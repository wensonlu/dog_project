const { getSupabaseClient } = require('../utils/supabaseClient');
const { generateTopicContent } = require('../utils/ai');

/**
 * Helper function to fetch user profiles in batch
 * @param {Object} client - Supabase client
 * @param {Array<string>} userIds - Array of user IDs
 * @returns {Object} Map of user_id -> profile
 */
async function fetchUserProfiles(client, userIds) {
  if (!userIds || userIds.length === 0) {
    return {};
  }

  // Remove duplicates
  const uniqueUserIds = [...new Set(userIds)];

  const { data: profiles, error } = await client
    .from('profiles')
    .select('id, email, full_name, avatar_url')
    .in('id', uniqueUserIds);

  if (error) {
    console.error('Error fetching user profiles:', error);
    return {};
  }

  // Create a map for easy lookup
  const profileMap = {};
  (profiles || []).forEach(profile => {
    profileMap[profile.id] = profile;
  });

  return profileMap;
}

/**
 * Get all forum topics with filters and sorting
 */
async function getAllTopics(req, res) {
  const client = getSupabaseClient(req);
  const { category, sort = 'latest', search } = req.query;

  try {
    // Query topics without profiles relation
    let query = client
      .from('forum_topics')
      .select('*')
      .order('created_at', { ascending: false });

    // Category filter
    if (category && category !== 'all') {
      const categoryMap = {
        adoption: '领养经验',
        daily: '日常分享',
        help: '求助问答'
      };
      if (categoryMap[category]) {
        query = query.eq('category', categoryMap[category]);
      }
    }

    // Search filter
    if (search && search.trim()) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const { data: topics, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Sort topics
    let sortedTopics = topics || [];
    if (sort === 'hot') {
      sortedTopics.sort((a, b) => b.likes_count - a.likes_count);
    } else if (sort === 'comments') {
      sortedTopics.sort((a, b) => b.comments_count - a.comments_count);
    }

    // Collect all unique user IDs
    const userIds = [...new Set(sortedTopics.map(topic => topic.user_id))];
    
    // Fetch profiles in batch
    const profileMap = await fetchUserProfiles(client, userIds);

    // Format response
    const formattedTopics = sortedTopics.map(topic => {
      const profile = profileMap[topic.user_id];
      return {
        id: topic.id,
        title: topic.title,
        content: topic.content,
        category: topic.category,
        tags: topic.tags || [],
        images: topic.images || [],
        likes: topic.likes_count || 0,
        comments: topic.comments_count || 0,
        views: topic.views_count || 0,
        createdAt: topic.created_at,
        author: {
          id: profile?.id || topic.user_id,
          name: profile?.full_name || profile?.email?.split('@')[0] || '匿名用户',
          avatar: profile?.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6ZfAu74fVn19xwt_mCCWmnG0o7CZVapQ8kcQLS4X-Bq4t9inNQHpNA2CtIDIILlKL7BEwdeDFD1ir1ExQXcadXX1G0ZeCruY06uZCg-nslkcMsFEssRFlRG9WUkpJ1A6HzO8kRmhQdRu6pihqtzjdpfK-FD-VL3z-S_AoQG8KrdjqvQ3CSQdDha2DtsEiRkV3RGcfoZHR12Ii9gsm_0C6CJ79z0Hu7LkUOIdgB5G5XcVAN8qPe5tGxLh1fauXT7-L58wrQ_eXFM0'
        },
        isLiked: false // Will be set based on user likes
      };
    });

    // Check if user has liked topics (if userId provided in query)
    const userId = req.query.userId;
    if (userId) {
      const topicIds = formattedTopics.map(t => t.id);
      const { data: likes } = await client
        .from('forum_topic_likes')
        .select('topic_id')
        .eq('user_id', userId)
        .in('topic_id', topicIds);

      const likedTopicIds = new Set(likes?.map(l => l.topic_id) || []);
      formattedTopics.forEach(topic => {
        topic.isLiked = likedTopicIds.has(topic.id);
      });
    }

    res.json(formattedTopics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
}

/**
 * Get topic by ID with comments and replies
 */
async function getTopicById(req, res) {
  const client = getSupabaseClient(req);
  const { id } = req.params;

  try {
    // Get topic without profiles relation
    const { data: topic, error: topicError } = await client
      .from('forum_topics')
      .select('*')
      .eq('id', id)
      .single();

    if (topicError) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Increment views
    await client
      .from('forum_topics')
      .update({ views_count: (topic.views_count || 0) + 1 })
      .eq('id', id);

    // Get comments without profiles relation
    const { data: comments, error: commentsError } = await client
      .from('forum_comments')
      .select('*')
      .eq('topic_id', id)
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
    }

    // Get replies for each comment without profiles relation
    const allCommentIds = comments?.map(c => c.id) || [];
    let replies = [];
    if (allCommentIds.length > 0) {
      const { data: repliesData } = await client
        .from('forum_replies')
        .select('*')
        .in('comment_id', allCommentIds)
        .order('created_at', { ascending: true });

      replies = repliesData || [];
    }

    // Collect all user IDs (topic author, comment authors, reply authors)
    const userIds = new Set();
    if (topic.user_id) userIds.add(topic.user_id);
    (comments || []).forEach(comment => {
      if (comment.user_id) userIds.add(comment.user_id);
    });
    (replies || []).forEach(reply => {
      if (reply.user_id) userIds.add(reply.user_id);
    });

    // Fetch all profiles in batch
    const profileMap = await fetchUserProfiles(client, Array.from(userIds));

    // Check if user has liked topic
    let isLiked = false;
    const userId = req.query.userId;
    if (userId) {
      const { data: like } = await client
        .from('forum_topic_likes')
        .select('id')
        .eq('topic_id', id)
        .eq('user_id', userId)
        .single();
      isLiked = !!like;
    }

    // Format response
    const topicProfile = profileMap[topic.user_id];
    const formattedTopic = {
      id: topic.id,
      title: topic.title,
      content: topic.content,
      category: topic.category,
      tags: topic.tags || [],
      images: topic.images || [],
      likes: topic.likes_count || 0,
      comments: topic.comments_count || 0,
      views: (topic.views_count || 0) + 1,
      createdAt: topic.created_at,
      isLiked,
      author: {
        id: topicProfile?.id || topic.user_id,
        name: topicProfile?.full_name || topicProfile?.email?.split('@')[0] || '匿名用户',
        avatar: topicProfile?.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6ZfAu74fVn19xwt_mCCWmnG0o7CZVapQ8kcQLS4X-Bq4t9inNQHpNA2CtIDIILlKL7BEwdeDFD1ir1ExQXcadXX1G0ZeCruY06uZCg-nslkcMsFEssRFlRG9WUkpJ1A6HzO8kRmhQdRu6pihqtzjdpfK-FD-VL3z-S_AoQG8KrdjqvQ3CSQdDha2DtsEiRkV3RGcfoZHR12Ii9gsm_0C6CJ79z0Hu7LkUOIdgB5G5XcVAN8qPe5tGxLh1fauXT7-L58wrQ_eXFM0'
      }
    };

    // Check user likes for comments and replies
    const replyIds = replies?.map(r => r.id) || [];
    let commentLikes = [];
    let replyLikes = [];

    if (userId && allCommentIds.length > 0) {
      const { data: commentLikesData } = await client
        .from('forum_comment_likes')
        .select('comment_id')
        .eq('user_id', userId)
        .in('comment_id', allCommentIds);
      commentLikes = commentLikesData || [];
    }

    if (userId && replyIds.length > 0) {
      const { data: replyLikesData } = await client
        .from('forum_reply_likes')
        .select('reply_id')
        .eq('user_id', userId)
        .in('reply_id', replyIds);
      replyLikes = replyLikesData || [];
    }

    const likedCommentIds = new Set(commentLikes.map(l => l.comment_id));
    const likedReplyIds = new Set(replyLikes.map(l => l.reply_id));

    // Format comments with replies
    const formattedComments = (comments || []).map(comment => {
      const commentReplies = replies.filter(r => r.comment_id === comment.id);
      const commentProfile = profileMap[comment.user_id];
      
      return {
        id: comment.id,
        topicId: comment.topic_id,
        content: comment.content,
        likes: comment.likes_count || 0,
        replies: comment.replies_count || 0,
        createdAt: comment.created_at,
        locationCity: comment.location_city ?? null,
        isLiked: likedCommentIds.has(comment.id),
        author: {
          id: commentProfile?.id || comment.user_id,
          name: commentProfile?.full_name || commentProfile?.email?.split('@')[0] || '匿名用户',
          avatar: commentProfile?.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6ZfAu74fVn19xwt_mCCWmnG0o7CZVapQ8kcQLS4X-Bq4t9inNQHpNA2CtIDIILlKL7BEwdeDFD1ir1ExQXcadXX1G0ZeCruY06uZCg-nslkcMsFEssRFlRG9WUkpJ1A6HzO8kRmhQdRu6pihqtzjdpfK-FD-VL3z-S_AoQG8KrdjqvQ3CSQdDha2DtsEiRkV3RGcfoZHR12Ii9gsm_0C6CJ79z0Hu7LkUOIdgB5G5XcVAN8qPe5tGxLh1fauXT7-L58wrQ_eXFM0'
        },
        replies: commentReplies.map(reply => {
          const replyProfile = profileMap[reply.user_id];
          return {
            id: reply.id,
            commentId: reply.comment_id,
            content: reply.content,
            replyToUserName: reply.reply_to_user_name ?? null,
            likes: reply.likes_count || 0,
            createdAt: reply.created_at,
            locationCity: reply.location_city ?? null,
            isLiked: likedReplyIds.has(reply.id),
            author: {
              id: replyProfile?.id || reply.user_id,
              name: replyProfile?.full_name || replyProfile?.email?.split('@')[0] || '匿名用户',
              avatar: replyProfile?.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6ZfAu74fVn19xwt_mCCWmnG0o7CZVapQ8kcQLS4X-Bq4t9inNQHpNA2CtIDIILlKL7BEwdeDFD1ir1ExQXcadXX1G0ZeCruY06uZCg-nslkcMsFEssRFlRG9WUkpJ1A6HzO8kRmhQdRu6pihqtzjdpfK-FD-VL3z-S_AoQG8KrdjqvQ3CSQdDha2DtsEiRkV3RGcfoZHR12Ii9gsm_0C6CJ79z0Hu7LkUOIdgB5G5XcVAN8qPe5tGxLh1fauXT7-L58wrQ_eXFM0'
            }
          };
        })
      };
    });

    res.json({
      topic: formattedTopic,
      comments: formattedComments
    });
  } catch (error) {
    console.error('Error fetching topic:', error);
    res.status(500).json({ error: 'Failed to fetch topic' });
  }
}

/**
 * Create a new topic
 */
async function createTopic(req, res) {
  const client = getSupabaseClient(req);
  const { title, content, category, tags, images, userId } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  if (!userId) {
    return res.status(401).json({ error: 'User ID is required' });
  }

  try {
    const categoryMap = {
      adoption: '领养经验',
      daily: '日常分享',
      help: '求助问答'
    };
    const finalCategory = categoryMap[category] || category || '日常分享';

    const { data: topic, error } = await client
      .from('forum_topics')
      .insert({
        user_id: userId,
        title,
        content,
        category: finalCategory,
        tags: tags || [],
        images: images || []
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({
      id: topic.id,
      message: 'Topic created successfully'
    });
  } catch (error) {
    console.error('Error creating topic:', error);
    res.status(500).json({ error: 'Failed to create topic' });
  }
}

/**
 * Toggle like on a topic
 */
async function toggleTopicLike(req, res) {
  const client = getSupabaseClient(req);
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'User ID is required' });
  }

  try {
    // Check if already liked
    const { data: existingLike } = await client
      .from('forum_topic_likes')
      .select('id')
      .eq('topic_id', id)
      .eq('user_id', userId)
      .single();

    if (existingLike) {
      // Unlike
      await client
        .from('forum_topic_likes')
        .delete()
        .eq('topic_id', id)
        .eq('user_id', userId);

      // Decrement likes count
      const { data: topic } = await client
        .from('forum_topics')
        .select('likes_count')
        .eq('id', id)
        .single();

      await client
        .from('forum_topics')
        .update({ likes_count: Math.max(0, (topic?.likes_count || 0) - 1) })
        .eq('id', id);

      res.json({ liked: false, likes: Math.max(0, (topic?.likes_count || 0) - 1) });
    } else {
      // Like
      await client
        .from('forum_topic_likes')
        .insert({ topic_id: id, user_id: userId });

      // Increment likes count
      const { data: topic } = await client
        .from('forum_topics')
        .select('likes_count')
        .eq('id', id)
        .single();

      await client
        .from('forum_topics')
        .update({ likes_count: (topic?.likes_count || 0) + 1 })
        .eq('id', id);

      res.json({ liked: true, likes: (topic?.likes_count || 0) + 1 });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
}

/**
 * Create a comment
 */
async function createComment(req, res) {
  const client = getSupabaseClient(req);
  const { topicId } = req.params;
  const { content, replyToCommentId, userId, locationCity, replyToUserName } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Comment content is required' });
  }

  if (!userId) {
    return res.status(401).json({ error: 'User ID is required' });
  }

  try {
    if (replyToCommentId) {
      // Create a reply
      const { data: reply, error: replyError } = await client
        .from('forum_replies')
        .insert({
          comment_id: replyToCommentId,
          user_id: userId,
          content: content.trim(),
          location_city: locationCity || null,
          reply_to_user_name: replyToUserName || null
        })
        .select()
        .single();

      if (replyError) {
        return res.status(500).json({ error: replyError.message });
      }

      // Increment replies count on comment
      const { data: comment } = await client
        .from('forum_comments')
        .select('replies_count')
        .eq('id', replyToCommentId)
        .single();

      await client
        .from('forum_comments')
        .update({ replies_count: (comment?.replies_count || 0) + 1 })
        .eq('id', replyToCommentId);

      res.status(201).json({
        id: reply.id,
        message: 'Reply created successfully'
      });
    } else {
      // Create a comment
      const { data: comment, error: commentError } = await client
        .from('forum_comments')
        .insert({
          topic_id: topicId,
          user_id: userId,
          content: content.trim(),
          location_city: locationCity || null
        })
        .select()
        .single();

      if (commentError) {
        return res.status(500).json({ error: commentError.message });
      }

      // Increment comments count on topic
      const { data: topic } = await client
        .from('forum_topics')
        .select('comments_count')
        .eq('id', topicId)
        .single();

      await client
        .from('forum_topics')
        .update({ comments_count: (topic?.comments_count || 0) + 1 })
        .eq('id', topicId);

      res.status(201).json({
        id: comment.id,
        message: 'Comment created successfully'
      });
    }
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
}

/**
 * Toggle like on a comment
 */
async function toggleCommentLike(req, res) {
  const client = getSupabaseClient(req);
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'User ID is required' });
  }

  try {
    const { data: existingLike } = await client
      .from('forum_comment_likes')
      .select('id')
      .eq('comment_id', id)
      .eq('user_id', userId)
      .single();

    if (existingLike) {
      await client
        .from('forum_comment_likes')
        .delete()
        .eq('comment_id', id)
        .eq('user_id', userId);

      const { data: comment } = await client
        .from('forum_comments')
        .select('likes_count')
        .eq('id', id)
        .single();

      await client
        .from('forum_comments')
        .update({ likes_count: Math.max(0, (comment?.likes_count || 0) - 1) })
        .eq('id', id);

      res.json({ liked: false, likes: Math.max(0, (comment?.likes_count || 0) - 1) });
    } else {
      await client
        .from('forum_comment_likes')
        .insert({ comment_id: id, user_id: userId });

      const { data: comment } = await client
        .from('forum_comments')
        .select('likes_count')
        .eq('id', id)
        .single();

      await client
        .from('forum_comments')
        .update({ likes_count: (comment?.likes_count || 0) + 1 })
        .eq('id', id);

      res.json({ liked: true, likes: (comment?.likes_count || 0) + 1 });
    }
  } catch (error) {
    console.error('Error toggling comment like:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
}

/**
 * Toggle like on a reply
 */
async function toggleReplyLike(req, res) {
  const client = getSupabaseClient(req);
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'User ID is required' });
  }

  try {
    const { data: existingLike } = await client
      .from('forum_reply_likes')
      .select('id')
      .eq('reply_id', id)
      .eq('user_id', userId)
      .single();

    if (existingLike) {
      await client
        .from('forum_reply_likes')
        .delete()
        .eq('reply_id', id)
        .eq('user_id', userId);

      const { data: reply } = await client
        .from('forum_replies')
        .select('likes_count')
        .eq('id', id)
        .single();

      await client
        .from('forum_replies')
        .update({ likes_count: Math.max(0, (reply?.likes_count || 0) - 1) })
        .eq('id', id);

      res.json({ liked: false, likes: Math.max(0, (reply?.likes_count || 0) - 1) });
    } else {
      await client
        .from('forum_reply_likes')
        .insert({ reply_id: id, user_id: userId });

      const { data: reply } = await client
        .from('forum_replies')
        .select('likes_count')
        .eq('id', id)
        .single();

      await client
        .from('forum_replies')
        .update({ likes_count: (reply?.likes_count || 0) + 1 })
        .eq('id', id);

      res.json({ liked: true, likes: (reply?.likes_count || 0) + 1 });
    }
  } catch (error) {
    console.error('Error toggling reply like:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
}

/**
 * Delete a comment (only by author). Cascades to replies.
 */
async function deleteComment(req, res) {
  const client = getSupabaseClient(req);
  const { id } = req.params;
  const userId = req.query.userId || req.body?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'User ID is required' });
  }

  try {
    const { data: comment, error: fetchError } = await client
      .from('forum_comments')
      .select('id, user_id, topic_id')
      .eq('id', id)
      .single();

    if (fetchError || !comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.user_id !== userId) {
      return res.status(403).json({ error: 'Only the author can delete this comment' });
    }

    const { error: deleteError } = await client
      .from('forum_comments')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return res.status(500).json({ error: deleteError.message });
    }

    const { data: topic } = await client
      .from('forum_topics')
      .select('comments_count')
      .eq('id', comment.topic_id)
      .single();

    await client
      .from('forum_topics')
      .update({ comments_count: Math.max(0, (topic?.comments_count || 0) - 1) })
      .eq('id', comment.topic_id);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
}

/**
 * Delete a reply (only by author)
 */
async function deleteReply(req, res) {
  const client = getSupabaseClient(req);
  const { id } = req.params;
  const userId = req.query.userId || req.body?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'User ID is required' });
  }

  try {
    const { data: reply, error: fetchError } = await client
      .from('forum_replies')
      .select('id, user_id, comment_id')
      .eq('id', id)
      .single();

    if (fetchError || !reply) {
      return res.status(404).json({ error: 'Reply not found' });
    }

    if (reply.user_id !== userId) {
      return res.status(403).json({ error: 'Only the author can delete this reply' });
    }

    const { error: deleteError } = await client
      .from('forum_replies')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return res.status(500).json({ error: deleteError.message });
    }

    const { data: comment } = await client
      .from('forum_comments')
      .select('replies_count')
      .eq('id', reply.comment_id)
      .single();

    await client
      .from('forum_comments')
      .update({ replies_count: Math.max(0, (comment?.replies_count || 0) - 1) })
      .eq('id', reply.comment_id);

    res.json({ message: 'Reply deleted successfully' });
  } catch (error) {
    console.error('Error deleting reply:', error);
    res.status(500).json({ error: 'Failed to delete reply' });
  }
}

/**
 * Delete a topic (only by author)
 */
async function deleteTopic(req, res) {
  const client = getSupabaseClient(req);
  const { id } = req.params;
  const { userId } = req.query;

  if (!userId) {
    return res.status(401).json({ error: 'User ID is required' });
  }

  try {
    const { data: topic, error: fetchError } = await client
      .from('forum_topics')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    if (topic.user_id !== userId) {
      return res.status(403).json({ error: 'Only the author can delete this topic' });
    }

    const { error: deleteError } = await client
      .from('forum_topics')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return res.status(500).json({ error: deleteError.message });
    }

    res.json({ message: 'Topic deleted successfully' });
  } catch (error) {
    console.error('Error deleting topic:', error);
    res.status(500).json({ error: 'Failed to delete topic' });
  }
}

/**
 * Generate topic content with AI
 */
async function generateTopicWithAI(req, res) {
  const { keywords } = req.body;

  if (!keywords || typeof keywords !== 'string') {
    return res.status(400).json({ error: 'Keywords are required' });
  }

  try {
    // 调用AI生成函数
    const result = await generateTopicContent(keywords);

    // 记录AI使用日志（可选）
    const client = getSupabaseClient(req);
    try {
      await client.from('ai_usage_log').insert([{
        operation: 'topic_generation',
        model: result.model,
        duration_ms: result.duration,
        success: true
      }]);
    } catch (logError) {
      console.error('Failed to log AI usage:', logError);
      // 不影响主流程，继续返回结果
    }

    // 返回生成结果
    res.json({
      success: true,
      data: {
        title: result.title,
        content: result.content,
        category: result.category,
        tags: result.tags,
        cost: 0.03, // 预估成本
        model: result.model
      }
    });
  } catch (error) {
    console.error('Error generating topic:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate topic content'
    });
  }
}

module.exports = {
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
};
