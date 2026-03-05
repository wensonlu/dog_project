// ============================================
// 宠物百科路由
// ============================================

const express = require('express');
const router = express.Router();
const wikiController = require('../controllers/wikiController');
const { checkSupabase } = require('../middleware/supabaseCheck');

// 公开路由
router.get('/categories', checkSupabase, wikiController.getCategories);
router.get('/articles', checkSupabase, wikiController.getArticles);
router.get('/articles/search', checkSupabase, wikiController.searchArticles);
router.get('/articles/:slug', checkSupabase, wikiController.getArticleBySlug);

// 需要登录的路由
router.post('/articles', checkSupabase, wikiController.createArticle);
router.put('/articles/:id', checkSupabase, wikiController.updateArticle);

// 收藏
router.get('/favorites', checkSupabase, wikiController.getFavorites);
router.post('/favorites', checkSupabase, wikiController.toggleFavorite);

module.exports = router;
