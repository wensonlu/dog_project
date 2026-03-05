import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

/**
 * 与指定用户的对话页（从消息页搜索联系人进入，暂无会话时展示）
 */
const MessageWith = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const targetUser = location.state?.targetUser ?? null;
    const displayName = targetUser?.displayName ?? targetUser?.full_name ?? targetUser?.email?.split('@')[0] ?? '用户';

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
                    <h1 className="text-xl font-bold text-[#1b120e] dark:text-white truncate">与 {displayName} 的对话</h1>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
                {targetUser && (
                    <div className="flex flex-col items-center mb-6">
                        <div className="size-16 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 mb-3">
                            {targetUser.avatar_url ? (
                                <img src={targetUser.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="w-full h-full flex items-center justify-center text-3xl material-symbols-outlined text-blue-400">person</span>
                            )}
                        </div>
                        <p className="text-base font-medium text-[#1b120e] dark:text-white">{displayName}</p>
                        {targetUser.email && (
                            <p className="text-sm text-warm-beige truncate max-w-[240px]">{targetUser.email}</p>
                        )}
                    </div>
                )}
                <p className="text-warm-beige text-center">暂无消息，发起对话功能即将上线</p>
                <button
                    type="button"
                    onClick={() => navigate('/messages')}
                    className="mt-6 px-5 py-2.5 rounded-xl bg-primary text-white font-medium text-sm"
                >
                    返回消息列表
                </button>
            </main>

            <BottomNav />
        </div>
    );
};

export default MessageWith;
