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
  deleteTopic
} = require('../controllers/forumController');
const checkSupabase = require('../middleware/supabaseCheck');

// Get all topics with filters
router.get('/', checkSupabase, getAllTopics);

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

module.exports = router;
