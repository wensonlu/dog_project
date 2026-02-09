const { supabase } = require('../config/supabase');

/**
 * Get messages for a user
 */
async function getUserMessages(req, res) {
    const { userId } = req.params;

    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
}

/**
 * Get a single message by id (must belong to the user)
 */
async function getMessageById(req, res) {
    const { userId, id } = req.params;

    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

    if (error || !data) {
        return res.status(404).json({ error: 'Message not found' });
    }
    res.json(data);
}

/**
 * Mark a message as read (must belong to the user)
 */
async function markMessageAsRead(req, res) {
    const { userId, id } = req.params;

    const { data, error } = await supabase
        .from('messages')
        .update({ is_unread: false })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

    if (error || !data) {
        return res.status(404).json({ error: 'Message not found' });
    }
    res.json(data);
}

module.exports = {
    getUserMessages,
    getMessageById,
    markMessageAsRead
};
