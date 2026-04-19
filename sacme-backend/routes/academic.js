const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academicController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/year', authMiddleware.protect, academicController.createAcademicYear);
router.get('/year', authMiddleware.protect, academicController.getAcademicYears);
router.put('/year/:id/active', authMiddleware.protect, academicController.setActiveYear);

router.post('/branch', authMiddleware.protect, academicController.createBranch);
router.get('/branch', authMiddleware.protect, academicController.getBranches);

router.get('/global-stats', authMiddleware.protect, academicController.getGlobalStats);
router.get('/heatmap', authMiddleware.protect, academicController.getSystemHeatmap);

module.exports = router;
