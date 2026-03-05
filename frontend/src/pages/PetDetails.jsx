import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDogs } from '../context/DogContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../config/api';
import ReviewSection from '../components/ReviewSection';

const PetDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { DOGS } = useDogs();
    const { user } = useAuth();
    const [relatedTopics, setRelatedTopics] = useState([]);
    const [loadingTopics, setLoadingTopics] = useState(true);
    const [reviews, setReviews] = useState([]);
    const [canReview, setCanReview] = useState(false);
    const [applicationId, setApplicationId] = useState(null);
    const [loadingReviews, setLoadingReviews] = useState(true);

    // Find the dog by id, or default to the first one for demo
    const dog = DOGS.find(d => d.id === parseInt(id)) || DOGS[0];

    // 获取相关讨论
    useEffect(() => {
        const fetchRelatedTopics = async () => {
            if (!dog?.id) return;

            try {
                const response = await fetch(`${API_BASE_URL}/forum/related/${dog.id}`);
                if (response.ok) {
                    const data = await response.json();
                    setRelatedTopics(data || []);
                }
            } catch (error) {
                console.error('获取相关讨论失败:', error);
            } finally {
                setLoadingTopics(false);
            }
        };

        fetchRelatedTopics();
    }, [dog?.id]);

    // 获取评价列表和检查用户是否有资格评价
    useEffect(() => {
        const fetchReviews = async () => {
            if (!dog?.id) return;

            try {
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

                const response = await fetch(`${API_BASE_URL}/reviews/${dog.id}`, { headers });
                if (response.ok) {
                    const data = await response.json();
                    setReviews(data.reviews || []);
                }
            } catch (error) {
                console.error('获取评价失败:', error);
            } finally {
                setLoadingReviews(false);
            }
        };

        const checkEligibility = async () => {
            if (!user || !dog?.id) return;

            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_BASE_URL}/reviews/check-eligibility/${dog.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setCanReview(data.eligible);
                    setApplicationId(data.applicationId);
                }
            } catch (error) {
                console.error('检查评价资格失败:', error);
            }
        };

        fetchReviews();
        checkEligibility();
    }, [dog?.id, user]);

    const handleFavorite = () => {
        if (!user) {
            navigate('/login');
            return;
        }
        // Toggle favorite logic here
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark pb-32">
            <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/30 to-transparent pointer-events-none">
                <button
                    onClick={() => navigate(-1)}
                    className="pointer-events-auto flex size-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20"
                >
                    <span className="material-symbols-outlined">arrow_back_ios_new</span>
                </button>
                <button 
                    onClick={handleFavorite}
                    className="pointer-events-auto flex size-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20"
                >
                    <span className="material-symbols-outlined">favorite</span>
                </button>
            </div>

            <div className="relative w-full aspect-[4/5] bg-[#f3ebe7] overflow-hidden">
                <div
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url('${dog.image}')` }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                </div>
                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
                    <div className="w-8 h-1.5 rounded-full bg-white" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                </div>
            </div>

            <div className="relative -mt-6 bg-background-light dark:bg-background-dark rounded-t-3xl px-5 pt-8">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-[#1b120e] dark:text-white">{dog.name}, {dog.age}</h1>
                        <p className="text-[#97674e] dark:text-[#eb7e47]/80 text-lg font-bold mt-1">公 • {dog.breed}</p>
                    </div>
                    <div className="bg-primary/10 dark:bg-primary/20 text-primary p-2 rounded-xl">
                        <span className="material-symbols-outlined text-3xl">pets</span>
                    </div>
                </div>

                <div className="flex gap-2 py-6 overflow-x-auto hide-scrollbar">
                    {[
                        { icon: 'verified_user', text: '已接种疫苗', color: 'secondary' },
                        { icon: 'check_circle', text: '已绝育' },
                        { icon: 'mood', text: '性格亲人' },
                        { icon: 'house', text: '定点入厕' },
                    ].map((trait, i) => (
                        <div
                            key={i}
                            className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-xl px-4 border ${trait.color === 'secondary'
                                ? 'bg-secondary/15 border-secondary/20 text-secondary'
                                : 'bg-surface-light dark:bg-white/5 border-[#e5ded9] dark:border-white/10 text-[#1b120e] dark:text-[#f3ebe7]'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[20px]">{trait.icon}</span>
                            <p className="text-sm font-bold">{trait.text}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-2 mb-8">
                    <h2 className="text-xl font-black mb-3 text-[#1b120e] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">auto_awesome</span>
                        关于我
                    </h2>
                    <div className="bg-surface-light dark:bg-white/5 p-5 rounded-2xl border border-[#e5ded9] dark:border-white/10">
                        <p className="text-[#5c4033] dark:text-[#d1c2ba] leading-relaxed text-base font-medium">
                            {dog.name || '这只小狗'}性格温柔，最喜欢在公园里悠闲散步，也特别享受被摸肚子的时光。他与孩子和其他狗狗都能和谐相处，是陪伴家庭成长的完美伙伴。
                            <br /><br />
                            他已经掌握了一些基本指令，不过偶尔会有点小调皮！{dog.name || '他'}正在寻找一个永远的家，希望成为你最忠诚的伴侣。
                        </p>
                    </div>
                </div>

                {/* 相关讨论板块 - 新增 */}
                <div className="mb-8">
                    <h2 className="text-xl font-black mb-3 text-[#1b120e] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-teal-500">forum</span>
                        <span className="material-symbols-outlined text-sm">forum</span> 相关讨论
                        {!loadingTopics && relatedTopics.length > 0 && (
                            <span className="text-sm font-normal text-gray-500">
                                ({relatedTopics.length})
                            </span>
                        )}
                    </h2>
                    
                    {loadingTopics ? (
                        <div className="bg-surface-light dark:bg-white/5 p-5 rounded-2xl border border-[#e5ded9] dark:border-white/10 text-center">
                            <div className="animate-spin h-6 w-6 border-2 border-teal-500 border-t-transparent rounded-full mx-auto"></div>
                            <p className="text-sm text-gray-500 mt-2">加载中...</p>
                        </div>
                    ) : relatedTopics.length === 0 ? (
                        <div className="bg-surface-light dark:bg-white/5 p-5 rounded-2xl border border-[#e5ded9] dark:border-white/10 text-center">
                            <p className="text-gray-500 dark:text-gray-400 mb-3">暂无相关讨论</p>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/forum/create', { state: { dogId: id, dogName: dog.name } })}
                                className="px-4 py-2 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-300 rounded-full text-sm font-medium"
                            >
                                发起讨论 →
                            </motion.button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {relatedTopics.slice(0, 3).map((topic, index) => (
                                <motion.div
                                    key={topic.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    onClick={() => navigate(`/forum/${topic.id}`)}
                                    className="bg-surface-light dark:bg-white/5 p-4 rounded-2xl border border-[#e5ded9] dark:border-white/10 cursor-pointer active:scale-[0.98] transition-transform"
                                >
                                    <h3 className="font-bold text-[#1b120e] dark:text-white line-clamp-1">
                                        {topic.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                        {topic.content?.substring(0, 50)}...
                                    </p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">person</span>
                                            {topic.author_name || '匿名用户'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">chat</span>
                                            {topic.comment_count || 0}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                            
                            {relatedTopics.length > 3 && (
                                <button
                                    onClick={() => navigate('/forum', { state: { dogId: id, dogName: dog.name } })}
                                    className="w-full py-3 text-teal-600 dark:text-teal-400 font-medium text-sm text-center"
                                >
                                    查看全部 {relatedTopics.length} 个讨论 →
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* 评价系统板块 - 新增 */}
                <ReviewSection
                    dogId={dog.id}
                    reviews={reviews}
                    canReview={canReview}
                    applicationId={applicationId}
                    onReviewAdded={(newReview) => {
                        setReviews([newReview, ...reviews]);
                        setCanReview(false);
                    }}
                />

                <div className="mb-8">
                    <h2 className="text-xl font-black mb-3 text-[#1b120e] dark:text-white">所在地</h2>
                    <div className="relative w-full h-32 rounded-2xl overflow-hidden grayscale opacity-80 border border-[#e5ded9] dark:border-white/10">
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCM18pp0jECcq9K2kcMsU6X3-eUYOcEcsxCmUCxeh2L5PFsd2Xf-TQhJzYz3Dc8PHUBDb0HhJ8CankdCWFhbEbzPE8DrUDO-ejiFBLHVEX27cc-e4il5EELtjxQLLfw4ThRq58cBd69ek8FNrvWx0CwB4wg23CTJ2BZpNcfmHmZbgWdkc_BG72UxQBA_qAYmxZPunnECcW4onHqWxMe08FCg9GpYrqzEuniQPY9M_kPY1vTeZW8uJlSNetpuUhh-Ua38II5nyfp-vk')" }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-primary p-2 rounded-full shadow-lg">
                                <span className="material-symbols-outlined text-white">location_on</span>
                            </div>
                        </div>
                        <div className="absolute bottom-2 left-3">
                            <p className="text-xs font-bold text-white drop-shadow-md">桑尼维尔动物收容所, 加利福尼亚州</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-background-dark/90 backdrop-blur-xl border-t border-[#e5ded9] dark:border-white/10 px-6 pt-4 pb-8 ios-bottom-safe z-50">
                <div className="flex gap-4 items-center">
                    <button className="flex flex-col items-center justify-center size-14 shrink-0 rounded-2xl bg-surface-light dark:bg-white/10 text-[#1b120e] dark:text-white border border-[#e5ded9] dark:border-white/10">
                        <span className="material-symbols-outlined text-[24px]">chat_bubble</span>
                        <span className="text-[10px] font-black mt-0.5">咨询</span>
                    </button>
                    <button
                        onClick={() => navigate(`/application/${id}`)}
                        className="flex-1 h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black text-lg flex items-center justify-center shadow-lg shadow-primary/25 transition-transform active:scale-95"
                    >
                        领养我
                        <span className="material-symbols-outlined ml-2">favorite</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PetDetails;
