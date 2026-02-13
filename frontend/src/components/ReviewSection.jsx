import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';

const ReviewSection = ({ dogId, reviews: initialReviews, canReview, applicationId, onReviewAdded }) => {
    const { user } = useAuth();
    const [reviews, setReviews] = useState(initialReviews || []);
    const [showForm, setShowForm] = useState(false);

    const handleLike = async (reviewId) => {
        if (!user) {
            alert('请先登录');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                // 更新本地状态
                setReviews(reviews.map(review => {
                    if (review.id === reviewId) {
                        return {
                            ...review,
                            user_liked: data.liked ? 1 : 0,
                            likes_count: data.liked
                                ? (review.likes_count || 0) + 1
                                : Math.max(0, (review.likes_count || 0) - 1)
                        };
                    }
                    return review;
                }));
            }
        } catch (error) {
            console.error('点赞失败:', error);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return '今天';
        if (days === 1) return '昨天';
        if (days < 7) return `${days} 天前`;
        if (days < 30) return `${Math.floor(days / 7)} 周前`;
        if (days < 365) return `${Math.floor(days / 30)} 个月前`;
        return `${Math.floor(days / 365)} 年前`;
    };

    return (
        <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-rose-500">favorite</span>
                    领养故事
                    <span className="text-sm font-normal text-gray-500">({reviews.length})</span>
                </h3>

                {canReview && !showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-4 py-2 bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-xl text-sm font-medium hover:from-rose-500 hover:to-pink-600 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">edit</span>
                        写评价
                    </button>
                )}
            </div>

            {/* 评价表单 */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6"
                    >
                        <ReviewForm
                            dogId={dogId}
                            applicationId={applicationId}
                            onSuccess={(newReview) => {
                                setReviews([newReview, ...reviews]);
                                setShowForm(false);
                                if (onReviewAdded) onReviewAdded(newReview);
                            }}
                            onCancel={() => setShowForm(false)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 评价列表 */}
            {reviews.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl">
                    <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-zinc-600 mb-3 block">
                        pets
                    </span>
                    <p className="text-gray-500 dark:text-gray-400">
                        还没有领养故事，快来分享第一个吧！
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map(review => (
                        <motion.div
                            key={review.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-zinc-800 rounded-2xl p-5 shadow-sm"
                        >
                            {/* 用户信息 */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold">
                                        {review.username?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800 dark:text-white">
                                            {review.username}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatDate(review.created_at)}
                                        </p>
                                    </div>
                                </div>

                                {/* 评分 */}
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <span
                                            key={i}
                                            className={`material-symbols-outlined text-lg ${
                                                i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                                            }`}
                                        >
                                            star
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* 评价内容 */}
                            <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                                {review.content}
                            </p>

                            {/* 照片 */}
                            {review.photos && review.photos.length > 0 && (
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                    {review.photos.map((photo, index) => (
                                        <img
                                            key={index}
                                            src={`${API_BASE_URL}${photo}`}
                                            alt={`评价照片 ${index + 1}`}
                                            className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => window.open(`${API_BASE_URL}${photo}`, '_blank')}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* 点赞 */}
                            <div className="flex items-center gap-4 pt-3 border-t border-gray-100 dark:border-zinc-700">
                                <button
                                    onClick={() => handleLike(review.id)}
                                    className={`flex items-center gap-1 text-sm transition-colors ${
                                        review.user_liked
                                            ? 'text-rose-500'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-rose-500'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-lg">
                                        {review.user_liked ? 'favorite' : 'favorite_border'}
                                    </span>
                                    <span>{review.likes_count || 0}</span>
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

// 导入 ReviewForm（需要先创建）
import ReviewForm from './ReviewForm';

export default ReviewSection;
