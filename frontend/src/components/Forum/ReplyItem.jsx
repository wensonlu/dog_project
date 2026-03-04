import React, { useState } from 'react';
import { formatTime } from '../../data/mockForum';

const ReplyItem = ({ reply, onLike, onReply }) => {
  const [isLiked, setIsLiked] = useState(reply.isLiked || false);
  const [likeCount, setLikeCount] = useState(reply.likes || 0);

  const handleLike = (e) => {
    e.stopPropagation();
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
    if (onLike) onLike(reply.id, newLiked);
  };

  const handleReply = () => {
    if (onReply) onReply(reply);
  };

  return (
    <div className="flex gap-2">
      {/* 头像 */}
      <div className="flex-shrink-0 size-8 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
        <img
          src={reply.author.avatar}
          alt={reply.author.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* 内容 */}
      <div className="flex-1">
        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-2.5 mb-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#1b120e] dark:text-white">
              {reply.author.name}
            </span>
            <span className="text-xs text-warm-beige">{formatTime(reply.createdAt)}</span>
          </div>
          <p className="text-xs text-[#1b120e] dark:text-zinc-300 leading-relaxed">
            {reply.content}
          </p>
        </div>

        {/* 操作按钮 - 心形点赞 */}
        <div className="flex items-center gap-3 ml-1">
          <button
            type="button"
            onClick={handleLike}
            className="flex items-center gap-1 text-warm-beige hover:text-primary transition-colors"
          >
            <span className={`material-symbols-outlined text-sm ${isLiked ? 'fill text-red-500' : ''}`}>
              {isLiked ? 'favorite' : 'favorite_border'}
            </span>
            <span className="text-xs">{likeCount}</span>
          </button>
          <button
            onClick={handleReply}
            className="text-xs text-warm-beige hover:text-primary transition-colors"
          >
            回复
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReplyItem;
