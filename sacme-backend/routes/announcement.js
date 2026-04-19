const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const announcementController = require('../controllers/announcementController');

router.post('/create', protect, authorizeRoles('PROFESSOR', 'MAIN_ADMIN'), announcementController.createAnnouncement);
router.get('/course/:courseId', protect, announcementController.getCourseAnnouncements);
router.delete('/:id', protect, authorizeRoles('PROFESSOR', 'MAIN_ADMIN'), announcementController.deleteAnnouncement);
router.put('/:id/read', protect, authorizeRoles('STUDENT'), announcementController.markAsRead);

module.exports = router;
