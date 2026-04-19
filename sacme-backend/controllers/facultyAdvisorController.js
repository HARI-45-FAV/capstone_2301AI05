const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { clearNetworkCache } = require('./networkController');
const bcrypt = require('bcrypt');

/**
 * Get assigned semesters for the Faculty Advisor.
 */
exports.getAssignedSemesters = async (req, res) => {
    try {
        const advisor = await prisma.facultyAdvisor.findUnique({
            where: { userId: req.user.id },
            include: {
                assignedSemesters: {
                    include: { semester: { include: { academicYear: true, branch: true } } }
                }
            }
        });

        if (!advisor) return res.status(404).json({ error: 'Advisor profile not found.' });

        res.status(200).json({ assignedSemesters: advisor.assignedSemesters });
    } catch (error) {
        console.error('getAssignedSemesters Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

/**
 * Preview bulk students before inserting.
 */
exports.previewStudents = async (req, res) => {
    try {
        const { students } = req.body; // Array of { name, rollNo, email, phone }
        let errors = [];
        let valid = [];
        let duplicatesInPayload = new Set();

        for (const s of students) {
            if (!s.name || !s.rollNo || !s.email) {
                errors.push(`Row missing required data (name, rollNo, email) for ${s.name || 'Unknown'}`);
                continue;
            }
            
            const cleanEmail = s.email.trim().toLowerCase();

            if (duplicatesInPayload.has(cleanEmail)) {
                errors.push(`Duplicate email in uploaded file: ${cleanEmail}`);
                continue;
            }
            duplicatesInPayload.add(cleanEmail);

            const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
            if (existing) {
                errors.push(`Duplicate: ${cleanEmail} already exists in the system.`);
                continue;
            }

            valid.push(s);
        }

        res.status(200).json({ valid, errors, isValid: errors.length === 0 });
    } catch (error) {
        console.error('Preview Students Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

/**
 * Import validated students into the system.
 */
exports.importStudents = async (req, res) => {
    try {
        const { semesterId } = req.params;
        const { students } = req.body;
        
        const semester = await prisma.semester.findUnique({ where: { id: semesterId } });
        if (!semester) return res.status(404).json({ error: 'Semester not found' });
        if (semester.status === 'LOCKED' || semester.status === 'COMPLETED') {
            return res.status(400).json({ error: 'Semester is locked or completed. Cannot add students.' });
        }

        const defaultPassword = await bcrypt.hash('Student@123', 10);
        let successCount = 0;
        let failedRecords = [];

        await prisma.$transaction(async (tx) => {
            for (const s of students) {
                if (!s.name || !s.rollNo || !s.email) {
                    failedRecords.push({
                        name: s.name,
                        rollNo: s.rollNo,
                        reason: "Missing required fields"
                    });
                    continue;
                }

                let email = s.email.trim().toLowerCase();

                const existingUser = await tx.user.findUnique({ where: { email } });
                if (existingUser) {
                    failedRecords.push({ name: s.name, rollNo: s.rollNo, email: email, reason: "Duplicate email" });
                    continue;
                }

                await tx.user.create({
                    data: {
                        email,
                        role: 'STUDENT',
                        account_status: 'ACTIVE',
                        passwordHash: defaultPassword,
                        student: {
                            create: {
                                name: s.name,
                                rollNo: s.rollNo,
                                phone: s.phone && s.phone.trim() !== "" ? s.phone.trim() : null,
                                email: email,
                                branchId: semester.branchId,
                                semesterId: semester.id
                            }
                        }
                    }
                });
                successCount++;
            }
        });

        console.log("Students imported:", successCount, "Failed:", failedRecords.length);

        res.status(201).json({ 
            message: `Successfully imported ${successCount} students.`,
            totalRows: students.length,
            insertedCount: successCount,
            failedRecords: failedRecords
        });
    } catch (error) {
        console.error('Import Students Error:', error);
        res.status(500).json({ error: error.message || 'Server Error' });
    }
};

/**
 * Add a course to the semester.
 */
exports.createCourse = async (req, res) => {
    try {
        const { semesterId } = req.params;
        const { name, code, credits, courseType } = req.body;

        const semester = await prisma.semester.findUnique({ where: { id: semesterId } });
        if (!semester) return res.status(404).json({ error: 'Semester not found' });
        if (semester.status === 'LOCKED' || semester.status === 'COMPLETED') {
            return res.status(400).json({ error: 'Semester is locked/completed. Cannot add courses.' });
        }

        const newCourse = await prisma.course.create({
            data: {
                name,
                code,
                credits: parseInt(credits),
                courseType,
                semesterId
            }
        });

        clearNetworkCache();
        res.status(201).json({ message: 'Course added', course: newCourse });
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({ error: 'Course code already exists.' });
        console.error('Create Course Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

/**
 * Add a Professor to the system.
 */
exports.createProfessor = async (req, res) => {
    try {
        const { name, instructorId, email, phone, department } = req.body;

        const existing = await prisma.professor.findUnique({ where: { instructorId } });
        if (existing) return res.status(400).json({ error: 'Instructor ID already exists.' });

        const newUser = await prisma.user.create({
            data: {
                email,
                role: 'PROFESSOR',
                account_status: 'NOT_REGISTERED', // Must activate account first
                professor: {
                    create: {
                        name, instructorId, email, phone, department
                    }
                }
            },
            include: { professor: true }
        });

        clearNetworkCache();
        res.status(201).json({ message: 'Professor created', professor: newUser.professor });
    } catch (error) {
        console.error('Create Professor Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

/**
 * Preview bulk professors before inserting.
 */
exports.previewProfessors = async (req, res) => {
    try {
        const { professors } = req.body; // Array of { name, instructorId, email, phone, department }
        let errors = [];
        let valid = [];
        let duplicatesInPayload = new Set();
        let existingInstructorIds = new Set(
            (await prisma.professor.findMany({ select: { instructorId: true } })).map(p => p.instructorId)
        );

        for (const p of professors) {
            if (!p.name || !p.instructorId || !p.department || !p.email) {
                errors.push(`Row missing required data for ${p.instructorId || 'Unknown'}`);
                continue;
            }
            if (duplicatesInPayload.has(p.instructorId)) {
                errors.push(`Duplicate InstructorID in uploaded file: ${p.instructorId}`);
                continue;
            }
            duplicatesInPayload.add(p.instructorId);

            if (existingInstructorIds.has(p.instructorId)) {
                errors.push(`Duplicate: ${p.instructorId} already exists in the system.`);
                continue;
            }

            valid.push(p);
        }

        res.status(200).json({ valid, errors, isValid: errors.length === 0 });
    } catch (error) {
        console.error('Preview Professors Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

/**
 * Bulk Import Professors.
 */
exports.importProfessors = async (req, res) => {
    try {
        const { professors } = req.body;
        let successCount = 0;

        await prisma.$transaction(async (tx) => {
            for (const p of professors) {
                await tx.user.create({
                    data: {
                        email: p.email,
                        role: 'PROFESSOR',
                        account_status: 'NOT_REGISTERED',
                        professor: {
                            create: {
                                name: p.name,
                                instructorId: p.instructorId,
                                email: p.email,
                                phone: p.phone,
                                department: p.department
                            }
                        }
                    }
                });
                successCount++;
            }
        });

        res.status(201).json({ message: `Successfully imported ${successCount} professors.` });
    } catch (error) {
        console.error('Import Professors Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

/**
 * Assign a Professor to a Course.
 */
exports.assignProfessor = async (req, res) => {
    try {
        const { courseId, professorId } = req.body;

        const course = await prisma.course.findUnique({ where: { id: courseId }, include: { semester: true } });
        if (!course) return res.status(404).json({ error: 'Course not found' });
        
        if (course.semester.status === 'LOCKED' || course.semester.status === 'COMPLETED') {
            return res.status(400).json({ error: 'Semester is locked/completed. Cannot modify assignments.' });
        }

        const assignment = await prisma.courseAssignment.create({
            data: { courseId, professorId },
            include: { professor: true, course: true }
        });

        clearNetworkCache();
        res.status(201).json({ message: 'Assigned successfully', assignment });
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({ error: 'Professor is already assigned to this course.' });
        console.error('Assign Professor Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

/**
 * Get all available professors in the system.
 */
exports.getAllProfessors = async (req, res) => {
    try {
        const professors = await prisma.professor.findMany({ 
            where: { isDeleted: false },
            include: { user: true } 
        });
        res.status(200).json({ professors });
    } catch (error) {
        console.error('Get All Professors Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

/**
 * Delete a student (Soft disconnect or hard delete limit).
 */
exports.deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.student.delete({ where: { id } });
        res.status(200).json({ message: 'Student deleted successfully.' });
    } catch (error) {
        console.error('Delete Student Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

/**
 * Update a course.
 */
exports.updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, credits, courseType } = req.body;
        const course = await prisma.course.update({
            where: { id },
            data: { name, code, credits: parseInt(credits), courseType }
        });
        res.status(200).json({ message: 'Course updated', course });
    } catch (error) {
        console.error('Update Course Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

/**
 * Delete a course.
 */
exports.deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.course.update({ 
            where: { id }, 
            data: { isDeleted: true } 
        });
        
        clearNetworkCache();
        res.status(200).json({ message: 'Course deleted successfully.' });
    } catch (error) {
        console.error('Delete Course Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};
