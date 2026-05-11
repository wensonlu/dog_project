import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDogs } from '../context/DogContext';
import BottomNav from '../components/BottomNav';

const SelectDog = () => {
    const navigate = useNavigate();
    const { DOGS, loading } = useDogs();

    if (loading) {
        return (
            <div className="mx-auto max-w-[430px] h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="relative mx-auto max-w-[430px] min-h-screen bg-background-light dark:bg-background-dark pb-24">
            {/* Header */}
            <div className="sticky top-0 ios-safe-top z-20 bg-background-light dark:bg-background-dark border-b border-zinc-200 dark:border-zinc-800 px-5 py-4">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate('/')}
                        className="size-10 rounded-full bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center text-zinc-600 dark:text-zinc-300"
                    >
                        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold text-[#1b120e] dark:text-white">选择小狗申请领养</h1>
                    <div className="size-10"></div>
                </div>
            </div>

            {/* Dog Grid */}
            <div className="p-4">
                <div className="grid grid-cols-2 gap-4">
                    {DOGS && DOGS.map((dog) => (
                        <div
                            key={dog.id}
                            onClick={() => navigate(`/application/${dog.id}`)}
                            className="bg-white dark:bg-zinc-800 rounded-2xl overflow-hidden shadow-md cursor-pointer transition-transform active:scale-95 hover:shadow-xl"
                        >
                            <div className="relative aspect-square">
                                <img
                                    src={dog.image}
                                    alt={dog.name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                                    <h3 className="font-bold text-lg">{dog.name}</h3>
                                    <p className="text-sm opacity-90">{dog.age} · {dog.breed}</p>
                                    <div className="flex items-center gap-1 mt-1 text-xs text-primary">
                                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                                        <span>{dog.location}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 text-center">
                                <button className="w-full py-2 bg-primary text-white rounded-lg font-semibold text-sm">
                                    申请领养
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <BottomNav />
        </div>
    );
};

export default SelectDog;
