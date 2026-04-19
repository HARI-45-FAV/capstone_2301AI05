const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { attendanceLimiter } = require('../middleware/rateLimiter');

router.get('/my-courses', protect, authorizeRoles('PROFESSOR', 'STUDENT'), courseController.getMyCourses);
router.get('/my-timeline', protect, authorizeRoles('STUDENT'), courseController.getStudentTimeline);

// Attendance Workflows (Professors Only)
router.get('/:courseId/students', protect, authorizeRoles('PROFESSOR', 'STUDENT'), courseController.getCourseStudents);
router.get('/:courseId/attendance', protect, authorizeRoles('PROFESSOR'), courseController.getAttendance);
router.get('/:courseId/attendance/export', protect, authorizeRoles('PROFESSOR'), courseController.exportAttendanceCsv);
router.get('/:courseId/attendance-trends', protect, authorizeRoles('PROFESSOR'), courseController.getAttendanceTrends);
router.post('/:courseId/attendance', protect, authorizeRoles('PROFESSOR'), attendanceLimiter, courseController.saveAttendance);

module.exports = router;
