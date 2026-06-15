const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/auth');

// All messaging routes require authentication
router.use(authMiddleware);

// Send a message
router.post('/send', messageController.sendMessage);

// Get conversation with a specific user (optionally filtered by book)
router.get('/conversation', messageController.getConversation);

// Get all conversations
router.get('/conversations', messageController.getConversations);

// Get unread message count
router.get('/unread-count', messageController.getUnreadCount);

// Delete a message
router.delete('/:message_id', messageController.deleteMessage);

module.exports = router;
