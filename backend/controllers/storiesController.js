// ============================================
// 领养故事控制器
// ============================================

const { getSupabaseClient } = require('../utils/supabaseClient');

// 获取故事列表
async function getStories(req, res) {
    try {
        const { page = 1, limit = 10, status = 'approved' } = req.query;
        const offset = (page - 1) * limit;
        
        const supabase = getSupabaseClient(req);
        
        let query = supabase
            .from('adoption_stories')
            .select(`
                *,
                adopter:profiles!adopter_id(id, username, avatar_url),
                dog:dogs!dog_id(id, name, breed, images)
            `)
            .eq('status', status)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        
        const { data, error, count } = await query;
        
        if (error) throw error;
        
        res.json({
            data,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count
            }
        });
    } catch (error) {
        console.error('Get stories error:', error);
        res.status(500).json({ error: error.message });
    }
}

// 获取故事详情
async function getStoryById(req, res) {
    try {
        const { id } = req.params;
        const supabase = getSupabaseClient(req);
        
        // 获取故事详情
        const { data: story, error } = await supabase
            .from('adoption_stories')
            .select(`
                *,
                adopter:profiles!adopter_id(id, username, avatar_url),
                foster:profiles!foster_id(id, username, avatar_url),
                dog:dogs!dog_id(id, name, breed, images)
            `)
            .eq('id', id)
            .single();
        
        if (error) throw error;
        if (!story) return res.status(404).json({ error: 'Story not found' });
        
        // 增加浏览量
        await supabase
            .from('adoption_stories')
            .update({ view_count: story.view_count + 1 })
            .eq('id', id);
        
        // 获取时间线
        const { data: timeline } = await supabase
            .from('story_timeline')
            .select('*')
            .eq('story_id', id)
            .order('milestone_date', { ascending: true });
        
        // 获取评论
        const { data: comments } = await supabase
            .from('story_comments')
            .select(`
                *,
                user:profiles!user_id(id, username, avatar_url)
            `)
            .eq('story_id', id)
            .is('parent_id', null)
            .order('created_at', { ascending: false });
        
        res.json({
            ...story,
            timeline: timeline || [],
            comments: comments || []
        });
    } catch (error) {
        console.error('Get story error:', error);
        res.status(500).json({ error: error.message });
    }
}

// 创建故事
async function createStory(req, res) {
    try {
        const { dog_id, title, content, cover_image, images } = req.body;
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const supabase = getSupabaseClient(req);
        
        // 获取狗狗信息以确定 foster_id
        const { data: dog } = await supabase
            .from('dogs')
            .select('foster_id')
            .eq('id', dog_id)
            .single();
        
        const { data, error } = await supabase
            .from('adoption_stories')
            .insert([{
                dog_id,
                adopter_id: userId,
                foster_id: dog?.foster_id,
                title,
                content,
                cover_image,
                images: images || [],
                status: 'pending'
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        res.status(201).json(data);
    } catch (error) {
        console.error('Create story error:', error);
        res.status(500).json({ error: error.message });
    }
}

// 更新故事
async function updateStory(req, res) {
    try {
        const { id } = req.params;
        const { title, content, cover_image, images } = req.body;
        const userId = req.user?.id;
        
        const supabase = getSupabaseClient(req);
        
        // 检查权限
        const { data: story } = await supabase
            .from('adoption_stories')
            .select('adopter_id')
            .eq('id', id)
            .single();
        
        if (!story || story.adopter_id !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        
        const { data, error } = await supabase
            .from('adoption_stories')
            .update({ title, content, cover_image, images })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        
        res.json(data);
    } catch (error) {
        console.error('Update story error:', error);
        res.status(500).json({ error: error.message });
    }
}

// 删除故事
async function deleteStory(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        
        const supabase = getSupabaseClient(req);
        
        // 检查权限
        const { data: story } = await supabase
            .from('adoption_stories')
            .select('adopter_id')
            .eq('id', id)
            .single();
        
        if (!story || story.adopter_id !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        
        const { error } = await supabase
            .from('adoption_stories')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        res.json({ message: 'Story deleted successfully' });
    } catch (error) {
        console.error('Delete story error:', error);
        res.status(500).json({ error: error.message });
    }
}

// 添加时间线记录
async function addTimeline(req, res) {
    try {
        const { id } = req.params;
        const { title, content, image, milestone_date } = req.body;
        
        const supabase = getSupabaseClient(req);
        
        const { data, error } = await supabase
            .from('story_timeline')
            .insert([{
                story_id: id,
                title,
                content,
                image,
                milestone_date
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        res.status(201).json(data);
    } catch (error) {
        console.error('Add timeline error:', error);
        res.status(500).json({ error: error.message });
    }
}

// 点赞/取消点赞
async function toggleLike(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const supabase = getSupabaseClient(req);
        
        // 检查是否已点赞
        const { data: existing } = await supabase
            .from('story_likes')
            .select('*')
            .eq('story_id', id)
            .eq('user_id', userId)
            .single();
        
        if (existing) {
            // 取消点赞
            await supabase
                .from('story_likes')
                .delete()
                .eq('id', existing.id);
            
            // 更新点赞数
            await supabase.rpc('decrement_story_likes', { story_id: id });
            
            res.json({ status: 'unliked' });
        } else {
            // 添加点赞
            await supabase
                .from('story_likes')
                .insert([{ story_id: id, user_id: userId }]);
            
            // 更新点赞数
            await supabase.rpc('increment_story_likes', { story_id: id });
            
            res.json({ status: 'liked' });
        }
    } catch (error) {
        console.error('Toggle like error:', error);
        res.status(500).json({ error: error.message });
    }
}

// 发表评论
async function addComment(req, res) {
    try {
        const { id } = req.params;
        const { content, parent_id } = req.body;
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const supabase = getSupabaseClient(req);
        
        const { data, error } = await supabase
            .from('story_comments')
            .insert([{
                story_id: id,
                user_id: userId,
                content,
                parent_id
            }])
            .select(`
                *,
                user:profiles!user_id(id, username, avatar_url)
            `)
            .single();
        
        if (error) throw error;
        
        // 更新评论数
        await supabase.rpc('increment_story_comments', { story_id: id });
        
        res.status(201).json(data);
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getStories,
    getStoryById,
    createStory,
    updateStory,
    deleteStory,
    addTimeline,
    toggleLike,
    addComment
};
