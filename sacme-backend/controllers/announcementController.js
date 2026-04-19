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

exports.createAnnouncement = async (req, res) => {
    try {
        const { title, message, courseId, type, sendEmail, isPinned, scheduledAt } = req.body;

        const announcement = await prisma.announcement.create({
            data: {
                title,
                message,
                courseId,
                professorId: req.user.id,
                type: type || 'GENERAL',
                sendEmail: sendEmail || false,
                isPinned: isPinned || false,
                scheduledAt: scheduledAt ? new Date(scheduledAt) : null
            }
        });

        const enrollments = await prisma.enrollment.findMany({
            where: { courseId },
            include: { student: true }
        });

        // Generate system notifications for the Top Nav bell
        if (enrollments.length > 0) {
            const notifications = enrollments.map(e => ({
                userId: e.student.userId,
                type: 'ANNOUNCEMENT',
                title: `New Announcement: ${title}`,
                message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
                linkUrl: '/student/dashboard'
            }));
            
            await prisma.notification.createMany({
                data: notifications
            });
        }

        if (sendEmail) {
            for (const e of enrollments) {
                if (e.student.email) {
                    await transporter.sendMail({
                        from: process.env.EMAIL_USER,
                        to: e.student.email,
                        subject: `New Announcement: ${title}`,
                        html: `<h3>${title}</h3><p>${message}</p>`
                    }).catch(console.error);
                }
            }
        }

        res.status(201).json(announcement);
    } catch (e) {
        console.error("Create Announcement error:", e);
        res.status(500).json({ error: "Failed to create announcement" });
    }
};

exports.getCourseAnnouncements = async (req, res) => {
    try {
        const { courseId } = req.params;
        const announcements = await prisma.announcement.findMany({
            where: { courseId },
            orderBy: [
                { isPinned: 'desc' },
                { createdAt: 'desc' }
            ]
        });
        res.json(announcements);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch announcements" });
    }
};

exports.deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.announcement.delete({ where: { id } });
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to delete announcement" });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.announcement.update({
            where: { id },
            data: { isRead: true }
        });
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to update read status" });
    }
};
