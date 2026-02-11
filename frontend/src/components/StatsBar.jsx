import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Users, Dog } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://dog-project-backend.vercel.app';

const StatsBar = () => {
  const [stats, setStats] = useState({
    availableDogs: 128,
    adoptedDogs: 56,
    totalUsers: 2340
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.log('Using default stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-4 mb-2 py-2 px-3 bg-white/80 dark:bg-zinc-800/80 backdrop-blur rounded-full shadow-sm">
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-2 py-2 px-4 bg-white/90 dark:bg-zinc-800/90 backdrop-blur rounded-full shadow-sm border border-gray-100 dark:border-zinc-700"
    >
      <div className="flex items-center justify-around">
        {/* 待领养 */}
        <div className="flex items-center gap-1.5">
          <Dog size={14} className="text-orange-500" />
          <span className="text-sm font-bold text-gray-800 dark:text-white">
            {stats.availableDogs}
          </span>
          <span className="text-xs text-gray-500">待领养</span>
        </div>

        {/* 分隔线 */}
        <div className="w-px h-4 bg-gray-200 dark:bg-zinc-600" />

        {/* 已领养 */}
        <div className="flex items-center gap-1.5">
          <Heart size={14} className="text-pink-500 fill-pink-500" />
          <span className="text-sm font-bold text-gray-800 dark:text-white">
            {stats.adoptedDogs}
          </span>
          <span className="text-xs text-gray-500">已领养</span>
        </div>

        {/* 分隔线 */}
        <div className="w-px h-4 bg-gray-200 dark:bg-zinc-600" />

        {/* 爱心用户 */}
        <div className="flex items-center gap-1.5">
          <Users size={14} className="text-blue-500" />
          <span className="text-sm font-bold text-gray-800 dark:text-white">
            {stats.totalUsers > 1000 ? `${(stats.totalUsers/1000).toFixed(1)}k` : stats.totalUsers}
          </span>
          <span className="text-xs text-gray-500">用户</span>
        </div>
      </div>
    </motion.div>
  );
};

export default StatsBar;
