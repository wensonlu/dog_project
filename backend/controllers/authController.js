const { supabase } = require('../config/supabase');
const { calculateProfileCompletion } = require('../utils/applicationWorkflow');
const crypto = require('crypto');

const MOBILE_TICKET_TTL_MS = 3 * 60 * 1000;
const mobileTicketStore = new Map();

function cleanupExpiredMobileTickets() {
    const now = Date.now();
    for (const [key, value] of mobileTicketStore.entries()) {
        if (!value || value.expiresAt <= now) {
            mobileTicketStore.delete(key);
        }
    }
}

/**
 * Register a new user
 */
async function register(req, res) {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    // 返回格式化的用户数据，确保前端可以正确使用
    res.json({
        user: data.user,
        session: data.session
    });
}

/**
 * Login user1
 */
async function login(req, res) {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    // 返回格式化的用户数据，确保前端可以正确使用
    res.json({
        user: data.user,
        session: data.session
    });
}

/**
 * Get user profile
 */
async function getProfile(req, res) {
    const userId = req.params.id;

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
}

/**
 * Update user profile
 */
async function updateProfile(req, res) {
    const userId = req.params.id;
    const { full_name, avatar_url, bio, phone } = req.body;

    // 更新 profiles 表
    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    if (bio !== undefined) updateData.bio = bio;
    if (phone !== undefined) updateData.phone = phone;

    const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
}

/**
 * Get user profile completion summary
 */
async function getProfileCompletion(req, res) {
    const userId = req.params.id;
    const isSelf = req.user.userId === userId;
    const isAdmin = (req.user.permissions & 1) > 0 || (req.user.permissions & 4) > 0;

    if (!isSelf && !isAdmin) {
        return res.status(403).json({ error: '无权查看该用户资料完整度' });
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, bio, phone')
        .eq('id', userId)
        .single();

    if (error) {
        const statusCode = error.code === 'PGRST116' ? 404 : 400;
        return res.status(statusCode).json({ error: error.message });
    }

    return res.json({
        userId: data.id,
        completion: calculateProfileCompletion(data),
    });
}

/**
 * Create one-time mobile auth ticket from current bearer token.
 */
async function createMobileTicket(req, res) {
    cleanupExpiredMobileTickets();
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '未提供认证 Token' });
    }

    const accessToken = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
        return res.status(401).json({ error: '无效的认证 Token' });
    }

    const ticket = crypto.randomBytes(24).toString('hex');
    mobileTicketStore.set(ticket, {
        token: accessToken,
        userId: user.id,
        expiresAt: Date.now() + MOBILE_TICKET_TTL_MS,
    });

    return res.json({
        ticket,
        expiresInMs: MOBILE_TICKET_TTL_MS,
    });
}

/**
 * Exchange one-time mobile auth ticket for token and user id.
 */
async function exchangeMobileTicket(req, res) {
    cleanupExpiredMobileTickets();
    const ticket = String(req.body?.ticket || '').trim();
    if (!ticket) {
        return res.status(400).json({ error: 'ticket 必填' });
    }

    const payload = mobileTicketStore.get(ticket);
    if (!payload || payload.expiresAt <= Date.now()) {
        mobileTicketStore.delete(ticket);
        return res.status(401).json({ error: 'ticket 无效或已过期' });
    }

    mobileTicketStore.delete(ticket);
    return res.json({
        token: payload.token,
        userId: payload.userId,
        expiresAt: payload.expiresAt,
    });
}

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    getProfileCompletion,
    createMobileTicket,
    exchangeMobileTicket
};
