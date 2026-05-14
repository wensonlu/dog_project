// frontend/src/components/ChatMessage.jsx

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const MotionDiv = motion.div;

export default function ChatMessage({ message, isUser }) {
  const navigate = useNavigate();
  const topicLinks = message.referenced_topics || [];

  const handleTopicClick = (topicId) => {
    navigate(`/forum/${topicId}`);
  };

  return (
    <MotionDiv
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
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="chat-markdown break-words">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0 leading-6">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li>{children}</li>,
                h1: ({ children }) => <h1 className="text-base font-semibold mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-[15px] font-semibold mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold mb-2">{children}</h3>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                code: ({ inline, children }) => (
                  inline ? (
                    <code className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-[12px]">{children}</code>
                  ) : (
                    <pre className="mb-2 p-2 rounded bg-gray-200 dark:bg-gray-700 overflow-x-auto">
                      <code className="text-[12px]">{children}</code>
                    </pre>
                  )
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 dark:text-blue-400 underline"
                  >
                    {children}
                  </a>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-gray-300 dark:border-gray-600 pl-3 italic mb-2">
                    {children}
                  </blockquote>
                )
              }}
            >
              {message.content || ''}
            </ReactMarkdown>
          </div>
        )}
        {!isUser && topicLinks.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">相关帖子</p>
            <div className="space-y-1">
              {topicLinks.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => handleTopicClick(topic.id)}
                  className="block w-full text-left text-xs text-blue-600 dark:text-blue-400 hover:underline truncate"
                  title={topic.title}
                >
                  {topic.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </MotionDiv>
  );
}
