import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { useDogs } from '../context/DogContext';
import { RN_PET_DETAIL_DEEP_LINK, RN_PREVIEW_ENTRIES, buildPetDetailDeepLink, openRnPreviewEntry, shouldShowRnTab } from '../utils/rnTabNavigation';

const BottomNav = ({ hidden = false }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { DOGS = [] } = useDogs() || {};
    const [showRnPreview, setShowRnPreview] = useState(false);

    if (hidden) return null;

    const firstPetId = DOGS.find((dog) => dog?.id !== undefined && dog?.id !== null)?.id;
    const rnPreviewEntries = RN_PREVIEW_ENTRIES.map((entry) => (
        entry.url === RN_PET_DETAIL_DEEP_LINK
            ? {
                ...entry,
                description: firstPetId ? `宠物 ID ${firstPetId}` : '宠物数据加载中',
                disabled: !firstPetId,
                url: firstPetId ? buildPetDetailDeepLink(firstPetId) : '',
            }
            : entry
    ));

    const navItems = [
        { label: '探索', icon: 'style', path: '/' },
        { label: '论坛', icon: 'forum', path: '/forum' },
        { label: '商城', icon: 'storefront', path: '/shop' },
        { label: '故事', icon: 'auto_stories', path: '/content' },
        shouldShowRnTab() && { label: 'RN', icon: 'developer_mode', path: null, action: () => setShowRnPreview((value) => !value) },
        { label: '我的', icon: 'person', path: '/profile' },
    ].filter(Boolean);

    return (
        <nav className="fixed bottom-0 left-0 right-0 min-h-20 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-around px-4 pb-4 ios-safe-bottom z-50">
            {showRnPreview && (
                <div className="absolute left-4 right-4 bottom-full mb-3 rounded-2xl border border-rose-100 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 shadow-2xl shadow-rose-200/30 dark:shadow-black/30 backdrop-blur-xl overflow-hidden">
                    <div className="grid grid-cols-2 gap-2 p-3">
                        {rnPreviewEntries.map((entry) => (
                            <button
                                key={`${entry.label}:${entry.url || 'disabled'}`}
                                type="button"
                                disabled={entry.disabled}
                                onClick={async () => {
                                    if (entry.disabled) return;
                                    setShowRnPreview(false);
                                    await openRnPreviewEntry(entry);
                                }}
                                className={clsx(
                                    "flex items-center gap-2 rounded-xl bg-rose-50/70 dark:bg-zinc-800 px-3 py-2 text-left",
                                    entry.disabled && "cursor-not-allowed opacity-50"
                                )}
                            >
                                <span className="material-symbols-outlined text-[20px] text-rose-500">
                                    {entry.icon}
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-xs font-bold text-gray-800 dark:text-white">
                                        {entry.label}
                                    </span>
                                    <span className="block truncate text-[10px] font-medium text-warm-beige">
                                        {entry.description}
                                    </span>
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
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
                        type="button"
                        aria-label={item.label === 'RN' ? '打开 RN 预览入口' : undefined}
                        aria-expanded={item.label === 'RN' ? showRnPreview : undefined}
                        onClick={() => {
                            if (item.action) {
                                item.action();
                                return;
                            }
                            setShowRnPreview(false);
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
