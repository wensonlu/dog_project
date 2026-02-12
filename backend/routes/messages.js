const express = require('express');
const router = express.Router();
const { getUserMessages, getMessageById, markMessageAsRead } = require('../controllers/messagesController');
const checkSupabase = require('../middleware/supabaseCheck');
const supabase = require('../config/supabase');

// Get unread message count
router.get('/unread/:userId', checkSupabase, async (req, res) => {
    try {
        const { userId } = req.params;
        
        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', userId)
            .eq('is_read', false);
            
        if (error) throw error;
        
        res.json({ count: count || 0 });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
});

// Get messages for a user
router.get('/:userId', checkSupabase, getUserMessages);
// Get single message (must belong to userId)
router.get('/:userId/detail/:id', checkSupabase, getMessageById);
// Mark message as read
router.patch('/:userId/detail/:id/read', checkSupabase, markMessageAsRead);

module.exports = router;
