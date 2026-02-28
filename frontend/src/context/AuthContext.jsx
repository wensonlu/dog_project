import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { supabase } from '../config/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 检查 Supabase 会话
        const checkSupabaseSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const userData = {
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.user_metadata?.name || session.user.email,
                    avatar: session.user.user_metadata?.avatar_url || null
                };
                setUser(userData);
                localStorage.setItem('pawmate_user', JSON.stringify(userData));
            } else {
                // 如果没有 Supabase 会话，检查本地存储
                const storedUser = localStorage.getItem('pawmate_user');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            }
            setLoading(false);
        };

        checkSupabaseSession();

        // 监听认证状态变化
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                const userData = {
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.user_metadata?.name || session.user.email,
                    avatar: session.user.user_metadata?.avatar_url || null
                };
                setUser(userData);
                localStorage.setItem('pawmate_user', JSON.stringify(userData));
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                localStorage.removeItem('pawmate_user');
            }
        });

        return () => {
            authListener?.subscription?.unsubscribe();
        };
    }, []);

    const login = async (email, password) => {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        setUser(data.user);
        localStorage.setItem('pawmate_user', JSON.stringify(data.user));
        return data.user;
    };

    const loginWithGoogle = async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent'
                }
            }
        });

        if (error) throw error;
        return data;
    };

    const register = async (email, password) => {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        setUser(data.user);
        localStorage.setItem('pawmate_user', JSON.stringify(data.user));
        return data.user;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        localStorage.removeItem('pawmate_user');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
