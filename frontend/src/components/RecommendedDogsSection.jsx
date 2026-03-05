import { useNavigate } from 'react-router-dom';

export default function RecommendedDogsSection({ recommendations }) {
  const navigate = useNavigate();

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 p-5 bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 dark:from-rose-900/20 dark:via-pink-900/20 dark:to-orange-900/20 rounded-2xl backdrop-blur"
    >
      {/* 头部标题 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-lg text-white">favorite</span>
          </div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            为您推荐
          </h2>
        </div>
        <span className="text-xs font-medium text-rose-500 bg-rose-100 dark:bg-rose-900/30 px-3 py-1 rounded-full">
          {recommendations.length}只匹配
        </span>
      </div>

      {/* 横向滚动卡片 */}
      <div className="flex gap-3 overflow-x-auto pb-3 -mx-5 px-5 snap-x snap-mandatory scroll-smooth scrollbar-hide touch-pan-x">
        {recommendations.map((dog, index) => (
          <motion.div
            key={dog.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/pet/${dog.id}`)}
            className="flex-shrink-0 w-[280px] sm:w-64 snap-start bg-white dark:bg-zinc-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow cursor-pointer"
          >
            {/* 宠物图片 */}
            <div className="relative h-40 bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800">
              {dog.photos && dog.photos.length > 0 ? (
                <img
                  src={dog.photos[0]}
                  alt={dog.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-zinc-400">pets</span>
                </div>
              )}

              {/* 匹配度徽章 */}
              <div className="absolute top-3 right-3 px-3 py-1.5 bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-full shadow-lg flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">verified</span>
                <span className="text-xs font-bold">{dog.matchPercentage || dog.matchScore}%</span>
              </div>
            </div>

            {/* 宠物信息 */}
            <div className="p-4">
              <h3 className="text-base font-bold text-gray-800 dark:text-white mb-1">
                {dog.name}
              </h3>

              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">pets</span>
                  {dog.breed}
                </span>
                <span>•</span>
                <span>{dog.age}岁</span>
                <span>•</span>
                <span>{dog.gender === 'male' ? '♂ 公' : '♀ 母'}</span>
              </div>

              {/* 匹配原因标签 */}
              {dog.matchReasons && dog.matchReasons.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {dog.matchReasons.slice(0, 3).map((reason, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/30 dark:to-cyan-900/30 text-teal-700 dark:text-teal-300 rounded-lg text-[10px] font-medium border border-teal-200 dark:border-teal-700"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* 提示文本 */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4 text-xs text-center text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-sm">info</span>
        <span>点击卡片查看详情 • 推荐基于您的生活方式偏好</span>
      </motion.p>
    </motion.div>
  );
}
