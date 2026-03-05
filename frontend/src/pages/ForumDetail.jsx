import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import CommentItem from '../components/Forum/CommentItem';
import CommentActionSheet from '../components/Forum/CommentActionSheet';
import ConfirmModal from '../components/ConfirmModal';
import { formatTime } from '../data/mockForum';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import { addForumBrowseHistory } from '../utils/forumHistory';
import { getCurrentCityName } from '../utils/geolocation';

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
  const [replyCity, setReplyCity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const [tipMessage, setTipMessage] = useState('');
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState(null);
  const [deleteCommentReplyTarget, setDeleteCommentReplyTarget] = useState(null);
  const [deleteCommentReplyLoading, setDeleteCommentReplyLoading] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [barBottomPx, setBarBottomPx] = useState(80);
  const [isBarInputMode, setIsBarInputMode] = useState(false);
  const imageScrollRef = useRef(null);
  const commentSectionRef = useRef(null);
  const commentInputRef = useRef(null);
  const barInputRef = useRef(null);

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

  // 键盘弹起时底部栏吸附在键盘上方（visualViewport）
  useEffect(() => {
    const vv = window.visualViewport;
    const updateBarBottom = () => {
      const keyboardHeight = window.innerHeight - vv.height;
      const isKeyboardOpen = keyboardHeight > 80;
      setBarBottomPx(isKeyboardOpen ? keyboardHeight : 80);
    };
    updateBarBottom();
    vv.addEventListener('resize', updateBarBottom);
    vv.addEventListener('scroll', updateBarBottom);
    return () => {
      vv.removeEventListener('resize', updateBarBottom);
      vv.removeEventListener('scroll', updateBarBottom);
    };
  }, []);

  const handleLike = async () => {
    if (!user?.id) {
      setTipMessage('请先登录');
      setTipOpen(true);
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

  const handleCommentLike = async (commentId) => {
    if (!user?.id) {
      setTipMessage('请先登录');
      setTipOpen(true);
      return;
    }

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

  const handleReplyLike = async (replyId) => {
    if (!user?.id) {
      setTipMessage('请先登录');
      setTipOpen(true);
      return;
    }

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
    if (!user?.id) {
      setTipMessage('请先登录');
      setTipOpen(true);
      return;
    }
    setReplyingTo(target);
    setReplyCity(null);
    setIsBarInputMode(true);
    commentSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => barInputRef.current?.focus(), 300);
    getCurrentCityName()
      .then((city) => {
        setReplyCity(city ?? null);
      })
      .catch(() => {
        setReplyCity(null);
      });
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    if (!user?.id) {
      setTipMessage('请先登录');
      setTipOpen(true);
      return;
    }

    setSubmitting(true);
    try {
      // 点击发送时统一带上定位：已有则用，没有则请求一次（直接评论或回复都覆盖）
      let locationCity = replyCity ?? undefined;
      if (locationCity == null) {
        try {
          const city = await getCurrentCityName();
          locationCity = city ?? undefined;
          if (city) setReplyCity(city);
        } catch {
          // 定位失败仍可发送，不阻塞
        }
      }
      const response = await fetch(`${API_BASE_URL}/forum/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: commentText.trim(),
          userId: user.id,
          replyToCommentId: replyingTo?.commentId ?? replyingTo?.id ?? null,
          locationCity,
          replyToUserName: replyingTo?.author?.name ?? undefined
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
        setReplyCity(null);
        setIsBarInputMode(false);
      } else {
        const error = await response.json();
        setTipMessage(error.error || '提交失败，请重试');
        setTipOpen(true);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      setTipMessage('网络错误，请重试');
      setTipOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyCity(null);
    setIsBarInputMode(false);
    barInputRef.current?.blur();
  };

  const handleOpenCommentReplyAction = (target) => {
    setActionTarget(target);
    setActionSheetOpen(true);
  };

  const handleCloseActionSheet = () => {
    setActionSheetOpen(false);
    setActionTarget(null);
  };

  const getCopyText = () => {
    if (!actionTarget) return '';
    if (actionTarget.type === 'comment') return actionTarget.comment.content;
    const r = actionTarget.reply;
    return r.replyToUserName ? `回复 ${r.replyToUserName}: ${r.content}` : r.content;
  };

  const handleActionCollect = () => {
    if (!actionTarget || !id) return;
    const key = 'forum_collected';
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    const item = actionTarget.type === 'comment'
      ? {
          type: 'comment',
          id: actionTarget.comment.id,
          topicId: id,
          content: actionTarget.comment.content,
          authorName: actionTarget.comment.author?.name
        }
      : {
          type: 'reply',
          id: actionTarget.reply.id,
          topicId: id,
          content: actionTarget.reply.content,
          authorName: actionTarget.reply.author?.name
        };
    if (list.some((x) => x.type === item.type && x.id === item.id)) {
      setTipMessage('已在收藏中');
    } else {
      list.push(item);
      localStorage.setItem(key, JSON.stringify(list));
      setTipMessage('已收藏');
    }
    setTipOpen(true);
  };

  const handleActionCopy = async () => {
    const text = getCopyText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setTipMessage('已复制到剪贴板');
    } catch {
      setTipMessage('复制失败');
    }
    setTipOpen(true);
  };

  const handleActionDelete = () => {
    if (!actionTarget) return;
    setDeleteCommentReplyTarget(
      actionTarget.type === 'comment'
        ? { type: 'comment', id: actionTarget.comment.id }
        : { type: 'reply', id: actionTarget.reply.id }
    );
    handleCloseActionSheet();
  };

  const handleConfirmDeleteCommentReply = async () => {
    if (!deleteCommentReplyTarget || !user?.id) return;
    setDeleteCommentReplyLoading(true);
    try {
      const url = deleteCommentReplyTarget.type === 'comment'
        ? `${API_BASE_URL}/forum/comments/${deleteCommentReplyTarget.id}?userId=${encodeURIComponent(user.id)}`
        : `${API_BASE_URL}/forum/replies/${deleteCommentReplyTarget.id}?userId=${encodeURIComponent(user.id)}`;
      const response = await fetch(url, { method: 'DELETE' });
      if (response.ok) {
        setDeleteCommentReplyTarget(null);
        const params = new URLSearchParams();
        if (user.id) params.append('userId', user.id);
        const refreshResponse = await fetch(`${API_BASE_URL}/forum/${id}?${params.toString()}`);
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setTopic(data.topic);
          setComments(data.comments || []);
          setLikeCount(data.topic?.likes || 0);
        }
        setTipMessage('已删除');
        setTipOpen(true);
      } else {
        const data = await response.json();
        setTipMessage(data.error || '删除失败');
        setTipOpen(true);
      }
    } catch (err) {
      console.error('Error deleting comment/reply:', err);
      setTipMessage('网络错误，请重试');
      setTipOpen(true);
    } finally {
      setDeleteCommentReplyLoading(false);
    }
  };

  const isOwnTopic = user?.id && topic?.author?.id && topic.author.id === user.id;

  const handleDeleteTopic = async () => {
    if (!isOwnTopic || !user?.id) return;
    setDeleteLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/forum/${id}?userId=${encodeURIComponent(user.id)}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setDeleteConfirmOpen(false);
        navigate('/forum');
      } else {
        const data = await response.json();
        setDeleteConfirmOpen(false);
        setTipMessage(data.error || '删除失败');
        setTipOpen(true);
      }
    } catch (err) {
      console.error('Error deleting topic:', err);
      setDeleteConfirmOpen(false);
      setTipMessage('网络错误，请重试');
      setTipOpen(true);
    } finally {
      setDeleteLoading(false);
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
      {/* 头部 - 返回与作者头像+昵称贴近左侧，右侧关注/分享或删除 */}
      <header className="fixed top-0 left-0 right-0 max-w-[430px] mx-auto z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 pt-12 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              onClick={() => navigate(-1)}
              className="size-9 rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm shadow-sm flex items-center justify-center text-[#1b120e] dark:text-white flex-shrink-0"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
            </button>
            <div className="size-8 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex-shrink-0">
              <img
                src={topic.author.avatar}
                alt={topic.author.name}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-sm font-bold text-[#1b120e] dark:text-white truncate">
              {topic.author.name}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isOwnTopic ? (
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteConfirmOpen(true); }}
                className="size-9 rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm shadow-sm flex items-center justify-center text-red-500 dark:text-red-400"
                title="删除帖子"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
            ) : (
              <>
                <button className="px-3 py-1.5 bg-primary text-white text-sm font-bold rounded-full">
                  关注
                </button>
                <button className="size-9 rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm shadow-sm flex items-center justify-center text-[#1b120e] dark:text-white">
                  <span className="material-symbols-outlined text-lg">share</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 话题内容 - 小红书风格（底部留白避免被固定操作栏遮挡） */}
      <main className="flex-1 overflow-y-auto pt-0 pb-28">
        {/* 图片区域 - 右上角 1/N，底部圆点 */}
        {topic.images && topic.images.length > 0 && (
          <div className="relative w-full bg-black" style={{ aspectRatio: '4/5' }}>
            <div
              ref={imageScrollRef}
              className="absolute inset-0 overflow-x-auto snap-x snap-mandatory scrollbar-hide flex"
              onScroll={() => {
                const el = imageScrollRef.current;
                if (!el || topic.images.length <= 1) return;
                const w = el.offsetWidth;
                const index = Math.round(el.scrollLeft / w);
                setImageIndex(Math.min(index, topic.images.length - 1));
              }}
            >
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
            {/* 右上角 1/N */}
            <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-white text-xs z-10">
              {imageIndex + 1}/{topic.images.length}
            </div>
            {/* 底部圆点指示器 */}
            {topic.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {topic.images.map((_, index) => (
                  <div
                    key={index}
                    className={`size-1.5 rounded-full transition-all ${
                      index === imageIndex ? 'bg-white w-3' : 'bg-white/60'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 正文区域 */}
        <div className="px-4 pt-4 pb-6">
          {/* 标题和正文 */}
          <div className="mb-3">
            <h2 className="text-lg font-bold text-[#1b120e] dark:text-white mb-2 leading-tight">
              {topic.title}
            </h2>
            <p className="text-sm text-[#1b120e] dark:text-zinc-300 leading-relaxed whitespace-pre-line">
              {topic.content}
            </p>
          </div>

          {/* 标签 */}
          {topic.tags && topic.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
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
        </div>

        {/* 日期和不喜欢 - 正文下、共 N 条评论上 */}
        <div className="px-4 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 py-2 border-t border-zinc-100 dark:border-zinc-800">
          <span>{formatTime(topic.createdAt)}</span>
          <button type="button" className="flex items-center gap-1">
            <span className="material-symbols-outlined text-base">thumb_down</span>
            不喜欢
          </button>
        </div>

        {/* 评论区域 - 共 N 条评论 */}
        <div className="px-4 pb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#1b120e] dark:text-white">
              共 {comments.length} 条评论
            </h3>
            {comments.length > 0 && (
              <button type="button" className="p-1.5 text-zinc-500 dark:text-zinc-400">
                <span className="material-symbols-outlined text-xl">menu</span>
              </button>
            )}
          </div>

          {/* 让大家听到你的声音 - 共 N 条评论下、评论列表上 */}
          <div ref={commentSectionRef} className="pt-2 border-t border-zinc-100 dark:border-zinc-800 mb-4">
            {replyingTo && (
              <div className="mb-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-700/50 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-warm-beige">回复</span>
                  <span className="text-xs font-medium text-[#1b120e] dark:text-white">
                    {replyingTo.author.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCancelReply}
                  className="size-5 rounded-full bg-zinc-200 dark:bg-zinc-600 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-xs text-warm-beige">close</span>
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-full bg-zinc-100 dark:bg-zinc-800 pl-1 pr-1 py-1">
              <div className="size-8 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex-shrink-0">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-lg text-warm-beige">
                    <span className="material-symbols-outlined">person</span>
                  </span>
                )}
              </div>
              <input
                ref={commentInputRef}
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={replyingTo ? `回复 ${replyingTo.author.name}...` : '让大家听到你的声音'}
                className="flex-1 min-w-0 h-8 px-3 bg-transparent text-sm text-[#1b120e] dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
              />
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button type="button" className="size-8 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                  <span className="material-symbols-outlined text-xl">mic</span>
                </button>
                <button type="button" className="size-8 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                  <span className="material-symbols-outlined text-xl">image</span>
                </button>
                {commentText.trim() && (
                  <button
                    type="button"
                    onClick={handleSubmitComment}
                    disabled={submitting}
                    className="text-primary text-sm font-bold px-2 disabled:opacity-50"
                  >
                    {submitting ? '发送中...' : '发送'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 评论列表 - 每条评论内默认只展示第一条回复，由 CommentItem 控制 */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-12 text-warm-beige">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-40">comment</span>
                <p className="text-sm">暂无评论，快来抢沙发吧～</p>
              </div>
            ) : (
              comments.map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  replies={comment.replies || []}
                  currentUserId={user?.id}
                  onLike={handleCommentLike}
                  onReplyLike={handleReplyLike}
                  onReply={handleReply}
                  onOpenActionMenu={handleOpenCommentReplyAction}
                />
              ))
            )}
          </div>
        </div>
      </main>

      {/* 底部固定操作栏 - 键盘弹起时吸附在键盘上方并做文字回显 */}
      <div
        className="fixed left-0 right-0 max-w-[430px] mx-auto z-40 bg-background-light dark:bg-background-dark border-t border-zinc-200 dark:border-zinc-700 px-4 py-2 transition-[bottom] duration-200"
        style={{ bottom: `${barBottomPx}px` }}
      >
        <div className="flex items-center justify-between gap-3">
          {isBarInputMode ? (
            <>
              <div className="flex-1 min-w-0 flex items-center gap-2 rounded-full bg-zinc-100 dark:bg-zinc-800 pl-3 pr-1 py-1">
                {replyingTo && (
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-warm-beige">回复 {replyingTo.author?.name}</span>
                    <button
                      type="button"
                      onClick={handleCancelReply}
                      className="size-5 rounded-full bg-zinc-200 dark:bg-zinc-600 flex items-center justify-center"
                      aria-label="取消回复"
                    >
                      <span className="material-symbols-outlined text-xs text-warm-beige">close</span>
                    </button>
                  </div>
                )}
                <input
                  ref={barInputRef}
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={replyingTo ? `回复 ${replyingTo.author?.name}...` : '让大家听到你的声音'}
                  className="flex-1 min-w-0 h-8 bg-transparent text-sm text-[#1b120e] dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitComment();
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      if (!commentText.trim()) setIsBarInputMode(false);
                    }, 150);
                  }}
                />
                {commentText.trim() && (
                  <button
                    type="button"
                    onClick={handleSubmitComment}
                    disabled={submitting}
                    className="text-primary text-sm font-bold px-2 py-1 disabled:opacity-50"
                  >
                    {submitting ? '发送中...' : '发送'}
                  </button>
                )}
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (!user?.id) {
                  setTipMessage('请先登录');
                  setTipOpen(true);
                  return;
                }
                setIsBarInputMode(true);
                commentSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                setTimeout(() => barInputRef.current?.focus(), 300);
              }}
              className="flex-1 flex items-center gap-2 text-left text-sm text-zinc-500 dark:text-zinc-400 min-w-0 rounded-full bg-zinc-100 dark:bg-zinc-800 pl-4 pr-4 py-2.5"
            >
              <span className="material-symbols-outlined text-xl">edit_note</span>
              说点什么...
            </button>
          )}
          <div className="flex items-center gap-4 flex-shrink-0">
            <button
              type="button"
              onClick={handleLike}
              className="flex items-center gap-1 text-[#1b120e] dark:text-zinc-300"
            >
              <span className={`material-symbols-outlined text-2xl ${isLiked ? 'fill text-red-500' : ''}`}>
                {isLiked ? 'favorite' : 'favorite_border'}
              </span>
              <span className="text-sm font-medium">{likeCount}</span>
            </button>
            <button type="button" className="flex items-center gap-1 text-[#1b120e] dark:text-zinc-300">
              <span className="material-symbols-outlined text-2xl">star_border</span>
              <span className="text-sm font-medium">0</span>
            </button>
            <button type="button" className="flex items-center gap-1 text-[#1b120e] dark:text-zinc-300">
              <span className="material-symbols-outlined text-2xl">chat_bubble_outline</span>
              <span className="text-sm font-medium">{topic?.comments ?? 0}</span>
            </button>
          </div>
        </div>
      </div>

      <BottomNav />

      {/* 删除确认弹窗（H5 友好，替代 confirm） */}
      <ConfirmModal
        open={deleteConfirmOpen}
        title="删除帖子"
        message="确定要删除这条帖子吗？删除后无法恢复。"
        confirmText="确定删除"
        cancelText="取消"
        confirmVariant="danger"
        confirmLoading={deleteLoading}
        onConfirm={handleDeleteTopic}
        onCancel={() => setDeleteConfirmOpen(false)}
      />

      {/* 评论/回复操作弹窗：收藏、复制、删除 */}
      <CommentActionSheet
        open={actionSheetOpen}
        onClose={handleCloseActionSheet}
        onCollect={handleActionCollect}
        onCopy={handleActionCopy}
        onDelete={handleActionDelete}
      />

      {/* 删除评论/回复确认 */}
      <ConfirmModal
        open={!!deleteCommentReplyTarget}
        title={deleteCommentReplyTarget?.type === 'reply' ? '删除回复' : '删除评论'}
        message={deleteCommentReplyTarget?.type === 'reply' ? '确定要删除这条回复吗？' : '确定要删除这条评论吗？删除后无法恢复。'}
        confirmText="确定删除"
        cancelText="取消"
        confirmVariant="danger"
        confirmLoading={deleteCommentReplyLoading}
        onConfirm={handleConfirmDeleteCommentReply}
        onCancel={() => setDeleteCommentReplyTarget(null)}
      />

      {/* 通用提示弹窗（替代 alert，H5/PC 通用） */}
      <ConfirmModal
        open={tipOpen}
        title="提示"
        message={tipMessage}
        confirmText="确定"
        onConfirm={() => setTipOpen(false)}
      />
    </div>
  );
};

export default ForumDetail;
