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
const MotionButton = motion.button;
const MotionDiv = motion.div;
const PROMPT_EXAMPLES = [
  '帮我总结这个帖子，并提炼3条关键观点',
  '帮我找论坛里和“新手领养金毛”最相关的帖子',
  '基于当前帖子，帮我草拟一条礼貌且有信息量的回复',
  '我想发“第一次领养”的帖子，先帮我生成标题和正文',
  '发布前帮我检查有没有重复话题，并给我优化建议'
];

export default function ChatAssistant() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const messagesEndRef = useRef(null);

  const { sessionId, loading: sessionLoading } = useChatSession();
  const {
    messages,
    loading: chatLoading,
    error: chatError,
    sendMessage,
    regenerateLastReply,
    stopGeneration
  } = useChat(sessionId);

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

  const handleUsePromptExample = (text) => {
    setInputValue(text);
    setInputError('');
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
          <MotionButton
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
          </MotionButton>
        )}
      </AnimatePresence>

      {/* 聊天窗口 */}
      <AnimatePresence>
        {isOpen && (
          <>
            <MotionDiv
              className="chat-sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            <MotionDiv
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 80 }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              className="chat-window"
            >
              <div className="chat-sheet-handle-wrap">
                <div className="chat-sheet-handle" />
              </div>

              {/* 头部 */}
              <div className="chat-header">
                <div className="chat-header-title">
                  <span>🐕 宠物小助手</span>
                </div>
                <button
                  className="chat-header-btn"
                  onClick={() => setIsOpen(false)}
                  title="关闭"
                >
                  ✕
                </button>
              </div>

              {/* 消息区域 */}
              <div className="chat-messages">
                {messages.length === 0 ? (
                <div className="chat-welcome">
                  <div className="chat-welcome-icon">🐾</div>
                  <div className="chat-welcome-text">欢迎！你可以这样用我：</div>
                  <ul className="chat-welcome-examples">
                    <li>• 论坛内容总结：长帖提炼、争议点梳理、结论归纳</li>
                    <li>• 论坛检索推荐：按主题找相关帖子，减少重复提问</li>
                    <li>• 回复草拟优化：生成礼貌、清晰、有信息量的回复</li>
                    <li>• 发帖辅助：生成标题/正文，并提示相似话题</li>
                  </ul>
                  <div className="chat-prompt-title">试试这样提问：</div>
                  <div className="chat-prompt-grid">
                    {PROMPT_EXAMPLES.map((example) => (
                      <button
                        key={example}
                        type="button"
                        className="chat-prompt-chip"
                        onClick={() => handleUsePromptExample(example)}
                      >
                        {example}
                      </button>
                    ))}
                  </div>
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
                <button
                  className="chat-regenerate-btn"
                  onClick={regenerateLastReply}
                  disabled={!isInitialized || chatLoading || messages.filter(m => m.role === 'user').length === 0}
                  title="重新生成上一条回复"
                >
                  重试
                </button>
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
                  onClick={chatLoading ? stopGeneration : handleSendMessage}
                  disabled={!isInitialized || (!!inputError) || (!chatLoading && !inputValue.trim())}
                  title={chatLoading ? '停止生成' : (inputError ? inputError : '发送')}
                >
                  {chatLoading ? '■' : '→'}
                </button>
              </div>
            </MotionDiv>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
