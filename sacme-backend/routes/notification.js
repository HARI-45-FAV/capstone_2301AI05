const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { protect } = require('../middleware/authMiddleware');

// Get all notifications for the authenticated user
router.get('/mine', protect, async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.status(200).json({ notifications });
    } catch (error) {
        console.error('Fetch Notifications Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
});

// Mark a specific notification as read (without deleting)
router.put('/:id/read', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await prisma.notification.findUnique({ where: { id } });
        if (!notification) return res.status(404).json({ error: 'Not found' });
        
        if (notification.userId !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });

        res.status(200).json({ message: 'Marked as read' });
    } catch (error) {
        console.error('Mark Read Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;
