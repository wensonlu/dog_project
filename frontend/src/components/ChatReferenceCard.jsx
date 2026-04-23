// frontend/src/components/ChatReferenceCard.jsx

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function ChatReferenceCard({ type, item }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (type === 'article') {
      navigate(`/wiki/article/${item.slug}`);
    } else if (type === 'dog') {
      navigate(`/pet/${item.id}`);
    } else if (type === 'story') {
      navigate(`/stories/${item.id}`);
    }
  };

  const icons = {
    article: '📄',
    dog: '🐕',
    story: '✨'
  };

  const labels = {
    article: '推荐文章',
    dog: '相似宠物',
    story: '成功案例'
  };

  return (
    <motion.button
      onClick={handleClick}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4 }}
      className="block w-full text-left px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-xs mb-2"
    >
      <div className="flex items-start gap-2">
        <span className="text-lg">{icons[type]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">{labels[type]}</p>
          <p className="font-medium text-gray-900 dark:text-white line-clamp-1 text-sm">
            {item.title || item.name || ''}
          </p>
          {type === 'dog' && item.breed && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{item.breed}</p>
          )}
        </div>
      </div>
    </motion.button>
  );
}
