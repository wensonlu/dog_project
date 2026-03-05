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

/**
 * 模糊搜索注册用户（联系人），用于消息页搜索
 * GET /:userId/contacts/search?q=xxx
 * 排除当前用户，按 full_name、email 模糊匹配
 */
async function searchContacts(req, res) {
    const { userId } = req.params;
    const q = (req.query.q || '').trim();
    if (!q) {
        return res.json([]);
    }
    const { supabase } = require('../config/supabase');
    const term = q.slice(0, 80).replace(/,/g, '');
    const pattern = `%${term}%`;
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .neq('id', userId)
        .or(`full_name.ilike.${pattern},email.ilike.${pattern}`);
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    const list = (data || []).map((p) => ({
        id: p.id,
        full_name: p.full_name || null,
        email: p.email || null,
        avatar_url: p.avatar_url || null,
        displayName: p.full_name || p.email?.split('@')[0] || '用户'
    }));
    return res.json(list);
}

module.exports = {
    getUserMessages,
    getMessageById,
    markMessageAsRead,
    searchContacts
};
