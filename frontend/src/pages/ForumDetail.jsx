import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import CommentItem from '../components/Forum/CommentItem';
import { formatTime } from '../data/mockForum';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import { addForumBrowseHistory } from '../utils/forumHistory';

const ForumDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [topic, setTopic] = useState(null);
  const [comments, setComments] = useState([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyingComment, setReplyingComment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 获取话题详情
  useEffect(() => {
    const fetchTopic = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (user?.id) {
          params.append('userId', user.id);
        }
        const response = await fetch(`${API_BASE_URL}/forum/${id}?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch topic');
        }
        const data = await response.json();
        setTopic(data.topic);
        setComments(data.comments || []);
        setIsLiked(data.topic?.isLiked || false);
        setLikeCount(data.topic?.likes || 0);
        if (data.topic?.id != null && data.topic?.title) {
          addForumBrowseHistory({ id: data.topic.id, title: data.topic.title });
        }
      } catch (error) {
        console.error('Error fetching topic:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTopic();
    }
  }, [id, user?.id]);

  const handleLike = async () => {
    if (!user?.id) {
      alert('请先登录');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/forum/${id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.liked);
        setLikeCount(data.likes);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleCommentLike = async (commentId, newLiked) => {
    if (!user?.id) return;

    try {
      const response = await fetch(`${API_BASE_URL}/forum/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      if (response.ok) {
        const data = await response.json();
        // Update comment in state
        setComments(prev => prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, likes: data.likes, isLiked: data.liked }
            : comment
        ));
      }
    } catch (error) {
      console.error('Error toggling comment like:', error);
    }
  };

  const handleReplyLike = async (replyId, newLiked) => {
    if (!user?.id) return;

    try {
      const response = await fetch(`${API_BASE_URL}/forum/replies/${replyId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      if (response.ok) {
        const data = await response.json();
        // Update reply in comments state
        setComments(prev => prev.map(comment => ({
          ...comment,
          replies: comment.replies?.map(reply =>
            reply.id === replyId
              ? { ...reply, likes: data.likes, isLiked: data.liked }
              : reply
          ) || []
        })));
      }
    } catch (error) {
      console.error('Error toggling reply like:', error);
    }
  };

  const handleReply = (target) => {
    setReplyingTo(target);
    setReplyingComment(target);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    if (!user?.id) {
      alert('请先登录');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/forum/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: commentText.trim(),
          userId: user.id,
          replyToCommentId: replyingTo?.id || null
        })
      });

      if (response.ok) {
        // Refresh topic data
        const params = new URLSearchParams();
        if (user.id) {
          params.append('userId', user.id);
        }
        const refreshResponse = await fetch(`${API_BASE_URL}/forum/${id}?${params.toString()}`);
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setTopic(data.topic);
          setComments(data.comments || []);
          setLikeCount(data.topic?.likes || 0);
        }
        
        setCommentText('');
        setReplyingTo(null);
        setReplyingComment(null);
      } else {
        const error = await response.json();
        alert(error.error || '提交失败，请重试');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('网络错误，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyingComment(null);
  };

  const isOwnTopic = user?.id && topic?.author?.id && topic.author.id === user.id;

  const handleDeleteTopic = async () => {
    if (!isOwnTopic || !user?.id) return;
    if (!window.confirm('确定要删除这条帖子吗？删除后无法恢复。')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/forum/${id}?userId=${encodeURIComponent(user.id)}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        navigate('/forum');
      } else {
        const data = await response.json();
        alert(data.error || '删除失败');
      }
    } catch (err) {
      console.error('Error deleting topic:', err);
      alert('网络错误，请重试');
    }
  };

  if (loading) {
    return (
      <div className="max-w-[430px] mx-auto min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-warm-beige">加载中...</p>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="max-w-[430px] mx-auto min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark">
        <span className="material-symbols-outlined text-6xl text-warm-beige mb-4">error</span>
        <p className="text-lg font-medium text-warm-beige">话题不存在</p>
        <button
          onClick={() => navigate('/forum')}
          className="mt-4 text-primary font-bold"
        >
          返回论坛
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[430px] mx-auto min-h-screen flex flex-col bg-background-light dark:bg-background-dark pb-24">
      {/* 头部 - 固定在顶部，半透明 */}
      <header className="fixed top-0 left-0 right-0 max-w-[430px] mx-auto z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 pt-12 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/forum')}
            className="size-9 rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm shadow-sm flex items-center justify-center text-[#1b120e] dark:text-white"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </button>
          <div className="flex-1"></div>
          {isOwnTopic ? (
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteTopic(); }}
              className="size-9 rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm shadow-sm flex items-center justify-center text-red-500 dark:text-red-400"
              title="删除帖子"
            >
              <span className="material-symbols-outlined text-lg">delete</span>
            </button>
          ) : (
            <button className="size-9 rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm shadow-sm flex items-center justify-center text-[#1b120e] dark:text-white">
              <span className="material-symbols-outlined text-lg">more_vert</span>
            </button>
          )}
        </div>
      </header>

      {/* 话题内容 - 小红书风格 */}
      <main className="flex-1 overflow-y-auto pt-0">
        {/* 图片区域 - 全屏展示，可滑动 */}
        {topic.images && topic.images.length > 0 && (
          <div className="relative w-full bg-black" style={{ aspectRatio: '4/5' }}>
            <div className="absolute inset-0 overflow-x-auto snap-x snap-mandatory scrollbar-hide flex">
              {topic.images.map((image, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-full h-full snap-center relative"
                >
                  <img
                    src={image}
                    alt={`图片 ${index + 1}`}
                    className="w-full h-full object-contain"
                  />
                </div>
              ))}
            </div>
            {/* 图片指示器 */}
            {topic.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {topic.images.map((_, index) => (
                  <div
                    key={index}
                    className="h-1 rounded-full bg-white/80 transition-all"
                    style={{ width: '6px' }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 内容区域 */}
        <div className="px-4 pt-4 pb-6">
          {/* 作者信息 */}
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
              <img
                src={topic.author.avatar}
                alt={topic.author.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-[#1b120e] dark:text-white">
                {topic.author.name}
              </p>
              <p className="text-xs text-warm-beige">{formatTime(topic.createdAt)}</p>
            </div>
            <button className="px-4 py-1.5 bg-primary text-white text-sm font-bold rounded-full">
              关注
            </button>
          </div>

          {/* 标题和内容 */}
          <div className="mb-4">
            <h2 className="text-lg font-bold text-[#1b120e] dark:text-white mb-2 leading-tight">
              {topic.title}
            </h2>
            <p className="text-sm text-[#1b120e] dark:text-zinc-300 leading-relaxed whitespace-pre-line">
              {topic.content}
            </p>
          </div>

          {/* 标签 */}
          {topic.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {topic.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-lg"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 操作栏 - 固定在底部 */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-700">
            <div className="flex items-center gap-6">
              <button
                onClick={handleLike}
                className="flex items-center gap-2 text-warm-beige transition-colors"
              >
                <span className={`material-symbols-outlined text-2xl ${isLiked ? 'fill text-red-500' : ''}`}>
                  {isLiked ? 'favorite' : 'favorite_border'}
                </span>
                <span className="text-sm font-medium">{likeCount}</span>
              </button>
              <div className="flex items-center gap-2 text-warm-beige">
                <span className="material-symbols-outlined text-2xl">comment</span>
                <span className="text-sm font-medium">{topic.comments}</span>
              </div>
              <div className="flex items-center gap-2 text-warm-beige">
                <span className="material-symbols-outlined text-2xl">share</span>
              </div>
            </div>
            <div className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg">
              {topic.category}
            </div>
          </div>
        </div>

        {/* 评论区域 - 小红书风格 */}
        <div className="px-4 pb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#1b120e] dark:text-white">
              评论 {comments.length > 0 && `(${comments.length})`}
            </h3>
            {comments.length > 0 && (
              <button className="text-xs text-primary font-medium">查看全部</button>
            )}
          </div>

          {/* 评论列表 */}
          <div className="mb-4 space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-12 text-warm-beige">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-40">comment</span>
                <p className="text-sm">暂无评论，快来抢沙发吧～</p>
              </div>
            ) : (
              comments.slice(0, 3).map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  replies={comment.replies || []}
                  onLike={handleCommentLike}
                  onReplyLike={handleReplyLike}
                  onReply={handleReply}
                />
              ))
            )}
          </div>
        </div>

        {/* 评论输入框 - 固定在底部 */}
        <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-background-light dark:bg-background-dark border-t border-zinc-200 dark:border-zinc-700 px-4 py-3 pb-20">
          {replyingTo && (
            <div className="mb-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-700/50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-warm-beige">回复</span>
                <span className="text-xs font-medium text-[#1b120e] dark:text-white">
                  {replyingTo.author.name}
                </span>
              </div>
              <button
                onClick={handleCancelReply}
                className="size-5 rounded-full bg-zinc-200 dark:bg-zinc-600 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-xs text-warm-beige">close</span>
              </button>
            </div>
          )}
          <div className="flex gap-2 items-center">
            <div className="size-8 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex-shrink-0">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6ZfAu74fVn19xwt_mCCWmnG0o7CZVapQ8kcQLS4X-Bq4t9inNQHpNA2CtIDIILlKL7BEwdeDFD1ir1ExQXcadXX1G0ZeCruY06uZCg-nslkcMsFEssRFlRG9WUkpJ1A6HzO8kRmhQdRu6pihqtzjdpfK-FD-VL3z-S_AoQG8KrdjqvQ3CSQdDha2DtsEiRkV3RGcfoZHR12Ii9gsm_0C6CJ79z0Hu7LkUOIdgB5G5XcVAN8qPe5tGxLh1fauXT7-L58wrQ_eXFM0"
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={replyingTo ? `回复 ${replyingTo.author.name}...` : '说点什么...'}
              className="flex-1 h-9 px-4 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-[#1b120e] dark:text-white placeholder-warm-beige focus:outline-none focus:ring-2 focus:ring-primary/20"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
            />
            {commentText.trim() && (
              <button
                onClick={handleSubmitComment}
                disabled={submitting}
                className="text-primary text-sm font-bold px-2 disabled:opacity-50"
              >
                {submitting ? '发送中...' : '发送'}
              </button>
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default ForumDetail;
