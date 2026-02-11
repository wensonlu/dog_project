import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [favoritesCount, setFavoritesCount] = useState(0);
    const [applicationsCount, setApplicationsCount] = useState(0);
    const [submissionsCount, setSubmissionsCount] = useState(0);
    const [applications, setApplications] = useState([]);
    const [showApplications, setShowApplications] = useState(false);
    const [loading, setLoading] = useState(true);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!user || !user.id) {
                setLoading(false);
                return;
            }

            try {
                const [favoritesRes, applicationsRes, submissionsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/favorites/${user.id}`).catch(err => ({ ok: false, error: err })),
                    fetch(`${API_BASE_URL}/applications/${user.id}`).catch(err => ({ ok: false, error: err })),
                    fetch(`${API_BASE_URL}/dog-submissions`).catch(err => ({ ok: false, error: err }))
                ]);

                if (favoritesRes.ok) {
                    const favoritesData = await favoritesRes.json();
                    setFavoritesCount(Array.isArray(favoritesData) ? favoritesData.length : 0);
                }

                if (applicationsRes.ok) {
                    const applicationsData = await applicationsRes.json();
                    const appsArray = Array.isArray(applicationsData) ? applicationsData : [];
                    setApplications(appsArray);
                    setApplicationsCount(appsArray.length);
                }

                if (submissionsRes.ok) {
                    const submissionsData = await submissionsRes.json();
                    const submissionsArray = Array.isArray(submissionsData) ? submissionsData : [];
                    const userSubmissions = submissionsArray.filter(sub => sub.user_id === user.id);
                    setSubmissionsCount(userSubmissions.length);
                }
            } catch (error) {
                console.error('Error fetching profile data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user?.id]);

    const pendingCount = applications.filter(app => app.status === 'pending').length;

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
            approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
            rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
        };
        const labels = {
            pending: '审核中',
            approved: '已通过',
            rejected: '未通过'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles[status] || styles.pending}`}>
                {labels[status] || '未知'}
            </span>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const menuItems = [
        { 
            icon: 'pending_actions', 
            label: '领养进度', 
            emoji: '📋',
            sub: pendingCount > 0 ? `${pendingCount} 个新动态` : null, 
            highlight: true,
            action: () => setShowApplications(true)
        },
        { 
            icon: 'forum', 
            label: '我的帖子',
            emoji: '💬',
            action: () => navigate('/forum')
        },
        { 
            icon: 'assignment', 
            label: '领养管理', 
            emoji: '📊',
            action: () => navigate('/admin')
        },
        { 
            icon: 'publish', 
            label: '发布管理', 
            emoji: '📝',
            action: () => navigate('/admin-submissions')
        },
        { 
            icon: 'pets', 
            label: '送养小狗', 
            emoji: '🐕',
            action: () => navigate('/submit-dog') 
        },
        { 
            icon: 'help_center', 
            label: '帮助中心',
            emoji: '❓',
        },
        { 
            icon: 'settings', 
            label: '设置',
            emoji: '⚙️',
        },
    ];

    return (
        <div className="mx-auto max-w-[430px] min-h-screen bg-gradient-to-b from-rose-50/50 via-cream-50 to-teal-50/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 text-gray-800 dark:text-white font-sans relative pb-32 overflow-hidden">
            {/* 背景装饰 */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-rose-200/30 rounded-full blur-3xl" />
                <div className="absolute top-1/3 -left-20 w-48 h-48 bg-pink-200/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-0 w-56 h-56 bg-teal-200/20 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-rose-100/50 dark:border-zinc-800"
            >
                <div className="flex items-center p-4 pb-3 justify-between">
                    <motion.button 
                        whileTap={{ scale: 0.9 }}
                        className="flex size-11 rounded-xl bg-rose-100 dark:bg-rose-900/30 items-center justify-center text-rose-500"
                    >
                        <span className="material-symbols-outlined text-xl">settings</span>
                    </motion.button>
                    <div className="flex flex-col items-center">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white">我的</h2>
                        <p className="text-xs text-rose-400">温暖相伴</p>
                    </div>
                    <motion.button 
                        whileTap={{ scale: 0.9 }}
                        className="relative flex size-11 rounded-xl bg-rose-100 dark:bg-rose-900/30 items-center justify-center text-rose-500"
                    >
                        <span className="material-symbols-outlined text-xl">notifications</span>
                        <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                        </span>
                    </motion.button>
                </div>
            </motion.div>

            {/* 用户信息卡片 */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="px-4 pt-4"
            >
                <div className="bg-white dark:bg-zinc-800 rounded-3xl p-6 shadow-lg shadow-rose-100/30 dark:shadow-none border border-rose-100/50 dark:border-zinc-700">
                    <div className="flex flex-col items-center">
                        <div className="relative mb-4">
                            <div className="size-24 rounded-full bg-gradient-to-br from-rose-300 via-pink-300 to-teal-300 p-1">
                                <div className="w-full h-full rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                                    <span className="text-5xl">🐕</span>
                                </div>
                            </div>
                            <motion.button 
                                whileTap={{ scale: 0.9 }}
                                className="absolute bottom-0 right-0 size-8 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 flex items-center justify-center text-white shadow-lg"
                            >
                                <span className="material-symbols-outlined text-sm">edit</span>
                            </motion.button>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">
                            {user?.email?.split('@')[0] || '爱心铲屎官'}
                        </h3>
                        <p className="text-sm text-rose-500 font-medium mb-2">汪星球领养人</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                            <span className="material-symbols-outlined text-sm text-rose-400">calendar_today</span>
                            <span>加入第 125 天</span>
                        </div>
                        <div className="px-4 py-2 bg-rose-50 dark:bg-rose-900/20 rounded-full">
                            <p className="text-sm text-rose-600 dark:text-rose-300 italic">"愿每一只狗狗都有温暖的家"</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* 数据统计 */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="px-4 mt-4"
            >
                <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-md shadow-rose-100/20 dark:shadow-none border border-rose-100/50 dark:border-zinc-700">
                    <div className="flex items-center justify-around">
                        <motion.div 
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/favorites')}
                            className="flex flex-col items-center cursor-pointer"
                        >
                            <span className="text-2xl font-bold text-rose-500">
                                {loading ? '-' : favoritesCount}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">我的收藏</span>
                        </motion.div>
                        <div className="w-px h-10 bg-rose-100 dark:bg-zinc-700" />
                        <motion.div 
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowApplications(true)}
                            className="flex flex-col items-center cursor-pointer"
                        >
                            <span className="text-2xl font-bold text-emerald-500">
                                {loading ? '-' : applicationsCount}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">已领养</span>
                        </motion.div>
                        <div className="w-px h-10 bg-rose-100 dark:bg-zinc-700" />
                        <motion.div 
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/admin-submissions')}
                            className="flex flex-col items-center cursor-pointer"
                        >
                            <span className="text-2xl font-bold text-blue-500">
                                {loading ? '-' : submissionsCount}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">已发布</span>
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* 菜单列表 */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="px-4 mt-4 space-y-2"
            >
                <p className="text-xs text-gray-500 font-medium px-2 mb-2">领养服务</p>
                {menuItems.slice(0, 5).map((item, index) => (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={item.action}
                        className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-rose-100/30 dark:border-zinc-700 cursor-pointer"
                    >
                        <div className={`size-11 rounded-xl flex items-center justify-center text-xl ${item.highlight ? 'bg-rose-100 dark:bg-rose-900/30' : 'bg-gray-100 dark:bg-zinc-700'}`}>
                            {item.emoji}
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-gray-800 dark:text-white">{item.label}</p>
                            {item.sub && <p className="text-xs text-rose-500 mt-0.5">{item.sub}</p>}
                        </div>
                        <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                    </motion.div>
                ))}

                <p className="text-xs text-gray-500 font-medium px-2 mb-2 mt-6">其他</p>
                {menuItems.slice(5).map((item, index) => (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.05 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={item.action}
                        className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-rose-100/30 dark:border-zinc-700 cursor-pointer"
                    >
                        <div className="size-11 rounded-xl bg-gray-100 dark:bg-zinc-700 flex items-center justify-center text-xl">
                            {item.emoji}
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-gray-800 dark:text-white">{item.label}</p>
                        </div>
                        <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                    </motion.div>
                ))}

                {/* 退出按钮 */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 p-4 mt-4 bg-rose-50 dark:bg-rose-900/20 text-rose-500 font-bold rounded-2xl border border-rose-100 dark:border-rose-900/30"
                >
                    <span className="material-symbols-outlined">logout</span>
                    退出登录
                </motion.button>
            </motion.div>

            {/* 领养进度弹窗 */}
            <AnimatePresence>
                {showApplications && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-white dark:bg-zinc-900"
                    >
                        <div className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-rose-100/50 dark:border-zinc-800">
                            <div className="flex items-center p-4 pb-3 justify-between">
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowApplications(false)}
                                    className="flex size-11 rounded-xl bg-rose-100 dark:bg-rose-900/30 items-center justify-center text-rose-500"
                                >
                                    <span className="material-symbols-outlined">arrow_back</span>
                                </motion.button>
                                <h2 className="text-lg font-bold text-gray-800 dark:text-white">领养进度</h2>
                                <div className="w-11" />
                            </div>
                        </div>

                        <div className="px-4 py-4 max-h-[calc(100vh-80px)] overflow-y-auto pb-24">
                            {applications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="text-6xl mb-4">🐾</div>
                                    <p className="text-gray-500 dark:text-gray-400">暂无申请记录</p>
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            setShowApplications(false);
                                            navigate('/');
                                        }}
                                        className="mt-4 px-6 py-2 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full text-sm font-medium"
                                    >
                                        去申请领养
                                    </motion.button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {applications.map((app, index) => (
                                        <motion.div
                                            key={app.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => {
                                                setShowApplications(false);
                                                navigate(`/application/${app.id}`);
                                            }}
                                            className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-sm border border-rose-100/50 dark:border-zinc-700 cursor-pointer"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                                                        {app.dogs?.name || '未知小狗'}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">
                                                        {formatDate(app.created_at)}
                                                    </p>
                                                </div>
                                                {getStatusBadge(app.status)}
                                            </div>
                                            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                                <p>申请人：{app.full_name}</p>
                                                <p>电话：{app.phone}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <BottomNav />
        </div>
    );
};

export default Profile;
