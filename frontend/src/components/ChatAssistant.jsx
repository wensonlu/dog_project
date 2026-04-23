// frontend/src/components/ChatAssistant.jsx

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useChatSession } from '../hooks/useChatSession';
import { useChat } from '../hooks/useChat';
import ChatMessage from './ChatMessage';
import ChatReferenceCard from './ChatReferenceCard';
import '../styles/ChatAssistant.css';

const MAX_MESSAGE_LENGTH = 500;

export default function ChatAssistant() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const messagesEndRef = useRef(null);

  const { sessionId, loading: sessionLoading } = useChatSession();
  const { messages, loading: chatLoading, error: chatError, sendMessage } = useChat(sessionId);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputValue(text);

    // 检查消息长度
    if (text.trim().length > MAX_MESSAGE_LENGTH) {
      setInputError(`消息过长（最多${MAX_MESSAGE_LENGTH}字）`);
    } else {
      setInputError('');
    }
  };

  const handleSendMessage = async () => {
    const trimmedInput = inputValue.trim();

    if (!trimmedInput || !sessionId || chatLoading) return;

    // 再次验证长度
    if (trimmedInput.length > MAX_MESSAGE_LENGTH) {
      setInputError(`消息过长（最多${MAX_MESSAGE_LENGTH}字）`);
      return;
    }

    setInputError('');
    await sendMessage(trimmedInput);
    setInputValue('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isInitialized = sessionId && !sessionLoading;
  const unreadCount = messages.filter(m => m.role === 'assistant').length;

  return (
    <>
      {/* 浮窗按钮 */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="chat-bubble-btn"
            onClick={() => setIsOpen(true)}
            disabled={!isInitialized}
            title={isInitialized ? '打开聊天助手' : '加载中...'}
          >
            🐕
            {unreadCount > 0 && (
              <div className="chat-bubble-badge">{unreadCount > 9 ? '9+' : unreadCount}</div>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* 聊天窗口 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="chat-window"
          >
            {/* 头部 */}
            <div className="chat-header">
              <div className="chat-header-title">
                <span>🐕 宠物小助手</span>
              </div>
              <div className="chat-header-actions">
                <button
                  className="chat-header-btn"
                  onClick={() => setIsOpen(false)}
                  title="最小化"
                >
                  ⎕
                </button>
                <button
                  className="chat-header-btn"
                  onClick={() => setIsOpen(false)}
                  title="关闭"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 消息区域 */}
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="chat-welcome">
                  <div className="chat-welcome-icon">🐾</div>
                  <div className="chat-welcome-text">欢迎！我可以帮你回答：</div>
                  <ul className="chat-welcome-examples">
                    <li>• 宠物品种和特征</li>
                    <li>• 养护知识和健康问题</li>
                    <li>• 领养流程指导</li>
                  </ul>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id || msg.created_at}>
                    <ChatMessage
                      message={msg}
                      isUser={msg.role === 'user'}
                    />
                    {msg.role === 'assistant' && (
                      <div className="px-2 mb-3 space-y-1">
                        {msg.referenced_articles && msg.referenced_articles.length > 0 && (
                          msg.referenced_articles.map((article) => (
                            <ChatReferenceCard
                              key={`article-${article.id}`}
                              type="article"
                              item={article}
                            />
                          ))
                        )}
                        {msg.referenced_dogs && msg.referenced_dogs.length > 0 && (
                          msg.referenced_dogs.map((dog) => (
                            <ChatReferenceCard
                              key={`dog-${dog.id}`}
                              type="dog"
                              item={dog}
                            />
                          ))
                        )}
                        {msg.referenced_stories && msg.referenced_stories.length > 0 && (
                          msg.referenced_stories.map((story) => (
                            <ChatReferenceCard
                              key={`story-${story.id}`}
                              type="story"
                              item={story}
                            />
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
              {chatError && (
                <div className="text-red-600 text-sm p-2 bg-red-50 rounded">
                  错误：{chatError}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 登录提示 */}
            {!user?.id && messages.length > 0 && (
              <div className="chat-login-hint">
                🔓 登录后可保存对话
              </div>
            )}

            {/* 输入区域 */}
            <div className="chat-input-area">
              <textarea
                className="chat-input"
                placeholder="问我任何宠物相关的问题..."
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                disabled={!isInitialized || chatLoading}
                rows="1"
                maxLength={MAX_MESSAGE_LENGTH}
              />
              {inputError && (
                <div className="text-red-600 text-xs p-1 mt-1">
                  {inputError}
                </div>
              )}
              <button
                className="chat-send-btn"
                onClick={handleSendMessage}
                disabled={!isInitialized || !inputValue.trim() || chatLoading || inputError}
                title={chatLoading ? '回答中...' : (inputError ? inputError : '发送')}
              >
                {chatLoading ? '...' : '→'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
