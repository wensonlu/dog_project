import React, { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Heart, Users, Sparkles, PawPrint } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const StatsBar = ({ isVisible }) => {
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
      const response = await fetch(`${API_BASE_URL}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch {
      console.log('Using default stats');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="mx-4 mb-3"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-50 via-cream-50 to-teal-50 dark:from-zinc-800 dark:via-zinc-800 dark:to-zinc-800 p-4 shadow-sm border border-rose-100/50 dark:border-zinc-700">
            {/* 装饰背景 */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-200/20 to-transparent rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-teal-200/20 to-transparent rounded-full blur-xl" />
            
            {/* 标题 */}
            <div className="relative flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-rose-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">温暖数据</span>
              <div className="flex-1 h-px bg-gradient-to-r from-rose-200/50 to-transparent" />
            </div>

            {/* 统计数据 */}
            <div className="relative flex items-center justify-around">
              {/* 待领养 */}
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                    <PawPrint size={18} className="text-rose-500" />
                  </div>
                  <span className="text-2xl font-bold text-gray-800 dark:text-white">
                    {loading ? '-' : stats.availableDogs}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">等待家的毛孩子</span>
              </div>

              {/* 分隔装饰 */}
              <div className="h-10 w-px bg-gradient-to-b from-transparent via-rose-200 to-transparent" />

              {/* 已领养 */}
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="p-1.5 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                    <Heart size={18} className="text-pink-500 fill-pink-500" />
                  </div>
                  <span className="text-2xl font-bold text-gray-800 dark:text-white">
                    {loading ? '-' : stats.adoptedDogs}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">找到幸福家庭</span>
              </div>

              {/* 分隔装饰 */}
              <div className="h-10 w-px bg-gradient-to-b from-transparent via-teal-200 to-transparent" />

              {/* 爱心用户 */}
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="p-1.5 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                    <Users size={18} className="text-teal-500" />
                  </div>
                  <span className="text-2xl font-bold text-gray-800 dark:text-white">
                    {loading ? '-' : stats.totalUsers > 1000 ? `${(stats.totalUsers/1000).toFixed(1)}k` : stats.totalUsers}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">爱心伙伴</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StatsBar;
