const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', protect, authorizeRoles('MAIN_ADMIN', 'PROFESSOR'), searchController.globalSearch);

module.exports = router;
