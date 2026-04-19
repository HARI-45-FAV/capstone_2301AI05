const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Dedicated API endpoint for a student to fetch their own attendance records
router.get('/student/:studentId', protect, authorizeRoles('STUDENT', 'PROFESSOR', 'MAIN_ADMIN'), courseController.getStudentAttendance);

module.exports = router;
