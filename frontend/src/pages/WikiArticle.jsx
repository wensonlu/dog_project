import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

function WikiArticle() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    fetchArticle();
  }, [slug]);

  const fetchArticle = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/wiki/articles/${slug}`);
      const data = await response.json();
      setArticle(data);
      setLoading(false);
    } catch (error) {
      console.error('Fetch article error:', error);
      setLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/wiki/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ article_id: article.id })
      });
      const result = await response.json();
      setIsFavorited(result.status === 'favorited');
    } catch (error) {
      console.error('Favorite error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">文章不存在</p>
          <button
            onClick={() => navigate('/wiki')}
            className="mt-4 text-rose-500 font-medium"
          >
            返回百科
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#F5F5F0]/95 backdrop-blur-sm px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="font-bold text-lg truncate max-w-[200px]">{article.title}</span>
        </div>
        
        <button
          onClick={handleFavorite}
          className={`p-2 rounded-full transition-colors ${isFavorited ? 'text-rose-500' : 'text-gray-400'}`}
        >
          <span className="material-symbols-outlined">{isFavorited ? 'favorite' : 'favorite_border'}</span>
        </button>
      </header>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-4"
      >
        {/* Cover Image */}
        {article.cover_image && (
          <div className="rounded-2xl overflow-hidden mb-4">
            <img
              src={article.cover_image}
              alt={article.title}
              className="w-full aspect-video object-cover"
            />
          </div>
        )}

        {/* Category & Meta */}
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-rose-100 text-rose-600 text-sm px-3 py-1 rounded-full">
            {article.category?.name}
          </span>
          <span className="text-sm text-gray-400">
            {new Date(article.published_at).toLocaleDateString('zh-CN')}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-black text-gray-900 mb-4">{article.title}</h1>

        {/* Summary */}
        {article.summary && (
          <div className="bg-rose-50 rounded-2xl p-4 mb-6">
            <p className="text-rose-700 text-sm leading-relaxed">{article.summary}</p>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-2xl p-5 mb-6">
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 py-4 border-t border-gray-200 mb-6">
          <div className="flex items-center gap-2 text-gray-500">
            <span className="material-symbols-outlined">visibility</span>
            <span>{article.view_count} 阅读</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <span className="material-symbols-outlined">favorite</span>
            <span>{article.like_count} 喜欢</span>
          </div>
        </div>

        {/* Related Articles */}
        {article.related && article.related.length > 0 && (
          <div>
            <h2 className="font-bold text-lg mb-3">相关文章</h2>
            <div className="space-y-3">
              {article.related.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/wiki/article/${item.slug}`)}
                  className="bg-white rounded-2xl p-3 flex gap-3 cursor-pointer"
                >
                  <img
                    src={item.cover_image || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100'}
                    alt={item.title}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-sm line-clamp-2">{item.title}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">{item.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default WikiArticle;
