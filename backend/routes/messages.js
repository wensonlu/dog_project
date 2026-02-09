const express = require('express');
const router = express.Router();
const { getUserMessages, getMessageById, markMessageAsRead } = require('../controllers/messagesController');
const checkSupabase = require('../middleware/supabaseCheck');

// Get messages for a user
router.get('/:userId', checkSupabase, getUserMessages);
// Get single message (must belong to userId)
router.get('/:userId/detail/:id', checkSupabase, getMessageById);
// Mark message as read
router.patch('/:userId/detail/:id/read', checkSupabase, markMessageAsRead);

module.exports = router;
