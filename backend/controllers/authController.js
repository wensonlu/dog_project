const { supabase } = require('../config/supabase');

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
 * Login user
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

module.exports = {
    register,
    login,
    getProfile,
    updateProfile
};
