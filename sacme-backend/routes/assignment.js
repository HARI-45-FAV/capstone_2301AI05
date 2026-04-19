const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { submissionLimiter } = require('../middleware/rateLimiter');

const multer = require('multer');
const path = require('path');

// Configure multer securely for generic documents
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024, files: 5 }, // 50MB limit, 5 files max
    fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.docx', '.png', '.jpg', '.jpeg', '.zip', '.csv', '.ppt', '.pptx', '.xls', '.xlsx'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) return cb(null, true);
        cb(new Error("Invalid file type. Allowed: PDF, DOCX, PPTX, XLSX, ZIP, CSV, Images"));
    }
});

// Professor specific routes
router.post('/create', protect, authorizeRoles('PROFESSOR'), upload.array('files', 5), assignmentController.createAssignment);
router.put('/:assignmentId', protect, authorizeRoles('PROFESSOR'), upload.array('files', 5), assignmentController.updateAssignment);

router.post('/:assignmentId/timeline', protect, authorizeRoles('PROFESSOR'), assignmentController.updateTimeline);

router.post('/:assignmentId/upload-csv', protect, authorizeRoles('PROFESSOR'), upload.single('csvFile'), assignmentController.uploadCsvGrades);

// Globally accessible assignment fetching for enrolled students/professors
router.get('/course/:courseId', protect, authorizeRoles('PROFESSOR', 'STUDENT'), assignmentController.getAssignments);

// ZIP bulk download route
router.get('/:assignmentId/download-all', protect, authorizeRoles('PROFESSOR', 'FACULTY_ADVISOR', 'MAIN_ADMIN'), assignmentController.downloadAllSubmissions);

// Queries
router.post('/:assignmentId/query', protect, authorizeRoles('STUDENT'), assignmentController.raiseQuery);
router.post('/query/:queryId/reply', protect, authorizeRoles('PROFESSOR'), assignmentController.replyQuery);

// Student Submission Post logic
router.post('/:assignmentId/submit', protect, authorizeRoles('STUDENT'), submissionLimiter, upload.array('documents', 5), assignmentController.uploadSubmission);

module.exports = router;
