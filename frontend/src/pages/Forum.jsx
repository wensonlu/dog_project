import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars -- used as motion.header, motion.div, etc.
import { useQuery } from '@tanstack/react-query';
import BottomNav from '../components/BottomNav';
import TopicCard from '../components/Forum/TopicCard';
import AISummaryCard from '../components/Forum/AISummaryCard';
import CategoryFilter from '../components/Forum/CategoryFilter';
import { categories, sortOptions } from '../data/mockForum';
import { useAuth } from '../context/AuthContext';
import { useForumListContext } from '../context/ForumListContext';
import { FORUM_API } from '../config/api';

const Forum = ({ isActive = true }) => {
  const FORUM_PREFS_KEY = 'forum_view_prefs_v1';
  const navigate = useNavigate();
  const { user } = useAuth();
  const ctx = useForumListContext();

  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [localSelectedCategory, setLocalSelectedCategory] = useState('all');
  const [localSelectedSort, setLocalSelectedSort] = useState('latest');
  const [localTopics, setLocalTopics] = useState([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [localError, setLocalError] = useState(null);
  const [contextSummary, setContextSummary] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState(null);
  const [aiSummaryNonce, setAiSummaryNonce] = useState(0);
  const [aiSummaryVisible, setAiSummaryVisible] = useState(false);

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
  const topSortTabs = sortOptions.filter((item) => ['latest', 'hot', 'comments'].includes(item.id));

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FORUM_PREFS_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved?.selectedSort) setSelectedSort(saved.selectedSort);
      if (saved?.selectedCategory) setSelectedCategory(saved.selectedCategory);
    } catch {
      // ignore corrupted local storage
    }
    // 仅初始化时恢复一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(FORUM_PREFS_KEY, JSON.stringify({
        selectedSort,
        selectedCategory
      }));
    } catch {
      // ignore write failures
    }
  }, [selectedSort, selectedCategory]);

  useEffect(() => {
    setSearchInput(searchQuery || '');
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const nextQuery = searchInput.trim();
      setSearchQuery(nextQuery);
      setAiSummaryVisible(nextQuery.length >= 2);
      setAiSummary(null);
      setAiSummaryError(null);
      setAiSummaryLoading(false);
      setAiSummaryNonce(0);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, setSearchQuery]);

  const {
    data: forumTopics = [],
    error: forumTopicsError,
    isLoading: forumTopicsLoading,
  } = useQuery({
    queryKey: ['forum-topics', selectedCategory, selectedSort, searchQuery.trim(), user?.id || null],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (selectedSort) {
        params.append('sort', selectedSort);
      }
      if (searchQuery.trim()) {
        params.append('query', searchQuery.trim());
      }
      params.append('format', 'mcp');
      params.append('limit', '30');
      params.append('cursor', '0');
      if (user?.id) {
        params.append('userId', user.id);
      }

      const response = await fetch(`${FORUM_API.LIST}?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch topics');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : (data.items || []);
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    enabled: isActive,
  });

  useEffect(() => {
    if (skipNextFetchRef?.current) {
      skipNextFetchRef.current = false;
    }
    setTopics(forumTopics);
    setLoading(forumTopicsLoading);
    setError(forumTopicsError?.message || null);
    if (!forumTopicsLoading) {
      setScrollPosition(null);
    }
  }, [forumTopics, forumTopicsLoading, forumTopicsError, setTopics, setLoading, setError, setScrollPosition, skipNextFetchRef]);

  useEffect(() => {
    if (!isActive) return;

    const syncForumContext = async () => {
      try {
        const params = new URLSearchParams({
          pageType: 'topic_list',
          route: '/forum',
          sort: selectedSort,
          category: selectedCategory,
          query: searchQuery.trim(),
        });
        if (user?.id) params.append('userId', user.id);
        const response = await fetch(`${FORUM_API.CONTEXT}?${params.toString()}`);
        if (!response.ok) return;
        const data = await response.json();
        setContextSummary({
          pageType: data?.page?.type,
          totalVisible: data?.data?.visibleTopics?.length || 0
        });
      } catch {
        // context 同步失败不影响主流程
      }
    };
    syncForumContext();
  }, [selectedSort, selectedCategory, searchQuery, user?.id, isActive]);

  useEffect(() => {
    if (!isActive) return;

    const normalizedQuery = searchQuery.trim();
    if (!aiSummaryVisible || normalizedQuery.length < 2) return;

    const fetchSummary = async () => {
      setAiSummaryLoading(true);
      setAiSummaryError(null);
      try {
        const params = new URLSearchParams({
          q: normalizedQuery,
          timeRange: '180d',
        });
        if (aiSummaryNonce > 0) {
          params.append('_refresh', String(Date.now()));
        }
        const response = await fetch(`${FORUM_API.SEARCH_AI_SUMMARY}?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch AI summary');
        }
        const data = await response.json();
        setAiSummary(data);
      } catch (err) {
        console.error('Error fetching AI summary:', err);
        setAiSummaryError(err.message);
        setAiSummary(null);
      } finally {
        setAiSummaryLoading(false);
      }
    };

    fetchSummary();
  }, [searchQuery, aiSummaryNonce, aiSummaryVisible, isActive]);

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
        className="sticky top-0 ios-safe-top z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl px-4 pt-6 pb-3 border-b border-rose-100/50 dark:border-zinc-800"
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
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="搜索暖心话题..."
            className="w-full h-11 px-4 pl-11 rounded-2xl border border-rose-100 dark:border-zinc-700 bg-white/90 dark:bg-zinc-800/90 text-sm text-gray-800 dark:text-white placeholder-rose-300/70 focus:outline-none focus:ring-2 focus:ring-rose-200/50"
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-rose-300 text-lg">
            search
          </span>
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput('');
                setSearchQuery('');
                setAiSummaryVisible(false);
                setAiSummary(null);
                setAiSummaryError(null);
                setAiSummaryLoading(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 size-6 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-xs text-rose-500">close</span>
            </button>
          )}
        </div>

        {/* 一级：高频排序 Tab */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {topSortTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedSort(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                selectedSort === tab.id
                  ? 'bg-teal-500 text-white'
                  : 'bg-white/90 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 text-gray-700 dark:text-gray-200'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* 二级：分类筛选 */}
        <div className="mt-1">
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1 px-1">按话题分类筛选</div>
          <div className="flex-1 overflow-hidden">
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelect={setSelectedCategory}
            />
          </div>
        </div>
        {contextSummary && (
          <div className="mt-2 text-xs text-teal-600 dark:text-teal-400">
            AI上下文已同步：{contextSummary.pageType} · 可见话题 {contextSummary.totalVisible}
          </div>
        )}
      </motion.header>

      {/* 话题列表 - ref 供列表缓存恢复滚动 */}
      <main ref={listScrollRef} className="flex-1 px-2 pt-4 overflow-y-auto relative z-10">
        {aiSummaryVisible && (
          <AISummaryCard
            data={aiSummary}
            loading={aiSummaryLoading}
            error={aiSummaryError}
            onRefresh={() => setAiSummaryNonce((v) => v + 1)}
            onFollowUp={() => navigate(`/chat?q=${encodeURIComponent(searchQuery.trim())}`)}
          />
        )}

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
