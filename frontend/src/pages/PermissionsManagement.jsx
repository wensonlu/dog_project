import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { API_BASE_URL } from '../config/api';
import { supabase } from '../config/supabase';
import { PERMISSIONS, hasPermission as checkPermission, PERMISSION_NAMES } from '../constants/permissions';
import { useAuth } from '../context/AuthContext';

const PermissionsManagement = () => {
    const navigate = useNavigate();
    const { user, refreshPermissions } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [updating, setUpdating] = useState({});

    // 获取所有用户
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }

            const token = session.access_token;
            const res = await fetch(`${API_BASE_URL}/permissions/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            } else {
                console.error('获取用户列表失败');
            }
        } catch (error) {
            console.error('获取用户列表异常:', error);
        } finally {
            setLoading(false);
        }
    };

    // 切换用户权限
    const togglePermission = async (userId, permission) => {
        try {
            setUpdating(prev => ({ ...prev, [`${userId}-${permission}`]: true }));

            const targetUser = users.find(u => u.id === userId);
            if (!targetUser) return;

            // 计算新的权限值（使用位运算切换）
            const newPermissions = targetUser.permissions ^ permission;

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }

            const token = session.access_token;
            const res = await fetch(`${API_BASE_URL}/permissions/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ permissions: newPermissions })
            });

            if (res.ok) {
                const data = await res.json();
                // 更新本地用户列表
                setUsers(prev => prev.map(u =>
                    u.id === userId ? { ...u, permissions: data.user.permissions } : u
                ));

                // 如果更新的是当前用户，刷新当前用户权限
                if (userId === user?.id) {
                    await refreshPermissions();
                }
            } else {
                const error = await res.json();
                alert(error.message || '更新权限失败');
            }
        } catch (error) {
            console.error('更新权限异常:', error);
            alert('更新权限失败');
        } finally {
            setUpdating(prev => ({ ...prev, [`${userId}-${permission}`]: false }));
        }
    };

    // 过滤用户列表
    const filteredUsers = users.filter(u => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            u.email?.toLowerCase().includes(query) ||
            u.full_name?.toLowerCase().includes(query)
        );
    });

    return (
        <div className="mx-auto max-w-[430px] min-h-screen bg-gradient-to-b from-rose-50/50 via-cream-50 to-teal-50/30 text-gray-800 font-sans relative pb-32">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
                <div className="flex items-center justify-between px-4 py-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="size-10 rounded-full bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center text-zinc-600 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700"
                    >
                        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    </button>
                    <h1 className="text-lg font-bold">权限管理</h1>
                    <div className="size-10" />
                </div>

                {/* 搜索框 */}
                <div className="px-4 pb-4">
                    <div className="relative">
                        <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
                            search
                        </span>
                        <input
                            type="text"
                            placeholder="搜索用户邮箱或姓名"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300"
                        />
                    </div>
                </div>
            </div>

            {/* 用户列表 */}
            <div className="p-4 space-y-3">
                {loading ? (
                    <div className="text-center py-12 text-gray-500">
                        加载中...
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        {searchQuery ? '未找到匹配的用户' : '暂无用户'}
                    </div>
                ) : (
                    filteredUsers.map(u => (
                        <motion.div
                            key={u.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
                        >
                            {/* 用户信息 */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold">
                                    {u.avatar_url ? (
                                        <img
                                            src={u.avatar_url}
                                            alt={u.full_name || u.email}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-lg">
                                            {(u.full_name || u.email || '?')[0].toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 truncate">
                                        {u.full_name || u.email}
                                    </div>
                                    {u.full_name && (
                                        <div className="text-sm text-gray-500 truncate">
                                            {u.email}
                                        </div>
                                    )}
                                </div>
                                {u.id === user?.id && (
                                    <span className="px-2 py-1 bg-rose-100 text-rose-600 text-xs rounded-full">
                                        当前用户
                                    </span>
                                )}
                            </div>

                            {/* 权限开关 */}
                            <div className="space-y-2">
                                {[
                                    { permission: PERMISSIONS.MANAGE_ADOPTIONS, label: '领养管理' },
                                    { permission: PERMISSIONS.MANAGE_SUBMISSIONS, label: '发布管理' },
                                    { permission: PERMISSIONS.SUPER_ADMIN, label: '超级管理员' },
                                ].map(({ permission, label }) => {
                                    const isEnabled = checkPermission(u.permissions || 0, permission);
                                    const isUpdating = updating[`${u.id}-${permission}`];

                                    return (
                                        <div
                                            key={permission}
                                            className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                                        >
                                            <span className="text-sm text-gray-700">{label}</span>
                                            <button
                                                onClick={() => togglePermission(u.id, permission)}
                                                disabled={isUpdating}
                                                className={`relative w-12 h-6 rounded-full transition-colors ${isEnabled ? 'bg-rose-500' : 'bg-gray-300'
                                                    } ${isUpdating ? 'opacity-50' : ''}`}
                                            >
                                                <div
                                                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${isEnabled ? 'translate-x-6' : ''
                                                        }`}
                                                />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            <BottomNav />
        </div>
    );
};

export default PermissionsManagement;
