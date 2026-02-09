// 只在本地开发环境加载 dotenv
// Vercel 等 serverless 环境会直接提供 process.env，不需要 dotenv
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    try {
        const path = require('path');
        // 始终从 backend 目录加载 .env，避免从项目根启动时读不到
        const envPath = path.resolve(__dirname, '..', '.env');
        require('dotenv').config({ path: envPath });
    } catch (error) {
        // dotenv 未安装时忽略错误（serverless 环境）
        console.warn('dotenv not available, using environment variables directly');
    }
}

const { createClient } = require('@supabase/supabase-js');

// Supabase Setup
// Priority: Use service role key (bypasses RLS) > anon key (requires auth token)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY; // Fallback to SUPABASE_KEY for backward compatibility
let supabase = null;

// 详细的环境变量检查日志（仅在非生产环境或调试模式下）
const isDebugMode = process.env.DEBUG === 'true' || process.env.NODE_ENV !== 'production';

if (isDebugMode) {
    console.log('[Supabase Config] Environment check:');
    console.log(`  - SUPABASE_URL: ${supabaseUrl ? '✓ Set' : '✗ Missing'}`);
    console.log(`  - SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceRoleKey ? '✓ Set' : '✗ Missing'}`);
    console.log(`  - SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✓ Set' : '✗ Missing'}`);
    console.log(`  - NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    console.log(`  - VERCEL: ${process.env.VERCEL || 'not set'}`);
}

if (supabaseUrl && supabaseUrl.trim() !== '') {
    // Prefer service role key (bypasses RLS, suitable for backend operations)
    if (supabaseServiceRoleKey && supabaseServiceRoleKey.trim() !== '') {
        supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        console.log("✓ Supabase client initialized with SERVICE ROLE KEY (RLS bypassed).");
    } else if (supabaseAnonKey && supabaseAnonKey.trim() !== '') {
        supabase = createClient(supabaseUrl, supabaseAnonKey);
        console.log("✓ Supabase client initialized with ANON KEY (RLS enforced - requires auth token).");
        console.warn("⚠ WARNING: Using anon key. For backend operations, consider using SUPABASE_SERVICE_ROLE_KEY.");
    } else {
        console.error("✗ ERROR: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY missing. Supabase client not initialized.");
        console.error("  Please set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY in your environment variables.");
    }
} else {
    console.error("✗ ERROR: SUPABASE_URL missing. Supabase client not initialized.");
    console.error("  Please set SUPABASE_URL in your environment variables.");
    console.error("  In Vercel: Go to Project Settings > Environment Variables");
    console.error("  In local: Create a .env file in the backend/ directory");
}

module.exports = {
    supabase,
    supabaseUrl,
    supabaseServiceRoleKey,
    supabaseAnonKey
};
