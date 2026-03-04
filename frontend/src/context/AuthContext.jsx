import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { supabase } from '../config/supabase';
import { hasPermission as checkPermission } from '../constants/permissions';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // 从后端获取用户权限
    const fetchPermissions = async () => {
        try {
            // 从 localStorage 获取 session
            const sessionStr = localStorage.getItem('pawmate_session');
            if (!sessionStr) return 0;

            const session = JSON.parse(sessionStr);
            const token = session.access_token;

            const res = await fetch(`${API_BASE_URL}/permissions/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                return data.permissions || 0;
            }
            return 0;
        } catch (error) {
            console.error('获取权限失败:', error);
            return 0;
        }
    };

    useEffect(() => {
        // 从 localStorage 恢复用户状态
        const checkSession = async () => {
            console.log('[AuthContext useEffect] 开始恢复用户状态');
            const storedUser = localStorage.getItem('pawmate_user');
            const storedSession = localStorage.getItem('pawmate_session');
            console.log('[AuthContext useEffect] localStorage 中的用户:', storedUser ? JSON.parse(storedUser) : null);

            if (storedUser && storedSession) {
                const userData = JSON.parse(storedUser);
                const sessionData = JSON.parse(storedSession);

                // 恢复 Supabase 客户端 session（供管理页面使用）
                if (sessionData.access_token && sessionData.refresh_token) {
                    supabase.auth.setSession({
                        access_token: sessionData.access_token,
                        refresh_token: sessionData.refresh_token
                    }).catch(err => {
                        console.warn('[AuthContext useEffect] 恢复 Supabase session 失败:', err);
                    });
                }

                console.log('[AuthContext useEffect] 恢复用户状态:', userData);
                setUser(userData);
            } else {
                console.log('[AuthContext useEffect] localStorage 中没有用户数据');
            }
            setLoading(false);
            console.log('[AuthContext useEffect] 加载完成，loading = false');
        };

        checkSession();
    }, []);

    const login = async (email, password) => {
        console.log('[AuthContext] 开始登录...');
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        console.log('[AuthContext] 响应状态:', res.status);
        const data = await res.json();
        console.log('[AuthContext] 响应数据:', data);

        if (data.error) throw new Error(data.error);

        // 先保存 session，以便 fetchPermissions 可以使用
        localStorage.setItem('pawmate_session', JSON.stringify(data.session));

        // 同步 session 到 Supabase 客户端（供管理页面使用）
        // 异步调用，不等待完成，避免阻塞登录流程
        supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
        }).catch(err => {
            console.warn('[AuthContext] setSession 失败（不影响登录）:', err);
        });

        // 立即获取用户权限
        console.log('[AuthContext] 获取用户权限...');
        const permissions = await fetchPermissions();
        console.log('[AuthContext] 用户权限:', permissions);

        // 构建完整的用户数据
        const userData = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || data.user.email,
            avatar: data.user.user_metadata?.avatar_url || null,
            permissions,
            session: data.session
        };

        console.log('[AuthContext] 更新用户状态:', userData);
        setUser(userData);
        localStorage.setItem('pawmate_user', JSON.stringify(userData));
        console.log('[AuthContext] 登录完成！');

        return data.user;
    };

    const loginWithGoogle = async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
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

        // 先保存 session，以便 fetchPermissions 可以使用
        localStorage.setItem('pawmate_session', JSON.stringify(data.session));

        // 同步 session 到 Supabase 客户端（供管理页面使用）
        // 异步调用，不等待完成，避免阻塞注册流程
        supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
        }).catch(err => {
            console.warn('[AuthContext] setSession 失败（不影响注册）:', err);
        });

        // 立即获取用户权限
        const permissions = await fetchPermissions();

        // 构建完整的用户数据
        const userData = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || data.user.email,
            avatar: data.user.user_metadata?.avatar_url || null,
            permissions,
            session: data.session
        };

        setUser(userData);
        localStorage.setItem('pawmate_user', JSON.stringify(userData));

        return data.user;
    };

    const logout = async () => {
        // 清除 Supabase 客户端的 session（如果有 Google 登录）
        await supabase.auth.signOut();
        // 清除本地状态
        setUser(null);
        localStorage.removeItem('pawmate_user');
        localStorage.removeItem('pawmate_session');
    };

    // 刷新用户权限（权限更新后调用）
    const refreshPermissions = async () => {
        if (!user) return;
        const permissions = await fetchPermissions();
        const updatedUser = { ...user, permissions };
        setUser(updatedUser);
        localStorage.setItem('pawmate_user', JSON.stringify(updatedUser));
    };

    // 检查当前用户是否拥有指定权限
    const hasPermission = (requiredPermission) => {
        if (!user || user.permissions === undefined) return false;
        return checkPermission(user.permissions, requiredPermission);
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            loginWithGoogle,
            register,
            logout,
            refreshPermissions,
            hasPermission
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
