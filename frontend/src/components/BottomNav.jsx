import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { openRnDemoTab, shouldShowRnTab } from '../utils/rnTabNavigation';

const BottomNav = ({ hidden = false }) => {
    const navigate = useNavigate();
    const location = useLocation();

    if (hidden) return null;

    const navItems = [
        { label: '探索', icon: 'style', path: '/' },
        { label: '论坛', icon: 'forum', path: '/forum' },
        { label: '商城', icon: 'storefront', path: '/shop' },
        { label: '故事', icon: 'auto_stories', path: '/content' },
        shouldShowRnTab() && { label: 'RN', icon: 'developer_mode', path: null, action: openRnDemoTab },
        { label: '我的', icon: 'person', path: '/profile' },
    ].filter(Boolean);

    return (
        <nav className="fixed bottom-0 left-0 right-0 min-h-20 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-around px-4 pb-4 ios-safe-bottom z-50">
            {navItems.map((item) => {
                const isActive = location.pathname === item.path ||
                    (item.path === '/content' &&
                        (location.pathname.startsWith('/content') ||
                            location.pathname.startsWith('/wiki') ||
                            location.pathname.startsWith('/stories'))) ||
                    (item.path === '/shop' && location.pathname.startsWith('/shop'));

                return (
                    <button
                        key={item.label}
                        onClick={() => {
                            if (item.action) {
                                item.action();
                                return;
                            }
                            navigate(item.path);
                        }}
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
