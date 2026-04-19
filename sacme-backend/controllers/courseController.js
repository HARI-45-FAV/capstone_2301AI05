const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get courses for logged-in user (Professor or Student)
exports.getMyCourses = async (req, res) => {
    try {
        const { id, role } = req.user;
        console.log("============= GET MY COURSES LOG ==============");
        console.log("UserID:", id, "Role:", role);

        if (role === 'PROFESSOR') {
            const professor = await prisma.professor.findUnique({
                where: { userId: id, isDeleted: false },
                include: {
                    courseAssignments: {
                        include: {
                            course: {
                                include: {
                                    semester: true,
                                    attendances: { select: { status: true } },
                                    _count: {
                                        select: { attendances: true } 
                                    }
                                }
                            }
                        }
                    }
                }
            });

            if (!professor) return res.status(404).json({ error: 'Professor profile not found' });

            const courses = professor.courseAssignments
                .filter(ca => ca.course && !ca.course.isDeleted)
                .map(ca => {
                    const attendanceData = ca.course.attendances || [];
                    const totalSessionMarks = attendanceData.length;
                    const presentMarks = attendanceData.filter(a => a.status === 'Present').length;
                    const overallPercentage = totalSessionMarks === 0 ? 100 : Math.round((presentMarks / totalSessionMarks) * 100);

                    return {
                        id: ca.course.id,
                        name: ca.course.name,
                        code: ca.course.code,
                        credits: ca.course.credits,
                        courseType: ca.course.courseType,
                        semester: ca.course.semester.semesterNumber,
                        overallPercentage
                    };
                });

            return res.json({ courses });
            
        } else if (role === 'STUDENT') {
            const student = await prisma.student.findUnique({
                where: { userId: id, isDeleted: false },
                include: {
                    attendances: { select: { courseId: true, status: true } },
                    semester: {
                        include: {
                            courses: {
                                where: { isDeleted: false },
                                include: {
                                    courseAssignments: {
                                        include: { professor: true }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            if (!student) return res.status(404).json({ error: 'Student profile not found' });

            const courses = student.semester?.courses.map(course => {
                const specificAttendances = (student.attendances || []).filter(a => a.courseId === course.id);
                const total = specificAttendances.length;
                const present = specificAttendances.filter(a => a.status === 'Present').length;
                const attendancePercentage = total === 0 ? 100 : Math.round((present / total) * 100);

                return {
                    id: course.id,
                    name: course.name,
                    code: course.code,
                    credits: course.credits,
                    professor: course.courseAssignments[0]?.professor?.name || 'Unassigned',
                    attendancePercentage
                };
            }) || [];

            return res.json({ courses });
        } else {
            return res.status(403).json({ error: 'Role not supported for My Courses' });
        }
    } catch (error) {
        console.error('My Courses Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

// Get all students mapped to a specific course (via their Semester)
exports.getCourseStudents = async (req, res) => {
    try {
        const { courseId } = req.params;
        const requestedTake = parseInt(req.query.take) || 25;
        const skip = parseInt(req.query.skip) || 0;
        
        // Enforce maximum 50 records limits universally mitigating load
        const take = Math.min(requestedTake, 50);

        const course = await prisma.course.findUnique({
            where: { id: courseId, isDeleted: false },
            include: { 
                semester: { 
                    include: { 
                        students: { 
                            where: { isDeleted: false }, 
                            orderBy: { rollNo: 'asc' },
                            take,
                            skip
                        } 
                    } 
                } 
            }
        });

        if (!course) return res.status(404).json({ error: 'Course not found' });

        res.status(200).json({ students: course.semester.students });
    } catch (error) {
        console.error('Get Course Students Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

// Retrieve specific attendance for a course on a given date (YYYY-MM-DD format query)
exports.getAttendance = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { date } = req.query; // Expecting ISO string or YYYY-MM-DD
        
        if (!date) return res.status(400).json({ error: 'Date is required' });

        const searchDate = new Date(date);
        searchDate.setUTCHours(0,0,0,0);

        const records = await prisma.attendance.findMany({
            where: {
                courseId,
                date: searchDate
            }
        });

        res.status(200).json({ records });
    } catch (error) {
        console.error('Get Attendance Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

// Bulk Save/Update Attendance for a Course
exports.saveAttendance = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { date, records } = req.body; 
        // records: [{ studentId: "uuid", status: "Present" | "Absent" }]

        if (!date || !records || !Array.isArray(records)) {
            return res.status(400).json({ error: 'Invalid payload' });
        }

        const targetDate = new Date(date);
        targetDate.setUTCHours(0,0,0,0);

        // Check if attendance is already locked for this date
        const existingRecord = await prisma.attendance.findFirst({
            where: { courseId, date: targetDate }
        });
        if (existingRecord?.isLocked) {
             return res.status(403).json({ error: 'Attendance for this date is locked and cannot be modified.' });
        }

        await prisma.$transaction(async (tx) => {
            for (const rec of records) {
                await tx.attendance.upsert({
                    where: {
                        studentId_courseId_date: {
                            studentId: rec.studentId,
                            courseId,
                            date: targetDate
                        }
                    },
                    update: { status: rec.status, isLocked: true, lockedAt: new Date() },
                    create: {
                        studentId: rec.studentId,
                        courseId,
                        date: targetDate,
                        status: rec.status,
                        isLocked: true,
                        lockedAt: new Date()
                    }
                });
            }
        });

        const updatedRecords = await prisma.attendance.findMany({
            where: { courseId, date: targetDate }
        });

        const io = req.app.get('io');
        if (io) {
            io.to(courseId).emit("attendance_updated", updatedRecords);
        }

        res.status(200).json({ message: 'Attendance saved rapidly and securely.' });
    } catch (error) {
        console.error('Save Attendance Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

// Compute Dynamic Attendance Trajectories for Recharts
exports.getAttendanceTrends = async (req, res) => {
    try {
        const { courseId } = req.params;
        const range = parseInt(req.query.range) || 30;

        let dateFilter = {};
        if (range > 0 && range <= 365) {
             const startDate = new Date();
             startDate.setDate(startDate.getDate() - range);
             dateFilter = { gte: startDate };
        }

        const attendances = await prisma.attendance.findMany({
             where: { courseId, ...(dateFilter.gte ? { date: dateFilter } : {}) },
             orderBy: { date: 'asc' }
        });

        const trendsRaw = {};
        let totalPresent = 0;
        let totalAbsent = 0;

        attendances.forEach(a => {
             const d = a.date.toISOString().split('T')[0];
             if (!trendsRaw[d]) trendsRaw[d] = { present: 0, absent: 0 };
             if (a.status === 'Present') {
                 trendsRaw[d].present++;
                 totalPresent++;
             } else {
                 trendsRaw[d].absent++;
                 totalAbsent++;
             }
        });

        const trends = Object.keys(trendsRaw).map(date => ({
             date,
             present: trendsRaw[date].present,
             absent: trendsRaw[date].absent
        }));

        res.json({ trends, totalPresent, totalAbsent });
    } catch (e) {
        console.error("Trends Error:", e);
        res.status(500).json({ error: 'Server Error' });
    }
};

// Export Attendance mappings sequentially to CSV streams
exports.exportAttendanceCsv = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { range } = req.query; // '7', '30', 'all'
        let dateFilter = {};
        
        if (range && range !== 'all') {
            const rangeDays = parseInt(range);
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - rangeDays);
            dateFilter = { gte: startDate };
        }

        const attendances = await prisma.attendance.findMany({
            where: { courseId, ...(dateFilter.gte ? { date: dateFilter } : {}) },
            include: { student: true },
            orderBy: [{ date: 'desc' }, { student: { rollNo: 'asc' } }]
        });

        // Generate CSV mapping
        let csv = 'Roll No,Student Name,Date,Status\n';
        attendances.forEach(a => {
            csv += `${a.student.rollNo},${a.student.name},${a.date.toISOString().split('T')[0]},${a.status}\n`;
        });

        res.header('Content-Type', 'text/csv');
        res.attachment(`Course_${courseId}_Attendance_${new Date().toISOString().split('T')[0]}.csv`);
        res.status(200).send(csv);

    } catch (error) {
        console.error('CSV Export Error:', error);
        res.status(500).json({ error: 'Failed to generate CSV' });
    }
};

// Student Personal Activity Timeline (Feature 7)
exports.getStudentTimeline = async (req, res) => {
    try {
        const { id } = req.user;
        const student = await prisma.student.findUnique({
            where: { userId: id, isDeleted: false },
            include: {
                submissions: {
                    include: { assignment: { include: { course: true } } },
                    orderBy: { submittedAt: 'desc' },
                    take: 50
                },
                attendances: {
                    include: { course: true },
                    orderBy: { date: 'desc' },
                    take: 50
                }
            }
        });

        if (!student) return res.status(404).json({ error: 'Student not found' });

        const events = [];

        student.submissions.forEach(sub => {
            events.push({
                id: `sub-${sub.id}`,
                type: 'SUBMISSION',
                title: `Submitted: ${sub.assignment?.title || 'Assignment'}`,
                course: sub.assignment?.course?.name || 'Unknown Course',
                date: sub.submittedAt,
                status: sub.status,
                meta: sub.status === 'LATE' ? 'Late Submission' : 'On Time'
            });
        });

        student.attendances.forEach(att => {
            events.push({
                id: `att-${att.id}`,
                type: 'ATTENDANCE',
                title: att.status === 'Present' ? 'Attended Class' : 'Absent from Class',
                course: att.course?.name || 'Unknown Course',
                date: att.date,
                status: att.status,
                meta: att.status
            });
        });

        events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        res.json({ timeline: events });
    } catch (error) {
        console.error('Student Timeline Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

// Retrieve independent attendance for a specific student across courses
exports.getStudentAttendance = async (req, res) => {
    try {
        let { studentId } = req.params;
        const { courseId } = req.query; // Adding courseId as query param to allow exact module pulling
        
        if (studentId === 'me' && req.user.role === 'STUDENT') {
             const stud = await prisma.student.findUnique({ where: { userId: req.user.id } });
             if (!stud) return res.status(404).json({ error: 'Student not found' });
             studentId = stud.id;
        } else if (req.user.role === 'STUDENT') {
             // Authorization check: ONLY the student themselves or a professor can view this.
             const requestingStudent = await prisma.student.findUnique({ where: { userId: req.user.id } });
             if (!requestingStudent || requestingStudent.id !== studentId) {
                  return res.status(403).json({ error: 'Unauthorized access to student records.' });
             }
        }

        let whereClause = { studentId };
        if (courseId) {
             whereClause.courseId = courseId;
        }

        const distinctDates = await prisma.attendance.groupBy({
             by: ['date'],
             where: courseId ? { courseId } : {}
        });
        const totalClasses = distinctDates.length;

        const studentRecords = await prisma.attendance.findMany({
            where: whereClause,
            include: { course: true },
            orderBy: { date: 'desc' }
        });

        const attended = studentRecords.filter(r => r.status === "Present").length;
        const percentage = totalClasses === 0 ? 0 : Math.round((attended / totalClasses) * 100);

        // Required debug logs
        console.log("Total Classes:", totalClasses);
        console.log("Attended:", attended);
        console.log("Percentage:", percentage);

        res.status(200).json({ percentage, attended, totalClasses, records: studentRecords });
    } catch (error) {
        console.error('Get Student Attendance Error:', error);
        res.status(500).json({ error: 'Server Error fetching attendance.' });
    }
};

