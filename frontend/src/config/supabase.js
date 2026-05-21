import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const createMissingEnvError = () =>
    new Error(
        'Supabase 环境变量缺失：请在 Vercel 配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY'
    );

const createFallbackSupabaseClient = () => ({
    auth: {
        async getSession() {
            return { data: { session: null }, error: null };
        },
        async setSession() {
            return { data: { session: null }, error: createMissingEnvError() };
        },
        async signInWithOAuth() {
            return { data: null, error: createMissingEnvError() };
        },
        async exchangeCodeForSession() {
            return { data: null, error: createMissingEnvError() };
        },
        async signOut() {
            return { error: null };
        },
        onAuthStateChange() {
            return { data: { subscription: { unsubscribe() {} } } };
        }
    },
    storage: {
        from() {
            return {
                async upload() {
                    return { data: null, error: createMissingEnvError() };
                },
                getPublicUrl() {
                    return { data: { publicUrl: '' } };
                }
            };
        }
    }
});

export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            flowType: 'pkce',
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    })
    : createFallbackSupabaseClient();

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
}
