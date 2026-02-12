import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showAddMenu, setShowAddMenu] = useState(false);

    const navItems = [
        { label: '探索', icon: 'style', path: '/' },
        { label: '论坛', icon: 'forum', path: '/forum' },
        { label: '发布', icon: 'add', path: null, isCenter: true },  // 修改：path设为null
        { label: '消息', icon: 'chat_bubble', path: '/messages' },
        { label: '我的', icon: 'person', path: '/profile' },
    ];

    // 处理"+"按钮点击
    const handleCenterClick = () => {
        setShowAddMenu(true);
    };

    // 处理菜单项点击
    const handleMenuItemClick = (path) => {
        setShowAddMenu(false);
        navigate(path);
    };

    // 关闭菜单
    const closeMenu = () => {
        setShowAddMenu(false);
    };

    return (
        <>
            <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-around px-4 pb-4 z-50">
                {navItems.map((item) => {
                    if (item.isCenter) {
                        return (
                            <button
                                key={item.label}
                                onClick={handleCenterClick}  // 修改：点击弹出菜单
                                className="relative -top-8 size-14 bg-primary rounded-full shadow-lg shadow-primary/40 flex items-center justify-center text-white border-4 border-background-light dark:border-background-dark transition-transform active:scale-95"
                            >
                                <motion.span 
                                    animate={{ rotate: showAddMenu ? 45 : 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="material-symbols-outlined text-3xl font-bold"
                                >
                                    {item.icon}
                                </motion.span>
                            </button>
                        );
                    }

                    const isActive = location.pathname === item.path;

                    return (
                        <button
                            key={item.label}
                            onClick={() => navigate(item.path)}
                            className={clsx(
                                "flex flex-col items-center gap-1 transition-colors",
                                isActive ? "text-primary" : "text-warm-beige"
                            )}
                        >
                            <span className={clsx("material-symbols-outlined", isActive && "fill-primary")}>
                                {item.icon}
                            </span>
                            <span className="text-[10px] font-bold">{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* 发布菜单弹窗 */}
            <AnimatePresence>
                {showAddMenu && (
                    <>
                        {/* 遮罩层 */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeMenu}
                            className="fixed inset-0 bg-black/50 z-50"
                        />
                        
                        {/* 菜单内容 */}
                        <motion.div
                            initial={{ opacity: 0, y: 100, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 100, scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 w-64"
                        >
                            <div className="bg-white dark:bg-zinc-800 rounded-3xl shadow-2xl overflow-hidden">
                                {/* 标题 */}
                                <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-700">
                                    <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">选择发布类型</p>
                                </div>
                                
                                {/* 菜单项 */}
                                <div className="p-2 space-y-1">
                                    {/* 发布送养 */}
                                    <motion.button
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleMenuItemClick('/submit-dog')}
                                        className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                                    >
                                        <div className="size-12 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-rose-200/50">
                                            <span className="material-symbols-outlined text-2xl">pets</span>
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-gray-800 dark:text-white">发布送养</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">帮毛孩子找新家</p>
                                        </div>
                                    </motion.button>
                                    
                                    {/* 发布帖子 */}
                                    <motion.button
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleMenuItemClick('/forum/create')}
                                        className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                                    >
                                        <div className="size-12 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-teal-200/50">
                                            <span className="material-symbols-outlined text-2xl">forum</span>
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-gray-800 dark:text-white">发布帖子</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">分享养宠心得</p>
                                        </div>
                                    </motion.button>
                                </div>
                                
                                {/* 取消按钮 */}
                                <div className="p-2 border-t border-zinc-100 dark:border-zinc-700">
                                    <button
                                        onClick={closeMenu}
                                        className="w-full py-3 text-center text-gray-500 dark:text-gray-400 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700/50 rounded-xl transition-colors"
                                    >
                                        取消
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default BottomNav;
