/**
 * Vercel Serverless Function 入口点
 * 所有 /api/* 请求会被路由到这里
 * 
 * 注意：Vercel 会自动去掉 /api 前缀，所以请求 /api/auth/login 
 * 到达这里时路径已经变成了 /auth/login
 */
const express = require('express');

// 导入路由
const authRoutes = require('../routes/auth');
const dogsRoutes = require('../routes/dogs');
const favoritesRoutes = require('../routes/favorites');
const applicationsRoutes = require('../routes/applications');
const messagesRoutes = require('../routes/messages');
const dogSubmissionsRoutes = require('../routes/dogSubmissions');
const uploadRoutes = require('../routes/upload');
const forumRoutes = require('../routes/forum');
const statsRoutes = require('../routes/stats');
const reviewsRoutes = require('../routes/reviews');
const recommendationsRoutes = require('../routes/recommendations');
const permissionsRoutes = require('../routes/permissions');
const storiesRoutes = require('../routes/stories');
const wikiRoutes = require('../routes/wiki');

const app = express();

// Routes (Vercel Express 框架不会自动去掉 /api 前缀)
// 每个路由文件内部已经包含了 checkSupabase 中间件
app.use('/api/auth', authRoutes);
app.use('/api/dogs', dogsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/dog-submissions', dogSubmissionsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/permissions', permissionsRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/wiki', wikiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    const { supabase } = require('../config/supabase');
    res.json({ 
        status: 'ok', 
        message: 'Server is running',
        supabase: supabase ? 'initialized' : 'not initialized',
        env: {
            hasSupabaseUrl: !!process.env.SUPABASE_URL,
            hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            hasAnonKey: !!(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY),
            nodeEnv: process.env.NODE_ENV,
            vercel: process.env.VERCEL || 'not set'
        }
    });
});

// 调试：捕获所有未匹配的路由
app.use((req, res, next) => {
    console.log(`[API] Unmatched route: ${req.method} ${req.path}`);
    res.status(404).json({ 
        error: 'Route not found', 
        method: req.method, 
        path: req.path,
        originalUrl: req.originalUrl
    });
});

// 判断 origin 是否允许（与 corsOptions.origin 逻辑一致）
function isOriginAllowed(origin) {
    if (!origin) return true;
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) return true;
    if (origin.includes('wensons-projects-bb20578e.vercel.app') || origin.includes('vercel.app')) return true;
    const allowed = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
    return allowed.includes(origin);
}

// Vercel Serverless：先加 CORS 头并处理 OPTIONS，再交给 Express，避免预检/错误响应无 CORS 头
function handler(req, res) {
    const origin = req.headers.origin;
    if (isOriginAllowed(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
    } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    // 规范化路径：Vercel rewrite 可能把 path 放在 ?path=xxx，或 req.url 为完整 URL/带 /api
    let pathname = typeof req.url === 'string' ? req.url : '/';
    const pathMatch = pathname.match(/\?path=(.+)$/);
    if (pathMatch) {
        pathname = '/api/' + decodeURIComponent(pathMatch[1].replace(/&.*$/, ''));
    } else {
        try {
            if (pathname.startsWith('http')) {
                pathname = new URL(pathname).pathname;
            }
        } catch (_) {}
    }
    if (pathname.startsWith('/api')) {
        pathname = pathname.slice(4) || '/';
    }
    req.url = pathname;

    return app(req, res);
}

module.exports = handler;
