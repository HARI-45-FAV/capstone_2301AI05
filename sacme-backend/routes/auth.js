const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');

// Unified Auth Routes
router.post('/login', authLimiter, authController.login);
router.post('/activate', authController.activate);

// First-Time Activation Verification Routes
router.post('/activate/student', authController.activateStudent);
router.post('/activate/faculty-advisor', authController.activateFacultyAdvisor);
router.post('/activate/professor', authController.activateProfessor);
router.post('/activate/main-admin', authController.activateMainAdmin);

// Forgot Password Flow
const rateLimit = require("express-rate-limit");
const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // limit each IP to 3 requests per windowMs
  message: { error: "Too many OTP requests. Try again later." }
});

router.post('/forgot-password/generate', otpLimiter, authController.generateOtp);
router.post('/forgot-password/verify', authController.verifyOtp);
router.post('/forgot-password/reset', authController.resetPassword);

// Session Management
router.post('/logout', authController.logout);
router.get('/me', authController.me);

router.put('/change-password', require('../middleware/authMiddleware').protect, authController.changePassword);

module.exports = router;
