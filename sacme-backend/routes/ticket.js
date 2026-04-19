const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware.protect, ticketController.createTicket);
router.get('/', authMiddleware.protect, ticketController.getTickets);

module.exports = router;
