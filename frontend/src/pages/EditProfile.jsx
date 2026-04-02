import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import { supabase } from '../config/supabase';

const EditProfile = () => {
    const { user, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        bio: '',
        phone: '',
        avatar_url: ''
    });

    useEffect(() => {
        if (!user?.id) {
            navigate('/login');
            return;
        }
        fetchProfile();
    }, [user?.id]);

    const fetchProfile = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/profile/${user.id}`);
            if (response.ok) {
                const data = await response.json();
                setFormData({
                    full_name: data.full_name || '',
                    bio: data.bio || '',
                    phone: data.phone || '',
                    avatar_url: data.avatar_url || ''
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`${API_BASE_URL}/auth/profile/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                await refreshProfile();
                navigate('/profile');
            } else {
                const error = await response.json();
                alert(error.error || '保存失败');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('保存失败，请重试');
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('dog-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('dog-images')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('头像上传失败');
        }
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-[430px] min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 to-cream-50">
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-4xl"
                >
                    <span className="material-symbols-outlined text-4xl text-rose-400">pets</span>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[430px] min-h-screen bg-gradient-to-b from-rose-50/50 via-cream-50 to-teal-50/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 pb-8">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-rose-100/50 dark:border-zinc-800"
            >
                <div className="flex items-center p-4 pt-6 pb-3 justify-between">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigate(-1)}
                        className="flex size-11 rounded-xl bg-rose-100 dark:bg-rose-900/30 items-center justify-center text-rose-500"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </motion.button>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">编辑资料</h2>
                    <div className="w-11" />
                </div>
            </motion.header>

            <form onSubmit={handleSubmit} className="px-4 pt-6 space-y-4">
                {/* Avatar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center mb-6"
                >
                    <div className="relative">
                        <div className="size-24 rounded-full bg-gradient-to-br from-rose-300 via-pink-300 to-teal-300 p-1">
                            <div className="w-full h-full rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                                {formData.avatar_url ? (
                                    <img
                                        src={formData.avatar_url}
                                        alt="头像"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-5xl">🐕</span>
                                )}
                            </div>
                        </div>
                        <label className="absolute bottom-0 right-0 size-8 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 flex items-center justify-center text-white shadow-lg cursor-pointer">
                            <span className="material-symbols-outlined text-sm">camera_alt</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                className="hidden"
                            />
                        </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">点击更换头像</p>
                </motion.div>

                {/* Full Name */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        昵称
                    </label>
                    <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="输入昵称"
                        className="w-full h-12 px-4 bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-rose-200 focus:border-transparent"
                    />
                </motion.div>

                {/* Phone */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        手机号
                    </label>
                    <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="输入手机号"
                        className="w-full h-12 px-4 bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-rose-200 focus:border-transparent"
                    />
                </motion.div>

                {/* Bio */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        个人简介
                    </label>
                    <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="介绍一下自己吧~"
                        rows={3}
                        className="w-full p-4 bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-rose-200 focus:border-transparent resize-none"
                    />
                </motion.div>

                {/* Submit Button */}
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={saving}
                    className="w-full h-14 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-bold rounded-xl shadow-lg shadow-rose-300/50 disabled:opacity-50"
                >
                    {saving ? '保存中...' : '保存'}
                </motion.button>
            </form>
        </div>
    );
};

export default EditProfile;