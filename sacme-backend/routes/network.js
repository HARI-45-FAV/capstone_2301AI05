const express = require('express');
const router = express.Router();
const networkController = require('../controllers/networkController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', protect, authorizeRoles('MAIN_ADMIN'), networkController.getNetworkMap);
router.post('/clear', protect, authorizeRoles('MAIN_ADMIN'), networkController.manualClearCache);

module.exports = router;
