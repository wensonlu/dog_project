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
          <div className="mb-1">
            <span className="text-xs font-bold text-[#1b120e] dark:text-white">
              {reply.author.name}
            </span>
          </div>
          <p className="text-xs text-[#1b120e] dark:text-zinc-300 leading-relaxed">
            {reply.content}
          </p>
        </div>

        {/* 内容下一行：时间 城市 回复；小字灰色 */}
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 ml-1">
          <div className="flex items-center gap-3">
            <span>{formatTime(reply.createdAt)}{reply.locationCity ? ` ${reply.locationCity}` : ''}</span>
            <button
              type="button"
              onClick={handleReply}
              className="hover:text-primary transition-colors"
            >
              回复
            </button>
          </div>
          <button
            type="button"
            onClick={handleLike}
            className="flex items-center gap-0.5 hover:text-primary transition-colors"
          >
            <span className={`material-symbols-outlined text-sm ${isLiked ? 'fill text-red-500' : ''}`}>
              {isLiked ? 'favorite' : 'favorite_border'}
            </span>
            <span>{likeCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReplyItem;
