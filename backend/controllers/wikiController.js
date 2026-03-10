// ============================================
// 宠物百科控制器
// ============================================

const { getSupabaseClient } = require('../utils/supabaseClient');

// 获取所有分类
async function getCategories(req, res) {
    try {
        const supabase = getSupabaseClient(req);
        
        const { data, error } = await supabase
            .from('wiki_categories')
            .select('*')
            .order('sort_order', { ascending: true });
        
        if (error) throw error;
        
        res.json(data);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: error.message });
    }
}

// 获取文章列表
async function getArticles(req, res) {
    try {
        const { 
            page = 1, 
            limit = 10, 
            category, 
            tag,
            search 
        } = req.query;
        const offset = (page - 1) * limit;
        
        const supabase = getSupabaseClient(req);
        
        let query = supabase
            .from('wiki_articles')
            .select(`
                *,
                category:wiki_categories!category_id(id, name, slug),
                author:profiles!author_id(id, full_name, avatar_url),
                tags:wiki_article_tags(tag:wiki_tags(id, name, slug))
            `)
            .eq('is_published', true);
        
        // 按分类筛选
        if (category) {
            query = query.eq('category.slug', category);
        }
        
        // 搜索
        if (search) {
            query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%,content.ilike.%${search}%`);
        }
        
        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        res.json({
            data,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Get articles error:', error);
        res.status(500).json({ error: error.message });
    }
}

// 获取文章详情
async function getArticleBySlug(req, res) {
    try {
        const { slug } = req.params;
        const supabase = getSupabaseClient(req);
        
        // 获取文章详情
        const { data: article, error } = await supabase
            .from('wiki_articles')
            .select(`
                *,
                category:wiki_categories!category_id(id, name, slug),
                author:profiles!author_id(id, full_name, avatar_url),
                tags:wiki_article_tags(tag:wiki_tags(id, name, slug))
            `)
            .eq('slug', slug)
            .eq('is_published', true)
            .single();
        
        if (error) throw error;
        if (!article) return res.status(404).json({ error: 'Article not found' });
        
        // 增加浏览量
        await supabase
            .from('wiki_articles')
            .update({ view_count: article.view_count + 1 })
            .eq('id', article.id);
        
        // 获取相关文章（同分类）
        const { data: related } = await supabase
            .from('wiki_articles')
            .select('id, title, slug, cover_image, summary')
            .eq('category_id', article.category_id)
            .eq('is_published', true)
            .neq('id', article.id)
            .limit(4);
        
        res.json({
            ...article,
            related: related || []
        });
    } catch (error) {
        console.error('Get article error:', error);
        res.status(500).json({ error: error.message });
    }
}

// 创建文章（管理员）
async function createArticle(req, res) {
    try {
        const { 
            category_id, 
            title, 
            slug, 
            summary, 
            content, 
            cover_image,
            tag_ids 
        } = req.body;
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const supabase = getSupabaseClient(req);
        
        // 创建文章
        const { data: article, error } = await supabase
            .from('wiki_articles')
            .insert([{
                category_id,
                title,
                slug,
                summary,
                content,
                cover_image,
                author_id: userId,
                is_published: true,
                published_at: new Date()
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        // 关联标签
        if (tag_ids && tag_ids.length > 0) {
            const tagRelations = tag_ids.map(tag_id => ({
                article_id: article.id,
                tag_id
            }));
            
            await supabase
                .from('wiki_article_tags')
                .insert(tagRelations);
        }
        
        res.status(201).json(article);
    } catch (error) {
        console.error('Create article error:', error);
        res.status(500).json({ error: error.message });
    }
}

// 更新文章
async function updateArticle(req, res) {
    try {
        const { id } = req.params;
        const { 
            category_id, 
            title, 
            slug, 
            summary, 
            content, 
            cover_image,
            tag_ids 
        } = req.body;
        
        const supabase = getSupabaseClient(req);
        
        // 更新文章
        const { data: article, error } = await supabase
            .from('wiki_articles')
            .update({
                category_id,
                title,
                slug,
                summary,
                content,
                cover_image
            })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        
        // 更新标签关联
        if (tag_ids) {
            // 删除旧关联
            await supabase
                .from('wiki_article_tags')
                .delete()
                .eq('article_id', id);
            
            // 添加新关联
            if (tag_ids.length > 0) {
                const tagRelations = tag_ids.map(tag_id => ({
                    article_id: id,
                    tag_id
                }));
                
                await supabase
                    .from('wiki_article_tags')
                    .insert(tagRelations);
            }
        }
        
        res.json(article);
    } catch (error) {
        console.error('Update article error:', error);
        res.status(500).json({ error: error.message });
    }
}

// 获取用户收藏
async function getFavorites(req, res) {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const supabase = getSupabaseClient(req);
        
        const { data, error } = await supabase
            .from('wiki_favorites')
            .select(`
                *,
                article:wiki_articles!article_id(*)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        res.json(data);
    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({ error: error.message });
    }
}

// 收藏/取消收藏文章
async function toggleFavorite(req, res) {
    try {
        const { article_id } = req.body;
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const supabase = getSupabaseClient(req);
        
        // 检查是否已收藏
        const { data: existing } = await supabase
            .from('wiki_favorites')
            .select('*')
            .eq('article_id', article_id)
            .eq('user_id', userId)
            .single();
        
        if (existing) {
            // 取消收藏
            await supabase
                .from('wiki_favorites')
                .delete()
                .eq('id', existing.id);
            
            res.json({ status: 'unfavorited' });
        } else {
            // 添加收藏
            await supabase
                .from('wiki_favorites')
                .insert([{ article_id, user_id: userId }]);
            
            res.json({ status: 'favorited' });
        }
    } catch (error) {
        console.error('Toggle favorite error:', error);
        res.status(500).json({ error: error.message });
    }
}

// 搜索文章
async function searchArticles(req, res) {
    try {
        const { q, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        
        if (!q) {
            return res.json({ data: [], pagination: { page: 1, limit, total: 0 } });
        }
        
        const supabase = getSupabaseClient(req);
        
        const { data, error, count } = await supabase
            .from('wiki_articles')
            .select(`
                *,
                category:wiki_categories!category_id(id, name, slug)
            `, { count: 'exact' })
            .eq('is_published', true)
            .or(`title.ilike.%${q}%,summary.ilike.%${q}%,content.ilike.%${q}%`)
            .order('view_count', { ascending: false })
            .range(offset, offset + limit - 1);
        
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
        console.error('Search articles error:', error);
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getCategories,
    getArticles,
    getArticleBySlug,
    createArticle,
    updateArticle,
    getFavorites,
    toggleFavorite,
    searchArticles
};
