import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import { API_BASE_URL } from '../config/api';

const Messages = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [contactResults, setContactResults] = useState([]);
    const [contactSearching, setContactSearching] = useState(false);

    useEffect(() => {
        fetchMessages();
    }, [user]);

    // 输入字符后模糊匹配全部注册用户（防抖）
    const fetchContactSearch = useCallback(async (q) => {
        if (!user?.id || !q.trim()) {
            setContactResults([]);
            return;
        }
        setContactSearching(true);
        try {
            const res = await fetch(
                `${API_BASE_URL}/messages/${user.id}/contacts/search?q=${encodeURIComponent(q.trim())}`
            );
            const data = await res.json();
            setContactResults(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('搜索联系人失败:', err);
            setContactResults([]);
        } finally {
            setContactSearching(false);
        }
    }, [user?.id]);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setContactResults([]);
            setContactSearching(false);
            return;
        }
        const t = setTimeout(() => {
            fetchContactSearch(searchQuery);
        }, 300);
        return () => clearTimeout(t);
    }, [searchQuery, fetchContactSearch]);

    const fetchMessages = async () => {
        if (!user) return;

        try {
            const response = await fetch(`${API_BASE_URL}/messages/${user.id}`);
            const data = await response.json();
            setMessages(data);
        } catch (error) {
            console.error('获取消息失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days === 1) return '昨天';
        if (days < 7) return `${days}天前`;
        return date.toLocaleDateString('zh-CN');
    };

    const filteredMessages = messages.filter(msg => 
        msg.sender_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.content?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="mx-auto max-w-[430px] h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-cream-50 dark:from-zinc-900 dark:to-zinc-900">
                <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-4xl"
                >
                    💌
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-[430px] mx-auto min-h-screen flex flex-col relative bg-gradient-to-b from-blue-50/50 via-cream-50 to-rose-50/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 pb-24 overflow-hidden">
            {/* 背景装饰 */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl" />
                <div className="absolute top-1/3 -left-20 w-48 h-48 bg-rose-200/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-0 w-56 h-56 bg-pink-200/20 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl px-4 pt-6 pb-3 border-b border-blue-100/50 dark:border-zinc-800"
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="size-11 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-200/50">
                            <span className="text-2xl"><span className="material-symbols-outlined">chat</span></span>
                        </div>
                        <div>
                            <p className="text-xs text-blue-500 font-medium">温馨对话</p>
                            <h1 className="text-xl font-bold text-gray-800 dark:text-white">消息中心</h1>
                        </div>
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        className="size-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500"
                    >
                        <span className="material-symbols-outlined">edit_square</span>
                    </motion.button>
                </div>

                {/* 搜索栏 */}
                <div className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="搜索联系人..."
                        className="w-full h-11 px-4 pl-11 rounded-2xl border border-blue-100 dark:border-zinc-700 bg-white/90 dark:bg-zinc-800/90 text-sm text-gray-800 dark:text-white placeholder-blue-300/70 focus:outline-none focus:ring-2 focus:ring-blue-200/50"
                    />
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-blue-300 text-lg">
                        search
                    </span>
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 size-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"
                        >
                            <span className="material-symbols-outlined text-xs text-blue-500">close</span>
                        </button>
                    )}
                </div>
            </motion.header>

            {/* 消息列表 / 搜索联系人结果 */}
            <main className="flex-1 px-4 py-4 space-y-3 relative z-10">
                <AnimatePresence mode="popLayout">
                    {searchQuery.trim() ? (
                        <>
                            {/* 匹配的注册用户（模糊匹配全部用户） */}
                            <div className="mb-4">
                                <h3 className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-2 px-1">
                                    匹配的用户
                                </h3>
                                {contactSearching ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-400" />
                                    </div>
                                ) : contactResults.length === 0 ? (
                                    <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">未找到匹配用户</p>
                                ) : (
                                    <div className="space-y-2">
                                        {contactResults.map((u) => (
                                            <motion.div
                                                key={u.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                onClick={() => navigate(`/messages/with/${u.id}`, { state: { targetUser: u } })}
                                                className="flex items-center gap-4 p-3 rounded-2xl bg-white/80 dark:bg-zinc-800/80 border border-blue-100/50 dark:border-zinc-700 cursor-pointer hover:bg-blue-50/50 dark:hover:bg-zinc-700/80 transition-colors"
                                            >
                                                <div className="size-12 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex-shrink-0">
                                                    {u.avatar_url ? (
                                                        <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="w-full h-full flex items-center justify-center text-xl material-symbols-outlined text-blue-400">person</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-base font-medium text-gray-800 dark:text-white truncate">
                                                        {u.displayName}
                                                    </p>
                                                    {u.email && (
                                                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{u.email}</p>
                                                    )}
                                                </div>
                                                <span className="material-symbols-outlined text-gray-300 text-lg">chevron_right</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {/* 同时匹配的会话 */}
                            {filteredMessages.length > 0 && (
                                <>
                                    <h3 className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-2 px-1">匹配的会话</h3>
                                    {filteredMessages.map((msg, index) => (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            onClick={() => navigate(`/messages/${msg.id}`, { state: { message: msg } })}
                                            className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all ${
                                                msg.is_unread
                                                    ? 'bg-white dark:bg-zinc-800 shadow-lg shadow-blue-100/50 dark:shadow-none border border-blue-100/50 dark:border-zinc-700'
                                                    : 'bg-white/60 dark:bg-zinc-800/60 border border-transparent'
                                            }`}
                                        >
                                            <div className="relative">
                                                <div className="flex items-center justify-center aspect-square rounded-2xl size-14 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
                                                    <span className="text-2xl"><span className="material-symbols-outlined">pets</span></span>
                                                </div>
                                                {msg.is_unread && (
                                                    <div className="absolute -top-1 -right-1 size-4 rounded-full bg-rose-500 border-2 border-white dark:border-zinc-800 flex items-center justify-center">
                                                        <span className="text-[8px] text-white font-bold">!</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <h3 className="text-base font-bold text-gray-800 dark:text-white truncate">{msg.sender_name}</h3>
                                                    <span className={`text-xs whitespace-nowrap ml-2 ${msg.is_unread ? 'text-blue-500 font-medium' : 'text-gray-400'}`}>
                                                        {formatTime(msg.created_at)}
                                                    </span>
                                                </div>
                                                <p className={`text-sm truncate ${msg.is_unread ? 'text-gray-600 dark:text-gray-300 font-medium' : 'text-gray-400'}`}>
                                                    {msg.content}
                                                </p>
                                            </div>
                                            <span className="material-symbols-outlined text-gray-300 text-lg">chevron_right</span>
                                        </motion.div>
                                    ))}
                                </>
                            )}
                        </>
                    ) : filteredMessages.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-20"
                        >
                            <div className="text-6xl mb-4">🕊️</div>
                            <p className="text-gray-500 dark:text-gray-400 text-center">暂无消息，去认识新朋友吧~</p>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/')}
                                className="mt-4 px-6 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-500 rounded-full text-sm font-medium"
                            >
                                去探索
                            </motion.button>
                        </motion.div>
                    ) : (
                        filteredMessages.map((msg, index) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => navigate(`/messages/${msg.id}`, { state: { message: msg } })}
                                className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all ${
                                    msg.is_unread
                                        ? 'bg-white dark:bg-zinc-800 shadow-lg shadow-blue-100/50 dark:shadow-none border border-blue-100/50 dark:border-zinc-700'
                                        : 'bg-white/60 dark:bg-zinc-800/60 border border-transparent'
                                }`}
                            >
                                <div className="relative">
                                    <div className="flex items-center justify-center aspect-square rounded-2xl size-14 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
                                        <span className="text-2xl"><span className="material-symbols-outlined">pets</span></span>
                                    </div>
                                    {msg.is_unread && (
                                        <div className="absolute -top-1 -right-1 size-4 rounded-full bg-rose-500 border-2 border-white dark:border-zinc-800 flex items-center justify-center">
                                            <span className="text-[8px] text-white font-bold">!</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="text-base font-bold text-gray-800 dark:text-white truncate">{msg.sender_name}</h3>
                                        <span className={`text-xs whitespace-nowrap ml-2 ${msg.is_unread ? 'text-blue-500 font-medium' : 'text-gray-400'}`}>
                                            {formatTime(msg.created_at)}
                                        </span>
                                    </div>
                                    <p className={`text-sm truncate ${msg.is_unread ? 'text-gray-600 dark:text-gray-300 font-medium' : 'text-gray-400'}`}>
                                        {msg.content}
                                    </p>
                                </div>
                                <span className="material-symbols-outlined text-gray-300 text-lg">chevron_right</span>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </main>

            <BottomNav />
        </div>
    );
};

export default Messages;
