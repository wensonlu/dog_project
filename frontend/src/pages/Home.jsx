import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDogs } from '../context/DogContext';
import BottomNav from '../components/BottomNav';
import StatsBar from '../components/StatsBar';
import { motion, AnimatePresence } from 'framer-motion';

const Home = () => {
    const navigate = useNavigate();
    const { DOGS, favoriteIds, toggleFavorite, loading } = useDogs();
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [direction, setDirection] = React.useState(null);

    if (loading) {
        return (
            <div className="mx-auto max-w-[430px] h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!DOGS || DOGS.length === 0) {
        return (
            <div className="mx-auto max-w-[430px] h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark p-10 text-center">
                <span className="material-symbols-outlined text-6xl text-zinc-300 mb-4">sentiment_dissatisfied</span>
                <p className="text-zinc-500">无法加载小狗信息，请检查后端服务是否启动。</p>
            </div>
        )
    }

    const currentDog = DOGS[currentIndex % DOGS.length];
    const nextDog = DOGS[(currentIndex + 1) % DOGS.length];

    const handleNext = (isFavorite = false) => {
        setDirection(isFavorite ? 'right' : 'left');

        // Short delay to allow animation to start before switching state
        setTimeout(() => {
            if (isFavorite && !favoriteIds.includes(currentDog.id)) {
                toggleFavorite(currentDog.id);
            }
            setCurrentIndex(prev => prev + 1);
            setDirection(null);
        }, 200);
    };

    return (
        <div className="relative mx-auto max-w-[430px] h-screen flex flex-col shadow-2xl bg-background-light dark:bg-background-dark overflow-hidden pb-20">
            <header className="z-30 px-5 pt-6 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border-2 border-primary/10">
                            <div
                                className="w-full h-full bg-cover bg-center"
                                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB6ZfAu74fVn19xwt_mCCWmnG0o7CZVapQ8kcQLS4X-Bq4t9inNQHpNA2CtIDIILlKL7BEwdeDFD1ir1ExQXcadXX1G0ZeCruY06uZCg-nslkcMsFEssRFlRG9WUkpJ1A6HzO8kRmhQdRu6pihqtzjdpfK-FD-VL3z-S_AoQG8KrdjqvQ3CSQdDha2DtsEiRkV3RGcfoZHR12Ii9gsm_0C6CJ79z0Hu7LkUOIdgB5G5XcVAN8qPe5tGxLh1fauXT7-L58wrQ_eXFM0")' }}
                            />
                        </div>
                        <div>
                            <p className="text-[10px] text-warm-beige font-bold uppercase tracking-[0.2em]">发现伙伴</p>
                            <h1 className="text-lg font-bold tracking-tight text-[#1b120e] dark:text-white">为你推荐</h1>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="size-10 rounded-full bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                            <span className="material-symbols-outlined text-[20px]">tune</span>
                        </button>
                        <button className="size-10 rounded-full bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                            <span className="material-symbols-outlined text-[20px]">notifications</span>
                        </button>
                    </div>
                </div>
            </header>

            <StatsBar />

            <main className="flex-1 relative mx-4 mb-3">
                {/* Secondary Card (Visual cue for stack) */}
                <div
                    key={`next-${nextDog.id}`}
                    className="absolute inset-0 z-0 scale-[0.94] translate-y-4 opacity-40 bg-zinc-300 dark:bg-zinc-700 rounded-[2rem] overflow-hidden"
                >
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${nextDog.image})` }}
                    />
                </div>

                {/* Main Swipe Card with Animation */}
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={currentDog.id}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{
                            x: direction === 'right' ? 500 : direction === 'left' ? -500 : 0,
                            rotate: direction === 'right' ? 20 : direction === 'left' ? -20 : 0,
                            opacity: 0
                        }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="absolute inset-0 z-10 bg-zinc-200 dark:bg-zinc-800 rounded-[2rem] overflow-hidden shadow-2xl origin-bottom"
                    >
                        <div
                            onClick={() => navigate(`/pet/${currentDog.id}`)}
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 cursor-pointer"
                            style={{ backgroundImage: `url(${currentDog.image})` }}
                        />

                        {/* Status Overlay for Animation */}
                        {direction === 'right' && (
                            <div className="absolute top-10 left-10 z-20 border-4 border-primary text-primary font-black text-4xl px-4 py-2 rounded-xl rotate-[-20deg] uppercase">喜欢</div>
                        )}
                        {direction === 'left' && (
                            <div className="absolute top-10 right-10 z-20 border-4 border-red-500 text-red-500 font-black text-4xl px-4 py-2 rounded-xl rotate-[20deg] uppercase">忽略</div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        <div className="absolute bottom-28 left-6 right-6 text-white">
                            <div className="flex items-baseline gap-2 mb-1">
                                <h2 className="text-4xl font-bold">{currentDog.name}</h2>
                                <span className="text-2xl font-light opacity-90">{currentDog.age}</span>
                            </div>
                            <p className="text-lg font-medium opacity-80 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">pets</span>
                                {currentDog.breed}
                            </p>
                            <div className="flex items-center gap-1 mt-2 text-primary">
                                <span className="material-symbols-outlined text-[16px]">location_on</span>
                                <span className="text-sm font-semibold">{currentDog.location}</span>
                            </div>
                        </div>

                        <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-6">
                            <button
                                onClick={() => handleNext(false)}
                                className="size-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white transition-transform active:scale-90"
                            >
                                <span className="material-symbols-outlined text-3xl font-light">close</span>
                            </button>
                            <button
                                onClick={() => handleNext(true)}
                                className="size-20 rounded-full bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/30 transition-transform active:scale-95"
                            >
                                <span className={`material-symbols-outlined text-4xl ${favoriteIds.includes(currentDog.id) ? 'fill-white' : ''}`}>favorite</span>
                            </button>
                            <button
                                onClick={() => navigate(`/pet/${currentDog.id}`)}
                                className="size-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white transition-transform active:scale-90"
                            >
                                <span className="material-symbols-outlined text-3xl font-light">info</span>
                            </button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </main>

            <BottomNav />
        </div>
    );
};

export default Home;
