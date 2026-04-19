const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// QUESTION BANK
router.post('/question-bank', protect, authorizeRoles('PROFESSOR', 'admin'), quizController.createQuestion);
router.get('/question-bank/:courseId', protect, authorizeRoles('PROFESSOR', 'admin'), quizController.getQuestionBank);

// PROFESSOR CONTROL
router.post('/create', protect, authorizeRoles('PROFESSOR', 'admin'), quizController.createQuiz);
router.post('/mock', protect, authorizeRoles('PROFESSOR', 'admin'), quizController.createMockQuiz);
router.put('/change-status/:quizId', protect, authorizeRoles('PROFESSOR', 'admin'), quizController.changeQuizStatus);
router.get('/course/:courseId', protect, quizController.getCourseQuizzes);
router.get('/analytics/:quizId', protect, authorizeRoles('PROFESSOR', 'admin'), quizController.getQuizAnalytics);

// STUDENT / EXAM MAPS
router.get('/status/:quizId', protect, quizController.getQuizStatus);
router.get('/details/:quizId', protect, quizController.getQuizDetails);
router.post('/submit', protect, authorizeRoles('STUDENT'), quizController.submitQuiz);
router.post('/autosave', protect, authorizeRoles('STUDENT'), quizController.autoSaveQuiz);
router.get('/autosave/:quizId', protect, authorizeRoles('STUDENT'), quizController.getLatestAutosave);
router.post('/violation', protect, authorizeRoles('STUDENT'), quizController.logViolation);

module.exports = router;
