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
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-3 mb-1">
            <div className="mb-1">
              <span className="text-sm font-bold text-[#1b120e] dark:text-white">
                {comment.author.name}
              </span>
            </div>
            <p className="text-sm text-[#1b120e] dark:text-zinc-300 leading-relaxed">
              {comment.content}
            </p>
          </div>

          {/* 第二行：左 时间 城市 回复，右 心形+点赞数+不喜欢；小字灰色 */}
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 ml-2">
            <div className="flex items-center gap-3">
              <span>{formatTime(comment.createdAt)}{comment.locationCity ? ` ${comment.locationCity}` : ''}</span>
              <button type="button" onClick={handleReply} className="hover:text-primary transition-colors">
                回复
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLike}
                className="flex items-center gap-0.5 hover:text-primary transition-colors"
              >
                <span className={`material-symbols-outlined text-base ${isLiked ? 'fill text-red-500' : ''}`}>
                  {isLiked ? 'favorite' : 'favorite_border'}
                </span>
                <span>{likeCount}</span>
              </button>
              <button type="button" className="flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                <span className="material-symbols-outlined text-base">thumb_down</span>
              </button>
            </div>
          </div>

          {/* 回复列表 - 默认只展示第一条回复，折叠文案为「展开 xx 条回复」 */}
          {replies.length > 0 && (
            <div className="mt-2">
              {/* 第一条回复始终展示 */}
              <div className="ml-4 border-l-2 border-zinc-200 dark:border-zinc-700 pl-3 space-y-2">
                <ReplyItem
                  key={replies[0].id}
                  reply={replies[0]}
                  onLike={onReplyLike}
                  onReply={onReply}
                />
              </div>
              {replies.length > 1 && (
                <>
                  <button
                    onClick={() => setShowReplies(!showReplies)}
                    className="text-xs text-primary font-medium mt-2 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {showReplies ? 'expand_less' : 'expand_more'}
                    </span>
                    {showReplies ? '收起' : `展开${replies.length - 1}条回复`}
                  </button>
                  {showReplies && (
                    <div className="ml-4 border-l-2 border-zinc-200 dark:border-zinc-700 pl-3 space-y-2 mt-2">
                      {replies.slice(1).map(reply => (
                        <ReplyItem
                          key={reply.id}
                          reply={reply}
                          onLike={onReplyLike}
                          onReply={onReply}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
