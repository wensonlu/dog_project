import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

const FollowingAuthors = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFollowing = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const response = await fetch(`${API_BASE_URL}/forum/follows/me?userId=${encodeURIComponent(user.id)}`);
        if (!response.ok) {
          throw new Error('获取关注列表失败');
        }
        const data = await response.json();
        setAuthors(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching following authors:', err);
        setError(err.message || '加载失败');
      } finally {
        setLoading(false);
      }
    };

    fetchFollowing();
  }, [user?.id]);

  return (
    <div className="max-w-[430px] mx-auto min-h-screen bg-gradient-to-b from-rose-50/50 via-cream-50 to-teal-50/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 pb-24">
      <header className="sticky top-0 ios-safe-top z-50 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl border-b border-rose-100/50 dark:border-zinc-800">
        <div className="flex items-center gap-3 px-4 pt-6 pb-3">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="size-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-500"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-800 dark:text-white">我关注的人</h1>
            <p className="text-xs text-rose-400">{authors.length} 位作者</p>
          </div>
        </div>
      </header>

      <main className="px-4 pt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
            <p className="mt-3 text-sm text-rose-400">加载关注列表中...</p>
          </div>
        ) : error ? (
          <div className="text-center py-24">
            <p className="text-sm text-rose-500">{error}</p>
          </div>
        ) : authors.length === 0 ? (
          <div className="text-center py-24">
            <span className="material-symbols-outlined text-5xl text-zinc-300 dark:text-zinc-600">person_search</span>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">你还没有关注任何作者</p>
            <button
              type="button"
              onClick={() => navigate('/forum')}
              className="mt-4 px-4 py-2 rounded-full bg-primary text-white text-sm font-bold"
            >
              去论坛看看
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {authors.map((author) => (
              <div
                key={author.userId}
                className="bg-white dark:bg-zinc-800 rounded-2xl p-4 border border-rose-100/50 dark:border-zinc-700"
              >
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                    <img src={author.avatar} alt={author.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-800 dark:text-white truncate">{author.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      发帖 {author.topicCount || 0} 条 · 关注于 {new Date(author.followedAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/forum')}
                    className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold"
                  >
                    去看看
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default FollowingAuthors;
