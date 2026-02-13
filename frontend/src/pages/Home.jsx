import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDogs } from '../context/DogContext';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import StatsBar from '../components/StatsBar';
import SearchBox from '../components/SearchBox';
import FilterBar from '../components/FilterBar';
import { API_BASE_URL } from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';

const Home = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { DOGS, favoriteIds, toggleFavorite, loading } = useDogs();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(null);
    const [showStats, setShowStats] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);
    
    // 搜索和筛选状态
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({ breed: '', age: '', gender: '' });
    
    // 获取所有品种列表
    const breeds = useMemo(() => {
        if (!DOGS) return [];
        return [...new Set(DOGS.map(dog => dog.breed))].sort();
    }, [DOGS]);
    
    // 过滤后的宠物列表
    const filteredDogs = useMemo(() => {
        if (!DOGS) return [];
        return DOGS.filter(dog => {
            // 搜索过滤
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchName = dog.name?.toLowerCase().includes(query);
                const matchBreed = dog.breed?.toLowerCase().includes(query);
                if (!matchName && !matchBreed) return false;
            }
            
            // 品种过滤
            if (filters.breed && dog.breed !== filters.breed) return false;
            
            // 性别过滤
            if (filters.gender && dog.gender !== filters.gender) return false;
            
            // 年龄过滤
            if (filters.age) {
                const ageText = dog.age || '';
                const ageNum = parseInt(ageText);
                if (filters.age === 'puppy' && ageNum > 1) return false;
                if (filters.age === 'adult' && (ageNum <= 1 || ageNum > 7)) return false;
                if (filters.age === 'senior' && ageNum <= 7) return false;
            }
            
            return true;
        });
    }, [DOGS, searchQuery, filters]);

    // 智能显示/隐藏统计条
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            
            // 向下滚动超过50px时隐藏，向上滚动时显示
            if (currentScrollY > lastScrollY && currentScrollY > 50) {
                setShowStats(false);
            } else {
                setShowStats(true);
            }
            
            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    // 获取未读消息数
    useEffect(() => {
        const fetchUnreadCount = async () => {
            if (!user?.id) return;
            
            try {
                const response = await fetch(`${API_BASE_URL}/messages/unread/${user.id}`);
                if (response.ok) {
                    const data = await response.json();
                    setUnreadCount(data.count || 0);
                }
            } catch (error) {
                console.error('获取未读消息失败:', error);
            }
        };

        fetchUnreadCount();
        
        // 每30秒刷新一次
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [user?.id]);

    // 当过滤条件变化时重置索引
    useEffect(() => {
        // 只在客户端执行，避免 hydration 不匹配
        if (typeof window !== 'undefined') {
            setCurrentIndex(0);
        }
    }, [searchQuery, filters.breed, filters.age, filters.gender]);

    if (loading) {
        return (
            <div className="mx-auto max-w-[430px] h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 to-cream-50 dark:from-zinc-900 dark:to-zinc-900">
                <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-4xl flex items-center justify-center"
                >
                    <span className="material-symbols-outlined text-4xl text-rose-400">pets</span>
                </motion.div>
            </div>
        );
    }

    if (!filteredDogs || filteredDogs.length === 0) {
        return (
            <div className="relative mx-auto max-w-[430px] min-h-screen flex flex-col bg-gradient-to-b from-rose-50/50 via-cream-50 to-teal-50/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 overflow-hidden pb-20">
                {/* Header */}
                <header className="relative z-30 px-5 pt-6 pb-2">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="size-12 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-200/50">
                                <span className="material-symbols-outlined text-2xl text-white">home</span>
                            </div>
                            <div>
                                <p className="text-xs text-rose-500 font-medium">发现小伙伴</p>
                                <h1 className="text-xl font-bold text-gray-800 dark:text-white">汪星球</h1>
                            </div>
                        </div>
                    </motion.div>
                </header>
                
                {/* 搜索和筛选 */}
                <div className="relative z-20 px-4 mb-3 space-y-2">
                    <SearchBox onSearch={setSearchQuery} value={searchQuery} />
                    <FilterBar filters={filters} onFilterChange={setFilters} breeds={breeds} />
                </div>
                
                {/* 空状态 */}
                <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                    <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-6xl mb-4 flex items-center justify-center"
                    >
                        <span className="material-symbols-outlined text-6xl text-rose-400">search_off</span>
                    </motion.span>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        {(searchQuery || filters.breed || filters.age || filters.gender) 
                            ? '没有找到符合条件的小伙伴，试试其他筛选条件吧~'
                            : '暂无待领养的小可爱，稍后再来看看吧~'
                        }
                    </p>
                    {(searchQuery || filters.breed || filters.age || filters.gender) && (
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => {
                                setSearchQuery('');
                                setFilters({ breed: '', age: '', gender: '' });
                            }}
                            className="mt-4 px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium"
                        >
                            清除筛选
                        </motion.button>
                    )}
                </div>
                
                <BottomNav />
            </div>
        )
    }

    const currentDog = filteredDogs[currentIndex % filteredDogs.length];
    const nextDog = filteredDogs[(currentIndex + 1) % filteredDogs.length];

    const handleNext = (isFavorite = false) => {
        setDirection(isFavorite ? 'right' : 'left');

        setTimeout(() => {
            if (isFavorite && !favoriteIds.includes(currentDog.id)) {
                toggleFavorite(currentDog.id);
            }
            setCurrentIndex(prev => prev + 1);
            setDirection(null);
        }, 200);
    };

    return (
        <div className="relative mx-auto max-w-[430px] min-h-screen flex flex-col bg-gradient-to-b from-rose-50/50 via-cream-50 to-teal-50/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 overflow-hidden pb-20">
            {/* 背景装饰 */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-rose-200/30 rounded-full blur-3xl" />
                <div className="absolute top-1/3 -left-20 w-48 h-48 bg-teal-200/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-0 w-56 h-56 bg-pink-200/20 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <header className="relative z-30 px-5 pt-6 pb-2">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <div className="size-12 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-200/50">
                            <span className="material-symbols-outlined text-2xl text-white">home</span>
                        </div>
                        <div>
                            <p className="text-xs text-rose-500 font-medium">发现小伙伴</p>
                            <h1 className="text-xl font-bold text-gray-800 dark:text-white">汪星球</h1>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {/* 通知按钮 */}
                        <button className="size-10 rounded-xl bg-white/80 dark:bg-zinc-800/80 backdrop-blur shadow-sm flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:scale-105 transition-transform">
                            <span className="material-symbols-outlined text-[20px]">notifications</span>
                        </button>
                        
                        {/* 消息入口 - 新增 */}
                        <button 
                            onClick={() => navigate('/messages')}
                            className="relative size-10 rounded-xl bg-white/80 dark:bg-zinc-800/80 backdrop-blur shadow-sm flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:scale-105 transition-transform"
                        >
                            <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>
                    </div>
                </motion.div>
            </header>

            {/* 智能统计条 */}
            <div className="relative z-20">
                <StatsBar isVisible={showStats} />
            </div>
            
            {/* 搜索和筛选 */}
            <div className="relative z-20 px-4 mb-3 space-y-2">
                <SearchBox onSearch={setSearchQuery} value={searchQuery} />
                <FilterBar filters={filters} onFilterChange={setFilters} breeds={breeds} />
                
                {/* 结果统计 */}
                {(searchQuery || filters.breed || filters.age || filters.gender) && (
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-zinc-500 dark:text-zinc-400"
                    >
                        找到 <span className="font-medium text-rose-500">{filteredDogs.length}</span> 个小伙伴
                    </motion.p>
                )}
            </div>

            {/* 主内容区 */}
            <main className="flex-1 relative mx-4 mb-3 z-10">
                {/* 下一张卡片预览 */}
                <div
                    key={`next-${nextDog.id}`}
                    className="absolute inset-0 z-0 scale-[0.92] translate-y-3 opacity-30 bg-zinc-200 dark:bg-zinc-700 rounded-[2rem] overflow-hidden"
                >
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${nextDog.image})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>

                {/* 当前卡片 */}
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={currentDog.id}
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{
                            x: direction === 'right' ? 300 : direction === 'left' ? -300 : 0,
                            rotate: direction === 'right' ? 15 : direction === 'left' ? -15 : 0,
                            opacity: 0,
                            scale: 0.9
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="absolute inset-0 z-10 bg-white dark:bg-zinc-800 rounded-[2rem] overflow-hidden shadow-2xl shadow-rose-200/20 dark:shadow-none origin-bottom"
                    >
                        <div
                            onClick={() => navigate(`/pet/${currentDog.id}`)}
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 cursor-pointer hover:scale-105"
                            style={{ backgroundImage: `url(${currentDog.image})` }}
                        />

                        {/* 滑动状态标签 */}
                        {direction === 'right' && (
                            <motion.div 
                                initial={{ scale: 0, rotate: -10 }}
                                animate={{ scale: 1, rotate: -12 }}
                                className="absolute top-8 left-8 z-20 border-4 border-rose-400 text-rose-400 font-black text-3xl px-4 py-2 rounded-2xl bg-white/90 backdrop-blur"
                            >
                                喜欢 💕
                            </motion.div>
                        )}
                        {direction === 'left' && (
                            <motion.div 
                                initial={{ scale: 0, rotate: 10 }}
                                animate={{ scale: 1, rotate: 12 }}
                                className="absolute top-8 right-8 z-20 border-4 border-gray-400 text-gray-400 font-black text-3xl px-4 py-2 rounded-2xl bg-white/90 backdrop-blur"
                            >
                                下次见 👋
                            </motion.div>
                        )}

                        {/* 渐变遮罩 */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                        {/* 宠物信息 */}
                        <div className="absolute bottom-24 left-6 right-6 text-white">
                            <div className="flex items-baseline gap-2 mb-1">
                                <h2 className="text-4xl font-bold">{currentDog.name}</h2>
                                <span className="text-xl font-light opacity-90">{currentDog.age}</span>
                            </div>
                            <p className="text-lg font-medium opacity-90 flex items-center gap-2">
                                <span className="material-symbols-outlined">pets</span>
                                {currentDog.breed}
                            </p>
                            <div className="flex items-center gap-1 mt-2 text-rose-300">
                                <span className="material-symbols-outlined text-sm">location_on</span>
                                <span className="text-sm font-medium">{currentDog.location}</span>
                            </div>
                        </div>

                        {/* 操作按钮 */}
                        <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-4">
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleNext(false)}
                                className="size-12 rounded-full bg-white/20 backdrop-blur-xl border-2 border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                                title="跳过"
                            >
                                <span className="material-symbols-outlined text-xl">close</span>
                            </motion.button>
                            
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleNext(true)}
                                className="size-14 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-rose-500/30"
                                title="收藏"
                            >
                                <span className="material-symbols-outlined text-2xl">{favoriteIds.includes(currentDog.id) ? 'favorite' : 'favorite_border'}</span>
                            </motion.button>
                            
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => navigate(`/pet/${currentDog.id}`)}
                                className="size-12 rounded-full bg-white/20 backdrop-blur-xl border-2 border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                                title="查看详情"
                            >
                                <span className="material-symbols-outlined text-xl">info</span>
                            </motion.button>
                            
                            {/* 新增：快速申请按钮 */}
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => navigate(`/application/${currentDog.id}`)}
                                className="size-12 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30"
                                title="快速申请领养"
                            >
                                <span className="material-symbols-outlined text-xl">edit_document</span>
                            </motion.button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </main>

            <BottomNav />
        </div>
    );
};

export default Home;
