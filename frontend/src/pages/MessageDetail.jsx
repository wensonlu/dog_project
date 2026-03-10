import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import { API_BASE_URL } from '../config/api';

const MessageDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [message, setMessage] = useState(location.state?.message ?? null);
    const [loading, setLoading] = useState(!location.state?.message);

    useEffect(() => {
        if (location.state?.message) return;
        if (!user || !id) return;

        const fetchMessage = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/messages/${user.id}/detail/${id}`);
                if (!response.ok) throw new Error('Message not found');
                const data = await response.json();
                setMessage(data);
            } catch (err) {
                console.error('获取消息详情失败:', err);
                setMessage(null);
            } finally {
                setLoading(false);
            }
        };

        fetchMessage();
    }, [user, id, location.state?.message]);

    // 进入详情页时将该消息标为已读
    useEffect(() => {
        if (!message || !message.is_unread || !user || !id) return;

        const markAsRead = async () => {
            try {
                await fetch(`${API_BASE_URL}/messages/${user.id}/detail/${id}/read`, { method: 'PATCH' });
                setMessage((prev) => (prev ? { ...prev, is_unread: false } : null));
            } catch (err) {
                console.error('标为已读失败:', err);
            }
        };

        markAsRead();
    }, [message?.id, message?.is_unread, user, id]);

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-[430px] h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!message) {
        return (
            <div className="max-w-[430px] mx-auto min-h-screen flex flex-col bg-background-light dark:bg-background-dark pb-24">
                <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-6 pt-6 pb-4">
                    <button
                        type="button"
                        onClick={() => navigate('/messages')}
                        className="flex items-center gap-2 text-[#1b120e] dark:text-white"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        <span>返回</span>
                    </button>
                </header>
                <div className="flex-1 flex flex-col items-center justify-center px-6">
                    <span className="material-symbols-outlined text-6xl text-warm-beige mb-2">mail</span>
                    <p className="text-warm-beige font-medium">消息不存在或已删除</p>
                    <button
                        type="button"
                        onClick={() => navigate('/messages')}
                        className="mt-4 px-4 py-2 rounded-lg bg-primary text-white font-medium"
                    >
                        返回消息列表
                    </button>
                </div>
                <BottomNav />
            </div>
        );
    }

    return (
        <div className="max-w-[430px] mx-auto min-h-screen flex flex-col bg-background-light dark:bg-background-dark pb-24">
            <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-6 pt-6 pb-4 border-b border-[#F0E6DD] dark:border-zinc-700">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/messages')}
                        className="p-1 rounded-full hover:bg-card-light dark:hover:bg-zinc-800"
                        aria-label="返回"
                    >
                        <span className="material-symbols-outlined text-[#1b120e] dark:text-white">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold text-[#1b120e] dark:text-white">消息详情</h1>
                </div>
            </header>

            <main className="flex-1 px-6 py-6">
                <article className="rounded-xl bg-card-light dark:bg-zinc-800 shadow-sm border border-[#F0E6DD] dark:border-zinc-700 overflow-hidden">
                    <div className="p-4 border-b border-[#F0E6DD] dark:border-zinc-700">
                        <div className="flex items-center gap-3 mb-3">
                            {/* <div className="flex items-center justify-center aspect-square rounded-lg h-12 w-12 bg-primary/10">
                                <span className="material-symbols-outlined text-primary text-xl">notifications</span>
                            </div> */}
                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg font-bold text-[#1b120e] dark:text-white truncate">{message.sender_name}</h2>
                                <p className="text-xs text-warm-beige">{formatDateTime(message.created_at)}</p>
                            </div>
                            {message.is_unread && (
                                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">未读</span>
                            )}
                        </div>
                    </div>
                    <div className="p-4">
                        <p className="text-base text-[#1b120e] dark:text-white whitespace-pre-wrap">{message.content}</p>
                        {message.image_url && (
                            <div className="mt-4">
                                <img
                                    src={message.image_url}
                                    alt="消息附件"
                                    className="rounded-lg max-w-full h-auto object-cover"
                                />
                            </div>
                        )}
                    </div>
                </article>
            </main>

            <BottomNav />
        </div>
    );
};

export default MessageDetail;
