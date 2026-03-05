import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import TopicCard from '../components/Forum/TopicCard';
import CategoryFilter from '../components/Forum/CategoryFilter';
import SortSelector from '../components/Forum/SortSelector';
import { categories, sortOptions } from '../data/mockForum';
import { useAuth } from '../context/AuthContext';
import { useForumListContext } from '../context/ForumListContext';
import { API_BASE_URL } from '../config/api';

const Forum = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const ctx = useForumListContext();

  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [localSelectedCategory, setLocalSelectedCategory] = useState('all');
  const [localSelectedSort, setLocalSelectedSort] = useState('latest');
  const [localTopics, setLocalTopics] = useState([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [localError, setLocalError] = useState(null);

  const searchQuery = ctx ? ctx.searchQuery : localSearchQuery;
  const setSearchQuery = ctx ? ctx.setSearchQuery : setLocalSearchQuery;
  const selectedCategory = ctx ? ctx.selectedCategory : localSelectedCategory;
  const setSelectedCategory = ctx ? ctx.setSelectedCategory : setLocalSelectedCategory;
  const selectedSort = ctx ? ctx.selectedSort : localSelectedSort;
  const setSelectedSort = ctx ? ctx.setSelectedSort : setLocalSelectedSort;
  const topics = ctx ? ctx.topics : localTopics;
  const setTopics = ctx ? ctx.setTopics : setLocalTopics;
  const loading = ctx ? ctx.loading : localLoading;
  const setLoading = ctx ? ctx.setLoading : setLocalLoading;
  const error = ctx ? ctx.error : localError;
  const setError = ctx ? ctx.setError : setLocalError;
  const scrollPosition = ctx ? ctx.scrollPosition : null;
  const setScrollPosition = ctx ? ctx.setScrollPosition : () => {};
  const listScrollRef = ctx ? ctx.listScrollRef : { current: null };
  const skipNextFetchRef = ctx ? ctx.skipNextFetchRef : { current: false };

  useEffect(() => {
    if (skipNextFetchRef?.current && topics.length > 0) {
      skipNextFetchRef.current = false;
      setLoading(false);
      return;
    }
    if (scrollPosition != null && topics.length > 0) {
      setLoading(false);
      return;
    }
    const fetchTopics = async () => {
      setLoading(true);
      setError(null);
      setScrollPosition(null);
      try {
        const params = new URLSearchParams();
        if (selectedCategory !== 'all') {
          params.append('category', selectedCategory);
        }
        if (selectedSort) {
          params.append('sort', selectedSort);
        }
        if (searchQuery.trim()) {
          params.append('search', searchQuery.trim());
        }
        if (user?.id) {
          params.append('userId', user.id);
        }

        const response = await fetch(`${API_BASE_URL}/forum?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch topics');
        }
        const data = await response.json();
        setTopics(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching topics:', err);
        setError(err.message);
        setTopics([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
    // 返回列表时用缓存不 refetch，故不把 scrollPosition/topics 加入 deps
  }, [selectedCategory, selectedSort, searchQuery, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (scrollPosition == null) return;
    const el = listScrollRef?.current;
    if (!el) return;
    const id = requestAnimationFrame(() => {
      el.scrollTop = scrollPosition;
      setScrollPosition(null);
    });
    return () => cancelAnimationFrame(id);
    // listScrollRef/setScrollPosition 稳定，仅需在 scrollPosition/topics 变化时恢复
  }, [scrollPosition, topics.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-[430px] mx-auto min-h-screen flex flex-col bg-gradient-to-b from-teal-50/50 via-cream-50 to-rose-50/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 pb-24 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-teal-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-48 h-48 bg-rose-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-56 h-56 bg-pink-200/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl px-4 pt-6 pb-3 border-b border-rose-100/50 dark:border-zinc-800"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-200/50">
              <span className="text-2xl"><span className="material-symbols-outlined">forum</span></span>
            </div>
            <div>
              <p className="text-xs text-teal-500 font-medium">温暖交流</p>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">汪友社区</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                if (!user) {
                  navigate('/login');
                  return;
                }
                navigate('/forum/history');
              }}
              className="size-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-500"
            >
              <span className="material-symbols-outlined">history</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                if (!user) {
                  navigate('/login');
                  return;
                }
                navigate('/forum/create');
              }}
              className="size-10 rounded-xl bg-gradient-to-r from-rose-400 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-rose-200/50"
            >
              <span className="material-symbols-outlined">edit</span>
            </motion.button>
          </div>
        </div>

        {/* 搜索栏 */}
        <div className="relative mb-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索暖心话题..."
            className="w-full h-11 px-4 pl-11 rounded-2xl border border-rose-100 dark:border-zinc-700 bg-white/90 dark:bg-zinc-800/90 text-sm text-gray-800 dark:text-white placeholder-rose-300/70 focus:outline-none focus:ring-2 focus:ring-rose-200/50"
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-rose-300 text-lg">
            search
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 size-6 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-xs text-rose-500">close</span>
            </button>
          )}
        </div>

        {/* 分类和排序 */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 overflow-hidden">
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelect={setSelectedCategory}
            />
          </div>
          <SortSelector
            sortOptions={sortOptions}
            selectedSort={selectedSort}
            onSelect={setSelectedSort}
          />
        </div>
      </motion.header>

      {/* 话题列表 - ref 供列表缓存恢复滚动 */}
      <main ref={listScrollRef} className="flex-1 px-2 pt-4 overflow-y-auto relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-4xl"
            >
              <span className="material-symbols-outlined text-4xl">pets</span>
            </motion.div>
            <p className="mt-4 text-rose-400 text-sm">加载温暖话题中...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="text-5xl mb-4">😔</span>
            <p className="text-gray-500 dark:text-gray-400">加载失败，请稍后再试</p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full text-sm font-medium"
            >
              重试
            </motion.button>
          </div>
        ) : topics.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-6xl mb-4"
            >
              🌸
            </motion.div>
            <p className="text-gray-500 dark:text-gray-400">暂无话题，来做第一个分享的人吧~</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 text-rose-500 font-medium text-sm"
              >
                清除搜索
              </button>
            )}
          </div>
        ) : (
          <div className="columns-2 gap-2 space-y-2">
            {topics.map((topic, index) => (
              <motion.div 
                key={topic.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="break-inside-avoid mb-2"
              >
                <TopicCard topic={topic} onBeforeNavigate={ctx?.saveScrollPosition} />
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Forum;
