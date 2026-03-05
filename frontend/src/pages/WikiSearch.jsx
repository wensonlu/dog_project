import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import BottomNav from '../components/BottomNav';
import { API_BASE_URL } from '../config';

function WikiSearch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(query);

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (q) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/wiki/articles/search?q=${encodeURIComponent(q)}`
      );
      const data = await response.json();
      setResults(data.data || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/wiki/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#F5F5F0]/95 backdrop-blur-sm px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/wiki')}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索百科..."
                className="w-full h-11 pl-10 pr-4 bg-white rounded-xl border-0 shadow-sm"
                autoFocus
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">
                search
              </span>
            </div>
          </form>
        </div>
      </header>

      <main className="px-4 pt-2">
        {/* Search Results */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-gray-500">
                {results.length > 0 ? `找到 ${results.length} 个结果` : '暂无搜索结果'}
              </p>
            </div>

            <div className="space-y-3">
              {results.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/wiki/article/${article.slug}`)}
                  className="bg-white rounded-2xl overflow-hidden cursor-pointer"
                >
                  <div className="flex">
                    <div className="w-28 h-28 flex-shrink-0">
                      <img
                        src={article.cover_image || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200'}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">
                          {article.category?.name}
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-gray-900 mb-1">{article.title}</h3>
                      
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {article.summary}
                      </p>
                      
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          {article.view_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">favorite</span>
                          {article.like_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Empty State */}
            {results.length === 0 && !loading && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">未找到相关文章</h3>
                <p className="text-gray-500 mb-4">试试其他关键词？</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['金毛', '领养流程', '疫苗', '训练'].map((keyword) => (
                    <button
                      key={keyword}
                      onClick={() => {
                        setSearchQuery(keyword);
                        navigate(`/wiki/search?q=${keyword}`);
                      }}
                      className="px-4 py-2 bg-white rounded-full text-sm text-gray-600"
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

export default WikiSearch;
