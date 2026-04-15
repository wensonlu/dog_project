const express = require('express');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/auth');
const dogsRoutes = require('./routes/dogs');
const favoritesRoutes = require('./routes/favorites');
const applicationsRoutes = require('./routes/applications');
const messagesRoutes = require('./routes/messages');
const dogSubmissionsRoutes = require('./routes/dogSubmissions');
const uploadRoutes = require('./routes/upload');
const forumRoutes = require('./routes/forum');
const statsRoutes = require('./routes/stats');
const reviewsRoutes = require('./routes/reviews');
const recommendationsRoutes = require('./routes/recommendations');
const permissionsRoutes = require('./routes/permissions');
const storiesRoutes = require('./routes/stories');
const wikiRoutes = require('./routes/wiki');
const agentRoutes = require('./routes/agent');
const healthRoutes = require('./routes/health');

const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
// Support both `/xxx` and `/api/xxx` to avoid environment-specific routing issues.
const mountRoute = (path, route) => {
    app.use(path, route);
    app.use(`/api${path}`, route);
};

mountRoute('/auth', authRoutes);
mountRoute('/dogs', dogsRoutes);
mountRoute('/favorites', favoritesRoutes);
mountRoute('/applications', applicationsRoutes);
mountRoute('/messages', messagesRoutes);
mountRoute('/dog-submissions', dogSubmissionsRoutes);
mountRoute('/upload', uploadRoutes);
mountRoute('/forum', forumRoutes);
mountRoute('/stats', statsRoutes);
mountRoute('/reviews', reviewsRoutes);
mountRoute('/recommendations', recommendationsRoutes);
mountRoute('/permissions', permissionsRoutes);
mountRoute('/stories', storiesRoutes);
mountRoute('/wiki', wikiRoutes);
mountRoute('/agent', agentRoutes);
mountRoute('/health', healthRoutes);

// Health check endpoint（含 Supabase 状态，便于排查 500）
app.get('/health', (_req, res) => {
    const { supabase } = require('./config/supabase');
    res.json({
        status: 'ok',
        message: 'Server is running',
        supabase: supabase ? 'initialized' : 'not initialized',
        env: {
            hasSupabaseUrl: !!process.env.SUPABASE_URL,
            hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            hasAnonKey: !!(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY),
        },
    });
});

app.get('/api/health', (_req, res) => {
    const { supabase } = require('./config/supabase');
    res.json({
        status: 'ok',
        message: 'Server is running',
        supabase: supabase ? 'initialized' : 'not initialized',
        env: {
            hasSupabaseUrl: !!process.env.SUPABASE_URL,
            hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            hasAnonKey: !!(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY),
        },
    });
});

// Vercel serverless 环境：只导出 app，不调用 app.listen()
// 本地开发环境：需要启动服务器
if (process.env.VERCEL !== '1') {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

module.exports = app;
