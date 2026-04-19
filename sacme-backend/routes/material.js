const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = 'public/uploads/materials/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '_' + file.originalname.replace(/\s+/g, '_');
        cb(null, uniqueSuffix);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.docx', '.doc', '.ppt', '.pptx', '.zip', '.png', '.jpg', '.jpeg'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type. Allowed: PDF, DOCX, PPT, ZIP, Images."));
        }
    }
});

// Routes
router.post('/upload', protect, authorizeRoles('PROFESSOR', 'MAIN_ADMIN'), upload.single('file'), materialController.uploadMaterial);
router.get('/course/:courseId', protect, authorizeRoles('PROFESSOR', 'STUDENT', 'MAIN_ADMIN', 'FACULTY_ADVISOR'), materialController.getCourseMaterials);
router.put('/:materialId', protect, authorizeRoles('PROFESSOR', 'MAIN_ADMIN'), upload.single('file'), materialController.updateMaterial);
router.delete('/:materialId', protect, authorizeRoles('PROFESSOR', 'MAIN_ADMIN'), materialController.deleteMaterial);

module.exports = router;
