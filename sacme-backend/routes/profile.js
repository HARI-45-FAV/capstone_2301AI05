const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.put('/update', protect, authorizeRoles('FACULTY_ADVISOR', 'PROFESSOR', 'MAIN_ADMIN'), profileController.updateProfile);
router.post('/upload-avatar', protect, authorizeRoles('FACULTY_ADVISOR', 'PROFESSOR', 'MAIN_ADMIN', 'STUDENT'), profileController.uploadAvatar.single('avatar'), profileController.handleAvatarUpload);
router.post('/upload-image', protect, authorizeRoles('FACULTY_ADVISOR', 'PROFESSOR', 'MAIN_ADMIN', 'STUDENT'), profileController.uploadAvatar.single('avatar'), profileController.handleAvatarUpload);

router.get('/student/dashboard-stats', protect, authorizeRoles('STUDENT'), profileController.getStudentDashboardStats);

module.exports = router;
