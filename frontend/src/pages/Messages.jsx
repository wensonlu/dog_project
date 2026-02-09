import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import { API_BASE_URL } from '../config/api';

const Messages = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
   
    useEffect(() => {
        fetchMessages();
    }, [user]);

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

    if (loading) {
        return (
            <div className="mx-auto max-w-[430px] h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-[430px] mx-auto min-h-screen flex flex-col relative bg-background-light dark:bg-background-dark pb-24">
            <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-6 pt-12 pb-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight text-[#1b120e] dark:text-white">消息中心</h1>
                    <div className="flex gap-3">
                        <button className="size-10 flex items-center justify-center rounded-full bg-card-light dark:bg-zinc-800 text-primary">
                            <span className="material-symbols-outlined">edit_square</span>
                        </button>
                        <button className="size-10 flex items-center justify-center rounded-full bg-card-light dark:bg-zinc-800">
                            <span className="material-symbols-outlined text-[#1b120e] dark:text-white">settings</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="px-6 py-2">
                <div className="flex w-full items-center rounded-xl bg-card-light dark:bg-zinc-800 h-12 px-4 shadow-sm border border-[#F0E6DD] dark:border-zinc-700">
                    <span className="material-symbols-outlined text-warm-beige">search</span>
                    <input
                        className="flex-1 bg-transparent border-none focus:ring-0 text-base placeholder:text-warm-beige px-3"
                        placeholder="搜索联系人或宠物姓名"
                        type="text"
                    />
                </div>
            </div>

            <main className="flex-1 px-4 py-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="pt-20 flex flex-col items-center opacity-40">
                        <span className="material-symbols-outlined text-6xl text-warm-beige mb-2">mail</span>
                        <p className="text-xs text-warm-beige uppercase tracking-widest font-bold">暂无消息</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => navigate(`/messages/${msg.id}`, { state: { message: msg } })}
                            onKeyDown={(e) => e.key === 'Enter' && navigate(`/messages/${msg.id}`, { state: { message: msg } })}
                            className={`flex items-start gap-4 p-4 rounded-xl shadow-sm border border-transparent hover:border-primary/20 transition-all cursor-pointer ${msg.is_unread ? 'bg-white dark:bg-zinc-800' : 'bg-card-light/50 dark:bg-zinc-800/40'
                                }`}
                        >
                            <div className="relative">
                                <div className="flex items-center justify-center aspect-square rounded-lg h-14 w-14 bg-primary/10">
                                    <span className="material-symbols-outlined text-primary text-2xl">notifications</span>
                                </div>
                                {msg.is_unread && (
                                    <div className="absolute -top-1 -right-1 size-3.5 rounded-full bg-primary border-2 border-white dark:border-zinc-800" />
                                )}
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <h3 className="text-base font-bold text-[#1b120e] dark:text-white truncate">{msg.sender_name}</h3>
                                    <span className={`text-xs font-bold whitespace-nowrap ml-2 ${msg.is_unread ? 'text-primary' : 'text-warm-beige'}`}>
                                        {formatTime(msg.created_at)}
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-warm-beige">{msg.content}</p>
                            </div>
                        </div>
                    ))
                )}

                <div className="pt-10 flex flex-col items-center opacity-40">
                    <span className="material-symbols-outlined text-6xl text-warm-beige mb-2">potted_plant</span>
                    <p className="text-xs text-warm-beige uppercase tracking-widest font-bold">您的领养之旅从这里开始</p>
                </div>
            </main>

            <BottomNav />
        </div>
    );
};

export default Messages;
