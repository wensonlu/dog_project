/**
 * Vercel Serverless Function 入口点
 * 所有 /api/* 请求会被路由到这里
 * 
 * 注意：Vercel 会自动去掉 /api 前缀，所以请求 /api/auth/login 
 * 到达这里时路径已经变成了 /auth/login
 */
const express = require('express');
const cors = require('cors');

// 导入路由
const authRoutes = require('../routes/auth');
const dogsRoutes = require('../routes/dogs');
const favoritesRoutes = require('../routes/favorites');
const applicationsRoutes = require('../routes/applications');
const messagesRoutes = require('../routes/messages');
const dogSubmissionsRoutes = require('../routes/dogSubmissions');
const uploadRoutes = require('../routes/upload');
const forumRoutes = require('../routes/forum');

const app = express();

// CORS 配置：允许 Vercel 前端域名和本地开发环境
const corsOptions = {
    origin: function (origin, callback) {
        // 允许无 origin 的请求（如 Postman、移动应用等）
        if (!origin) {
            return callback(null, true);
        }
        
        // 允许本地开发环境
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
            return callback(null, true);
        }
        
        // 允许所有 Vercel 部署的前端域名（包含 wensons-projects-bb20578e.vercel.app）
        if (origin.includes('wensons-projects-bb20578e.vercel.app') || 
            origin.includes('vercel.app')) {
            return callback(null, true);
        }
        
        // 允许通过环境变量配置的额外域名
        const allowedOrigins = process.env.ALLOWED_ORIGINS 
            ? process.env.ALLOWED_ORIGINS.split(',') 
            : [];
        
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        // 拒绝其他来源
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true, // 允许携带凭证（cookies、authorization headers）
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400 // 预检请求缓存时间（24小时）
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes (注意：这里不需要 /api 前缀，因为 Vercel 已经去掉了)
// 每个路由文件内部已经包含了 checkSupabase 中间件
app.use('/auth', authRoutes);
app.use('/dogs', dogsRoutes);
app.use('/favorites', favoritesRoutes);
app.use('/applications', applicationsRoutes);
app.use('/messages', messagesRoutes);
app.use('/dog-submissions', dogSubmissionsRoutes);
app.use('/upload', uploadRoutes);
app.use('/forum', forumRoutes);

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

// 导出为 Vercel serverless function handler
module.exports = app;
