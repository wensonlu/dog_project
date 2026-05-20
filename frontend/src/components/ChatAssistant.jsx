// frontend/src/components/ChatAssistant.jsx

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChatSession } from '../hooks/useChatSession';
import { useChat } from '../hooks/useChat';
import { useTask } from '../context/TaskContext';
import { FORUM_API, SHOP_API } from '../config/api';
import ChatMessage from './ChatMessage';
import ChatReferenceCard from './ChatReferenceCard';
import '../styles/ChatAssistant.css';

const MAX_MESSAGE_LENGTH = 500;
const MotionButton = motion.button;
const MotionDiv = motion.div;
const FORUM_TASK_STEPS = [
  '解析目标帖子',
  '进入帖子详情',
  '点赞帖子',
  '评论内容',
  '关注作者',
  '结果校验'
];
const SHOP_TASK_STEPS = [
  '解析购买需求',
  '进入商城页面',
  '选择目标商品',
  '进入订单页',
  '结果校验'
];
const TOPIC_AI_STEPS = [
  '定位目标帖子',
  '读取帖子上下文',
  '生成AI结果'
];
const FORUM_SEARCH_STEPS = [
  '解析检索意图',
  '检索论坛帖子',
  '整理结果输出'
];
const PROMPT_EXAMPLES = [
  '帮我给第4个帖子点赞并评论：支持你，写得很好，再关注作者',
  '帮我买一份主粮并下单',
  '帮我浏览论坛里关于“新手养狗”的热门帖子',
  '帮我给第一个帖子点赞',
  '帮我给当前帖子评论：谢谢分享，内容很有帮助',
  '帮我提醒我在帖子详情里点收藏',
  '帮我总结这个帖子，并提炼3条关键观点',
  '帮我找论坛里和“新手领养金毛”最相关的帖子',
  '基于当前帖子，帮我草拟一条礼貌且有信息量的回复'
];

export default function ChatAssistant() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const [currentTaskSteps, setCurrentTaskSteps] = useState(FORUM_TASK_STEPS);
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
    stopGeneration,
    setMessages
  } = useChat(sessionId);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isOpen) {
      setKeyboardOffset(0);
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const vv = window.visualViewport;
    if (!vv) {
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }

    const updateKeyboardOffset = () => {
      const viewportHeight = vv.height || window.innerHeight;
      const rawOffset = window.innerHeight - viewportHeight - (vv.offsetTop || 0);
      setKeyboardOffset(Math.max(0, Math.round(rawOffset)));
    };

    updateKeyboardOffset();
    vv.addEventListener('resize', updateKeyboardOffset);
    vv.addEventListener('scroll', updateKeyboardOffset);

    return () => {
      vv.removeEventListener('resize', updateKeyboardOffset);
      vv.removeEventListener('scroll', updateKeyboardOffset);
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [isOpen]);

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
    const forumSearchCommand = parseForumSearchCommand(trimmedInput);
    if (forumSearchCommand) {
      setInputValue('');
      await executeForumSearchTask(forumSearchCommand);
      return;
    }

    const topicAiCommand = parseTopicAiCommand(trimmedInput);
    if (topicAiCommand) {
      setInputValue('');
      await executeTopicAiTask(topicAiCommand);
      return;
    }

    const shopCommand = parseShopCommand(trimmedInput);
    if (shopCommand) {
      if (!user?.id) {
        setInputError('执行商城下单前请先登录');
        return;
      }
      setInputValue('');
      await executeShopTask(shopCommand);
      return;
    }

    const command = parseForumCommand(trimmedInput);
    if (command) {
      if (!user?.id) {
        setInputError('执行互动任务前请先登录');
        return;
      }
      setInputValue('');
      await executeForumTask(command);
      return;
    }

    await sendMessage(trimmedInput);
    setInputValue('');
  };

  const parseShopCommand = (text) => {
    const normalized = String(text || '').trim();
    if (!/(下单|购买|买)/.test(normalized)) return null;

    const catalog = [
      { id: 'food-001', keywords: ['主粮', '狗粮', '低敏主粮', '幼犬粮'] },
      { id: 'snack-001', keywords: ['零食', '冻干', '鸡胸肉'] },
      { id: 'clean-001', keywords: ['清洁', '洗护', '抑菌', '除味'] },
      { id: 'travel-001', keywords: ['出行', '牵引', '胸背', '背包'] },
      { id: 'health-001', keywords: ['健康', '关节', '益生菌', '鱼油'] }
    ];

    const matched = catalog.find((item) => item.keywords.some((kw) => normalized.includes(kw)));
    return {
      productId: matched?.id || 'food-001',
      quantity: 1
    };
  };

  const parseForumCommand = (text) => {
    const normalized = String(text || '').trim();
    const hasLikeIntent = /点赞/.test(normalized);
    if (!hasLikeIntent) return null;

    const followAuthor = /关注作者/.test(normalized);
    const targetMatch = normalized.match(/第([一二三四五六七八九十\d]+)个帖子/);
    const indexRaw = targetMatch?.[1];
    const indexMap = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
    const targetIndex = indexRaw ? (Number(indexRaw) || indexMap[indexRaw] || 1) : null;

    const currentTopicMatch = window.location.pathname.match(/^\/forum\/([^/]+)$/);
    const currentTopicId = currentTopicMatch?.[1] || null;
    const useCurrentTopic = /这个帖子|当前帖子/.test(normalized);
    const useLastTopic = /刚才那个帖子|上一个帖子/.test(normalized);
    const lastTopicId = taskContext?.topicId || null;

    let targetTopicId = null;
    let targetLabel = '';
    if (targetIndex) {
      targetLabel = `第${targetIndex}个帖子`;
    } else if (useCurrentTopic && currentTopicId) {
      targetTopicId = currentTopicId;
      targetLabel = '当前帖子';
    } else if (useLastTopic && lastTopicId) {
      targetTopicId = lastTopicId;
      targetLabel = '刚才那个帖子';
    } else {
      return null;
    }

    // 可选评论内容：评论xxx / 并评论xxx / 再评论xxx
    const commentMatch = normalized.match(/评论[：:\s]*([\s\S]+)$/);
    const commentText = commentMatch?.[1]?.trim() || '';
    return { targetIndex, targetTopicId, targetLabel, commentText, followAuthor };
  };

  const parseTopicAiCommand = (text) => {
    const normalized = String(text || '').trim();
    const askSummary = /(总结|提炼).*(3|三).*(观点|要点)/.test(normalized);
    const askDraftReply = /(草拟|起草|生成).*(回复)/.test(normalized);
    if (!askSummary && !askDraftReply) return null;

    const currentTopicMatch = window.location.pathname.match(/^\/forum\/([^/]+)$/);
    const currentTopicId = currentTopicMatch?.[1] || null;
    const useCurrentTopic = /这个帖子|当前帖子|本帖/.test(normalized);
    const useLastTopic = /刚才那个帖子|上一个帖子/.test(normalized);
    const lastTopicId = taskContext?.topicId || null;
    const targetTopicId = (useCurrentTopic && currentTopicId) ? currentTopicId : (useLastTopic ? lastTopicId : currentTopicId || lastTopicId);

    return {
      type: askSummary ? 'topic_summary' : 'topic_draft_reply',
      targetTopicId
    };
  };

  const parseForumSearchCommand = (text) => {
    const normalized = String(text || '').trim();
    const hasSearchIntent = /(找找|查找|搜索|检索|看看).*(帖子|话题)/.test(normalized);
    if (!hasSearchIntent) return null;

    let query = normalized
      .replace(/帮我|请|在论坛中|论坛里|论坛中|帖子|话题|相关的|相关|找找|查找|搜索|检索|看看/g, ' ')
      .replace(/[，。！？]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!query) query = '新手领养';
    return { type: 'forum_search', query };
  };

  const setStepStatus = (stepIndex, status) => {
    setTaskStepStates((prev) => prev.map((item, idx) => (idx === stepIndex ? status : item)));
  };

  const executeForumTask = async (command) => {
    try {
      const { targetIndex, targetTopicId, targetLabel, commentText, followAuthor } = command;
      const hasComment = !!String(commentText || '').trim();
      cancelTaskRef.current = false;
      setTaskFailed(false);
      setTaskRunning(true);
      setTaskHudVisible(true);
      setIsOpen(false);
      setCurrentTaskSteps(FORUM_TASK_STEPS);
      setTaskTitle('执行论坛互动');
      setTaskStepStates(FORUM_TASK_STEPS.map(() => 'pending'));

      // step 1: resolve target
      setTaskStatusText(`1/6 正在解析${targetLabel || '目标帖子'}...`);
      setStepStatus(0, 'running');
      let target = null;
      if (targetTopicId) {
        const topicResp = await fetch(`${FORUM_API.LIST}/${targetTopicId}?userId=${encodeURIComponent(user.id)}`);
        if (!topicResp.ok) throw new Error('未找到目标帖子');
        const topicData = await topicResp.json();
        target = topicData.topic;
      } else {
        const listResp = await fetch(`${FORUM_API.LIST}?format=mcp&limit=${Math.max(targetIndex || 1, 10)}&cursor=0&userId=${user.id}`);
        const listData = await listResp.json();
        const items = listData.items || [];
        target = items[(targetIndex || 1) - 1];
      }
      if (!target) throw new Error(`未找到${targetLabel || '目标帖子'}`);
      setStepStatus(0, 'ok');

      if (cancelTaskRef.current) throw new Error('任务已取消');

      // step 2: navigate
      setTaskStatusText('2/6 正在进入帖子详情...');
      setStepStatus(1, 'running');
      navigate(`/forum/${target.id}`);
      setTaskContext({ topicId: target.id, commentText, targetIndex: targetIndex || 1, followAuthor, command });
      await new Promise((resolve) => setTimeout(resolve, 350));
      setStepStatus(1, 'ok');

      if (cancelTaskRef.current) throw new Error('任务已取消');

      // step 3: like
      setTaskStatusText('3/6 正在点赞帖子...');
      setStepStatus(2, 'running');
      const likeResp = await fetch(`${FORUM_API.LIST}/${target.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      if (!likeResp.ok) throw new Error('点赞失败');
      setStepStatus(2, 'ok');
      setTaskContext((prev) => ({
        ...(prev || {}),
        topicId: target.id,
        targetIndex: targetIndex || 1,
        commentText,
        followAuthor,
        likeSyncedAt: Date.now()
      }));

      if (cancelTaskRef.current) throw new Error('任务已取消');

      // step 4: reply via confirm flow (optional)
      if (hasComment) {
        setTaskStatusText(`4/6 正在评论“${commentText}”...`);
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
      } else {
        setStepStatus(3, 'skipped');
      }

      if (cancelTaskRef.current) throw new Error('任务已取消');

      // step 5: follow author (optional)
      if (followAuthor) {
        setTaskStatusText('5/6 正在关注作者...');
        setStepStatus(4, 'running');
        const followResp = await fetch(`${FORUM_API.LIST}/${target.id}/follow`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
        if (!followResp.ok) throw new Error('关注作者失败');
        setStepStatus(4, 'ok');
      } else {
        setStepStatus(4, 'skipped');
      }

      if (cancelTaskRef.current) throw new Error('任务已取消');

      // step 6: verify by reloading detail
      setTaskStatusText('6/6 正在校验结果...');
      setStepStatus(5, 'running');
      const verifyResp = await fetch(FORUM_API.VERIFY_INTERACTION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: target.id,
          userId: user.id,
          commentContains: hasComment ? commentText : ''
        })
      });
      const verifyData = await verifyResp.json();
      if (!verifyResp.ok || !verifyData.pass) {
        throw new Error(verifyData.error || '校验失败：未检测到点赞或评论结果');
      }
      setStepStatus(5, 'ok');
      const doneParts = ['已点赞'];
      if (hasComment) doneParts.push(`已评论“${commentText}”`);
      if (followAuthor) doneParts.push('已关注作者');
      setTaskStatusText(`已完成：${doneParts.join('，')}`);
      setTaskContext((prev) => ({
        ...(prev || {}),
        taskType: 'forum',
        topicId: target.id,
        targetIndex: targetIndex || 1,
        commentText,
        followAuthor,
        command,
        interactionSyncedAt: Date.now()
      }));
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

  const appendAssistantMessage = (content) => {
    setMessages((prev) => ([
      ...prev,
      { id: Date.now() + Math.random(), role: 'assistant', content }
    ]));
  };

  const executeTopicAiTask = async (command) => {
    try {
      cancelTaskRef.current = false;
      setTaskFailed(false);
      setTaskRunning(true);
      setTaskHudVisible(true);
      setIsOpen(false);
      setCurrentTaskSteps(TOPIC_AI_STEPS);
      setTaskStepStates(TOPIC_AI_STEPS.map(() => 'pending'));
      setTaskTitle(command.type === 'topic_summary' ? '执行帖子观点总结' : '执行帖子回复草拟');

      setTaskStatusText('1/3 正在定位目标帖子...');
      setStepStatus(0, 'running');
      const topicId = command.targetTopicId;
      if (!topicId) {
        throw new Error('未定位到帖子，请先进入帖子详情页再执行');
      }
      setStepStatus(0, 'ok');

      if (cancelTaskRef.current) throw new Error('任务已取消');

      setTaskStatusText('2/3 正在读取帖子上下文...');
      setStepStatus(1, 'running');
      const params = new URLSearchParams();
      if (user?.id) params.append('userId', user.id);
      const topicResp = await fetch(`${FORUM_API.LIST}/${topicId}?${params.toString()}`);
      const topicData = await topicResp.json();
      if (!topicResp.ok || !topicData?.topic) {
        throw new Error(topicData?.error || '读取帖子详情失败');
      }
      setStepStatus(1, 'ok');

      if (cancelTaskRef.current) throw new Error('任务已取消');

      setTaskStatusText('3/3 正在生成AI结果...');
      setStepStatus(2, 'running');
      if (command.type === 'topic_summary') {
        const prompt = `请基于下面帖子内容，提炼3条关键观点。要求：\n1) 每条20-40字\n2) 直接用“1. 2. 3.”输出\n3) 不要输出额外解释\n\n帖子标题：${topicData.topic.title}\n帖子内容：${topicData.topic.content}`;
        await sendMessage(prompt);
      } else {
        const response = await fetch(FORUM_API.DRAFT_REPLY, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topicId,
            userIntent: '礼貌回复并补充建议',
            tone: 'friendly',
            length: 'medium',
            userId: user?.id || null
          })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || '草拟回复失败');
        }
        const replyText = data?.draft || '暂未生成草稿，请重试。';
        appendAssistantMessage(`基于当前帖子生成的礼貌回复草稿：\n\n${replyText}`);
      }

      setStepStatus(2, 'ok');
      setTaskStatusText('已完成：结果已输出到助手对话');
      setTaskContext((prev) => ({
        ...(prev || {}),
        taskType: 'topic_ai',
        topicId,
        command,
        interactionSyncedAt: Date.now()
      }));
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

  const executeForumSearchTask = async (command) => {
    try {
      cancelTaskRef.current = false;
      setTaskFailed(false);
      setTaskRunning(true);
      setTaskHudVisible(true);
      setIsOpen(false);
      setCurrentTaskSteps(FORUM_SEARCH_STEPS);
      setTaskStepStates(FORUM_SEARCH_STEPS.map(() => 'pending'));
      setTaskTitle('执行论坛智能检索');

      setTaskStatusText('1/3 正在解析检索意图...');
      setStepStatus(0, 'running');
      const query = String(command.query || '').trim();
      if (!query) throw new Error('未识别到检索关键词');
      setStepStatus(0, 'ok');

      if (cancelTaskRef.current) throw new Error('任务已取消');

      setTaskStatusText(`2/3 正在检索“${query}”相关帖子...`);
      setStepStatus(1, 'running');
      const params = new URLSearchParams({
        format: 'mcp',
        limit: '8',
        cursor: '0',
        sort: 'hot',
        query
      });
      if (user?.id) params.set('userId', user.id);
      const response = await fetch(`${FORUM_API.LIST}?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || '论坛检索失败');
      const items = Array.isArray(data?.items) ? data.items : [];
      setStepStatus(1, 'ok');

      if (cancelTaskRef.current) throw new Error('任务已取消');

      setTaskStatusText('3/3 正在整理结果输出...');
      setStepStatus(2, 'running');
      if (items.length === 0) {
        appendAssistantMessage(`未检索到“${query}”相关帖子。你可以换更具体关键词，例如：新手领养金毛、首次领养准备、领养回家注意事项。`);
      } else {
        const lines = items.slice(0, 5).map((item, idx) => (
          `${idx + 1}. ${item.title}（赞${item.likes ?? 0}/评${item.comments ?? 0}）\n   跳转：/forum/${item.id}`
        ));
        appendAssistantMessage(`帮你找到这些“${query}”相关帖子：\n\n${lines.join('\n\n')}\n\n要不要我继续帮你对其中某一条做“3点总结”或“草拟回复”？`);
      }
      setStepStatus(2, 'ok');

      setTaskStatusText('已完成：检索结果已输出到助手对话');
      setTaskContext((prev) => ({
        ...(prev || {}),
        taskType: 'forum_search',
        query,
        command,
        interactionSyncedAt: Date.now()
      }));
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

  const executeShopTask = async (command) => {
    try {
      const { productId, quantity } = command;
      cancelTaskRef.current = false;
      setTaskFailed(false);
      setTaskRunning(true);
      setTaskHudVisible(true);
      setIsOpen(false);
      setCurrentTaskSteps(SHOP_TASK_STEPS);
      setTaskTitle('执行商城智能下单');
      setTaskStepStates(SHOP_TASK_STEPS.map(() => 'pending'));
      setTaskContext({ taskType: 'shop', command, productId, quantity });

      setTaskStatusText('1/5 正在解析购买需求...');
      setStepStatus(0, 'running');
      await new Promise((resolve) => setTimeout(resolve, 700));
      setStepStatus(0, 'ok');

      if (cancelTaskRef.current) throw new Error('任务已取消');

      setTaskStatusText('2/5 正在进入商城页面...');
      setStepStatus(1, 'running');
      navigate('/shop');
      await new Promise((resolve) => setTimeout(resolve, 900));
      setStepStatus(1, 'ok');

      if (cancelTaskRef.current) throw new Error('任务已取消');

      setTaskStatusText('3/5 正在选择目标商品...');
      setStepStatus(2, 'running');
      navigate(`/shop/${productId}`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStepStatus(2, 'ok');

      if (cancelTaskRef.current) throw new Error('任务已取消');

      setTaskStatusText('4/5 正在进入订单页...');
      setStepStatus(3, 'running');
      navigate(`/shop/order?productId=${encodeURIComponent(productId)}&quantity=${Number(quantity) || 1}`);
      await new Promise((resolve) => setTimeout(resolve, 900));
      setStepStatus(3, 'ok');

      if (cancelTaskRef.current) throw new Error('任务已取消');

      setTaskStatusText('5/5 正在校验下单结果...');
      setStepStatus(4, 'running');
      const currentPath = `${window.location.pathname}${window.location.search}`;
      const pass = currentPath.startsWith('/shop/order');
      if (!pass) throw new Error('校验失败：未检测到下单记录');
      setStepStatus(4, 'ok');

      setTaskStatusText('已完成：已进入订单页，请确认地址并支付');
      setTaskContext((prev) => ({
        ...(prev || {}),
        taskType: 'shop',
        productId,
        quantity: Number(quantity) || 1,
        command,
        interactionSyncedAt: Date.now()
      }));
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
    if (taskContext.taskType === 'shop' && taskContext.command) {
      await executeShopTask(taskContext.command);
      return;
    }
    if (taskContext.command) {
      await executeForumTask(taskContext.command);
      return;
    }
    await executeForumTask({
      targetIndex: taskContext.targetIndex || 1,
      targetTopicId: taskContext.topicId || null,
      targetLabel: taskContext.topicId ? '目标帖子' : `第${taskContext.targetIndex || 1}个帖子`,
      commentText: taskContext.commentText || '',
      followAuthor: Boolean(taskContext.followAuthor)
    });
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
              {currentTaskSteps.map((step, index) => (
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
              style={{ '--chat-keyboard-offset': `${keyboardOffset}px` }}
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
                    <li>• 商城智能下单：输入“帮我买主粮”可自动选品、下单并校验结果</li>
                    <li>• 帖子互动执行：支持“给第4个帖子点赞+评论+关注作者”一键完成</li>
                    <li>• 浏览帖子：按主题检索热门/相关帖子，快速定位讨论</li>
                    <li>• 点赞帖子：支持对第 N 个帖子或当前帖子执行点赞</li>
                    <li>• 评论帖子：可直接指定评论内容，助手自动执行评论流程</li>
                    <li>• 收藏提醒：助手可引导你在帖子页完成收藏操作</li>
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
