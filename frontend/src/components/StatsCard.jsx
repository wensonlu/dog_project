import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Users, ClipboardList, Dog } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://dog-project-backend.vercel.app';

const StatsCard = () => {
  const [stats, setStats] = useState({
    availableDogs: 0,
    adoptedDogs: 0,
    totalUsers: 0,
    totalApplications: 0,
    isMock: true
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

  const statItems = [
    {
      icon: Dog,
      label: '待领养',
      value: stats.availableDogs,
      color: 'bg-orange-100 text-orange-600'
    },
    {
      icon: Heart,
      label: '已领养',
      value: stats.adoptedDogs,
      color: 'bg-pink-100 text-pink-600'
    },
    {
      icon: Users,
      label: '爱心用户',
      value: stats.totalUsers,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: ClipboardList,
      label: '领养申请',
      value: stats.totalApplications,
      color: 'bg-green-100 text-green-600'
    }
  ];

  if (loading) {
    return (
      <div className="mx-4 mb-4 p-4 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm">
        <div className="flex items-center justify-center h-20">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-4 p-4 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📊</span>
        <h3 className="font-bold text-gray-800 dark:text-white">平台数据</h3>
        {stats.isMock && (
          <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-600 rounded-full">
            演示数据
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-4 gap-3">
        {statItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="flex flex-col items-center p-2 rounded-xl bg-gray-50 dark:bg-zinc-700/50"
          >
            <div className={`p-2 rounded-lg ${item.color} mb-1`}>
              <item.icon size={18} />
            </div>
            <span className="text-lg font-bold text-gray-800 dark:text-white">
              {item.value.toLocaleString()}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {item.label}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default StatsCard;
