import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import BottomNav from '../components/BottomNav';
import { API_BASE_URL } from '../config';

function WikiCategory() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    fetchCategoryAndArticles();
  }, [slug]);

  const fetchCategoryAndArticles = async () => {
    try {
      setLoading(true);

      const [categoriesRes, articlesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/wiki/categories`),
        fetch(`${API_BASE_URL}/wiki/articles?category=${slug}&page=1&limit=20`)
      ]);

      if (categoriesRes.ok) {
        const categories = await categoriesRes.json();
        const found = categories.find(c => c.slug === slug);
        setCategory(found || null);
      }

      if (articlesRes.ok) {
        const result = await articlesRes.json();
        setArticles(result.data || []);
        setHasMore((result.data || []).length >= 20);
      }

      setLoading(false);
    } catch (error) {
      console.error('Fetch category articles error:', error);
      setLoading(false);
    }
  };

  const loadMore = async () => {
    try {
      const nextPage = page + 1;
      const response = await fetch(
        `${API_BASE_URL}/wiki/articles?category=${slug}&page=${nextPage}&limit=20`
      );

      if (response.ok) {
        const result = await response.json();
        setArticles([...articles, ...(result.data || [])]);
        setPage(nextPage);
        setHasMore((result.data || []).length >= 20);
      }
    } catch (error) {
      console.error('Load more error:', error);
    }
  };

  return (
    <div className="max-w-[430px] mx-auto min-h-screen bg-[#F5F5F0] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#F5F5F0]/95 backdrop-blur-sm px-5 pt-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-200"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              {category?.name || '加载中...'}
            </h1>
            {category && (
              <p className="text-sm text-gray-500 mt-1">{category.description}</p>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">
              description
            </span>
            <p className="text-gray-500">暂无文章</p>
          </div>
        ) : (
          <>
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
                        src={
                          article.cover_image ||
                          'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200'
                        }
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 p-3">
                      <h3 className="font-bold text-gray-900 line-clamp-2 mb-1">
                        {article.title}
                      </h3>

                      <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                        {article.summary}
                      </p>

                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">
                            visibility
                          </span>
                          {article.view_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">
                            favorite
                          </span>
                          {article.like_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {hasMore && (
              <button
                onClick={loadMore}
                className="w-full mt-6 py-3 bg-white rounded-2xl text-rose-500 font-medium hover:bg-gray-50 transition-colors"
              >
                加载更多
              </button>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

export default WikiCategory;
