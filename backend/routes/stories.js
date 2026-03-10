// ============================================
// 领养故事路由
// ============================================

const express = require('express');
const router = express.Router();
const storiesController = require('../controllers/storiesController');
const checkSupabase = require('../middleware/supabaseCheck');

// 公开路由
router.get('/', checkSupabase, storiesController.getStories);
router.get('/:id', checkSupabase, storiesController.getStoryById);

// 需要登录的路由
router.post('/', checkSupabase, storiesController.createStory);
router.put('/:id', checkSupabase, storiesController.updateStory);
router.delete('/:id', checkSupabase, storiesController.deleteStory);

// 时间线
router.post('/:id/timeline', checkSupabase, storiesController.addTimeline);

// 互动
router.post('/:id/like', checkSupabase, storiesController.toggleLike);
router.get('/:id/comments', checkSupabase, storiesController.getStoryById);
router.post('/:id/comments', checkSupabase, storiesController.addComment);

module.exports = router;
