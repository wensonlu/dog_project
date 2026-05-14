// frontend/src/components/ChatAssistant.jsx

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChatSession } from '../hooks/useChatSession';
import { useChat } from '../hooks/useChat';
import { useTask } from '../context/TaskContext';
import { FORUM_API } from '../config/api';
import ChatMessage from './ChatMessage';
import ChatReferenceCard from './ChatReferenceCard';
import '../styles/ChatAssistant.css';

const MAX_MESSAGE_LENGTH = 500;
const MotionButton = motion.button;
const MotionDiv = motion.div;
const TASK_STEPS = [
  '解析目标帖子',
  '进入帖子详情',
  '点赞帖子',
  '评论内容',
  '结果校验'
];
const PROMPT_EXAMPLES = [
  '帮我总结这个帖子，并提炼3条关键观点',
  '帮我找论坛里和“新手领养金毛”最相关的帖子',
  '基于当前帖子，帮我草拟一条礼貌且有信息量的回复',
  '我想发“第一次领养”的帖子，先帮我生成标题和正文',
  '发布前帮我检查有没有重复话题，并给我优化建议'
];

export default function ChatAssistant() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const {
    taskHudVisible,
    setTaskHudVisible,
    taskTitle,
    setTaskTitle,
    taskStatusText,
    setTaskStatusText,
    taskRunning,
    setTaskRunning,
    taskFailed,
    setTaskFailed,
    taskContext,
    setTaskContext,
    taskStepStates,
    setTaskStepStates,
  } = useTask();
  const messagesEndRef = useRef(null);
  const cancelTaskRef = useRef(false);

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
    const match = trimmedInput.match(/帮我给第([一二三四五六七八九十\\d]+)个帖子点赞评论(.+)/);
    if (match) {
      if (!user?.id) {
        setInputError('执行互动任务前请先登录');
        return;
      }
      const indexRaw = match[1];
      const commentText = match[2]?.trim();
      const indexMap = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
      const targetIndex = Number(indexRaw) || indexMap[indexRaw] || 1;
      setInputValue('');
      await executeForumTask(targetIndex, commentText);
      return;
    }

    await sendMessage(trimmedInput);
    setInputValue('');
  };

  const setStepStatus = (stepIndex, status) => {
    setTaskStepStates((prev) => prev.map((item, idx) => (idx === stepIndex ? status : item)));
  };

  const executeForumTask = async (targetIndex, commentText) => {
    try {
      cancelTaskRef.current = false;
      setTaskFailed(false);
      setTaskRunning(true);
      setTaskHudVisible(true);
      setIsOpen(false);
      setTaskTitle('执行论坛互动');
      setTaskStepStates(TASK_STEPS.map(() => 'pending'));

      // step 1: resolve target
      setTaskStatusText(`1/5 正在解析第${targetIndex}个帖子...`);
      setStepStatus(0, 'running');
      const listResp = await fetch(`${FORUM_API.LIST}?format=mcp&limit=${Math.max(targetIndex, 10)}&cursor=0&userId=${user.id}`);
      const listData = await listResp.json();
      const items = listData.items || [];
      const target = items[targetIndex - 1];
      if (!target) throw new Error(`未找到第${targetIndex}个帖子`);
      setStepStatus(0, 'ok');

      if (cancelTaskRef.current) throw new Error('任务已取消');

      // step 2: navigate
      setTaskStatusText('2/5 正在进入帖子详情...');
      setStepStatus(1, 'running');
      navigate(`/forum/${target.id}`);
      setTaskContext({ topicId: target.id, commentText, targetIndex });
      await new Promise((resolve) => setTimeout(resolve, 350));
      setStepStatus(1, 'ok');

      if (cancelTaskRef.current) throw new Error('任务已取消');

      // step 3: like
      setTaskStatusText('3/5 正在点赞帖子...');
      setStepStatus(2, 'running');
      const likeResp = await fetch(`${FORUM_API.LIST}/${target.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      if (!likeResp.ok) throw new Error('点赞失败');
      setStepStatus(2, 'ok');

      if (cancelTaskRef.current) throw new Error('任务已取消');

      // step 4: reply via confirm flow
      setTaskStatusText(`4/5 正在评论“${commentText}”...`);
      setStepStatus(3, 'running');
      const precheckResp = await fetch(FORUM_API.PRECHECK_REPLY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId: target.id, content: commentText, userId: user.id })
      });
      const precheckData = await precheckResp.json();
      if (!precheckResp.ok) throw new Error(precheckData.error || '评论预检查失败');

      const confirmResp = await fetch(FORUM_API.CONFIRM_REPLY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmToken: precheckData.confirmToken, userId: user.id })
      });
      const confirmData = await confirmResp.json();
      if (!confirmResp.ok || !confirmData.ok) throw new Error(confirmData.error || '评论确认失败');
      setStepStatus(3, 'ok');

      if (cancelTaskRef.current) throw new Error('任务已取消');

      // step 5: verify by reloading detail
      setTaskStatusText('5/5 正在校验结果...');
      setStepStatus(4, 'running');
      const verifyResp = await fetch(FORUM_API.VERIFY_INTERACTION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: target.id,
          userId: user.id,
          commentContains: commentText
        })
      });
      const verifyData = await verifyResp.json();
      if (!verifyResp.ok || !verifyData.pass) {
        throw new Error(verifyData.error || '校验失败：未检测到点赞或评论结果');
      }
      setStepStatus(4, 'ok');
      setTaskStatusText(`已完成：已为第${targetIndex}个帖子点赞并评论“${commentText}”`);
      setTaskRunning(false);
      setTaskFailed(false);
    } catch (error) {
      const isCancelled = String(error.message || '').includes('已取消');
      setTaskRunning(false);
      if (isCancelled) {
        setTaskStatusText('任务已取消');
      } else {
        setTaskFailed(true);
        setTaskStatusText(`执行失败：${error.message || '未知错误'}`);
      }
    }
  };

  const handleCancelTask = () => {
    cancelTaskRef.current = true;
    setTaskRunning(false);
  };

  const retryFailedTask = async () => {
    if (!taskContext) return;
    await executeForumTask(taskContext.targetIndex || 1, taskContext.commentText);
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

      <AnimatePresence>
        {taskHudVisible && (
          <MotionDiv
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.22 }}
            className="chat-task-hud"
          >
            <div className="chat-task-hud-title">{taskTitle}</div>
            <div className="chat-task-hud-status">{taskStatusText || '准备中...'}</div>
            <div className="chat-task-step-list">
              {TASK_STEPS.map((step, index) => (
                <div key={step} className={`chat-task-step chat-task-step-${taskStepStates[index]}`}>
                  <span className="chat-task-step-dot" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
            <div className="chat-task-hud-actions">
              {taskRunning ? (
                <button type="button" className="chat-task-btn" onClick={handleCancelTask}>取消任务</button>
              ) : taskFailed ? (
                <>
                  <button type="button" className="chat-task-btn chat-task-btn-primary" onClick={retryFailedTask}>重试任务</button>
                  <button type="button" className="chat-task-btn" onClick={() => setTaskHudVisible(false)}>关闭</button>
                </>
              ) : (
                <>
                  <button type="button" className="chat-task-btn chat-task-btn-primary" onClick={() => setTaskHudVisible(false)}>完成</button>
                  <button type="button" className="chat-task-btn" onClick={() => setIsOpen(true)}>打开助手</button>
                </>
              )}
            </div>
          </MotionDiv>
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
