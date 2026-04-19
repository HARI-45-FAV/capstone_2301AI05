const express = require('express');
const router = express.Router();
const instituteController = require('../controllers/instituteController');
const authMiddleware = require('../middleware/authMiddleware');

// Route requires token authentication to know which admin is calling
router.post('/setup', authMiddleware.protect, instituteController.setupInstitute);

// Let's add GET just in case for later
router.get('/', authMiddleware.protect, async (req, res) => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    try {
       const inst = await prisma.institute.findFirst();
       res.json({ institute: inst });
    } catch (err) {
       res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
