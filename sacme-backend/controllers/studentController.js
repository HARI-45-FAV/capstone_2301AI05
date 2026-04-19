const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.getCourseRoster = async (req, res) => {
    try {
        const { courseId } = req.params;

        // Fetch the course and underlying semester mappings
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: { semester: { include: { students: { where: { isDeleted: false }, orderBy: { rollNo: 'asc' } } } } }
        });

        if (!course) return res.status(404).json({ error: 'Course not found' });

        const totalAssignments = await prisma.assignment.count({ where: { courseId } });

        let students = course.semester?.students || [];

        // Fallback: if no students linked to the semester, pull students via their attendance or submissions for this course
        if (students.length === 0) {
            const attendanceStudentIds = await prisma.attendance.findMany({
                where: { courseId },
                select: { studentId: true },
                distinct: ['studentId']
            });
            const submissionStudentIds = await prisma.submission.findMany({
                where: { assignment: { courseId } },
                select: { studentId: true },
                distinct: ['studentId']
            });
            const allIds = [...new Set([
                ...attendanceStudentIds.map(a => a.studentId),
                ...submissionStudentIds.map(s => s.studentId)
            ])];
            if (allIds.length > 0) {
                students = await prisma.student.findMany({
                    where: { id: { in: allIds }, isDeleted: false },
                    orderBy: { rollNo: 'asc' }
                });
            }
        }

        const rosterData = await Promise.all(students.map(async (student) => {
            const attendances = await prisma.attendance.findMany({
                where: { courseId, studentId: student.id }
            });
            const totalClasses = attendances.length;
            const presentClasses = attendances.filter(a => a.status === 'Present').length;
            const attendancePercentage = totalClasses === 0 ? 100 : Math.round((presentClasses / totalClasses) * 100);

            const submittedCount = await prisma.submission.count({
                where: { studentId: student.id, assignment: { courseId } }
            });
            const pendingAssignments = totalAssignments - submittedCount;

            return {
                id: student.id,
                rollNo: student.rollNo,
                name: student.name,
                email: student.email,
                phone: student.phone,
                attendancePercentage,
                pendingAssignments: pendingAssignments > 0 ? pendingAssignments : 0
            };
        }));

        res.status(200).json({ students: rosterData });
    } catch (error) {
        console.error("Fetch roster error:", error);
        res.status(500).json({ error: "Failed to fetch roster" });
    }
};

const sendStudentEmail = async (studentData, courseName, professorName, alertType) => {
    let subjectText = "";
    let messageBody = "";

    if (alertType === 'attendance') {
        subjectText = "Attendance Warning – Immediate Attention Required";
        messageBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px;">
                <h2 style="color: #ef4444;">Attendance Warning</h2>
                <p>Dear ${studentData.name},</p>
                <p>This is an automated notification from the course management system.</p>
                <p>Your current attendance in the course <strong>${courseName}</strong> is <strong>${studentData.attendancePercentage}%</strong>, which is below the minimum required attendance threshold of 75%.</p>
                <p>Please ensure that you attend upcoming classes regularly to meet academic requirements. If you have valid reasons for absence, please contact your instructor.</p>
                <p style="color: #64748b; margin-top: 30px;">Regards,<br/>Prof. ${professorName}<br/>Course Management System</p>
            </div>
        `;
    } else if (alertType === 'pending') {
        subjectText = "Pending Assignment Reminder";
        messageBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px;">
                <h2 style="color: #f59e0b;">Pending Work Reminder</h2>
                <p>Dear ${studentData.name},</p>
                <p>This is an automated reminder regarding pending coursework.</p>
                <p>You currently have <strong>${studentData.pendingAssignments} pending assignment(s)</strong> in the course <strong>${courseName}</strong>.</p>
                <p>Please submit your pending work before the deadline. Failure to submit assignments may affect your academic evaluation.</p>
                <p style="color: #64748b; margin-top: 30px;">Regards,<br/>Prof. ${professorName}<br/>Course Management System</p>
            </div>
        `;
    } else {
        // Combined
        subjectText = "Academic Alert – Attendance & Pending Work";
        messageBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px;">
                <h2 style="color: #dc2626;">Academic Alert</h2>
                <p>Dear ${studentData.name},</p>
                <p>This is an automated notification from the course management system.</p>
                <p>We are writing to flag two important issues regarding your performance in <strong>${courseName}</strong>:</p>
                <ul>
                    <li>Your attendance is severely low at <strong>${studentData.attendancePercentage}%</strong>.</li>
                    <li>You have <strong>${studentData.pendingAssignments}</strong> pending assignment(s).</li>
                </ul>
                <p>Please address these issues immediately to maintain your academic standing.</p>
                <p style="color: #64748b; margin-top: 30px;">Regards,<br/>Prof. ${professorName}<br/>Course Management System</p>
            </div>
        `;
    }

    await transporter.sendMail({
        from: process.env.EMAIL_USER || '"SACME Support" <no-reply@sacme.edu>',
        to: studentData.email,
        subject: subjectText,
        html: messageBody
    });
};

exports.sendStudentAlert = async (req, res) => {
    try {
        const { studentId, courseId, alertType } = req.body;

        const student = await prisma.student.findUnique({ where: { id: studentId } });
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        const professor = await prisma.professor.findUnique({ where: { userId: req.user.id } });

        if (!student || !course || !student.email) return res.status(400).json({ error: "Missing records or student email" });

        // Grab current dynamic logic again because frontend just requested via UI
        const attendances = await prisma.attendance.findMany({ where: { courseId, studentId } });
        const totalClasses = attendances.length;
        const currentAttendance = totalClasses === 0 ? 100 : Math.round((attendances.filter(a => a.status === 'Present').length / totalClasses) * 100);

        const submittedCount = await prisma.submission.count({ where: { studentId: student.id, assignment: { courseId } } });
        const totalAssignments = await prisma.assignment.count({ where: { courseId } });
        const pendingCount = totalAssignments - submittedCount;

        const structuredData = { name: student.name, email: student.email, attendancePercentage: currentAttendance, pendingAssignments: pendingCount };

        await sendStudentEmail(structuredData, course.name, professor?.name || "Instructor", alertType);

        await prisma.emailLog.create({
            data: { studentId: student.id, courseId: course.id, alertType }
        });

        res.status(200).json({ message: "Alert email sent successfully" });
    } catch (e) {
        console.error("Alert send error:", e);
        res.status(500).json({ error: "Server Error dispatching email" });
    }
};

exports.sendBulkAlerts = async (req, res) => {
    try {
        const { courseId } = req.body;
        
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: { semester: { include: { students: { where: { isDeleted: false } } } } }
        });
        const professor = await prisma.professor.findUnique({ where: { userId: req.user.id } });

        const totalAssignments = await prisma.assignment.count({ where: { courseId } });
        const students = course?.semester?.students || [];

        let sentCount = 0;

        for (const student of students) {
            if (!student.email) continue; // Skip bounds without email address
            
            const attendances = await prisma.attendance.findMany({ where: { courseId, studentId: student.id } });
            const totalClasses = attendances.length;
            const currentAttendance = totalClasses === 0 ? 100 : Math.round((attendances.filter(a => a.status === 'Present').length / totalClasses) * 100);

            const submittedCount = await prisma.submission.count({ where: { studentId: student.id, assignment: { courseId } } });
            const pendingCount = (totalAssignments - submittedCount) > 0 ? (totalAssignments - submittedCount) : 0;

            let targetAlertType = null;
            if (currentAttendance < 75 && pendingCount > 0) targetAlertType = 'both';
            else if (currentAttendance < 75) targetAlertType = 'attendance';
            else if (pendingCount > 0) targetAlertType = 'pending';

            if (targetAlertType) {
                const structuredData = { name: student.name, email: student.email, attendancePercentage: currentAttendance, pendingAssignments: pendingCount };
                
                await sendStudentEmail(structuredData, course.name, professor?.name || "Instructor", targetAlertType);
                await prisma.emailLog.create({ data: { studentId: student.id, courseId: course.id, alertType: targetAlertType } });

                sentCount++;
                // Explicit 2000ms debounce buffer per user restriction locking SMTP bounds!
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        res.status(200).json({ message: `Successfully fired ${sentCount} bulk alerts` });
    } catch (e) {
        console.error("Bulk Send Error", e);
        res.status(500).json({ error: "Failed pushing bulk batches" });
    }
};
