import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

function StoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    fetchStoryDetail();
  }, [id]);

  const fetchStoryDetail = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stories/${id}`);
      const data = await response.json();
      setStory(data);
      setLoading(false);
    } catch (error) {
      console.error('Fetch story detail error:', error);
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/stories/${id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      
      if (result.status === 'liked') {
        setIsLiked(true);
        setStory(prev => ({ ...prev, like_count: prev.like_count + 1 }));
      } else {
        setIsLiked(false);
        setStory(prev => ({ ...prev, like_count: prev.like_count - 1 }));
      }
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleComment = async () => {
    if (!user || !comment.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/stories/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content: comment })
      });
      
      if (response.ok) {
        setComment('');
        fetchStoryDetail();
      }
    } catch (error) {
      console.error('Comment error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">故事不存在或已被删除</p>
          <button
            onClick={() => navigate('/stories')}
            className="mt-4 text-rose-500 font-medium"
          >
            返回故事墙
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#F5F5F0]/95 backdrop-blur-sm px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <span className="font-bold text-lg">故事详情</span>
      </header>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-4"
      >
        {/* Cover Image */}
        <div className="rounded-2xl overflow-hidden mb-4">
          <img
            src={story.cover_image || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800'}
            alt={story.title}
            className="w-full aspect-video object-cover"
          />
        </div>

        {/* Title & Author */}
        <div className="mb-4">
          <h1 className="text-xl font-black text-gray-900 mb-3">{story.title}</h1>
          
          <div className="flex items-center gap-3">
            <img
              src={story.adopter?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + story.adopter_id}
              alt={story.adopter?.full_name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="font-medium text-gray-900">{story.adopter?.full_name || '匿名用户'}</p>
              <p className="text-xs text-gray-400">
                {new Date(story.created_at).toLocaleDateString('zh-CN')}
              </p>
            </div>          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl p-4 mb-4">
          <div className="prose prose-slate max-w-none text-gray-700">
            {/* <ReactMarkdown>{story.content.replace(/\\n/g, '\n')}</ReactMarkdown> */}
            {/* <div dangerouslySetInnerHTML={{ __html: story.content }} /> */}
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {story.content}
          </p>

          </div>
        </div>

        {/* Timeline */}
        {story.timeline && story.timeline.length > 0 && (
          <div className="mb-4">
            <h2 className="font-bold text-lg mb-3">成长记录</h2>
            <div className="space-y-3">
              {story.timeline.map((item, index) => (
                <div key={item.id} className="bg-white rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-rose-100 text-rose-600 text-xs px-2 py-1 rounded-full">
                      {item.milestone_date ? new Date(item.milestone_date).toLocaleDateString('zh-CN') : `第${index + 1}天`}
                    </span>
                  </div>
                  <h3 className="font-bold mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.content}</p>
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="mt-2 rounded-xl w-full aspect-video object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-6 py-4 border-t border-gray-200">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 ${isLiked ? 'text-rose-500' : 'text-gray-500'}`}
          >
            <span className="material-symbols-outlined">{isLiked ? 'favorite' : 'favorite_border'}</span>
            <span>{story.like_count}</span>
          </button>
          
          <div className="flex items-center gap-2 text-gray-500">
            <span className="material-symbols-outlined">chat_bubble_outline</span>
            <span>{story.comment_count}</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-500">
            <span className="material-symbols-outlined">visibility</span>
            <span>{story.view_count}</span>
          </div>
        </div>

        {/* Comments */}
        <div className="mt-4">
          <h2 className="font-bold text-lg mb-3">评论</h2>
          
          {/* Comment Input */}
          {user && (
            <div className="bg-white rounded-2xl p-3 mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="写下你的祝福..."
                  className="flex-1 bg-gray-100 rounded-xl px-4 py-2 text-sm"
                />
                <button
                  onClick={handleComment}
                  disabled={!comment.trim()}
                  className="px-4 py-2 bg-rose-500 text-white rounded-xl text-sm font-medium disabled:opacity-50"
                >
                  发送
                </button>
              </div>
            </div>
          )}

          {/* Comment List */}
          <div className="space-y-3">
            {story.comments?.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src={item.user?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + item.user_id}
                    alt={item.user?.full_name}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="font-medium text-sm">{item.user?.full_name}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(item.created_at).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <p className="text-gray-700 text-sm">{item.content}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default StoryDetail;
