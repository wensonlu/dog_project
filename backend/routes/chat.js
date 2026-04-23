// backend/routes/chat.js

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const checkSupabase = require('../middleware/supabaseCheck');

// 公开路由
router.post('/sessions', checkSupabase, chatController.createSession);
router.post('/messages', checkSupabase, chatController.sendMessage);
router.get('/sessions/:session_id', checkSupabase, chatController.getSessionHistory);

// 需要认证的路由
router.delete('/sessions/:session_id', checkSupabase, chatController.deleteSession);

module.exports = router;
