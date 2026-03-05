import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDogs } from '../context/DogContext';
import BottomNav from '../components/BottomNav';

const Favorites = () => {
    const navigate = useNavigate();
    const { favorites, toggleFavorite } = useDogs();

    return (
        <div className="max-w-[430px] mx-auto min-h-screen flex flex-col bg-background-light dark:bg-background-dark pb-24">
            <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-6 pt-6 pb-4">
                <h1 className="text-3xl font-bold tracking-tight text-[#1b120e] dark:text-white">我的收藏</h1>
            </header>

            <main className="flex-1 px-6 pt-4">
                {favorites.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-40">
                        <span className="material-symbols-outlined text-6xl mb-4">favorite</span>
                        <p className="text-lg font-medium">暂无收藏的小狗</p>
                        <button
                            onClick={() => navigate('/')}
                            className="mt-4 text-primary font-bold"
                        >
                            去探索更多
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {favorites.map(dog => (
                            <div
                                key={dog.id}
                                className="bg-white dark:bg-zinc-800 rounded-2xl overflow-hidden shadow-sm border border-zinc-100 dark:border-zinc-700 group relative"
                            >
                                <div
                                    onClick={() => navigate(`/pet/${dog.id}`)}
                                    className="aspect-square bg-cover bg-center cursor-pointer"
                                    style={{ backgroundImage: `url(${dog.image})` }}
                                />
                                <button
                                    onClick={() => toggleFavorite(dog.id)}
                                    className="absolute top-2 right-2 size-8 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center text-primary transition-transform active:scale-90"
                                >
                                    <span className="material-symbols-outlined text-xl fill-primary">favorite</span>
                                </button>
                                <div className="p-3">
                                    <h3 className="font-bold text-[#1b120e] dark:text-white truncate">{dog.name}</h3>
                                    <p className="text-xs text-warm-beige font-medium">{dog.breed}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <BottomNav />
        </div>
    );
};

export default Favorites;
