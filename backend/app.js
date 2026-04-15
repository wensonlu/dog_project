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

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, _res, next) => {
    console.log(`[Request] ${req.method} ${req.originalUrl}`);
    next();
});

// Probe endpoints that do not depend on database or optional modules.
app.get('/_ping', (_req, res) => {
    res.json({ ok: true, service: 'backend', ts: Date.now() });
});
app.get('/api/_ping', (_req, res) => {
    res.json({ ok: true, service: 'backend', ts: Date.now() });
});

// Routes
// Support both `/xxx` and `/api/xxx` to avoid environment-specific routing issues.
const mountRoute = (path, route) => {
    app.use(path, route);
    app.use(`/api${path}`, route);
};

// Load non-critical routes lazily so one optional module failure won't crash the whole API.
const mountOptionalRoute = (path, modulePath) => {
    try {
        const route = require(modulePath);
        mountRoute(path, route);
    } catch (error) {
        console.error(`[Route Init] Failed to load route "${path}" from "${modulePath}"`);
        console.error(error?.stack || error?.message || error);
    }
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
mountOptionalRoute('/agent', './routes/agent');
mountOptionalRoute('/health', './routes/health');

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

app.use((err, _req, res, _next) => {
    console.error('[Express Error Middleware]');
    console.error(err?.stack || err);
    res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
