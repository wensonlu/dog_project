// frontend/src/components/ChatMessage.jsx

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function ChatMessage({ message, isUser }) {
  const [displayText, setDisplayText] = useState('');
  const [isAnimating, setIsAnimating] = useState(!isUser);

  // 流式打字动画（仅用于助手消息）
  useEffect(() => {
    if (!isAnimating) {
      setDisplayText(message.content);
      return;
    }

    let index = 0;
    const interval = setInterval(() => {
      if (index < message.content.length) {
        setDisplayText(message.content.slice(0, index + 2));
        index += 2;
      } else {
        setIsAnimating(false);
        clearInterval(interval);
      }
    }, 10);

    return () => clearInterval(interval);
  }, [message.content, isAnimating]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
          isUser
            ? 'bg-rose-500 text-white rounded-br-none'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{displayText}</p>
      </div>
    </motion.div>
  );
}
