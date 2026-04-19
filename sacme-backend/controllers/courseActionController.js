const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { notifyCourseStudents } = require('./notificationHelper');

// -------------
// Materials
// -------------
exports.uploadMaterial = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No material file attached' });
        }

        const { courseId } = req.params;
        const { title } = req.body;

        if (!title) return res.status(400).json({ error: 'Material title is required' });

        const fileUrl = `/public/uploads/${req.file.filename}`;

        const material = await prisma.courseMaterial.create({
            data: {
                courseId,
                title,
                fileUrl
            }
        });

        await notifyCourseStudents(courseId, `📁 New Material Uploaded: ${title}`);

        res.status(201).json({ message: 'Material uploaded successfully', material });
    } catch (error) {
        console.error('Upload Material Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.getMaterials = async (req, res) => {
    try {
        const { courseId } = req.params;
        const materials = await prisma.courseMaterial.findMany({
            where: { courseId },
            orderBy: { id: 'desc' }
        });
        res.status(200).json({ materials });
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
};

// -------------
// Announcements
// -------------
exports.createAnnouncement = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { message } = req.body;

        if (!message) return res.status(400).json({ error: 'Message payload required' });

        const announcement = await prisma.announcement.create({
            data: {
                courseId,
                message
            }
        });

        await notifyCourseStudents(courseId, `📢 Important Final Announcement Posted!`);

        res.status(201).json({ message: 'Announcement deployed', announcement });
    } catch (error) {
        console.error('Create Announcement Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.getAnnouncements = async (req, res) => {
    try {
        const { courseId } = req.params;
        const announcements = await prisma.announcement.findMany({
            where: { courseId },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ announcements });
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
};
