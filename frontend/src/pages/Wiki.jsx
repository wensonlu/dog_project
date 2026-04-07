import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import BottomNav from '../components/BottomNav';
import { API_BASE_URL } from '../config';

function Wiki() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchArticles();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/wiki/categories`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Fetch categories error:', error);
    }
  };

  const fetchArticles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/wiki/articles?limit=6`);
      const result = await response.json();
      setArticles(result.data);
      setLoading(false);
    } catch (error) {
      console.error('Fetch articles error:', error);
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
    <div className="max-w-[430px] mx-auto min-h-screen bg-[#F5F5F0] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#F5F5F0]/95 backdrop-blur-sm px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">宠物百科</h1>
            <p className="text-sm text-gray-500 mt-1">养宠知识，一站掌握</p>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索品种、疾病、养护知识..."
            className="w-full h-12 pl-12 pr-4 bg-white rounded-2xl border-0 shadow-sm focus:ring-2 focus:ring-rose-200"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">
            search
          </span>
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-rose-500 text-white text-sm rounded-xl"
          >
            搜索
          </button>
        </form>
      </header>

      <main className="px-4">
        {/* Categories */}
        <section className="mb-6">
          <h2 className="font-bold text-lg mb-3">知识分类</h2>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/wiki/category/${category.slug}`)}
                className="bg-white rounded-2xl p-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-rose-500 text-2xl">
                      {category.icon || 'pets'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{category.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-1">{category.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Hot Articles */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">热门文章</h2>
            <button
              onClick={() => navigate('/wiki/articles')}
              className="text-sm text-rose-500"
            >
              查看全部 →
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/wiki/article/${article.slug}`)}
                  className="bg-white rounded-2xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex">
                    <div className="w-24 h-24 flex-shrink-0">
                      <img
                        src={article.cover_image || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200'}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">
                          {article.category?.name}
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-gray-900 line-clamp-1 mb-1">
                        {article.title}
                      </h3>
                      
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {article.summary}
                      </p>
                      
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
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
          )}
        </section>

        {/* Quick Links */}
        <section className="mt-6">
          <h2 className="font-bold text-lg mb-3">新手必读</h2>
          <div className="bg-white rounded-2xl p-4">
            <div className="space-y-3">
              {[
                { title: '新手养狗必备清单', slug: 'new-dog-owner-checklist' },
                { title: '领养流程详解', slug: 'adoption-process-guide' },
                { title: '如何与狗狗建立信任', slug: 'building-trust-with-dog' },
                { title: '狗狗常见行为解读', slug: 'dog-behavior-guide' }
              ].map((item, index) => (
                <div
                  key={index}
                  onClick={() => navigate(`/wiki/article/${item.slug}`)}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 cursor-pointer"
                >
                  <span className="text-gray-700">{item.title}</span>
                  <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

export default Wiki;
