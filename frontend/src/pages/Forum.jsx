import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import TopicCard from '../components/Forum/TopicCard';
import CategoryFilter from '../components/Forum/CategoryFilter';
import SortSelector from '../components/Forum/SortSelector';
import { categories, sortOptions } from '../data/mockForum';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

const Forum = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState('latest');
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 获取话题列表
  useEffect(() => {
    const fetchTopics = async () => {
      setLoading(true);
      setError(null);
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
        // 如果 API 失败，使用空数组而不是 mock 数据
        setTopics([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [selectedCategory, selectedSort, searchQuery, user?.id]);

  return (
    <div className="max-w-[430px] mx-auto min-h-screen flex flex-col bg-background-light dark:bg-background-dark pb-24">
      {/* 头部 - 小红书风格，更简洁 */}
      <header className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 pt-12 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold tracking-tight text-[#1b120e] dark:text-white">发现</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/forum/history')}
              className="size-9 rounded-full bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center text-[#1b120e] dark:text-white"
              title="浏览记录"
            >
              <span className="material-symbols-outlined text-lg">history</span>
            </button>
            <button
              onClick={() => navigate('/forum/create')}
              className="size-9 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
            </button>
          </div>
        </div>

        {/* 搜索栏 - 更紧凑 */}
        <div className="relative mb-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索话题..."
            className="w-full h-10 px-4 pl-10 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-[#1b120e] dark:text-white placeholder-warm-beige focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-warm-beige text-lg">
            search
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 size-5 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-xs text-warm-beige">close</span>
            </button>
          )}
        </div>

        {/* 分类和排序 - 更紧凑 */}
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
      </header>

      {/* 话题列表 - 小红书瀑布流布局 */}
      <main className="flex-1 px-2 pt-4 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-4 text-warm-beige">加载中...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-40">
            <span className="material-symbols-outlined text-6xl mb-4">error</span>
            <p className="text-lg font-medium text-warm-beige">加载失败：{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-primary font-bold"
            >
              重试
            </button>
          </div>
        ) : topics.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-40">
            <span className="material-symbols-outlined text-6xl mb-4">forum</span>
            <p className="text-lg font-medium text-warm-beige">暂无话题</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 text-primary font-bold"
              >
                清除搜索
              </button>
            )}
          </div>
        ) : (
          <div className="columns-2 gap-2 space-y-2">
            {topics.map(topic => (
              <div key={topic.id} className="break-inside-avoid mb-2">
                <TopicCard topic={topic} />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 底部导航 */}
      <BottomNav />
    </div>
  );
};

export default Forum;
