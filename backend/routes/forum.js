const express = require('express');
const router = express.Router();
const {
  getAllTopics,
  getTopicById,
  createTopic,
  toggleTopicLike,
  createComment,
  toggleCommentLike,
  toggleReplyLike,
  deleteComment,
  deleteReply,
  deleteTopic,
  generateTopicWithAI
} = require('../controllers/forumController');
const checkSupabase = require('../middleware/supabaseCheck');
const supabase = require('../config/supabase');

// Get related topics by dog ID
router.get('/related/:dogId', checkSupabase, async (req, res) => {
  try {
    const { dogId } = req.params;
    
    // 获取宠物信息
    const { data: dog, error: dogError } = await supabase
      .from('dogs')
      .select('name, breed')
      .eq('id', dogId)
      .single();
      
    if (dogError) throw dogError;
    
    // 搜索相关话题（按dog_id关联或内容包含宠物名称）
    const { data: topics, error } = await supabase
      .from('forum_topics')
      .select(`
        *,
        author:users(name),
        comments:forum_comments(count)
      `)
      .or(`dog_id.eq.${dogId},title.ilike.%${dog.name}%,content.ilike.%${dog.name}%`)
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (error) throw error;
    
    // 格式化数据
    const formattedTopics = topics?.map(topic => ({
      ...topic,
      author_name: topic.author?.name || '匿名用户',
      comment_count: topic.comments?.[0]?.count || 0
    })) || [];
    
    res.json(formattedTopics);
  } catch (error) {
    console.error('Error fetching related topics:', error);
    res.status(500).json({ error: 'Failed to fetch related topics' });
  }
});

// Get all topics with filters
router.get('/', checkSupabase, getAllTopics);

// AI generate topic content
router.post('/ai-generate', checkSupabase, generateTopicWithAI);

// Get topic by ID
router.get('/:id', checkSupabase, getTopicById);

// Create a new topic
router.post('/', checkSupabase, createTopic);

// Toggle like on a topic
router.post('/:id/like', checkSupabase, toggleTopicLike);

// Delete own topic (query: userId)
router.delete('/:id', checkSupabase, deleteTopic);

// Create a comment (or reply if replyToCommentId is provided)
router.post('/:topicId/comments', checkSupabase, createComment);

// Toggle like on a comment
router.post('/comments/:id/like', checkSupabase, toggleCommentLike);

// Toggle like on a reply
router.post('/replies/:id/like', checkSupabase, toggleReplyLike);

// Delete own comment
router.delete('/comments/:id', checkSupabase, deleteComment);

// Delete own reply
router.delete('/replies/:id', checkSupabase, deleteReply);

module.exports = router;
