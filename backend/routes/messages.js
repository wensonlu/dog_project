const express = require('express');
const router = express.Router();
const { getUserMessages, getMessageById, markMessageAsRead, searchContacts } = require('../controllers/messagesController');
const checkSupabase = require('../middleware/supabaseCheck');
const { supabase } = require('../config/supabase');

// Get unread message count
router.get('/unread/:userId', checkSupabase, async (req, res) => {
    try {
        const { userId } = req.params;
        
        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_unread', true);
            
        if (error) throw error;
        
        res.json({ count: count || 0 });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
});

// 搜索联系人（模糊匹配全部注册用户），须放在 /:userId 之前
router.get('/:userId/contacts/search', checkSupabase, searchContacts);
// Get messages for a user
router.get('/:userId', checkSupabase, getUserMessages);
// Get single message (must belong to userId)
router.get('/:userId/detail/:id', checkSupabase, getMessageById);
// Mark message as read
router.patch('/:userId/detail/:id/read', checkSupabase, markMessageAsRead);

module.exports = router;
