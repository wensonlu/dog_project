import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import BottomNav from '../components/BottomNav';
import { API_BASE_URL } from '../config';

function Stories() {
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async (pageNum = 1) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/stories?page=${pageNum}&limit=10`
      );
      const result = await response.json();
      
      if (pageNum === 1) {
        setStories(result.data);
      } else {
        setStories(prev => [...prev, ...result.data]);
      }
      
      setHasMore(result.data.length === 10);
      setLoading(false);
    } catch (error) {
      console.error('Fetch stories error:', error);
      setLoading(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchStories(nextPage);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#F5F5F0]/95 backdrop-blur-sm px-5 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">幸福故事</h1>
            <p className="text-sm text-gray-500 mt-1">每一个领养都是爱的延续</p>
          </div>
          <button
            onClick={() => navigate('/stories/create')}
            className="px-4 py-2 bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-rose-200"
          >
            分享故事
          </button>
        </div>
      </header>

      {/* Stories Grid */}
      <main className="px-4 pt-2">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {stories.map((story, index) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/stories/${story.id}`)}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer"
                >
                  {/* Cover Image */}
                  <div className="aspect-square relative">
                    <img
                      src={story.cover_image || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400'}
                      alt={story.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Title Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="text-white font-bold text-sm line-clamp-2">
                        {story.title}
                      </h3>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={story.adopter?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + story.adopter_id}
                        alt={story.adopter?.username}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-xs text-gray-600 truncate">
                        {story.adopter?.username || '匿名用户'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">favorite</span>
                        {story.like_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">chat_bubble</span>
                        {story.comment_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        {story.view_count}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <button
                onClick={loadMore}
                className="w-full py-4 mt-4 text-rose-500 font-medium"
              >
                加载更多
              </button>
            )}

            {/* Empty State */}
            {stories.length === 0 && !loading && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📖</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">还没有故事</h3>
                <p className="text-gray-500 mb-4">成为第一个分享领养故事的人吧！</p>
                <button
                  onClick={() => navigate('/stories/create')}
                  className="px-6 py-3 bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-xl font-medium"
                >
                  分享我的故事
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

export default Stories;
