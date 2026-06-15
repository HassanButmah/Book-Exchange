const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
    requestExchange,
    getExchangeRequests,
    acceptExchange,
    rejectExchange,
    cancelExchange,
} = require('../controllers/exchangeController');

// All exchange routes require authentication
router.use(authMiddleware);

// Request an exchange
router.post('/request', requestExchange);

// Get all exchange requests for user
router.get('/', getExchangeRequests);

// Accept exchange
router.post('/accept', acceptExchange);

// Reject exchange
router.post('/reject', rejectExchange);

// Cancel exchange
router.post('/cancel', cancelExchange);

module.exports = router;
