import React, { useState } from 'react';
import { API_BASE_URL } from '../config/api';

const ReviewForm = ({ dogId, applicationId, onSuccess, onCancel }) => {
    const [rating, setRating] = useState(5);
    const [content, setContent] = useState('');
    const [photos, setPhotos] = useState([]);
    const [photoPreviews, setPhotoPreviews] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handlePhotoChange = (e) => {
        const files = Array.from(e.target.files);

        if (files.length + photos.length > 3) {
            setError('最多只能上传 3 张照片');
            return;
        }

        setPhotos([...photos, ...files]);

        // 生成预览
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreviews(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removePhoto = (index) => {
        setPhotos(photos.filter((_, i) => i !== index));
        setPhotoPreviews(photoPreviews.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (content.length < 10) {
            setError('评价内容至少需要 10 个字');
            return;
        }

        if (content.length > 500) {
            setError('评价内容不能超过 500 个字');
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('applicationId', applicationId);
            formData.append('dogId', dogId);
            formData.append('rating', rating);
            formData.append('content', content);

            photos.forEach(photo => {
                formData.append('photos', photo);
            });

            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/reviews`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || '提交失败');
            }

            onSuccess(data.review);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-lg"
        >
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
                分享你的领养故事 ✨
            </h3>

            <form onSubmit={handleSubmit}>
                {/* 评分 */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        整体评分
                    </label>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className="text-3xl transition-transform hover:scale-110"
                            >
                                <span className={`material-symbols-outlined ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                                    {star <= rating ? 'star' : 'star_outline'}
                                </span>
                            </button>
                        ))}
                        <span className="ml-2 text-lg font-medium text-gray-700 dark:text-gray-300">
                            {rating}.0
                        </span>
                    </div>
                </div>

                {/* 评价内容 */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        评价内容 ({content.length}/500)
                    </label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="分享你和 TA 的故事，帮助其他人了解领养的快乐..."
                        rows={5}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-zinc-600 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-transparent dark:bg-zinc-700 dark:text-white resize-none"
                        maxLength={500}
                    />
                </div>

                {/* 照片上传 */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        上传照片 (最多 3 张)
                    </label>

                    {photoPreviews.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            {photoPreviews.map((preview, index) => (
                                <div key={index} className="relative">
                                    <img
                                        src={preview}
                                        alt={`预览 ${index + 1}`}
                                        className="w-full h-24 object-cover rounded-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removePhoto(index)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {photos.length < 3 && (
                        <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-xl cursor-pointer hover:border-rose-400 transition-colors">
                            <div className="text-center">
                                <span className="material-symbols-outlined text-gray-400 text-2xl">add_photo_alternate</span>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">点击上传照片</p>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handlePhotoChange}
                                className="hidden"
                            />
                        </label>
                    )}
                </div>

                {/* 错误提示 */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* 按钮 */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-zinc-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                    >
                        取消
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || content.length < 10}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-xl font-medium hover:from-rose-500 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isSubmitting ? '发布中...' : '发布评价'}
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

export default ReviewForm;
