const express = require('express');
const router = express.Router();
const facultyAdvisorController = require('../controllers/facultyAdvisorController');
const authMiddleware = require('../middleware/authMiddleware');

// Route Protection: Only FACULTY_ADVISOR
router.use(authMiddleware.protect);
router.use(authMiddleware.authorizeRoles('FACULTY_ADVISOR'));

// Semesters
router.get('/semesters', facultyAdvisorController.getAssignedSemesters);

// Students
router.post('/preview-students', facultyAdvisorController.previewStudents);
router.post('/import-students/:semesterId', facultyAdvisorController.importStudents);
router.delete('/students/:id', facultyAdvisorController.deleteStudent);

// Courses
router.post('/courses/:semesterId', facultyAdvisorController.createCourse);
router.put('/courses/:id', facultyAdvisorController.updateCourse);
router.delete('/courses/:id', facultyAdvisorController.deleteCourse);
router.post('/course-assignment', facultyAdvisorController.assignProfessor);

// Professors
router.post('/professors', facultyAdvisorController.createProfessor);
router.post('/preview-professors', facultyAdvisorController.previewProfessors);
router.post('/import-professors', facultyAdvisorController.importProfessors);
router.get('/professors', facultyAdvisorController.getAllProfessors);

module.exports = router;
