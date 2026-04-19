const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/course/:courseId/roster', protect, authorizeRoles('PROFESSOR', 'admin'), studentController.getCourseRoster);
router.post('/send-alert', protect, authorizeRoles('PROFESSOR', 'admin'), studentController.sendStudentAlert);
router.post('/send-bulk-alert', protect, authorizeRoles('PROFESSOR', 'admin'), studentController.sendBulkAlerts);

module.exports = router;
