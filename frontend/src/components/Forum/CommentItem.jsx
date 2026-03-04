import React, { useState } from 'react';
import { formatTime } from '../../data/mockForum';
import ReplyItem from './ReplyItem';

const CommentItem = ({ comment, replies = [], onReply, onLike, onReplyLike }) => {
  const [showReplies, setShowReplies] = useState(false);
  const [isLiked, setIsLiked] = useState(comment.isLiked || false);
  const [likeCount, setLikeCount] = useState(comment.likes || 0);

  const handleLike = (e) => {
    e.stopPropagation();
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
    if (onLike) onLike(comment.id, newLiked);
  };

  const handleReply = () => {
    if (onReply) onReply(comment);
  };

  return (
    <div className="mb-4">
      <div className="flex gap-3">
        {/* 头像 */}
        <div className="flex-shrink-0 size-10 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
          <img
            src={comment.author.avatar}
            alt={comment.author.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* 内容 */}
        <div className="flex-1">
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-3 mb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-[#1b120e] dark:text-white">
                {comment.author.name}
              </span>
              <span className="text-xs text-warm-beige">{formatTime(comment.createdAt)}</span>
            </div>
            <p className="text-sm text-[#1b120e] dark:text-zinc-300 leading-relaxed">
              {comment.content}
            </p>
          </div>

          {/* 操作按钮 - 小红书风格：心形点赞 + 回复 */}
          <div className="flex items-center gap-4 ml-2">
            <button
              type="button"
              onClick={handleLike}
              className="flex items-center gap-1 text-warm-beige hover:text-primary transition-colors"
            >
              <span className={`material-symbols-outlined text-base ${isLiked ? 'fill text-red-500' : ''}`}>
                {isLiked ? 'favorite' : 'favorite_border'}
              </span>
              <span className="text-xs font-medium">{likeCount}</span>
            </button>
            <button
              type="button"
              onClick={handleReply}
              className="flex items-center gap-1 text-warm-beige hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-base">reply</span>
              <span className="text-xs font-medium">回复</span>
            </button>
          </div>

          {/* 回复列表 */}
          {replies.length > 0 && (
            <div className="mt-2">
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-xs text-primary font-medium mb-2 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">
                  {showReplies ? 'expand_less' : 'expand_more'}
                </span>
                {replies.length} 条回复
              </button>
              {showReplies && (
                <div className="ml-4 border-l-2 border-zinc-200 dark:border-zinc-700 pl-3 space-y-2">
                  {replies.map(reply => (
                    <ReplyItem
                      key={reply.id}
                      reply={reply}
                      onLike={onReplyLike}
                      onReply={onReply}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
