const express = require('express');
const router = express.Router();
const courseActionController = require('../controllers/courseActionController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'MAT-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit for PPTs/Notes
});

// Materials
router.post('/courses/:courseId/materials', protect, authorizeRoles('PROFESSOR'), upload.single('document'), courseActionController.uploadMaterial);
router.get('/courses/:courseId/materials', protect, authorizeRoles('PROFESSOR', 'STUDENT'), courseActionController.getMaterials);

// Announcements
router.post('/courses/:courseId/announcements', protect, authorizeRoles('PROFESSOR'), courseActionController.createAnnouncement);
router.get('/courses/:courseId/announcements', protect, authorizeRoles('PROFESSOR', 'STUDENT'), courseActionController.getAnnouncements);

module.exports = router;
