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
app.use('/api/agent', agentRoutes);
app.use('/api/health', healthRoutes);

// Health check endpoint（含 Supabase 状态，便于排查 500）
app.get('/health', (req, res) => {
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