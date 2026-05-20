import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDogs } from '../context/DogContext';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import StatsBar from '../components/StatsBar';
import RecommendationQuestionnaire from '../components/RecommendationQuestionnaire';
import RecommendedDogsSection from '../components/RecommendedDogsSection';
import { API_BASE_URL } from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';

const Home = ({ isActive = true }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { DOGS, favoriteIds, toggleFavorite, loading } = useDogs();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(null);
    const [showStats, setShowStats] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);
    
    // 推荐功能状态
    const [showRecommendations, setShowRecommendations] = useState(false);
    const [recommendations, setRecommendations] = useState([]);

    // 手势滑动状态
    const [dragX, setDragX] = useState(0);
    const [talkingLine, setTalkingLine] = useState(null);
    const [talkingLoading, setTalkingLoading] = useState(false);
    const [talkingError, setTalkingError] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [talkPanelOpen, setTalkPanelOpen] = useState(false);
    const [isVoiceSupported, setIsVoiceSupported] = useState(true);

    // 智能显示/隐藏统计条
    useEffect(() => {
        if (!isActive) return undefined;

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
    }, [lastScrollY, isActive]);

    // 获取未读消息数
    useEffect(() => {
        if (!isActive) return undefined;

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
    }, [user?.id, isActive]);

    const hasDogs = Array.isArray(DOGS) && DOGS.length > 0;
    const currentDog = hasDogs ? DOGS[currentIndex % DOGS.length] : null;
    const nextDog = hasDogs ? DOGS[(currentIndex + 1) % DOGS.length] : null;

    const buildLocalTalkingLine = (dog) => {
        const name = dog?.name || '毛孩子';
        const age = dog?.age || '小年轻';
        const breed = dog?.breed || '汪星人';
        return {
            lineId: `local-${dog?.id || Date.now()}`,
            bubbleText: `${name}申请开麦：我${age}，${breed}，主打一个可爱但不讲武德。`,
            speechText: `哈喽我是${name}，别看我表面高冷，实际是黏人小甜豆。你要是点个收藏，我今天的尾巴就不下班啦。`,
            ctaText: '点个收藏，我立刻营业',
            source: 'local-fallback'
        };
    };

    const pickCuteVoice = () => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return null;
        const voices = window.speechSynthesis.getVoices() || [];
        const preferred = [
            /ting-ting/i,
            /siri/i,
            /xiaoxiao/i,
            /zh[-_]?cn/i,
            /female/i
        ];
        for (const rule of preferred) {
            const found = voices.find((voice) => rule.test(`${voice.name} ${voice.lang}`));
            if (found) return found;
        }
        return voices.find((voice) => /zh/i.test(voice.lang)) || voices[0] || null;
    };

    const stopSpeaking = () => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
    };

    const fetchTalkingLine = async (dogId, forceNew = false) => {
        setTalkingLoading(true);
        setTalkingError('');
        try {
            const seed = forceNew ? Date.now() + Math.floor(Math.random() * 1000000) : currentIndex;
            const response = await fetch(`${API_BASE_URL}/dogs/${dogId}/talking-line`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    seed,
                    previousHook: forceNew ? (talkingLine?.bubbleText || '') : ''
                })
            });

            if (!response.ok) {
                throw new Error('文案生成失败');
            }

            const data = await response.json();
            if (forceNew && data?.bubbleText && data.bubbleText === talkingLine?.bubbleText) {
                setTalkingLine({
                    ...data,
                    bubbleText: `${data.bubbleText}（加更版）`,
                    speechText: `${data.speechText} 我再补一句，今天也想被你夸夸。`
                });
            } else {
                setTalkingLine(data);
            }
        } catch (error) {
            console.error('获取会说话文案失败:', error);
            setTalkingError('接口异常，已切本地可爱模式');
            setTalkingLine(buildLocalTalkingLine(currentDog));
        } finally {
            setTalkingLoading(false);
        }
    };

    const playTalkingLine = async () => {
        if (!talkingLine?.speechText || isMuted || !isVoiceSupported) return;

        try {
            const response = await fetch(`${API_BASE_URL}/dogs/${currentDog.id}/talking-voice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lineId: talkingLine.lineId,
                    speechText: talkingLine.speechText
                })
            });

            if (!response.ok) {
                throw new Error('语音准备失败');
            }

            const voicePayload = await response.json();
            const utterance = new SpeechSynthesisUtterance(voicePayload.speechText);
            utterance.lang = 'zh-CN';
            utterance.rate = 1.12;
            utterance.pitch = 1.28;
            utterance.volume = 1;
            const cuteVoice = pickCuteVoice();
            if (cuteVoice) {
                utterance.voice = cuteVoice;
                utterance.lang = cuteVoice.lang || 'zh-CN';
            }
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => {
                setIsSpeaking(false);
                setTalkingError('语音播放失败，请重试');
            };

            stopSpeaking();
            setIsSpeaking(true);
            window.speechSynthesis.speak(utterance);
        } catch (error) {
            console.error('播放语音失败:', error);
            setIsSpeaking(false);
            setTalkingError('语音播放失败，请稍后重试');
        }
    };

    useEffect(() => {
        if (!isActive || !currentDog?.id) return;
        stopSpeaking();
        setTalkPanelOpen(false);
        fetchTalkingLine(currentDog.id);
    }, [currentDog?.id, isActive]);

    useEffect(() => () => stopSpeaking(), []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const support = !!window.speechSynthesis && typeof window.SpeechSynthesisUtterance !== 'undefined';
        setIsVoiceSupported(support);
        if (!support) {
            setTalkingError('当前设备不支持语音播放，仅展示文案');
        }
    }, []);

    const handleNext = (isFavorite = false) => {
        if (!currentDog) return;
        stopSpeaking();
        setDirection(isFavorite ? 'right' : 'left');

        setTimeout(() => {
            if (isFavorite && !favoriteIds.includes(currentDog.id)) {
                toggleFavorite(currentDog.id);
            }
            setCurrentIndex(prev => prev + 1);
            setDirection(null);
        }, 200);
    };

    // 处理推荐问卷提交
    const handleRecommendationSubmit = async (preferences) => {
        try {
            const response = await fetch(`${API_BASE_URL}/recommendations/calculate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ preferences })
            });

            if (response.ok) {
                const data = await response.json();
                setRecommendations(data.recommendations || []);
            } else {
                console.error('获取推荐失败');
                setRecommendations([]);
            }
        } catch (error) {
            console.error('推荐请求错误:', error);
            setRecommendations([]);
        }
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-[430px] h-screen flex flex-col items-center justify-center bg-gradient-to-b from-rose-50 to-cream-50 dark:from-zinc-900 dark:to-zinc-900 gap-4">
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-4xl flex items-center justify-center"
                >
                    🐕
                </motion.div>
                <p className="text-gray-600 dark:text-gray-300">加载中...</p>
            </div>
        );
    }

    if (!hasDogs) {
        return (
            <div className="relative mx-auto max-w-[430px] min-h-screen flex flex-col bg-gradient-to-b from-rose-50/50 via-cream-50 to-teal-50/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 overflow-hidden pb-20">
                <header className="relative z-30 ios-safe-top px-5 pt-6 pb-2">
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

                <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-6xl mb-4 flex items-center justify-center"
                    >
                        <span className="material-symbols-outlined text-6xl text-rose-400">pets</span>
                    </motion.span>
                    <p className="text-zinc-500 dark:text-zinc-400">暂无待领养的小可爱，稍后再来看看吧~</p>
                </div>

                <BottomNav />
            </div>
        );
    }

    return (
        <div className="relative mx-auto max-w-[430px] min-h-screen flex flex-col bg-gradient-to-b from-rose-50/50 via-cream-50 to-teal-50/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 overflow-hidden pb-20">
            {/* 背景装饰 */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-rose-200/30 rounded-full blur-3xl" />
                <div className="absolute top-1/3 -left-20 w-48 h-48 bg-teal-200/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-0 w-56 h-56 bg-pink-200/20 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <header className="relative z-30 ios-safe-top px-5 pt-6 pb-2">
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
                        {/* 智能推荐按钮 */}
                        <button
                            onClick={() => setShowRecommendations(true)}
                            className="size-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 shadow-sm flex items-center justify-center text-white hover:scale-105 transition-transform"
                        >
                            <span className="material-symbols-outlined text-[20px]">psychology</span>
                        </button>

                        {/* 通知按钮 */}
                        {/* <button className="size-10 rounded-xl bg-white/80 dark:bg-zinc-800/80 backdrop-blur shadow-sm flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:scale-105 transition-transform">
                            <span className="material-symbols-outlined text-[20px]">notifications</span>
                        </button> */}

                        {/* 消息入口 */}
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

            {/* 主内容区 - 增大屏占比 */}
            <main className="flex-1 relative mx-4 mt-2 mb-3 z-10"
>
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
                        animate={{ 
                            scale: 1, 
                            opacity: 1, 
                            y: 0,
                            x: 0,
                            rotate: 0
                        }}
                        exit={{
                            x: direction === 'right' ? 300 : direction === 'left' ? -300 : 0,
                            rotate: direction === 'right' ? 15 : direction === 'left' ? -15 : 0,
                            opacity: 0,
                            scale: 0.9
                        }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.9}
                        onDrag={(e, info) => setDragX(info.offset.x)}
                        onDragEnd={(e, info) => {
                            const threshold = 100;
                            const velocity = info.velocity.x;
                            
                            if (info.offset.x > threshold || velocity > 500) {
                                // 向右滑动 - 喜欢
                                handleNext(true);
                            } else if (info.offset.x < -threshold || velocity < -500) {
                                // 向左滑动 - 跳过
                                handleNext(false);
                            }
                            setDragX(0);
                        }}
                        whileDrag={{ cursor: 'grabbing' }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="absolute inset-0 z-10 bg-white dark:bg-zinc-800 rounded-[2rem] overflow-hidden shadow-2xl shadow-rose-200/20 dark:shadow-none origin-bottom cursor-grab active:cursor-grabbing"
                    >
                        <div
                            onClick={() => navigate(`/pet/${currentDog.id}`)}
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 cursor-pointer hover:scale-105"
                            style={{ backgroundImage: `url(${currentDog.image})` }}
                        />

                        {/* 滑动状态标签 - 手势滑动实时反馈 */}
                        <motion.div 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ 
                                scale: dragX > 50 ? 1 : 0,
                                opacity: dragX > 50 ? Math.min(dragX / 150, 1) : 0,
                                rotate: -12
                            }}
                            className="absolute top-8 left-8 z-20 border-4 border-rose-400 text-rose-400 font-black text-3xl px-4 py-2 rounded-2xl bg-white/90 backdrop-blur pointer-events-none"
                        >
                            喜欢 💕
                        </motion.div>
                        <motion.div 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ 
                                scale: dragX < -50 ? 1 : 0,
                                opacity: dragX < -50 ? Math.min(Math.abs(dragX) / 150, 1) : 0,
                                rotate: 12
                            }}
                            className="absolute top-8 right-8 z-20 border-4 border-gray-400 text-gray-400 font-black text-3xl px-4 py-2 rounded-2xl bg-white/90 backdrop-blur pointer-events-none"
                        >
                            下次见 👋
                        </motion.div>

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

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setTalkPanelOpen((prev) => !prev);
                                }}
                                className="mt-2 w-full rounded-full bg-black/40 backdrop-blur-md border border-white/20 px-3 py-2 flex items-center justify-between"
                            >
                                <span className="text-xs font-semibold text-amber-200">AI 玩梗开麦</span>
                                <span className="text-xs text-white/90 truncate ml-2">
                                    {talkingLoading ? '正在想梗...' : talkingLine?.bubbleText || talkingError || '点开让它营业'}
                                </span>
                            </button>
                        </div>

                        {talkPanelOpen && (
                            <div className="absolute bottom-[78px] left-6 right-6 z-30 rounded-2xl bg-black/55 backdrop-blur-md border border-white/20 p-3 text-white">
                                <p className="text-sm leading-5 min-h-[36px]">
                                    {talkingLoading ? '正在给它想梗...' : talkingLine?.bubbleText || talkingError || '点“换一句”让它营业'}
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (isSpeaking) {
                                                stopSpeaking();
                                            } else {
                                                playTalkingLine();
                                            }
                                        }}
                                        disabled={talkingLoading || isMuted || !isVoiceSupported || !talkingLine?.speechText}
                                        className="px-3 py-1.5 rounded-full bg-rose-500/90 text-white text-xs font-semibold disabled:opacity-50"
                                    >
                                        {isSpeaking ? '停止开麦' : '可爱开麦'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            fetchTalkingLine(currentDog.id, true);
                                        }}
                                        disabled={talkingLoading}
                                        className="px-3 py-1.5 rounded-full bg-white/20 text-white text-xs font-semibold disabled:opacity-50"
                                    >
                                        换一句
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const nextMuted = !isMuted;
                                            setIsMuted(nextMuted);
                                            if (nextMuted) stopSpeaking();
                                        }}
                                        className="px-3 py-1.5 rounded-full bg-white/20 text-white text-xs font-semibold"
                                    >
                                        {isMuted ? '取消静音' : '静音全部'}
                                    </button>
                                </div>
                            </div>
                        )}

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

            {/* 智能推荐弹出层 */}
            <AnimatePresence>
                {showRecommendations && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center"
                        onClick={() => setShowRecommendations(false)}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-[430px] max-h-[80vh] bg-white dark:bg-zinc-800 rounded-t-[2rem] overflow-hidden pb-safe"
                        >
                            <div className="p-6 flex justify-between items-center border-b border-zinc-200 dark:border-zinc-700">
                                <h3 className="text-xl font-bold text-zinc-800 dark:text-white">智能推荐</h3>
                                <button
                                    onClick={() => setShowRecommendations(false)}
                                    className="size-8 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center"
                                >
                                    <span className="material-symbols-outlined text-[20px]">close</span>
                                </button>
                            </div>
                            <div className="overflow-y-auto max-h-[calc(80vh-80px)] p-4 pb-24">
                                <RecommendationQuestionnaire onSubmit={handleRecommendationSubmit} />
                                {recommendations.length > 0 && (
                                    <RecommendedDogsSection recommendations={recommendations} />
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <BottomNav />
        </div>
    );
};

export default Home;
