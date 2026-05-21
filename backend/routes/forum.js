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
  generateTopicWithAI,
  getRelatedTopicsByContent,
  draftReply,
  draftTopic,
  precheckCreateTopic,
  confirmCreateTopic,
  precheckCreateReply,
  confirmCreateReply,
  verifyTopicInteraction,
  toggleTopicAuthorFollow,
  getMyFollowingAuthors,
  getForumContext,
  getSearchAiSummary,
  getTopicAiKit
} = require('../controllers/forumController');
const checkSupabase = require('../middleware/supabaseCheck');
const { supabase } = require('../config/supabase');

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
    const searchTerms = [dog?.name, dog?.breed].filter(Boolean);
    const searchClause = searchTerms
      .map((term) => `title.ilike.%${term}%,content.ilike.%${term}%`)
      .join(',');

    const { data: topics, error } = await supabase
      .from('forum_topics')
      .select('*')
      .or(searchClause || `title.ilike.%${dogId}%,content.ilike.%${dogId}%`)
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (error) throw error;

    const safeTopics = topics || [];
    const userIds = [...new Set(safeTopics.map((topic) => topic.user_id).filter(Boolean))];
    let profileMap = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      profileMap = (profiles || []).reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {});
    }

    const topicIds = safeTopics.map((topic) => topic.id);
    let commentCountMap = {};
    if (topicIds.length > 0) {
      const { data: comments } = await supabase
        .from('forum_comments')
        .select('topic_id')
        .in('topic_id', topicIds);
      commentCountMap = (comments || []).reduce((acc, item) => {
        acc[item.topic_id] = (acc[item.topic_id] || 0) + 1;
        return acc;
      }, {});
    }

    const formattedTopics = safeTopics.map((topic) => {
      const profile = profileMap[topic.user_id];
      return {
        ...topic,
        author_name: profile?.full_name || profile?.email?.split('@')[0] || '匿名用户',
        comment_count: commentCountMap[topic.id] || 0,
      };
    });
    
    res.json(formattedTopics);
  } catch (error) {
    console.error('Error fetching related topics:', error);
    res.status(500).json({ error: 'Failed to fetch related topics' });
  }
});

// Get all topics with filters
router.get('/', checkSupabase, getAllTopics);
router.get('/context', checkSupabase, getForumContext);
router.get('/search/ai-summary', checkSupabase, getSearchAiSummary);
router.get('/related-topics', checkSupabase, getRelatedTopicsByContent);

// AI generate topic content
router.post('/ai-generate', checkSupabase, generateTopicWithAI);
router.post('/draft-reply', checkSupabase, draftReply);
router.post('/draft-topic', checkSupabase, draftTopic);
router.post('/precheck/topic', checkSupabase, precheckCreateTopic);
router.post('/confirm/topic', checkSupabase, confirmCreateTopic);
router.post('/precheck/reply', checkSupabase, precheckCreateReply);
router.post('/confirm/reply', checkSupabase, confirmCreateReply);
router.post('/verify-interaction', checkSupabase, verifyTopicInteraction);

// Get my following authors
router.get('/follows/me', checkSupabase, getMyFollowingAuthors);

// Get topic by ID
router.get('/:id/ai-kit', checkSupabase, getTopicAiKit);
router.get('/:id', checkSupabase, getTopicById);

// Create a new topic
router.post('/', checkSupabase, createTopic);

// Toggle like on a topic
router.post('/:id/like', checkSupabase, toggleTopicLike);

// Toggle follow on topic author
router.post('/:id/follow', checkSupabase, toggleTopicAuthorFollow);

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
