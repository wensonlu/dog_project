import React from 'react';
import { useNavigate } from 'react-router-dom';

const TopicCard = ({ topic, onBeforeNavigate }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    onBeforeNavigate?.();
    navigate(`/forum/${topic.id}`);
  };

  const aspectRatios = [
    'aspect-[2/3]',
    'aspect-[3/4]',
    'aspect-[1/1]',
    'aspect-[4/3]',
    'aspect-[3/5]'
  ];
  const aspectRatio = aspectRatios[topic.id % aspectRatios.length];

  return (
    <div
      onClick={handleClick}
      className="bg-white dark:bg-zinc-800 rounded-2xl overflow-hidden shadow-md hover:shadow-lg cursor-pointer transition-all duration-300 active:scale-[0.98] w-full"
    >
      {topic.images && topic.images.length > 0 ? (
        <>
          {/* 有图卡片：主图 + 仅角标，图下方信息区 */}
          <div className={`relative bg-zinc-200 dark:bg-zinc-700 ${aspectRatio}`}>
            <img
              src={topic.images[0]}
              alt={topic.title}
              className="w-full h-full object-cover"
            />
            {topic.images.length > 1 && (
              <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg flex items-center gap-1 z-10">
                <span className="material-symbols-outlined text-white text-sm">photo_library</span>
                <span className="text-white text-xs font-medium">{topic.images.length}</span>
              </div>
            )}
            <div className="absolute top-2 left-2 z-10">
              <span className="px-2 py-1 bg-white/90 dark:bg-black/70 backdrop-blur-sm text-primary text-xs font-bold rounded-lg">
                {topic.category}
              </span>
            </div>
          </div>
          {/* 图下方信息区：标题 + 作者 + 点赞 */}
          <div className="p-3">
            <h3 className="text-sm font-bold text-[#1b120e] dark:text-white line-clamp-2 leading-tight mb-2">
              {topic.title}
            </h3>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="size-6 rounded-full bg-zinc-200 dark:bg-zinc-600 overflow-hidden flex-shrink-0">
                  <img
                    src={topic.author?.avatar}
                    alt={topic.author?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xs text-warm-beige dark:text-zinc-400 truncate">
                  {topic.author?.name ?? '匿名'}
                </span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className={`material-symbols-outlined text-sm ${topic.isLiked ? 'fill text-red-500' : 'text-warm-beige dark:text-zinc-400'}`}>
                  {topic.isLiked ? 'favorite' : 'favorite_border'}
                </span>
                <span className="text-xs font-medium text-warm-beige dark:text-zinc-400">{topic.likes ?? 0}</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* 无图卡片：浅色底、引号装饰、标题+摘要、作者+点赞 */
        <div className="p-4 min-h-[120px] flex flex-col">
          <div className="relative flex-1">
            <span className="absolute left-0 top-0 text-4xl font-serif text-primary/30 dark:text-primary/20 leading-none">"</span>
            <h3 className="text-sm font-bold text-[#1b120e] dark:text-white line-clamp-2 leading-tight pl-6 pr-0 mb-1">
              {topic.title}
            </h3>
            <p className="text-xs text-warm-beige dark:text-zinc-400 line-clamp-2 leading-relaxed pl-6">
              {topic.content}
            </p>
          </div>
          <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-700">
            <div className="flex items-center gap-2 min-w-0">
              <div className="size-6 rounded-full bg-zinc-200 dark:bg-zinc-600 overflow-hidden flex-shrink-0">
                <img
                  src={topic.author?.avatar}
                  alt={topic.author?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xs text-warm-beige dark:text-zinc-400 truncate">
                {topic.author?.name ?? '匿名'}
              </span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className={`material-symbols-outlined text-sm ${topic.isLiked ? 'fill text-red-500' : 'text-warm-beige dark:text-zinc-400'}`}>
                {topic.isLiked ? 'favorite' : 'favorite_border'}
              </span>
              <span className="text-xs font-medium text-warm-beige dark:text-zinc-400">{topic.likes ?? 0}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicCard;
