import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { label: '探索', icon: 'style', path: '/' },
        { label: '论坛', icon: 'forum', path: '/forum' },
        { label: '百科', icon: 'menu_book', path: '/wiki' },
        { label: '故事', icon: 'auto_stories', path: '/stories' },
        { label: '我的', icon: 'person', path: '/profile' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-around px-4 pb-4 z-50">
            {navItems.map((item) => {
                const isActive = location.pathname === item.path ||
                    (item.path === '/wiki' && location.pathname.startsWith('/wiki')) ||
                    (item.path === '/stories' && location.pathname.startsWith('/stories'));

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
    );
};

export default BottomNav;
