const express = require('express');
const router = express.Router();
const semesterController = require('../controllers/semesterController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/faculty-advisors', authMiddleware.protect, authMiddleware.authorizeRoles('MAIN_ADMIN'), semesterController.getAllFacultyAdvisors);
router.get('/:id', authMiddleware.protect, semesterController.getSemesterDetails);
router.post('/:semesterId/assign-faculty', authMiddleware.protect, authMiddleware.authorizeRoles('MAIN_ADMIN'), semesterController.assignFaculty);

module.exports = router;
