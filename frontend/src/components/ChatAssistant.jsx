// frontend/src/components/ChatAssistant.jsx

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChatSession } from '../hooks/useChatSession';
import { useChat } from '../hooks/useChat';
import { useTask } from '../context/TaskContext';
import { AGENT_API, FORUM_API } from '../config/api';
import { getShopProductById } from '../data/shopProducts';
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
const AGENT_TOOL_POLICIES = {
  'forum.search_topics': { label: '检索论坛帖子', tone: 'navigation' },
  'forum.resolve_topic': { label: '定位目标帖子', tone: 'navigation' },
  'forum.get_topic': { label: '读取帖子详情', tone: 'navigation' },
  'forum.summarize_topic': { label: '总结帖子', tone: 'navigation' },
  'forum.draft_reply': { label: '草拟回复', tone: 'decision' },
  'forum.like_topic': { label: '点赞帖子', tone: 'write' },
  'forum.comment_topic': { label: '发布评论', tone: 'public' },
  'forum.follow_author': { label: '关注作者', tone: 'write' },
  'forum.verify_interaction': { label: '校验互动结果', tone: 'navigation' },
  'shop.select_product': { label: '选择商品', tone: 'decision' },
  'shop.open_product': { label: '打开商品页', tone: 'navigation' },
  'shop.open_checkout': { label: '进入订单页', tone: 'write' },
  'ui.navigate': { label: '页面跳转', tone: 'navigation' },
  'chat.append_message': { label: '输出结果', tone: 'navigation' }
};
const LOGIN_REQUIRED_TOOLS = new Set([
  'forum.like_topic',
  'forum.comment_topic',
  'forum.follow_author',
  'shop.open_checkout'
]);
const AGENT_LABELS = {
  assistant_capability_agent: '助手能力 Agent',
  intelligent_action_agent: '智能操作 Agent',
  forum_research_agent: '论坛研究 Agent',
  navigation_agent: '导航 Agent',
  custom_rule_agent: '自设规则 Agent',
  chat_answer_agent: '普通对话 Agent'
};
const CAPABILITY_QUESTION_PATTERN = /(你会什么|你能做什么|你可以做什么|有什么能力|功能介绍|能力介绍|怎么帮我)/;
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
  const [approvalRequest, setApprovalRequest] = useState(null);
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

    const scrollY = window.scrollY || window.pageYOffset || 0;
    const originalBodyStyle = {
      overflow: document.body.style.overflow,
      touchAction: document.body.style.touchAction,
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
    };

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';

    const restoreBodyScroll = () => {
      document.body.style.overflow = originalBodyStyle.overflow;
      document.body.style.touchAction = originalBodyStyle.touchAction;
      document.body.style.position = originalBodyStyle.position;
      document.body.style.top = originalBodyStyle.top;
      document.body.style.left = originalBodyStyle.left;
      document.body.style.right = originalBodyStyle.right;
      document.body.style.width = originalBodyStyle.width;
      window.scrollTo(0, scrollY);
    };

    const vv = window.visualViewport;
    if (!vv) {
      return restoreBodyScroll;
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
      restoreBodyScroll();
    };
  }, [isOpen]);

  const formatCurrency = (amount) => `¥${Number(amount || 0)}`;

  const createAuthorizationId = (type) => (
    `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  );

  const getCurrentTopicIdFromRoute = () => {
    const currentTopicMatch = window.location.pathname.match(/^\/forum\/([^/]+)$/);
    return currentTopicMatch?.[1] || null;
  };

  const resolveShopProductSelection = (args = {}) => {
    const query = String(args.productQuery || args.query || '').trim();
    const catalog = [
      { id: 'food-001', keywords: ['主粮', '狗粮', '低敏主粮', '幼犬粮', 'food'] },
      { id: 'snack-001', keywords: ['零食', '冻干', '鸡胸肉', 'snack'] },
      { id: 'clean-001', keywords: ['清洁', '洗护', '抑菌', '除味', 'clean'] },
      { id: 'travel-001', keywords: ['出行', '牵引', '胸背', '背包', 'travel'] },
      { id: 'health-001', keywords: ['健康', '关节', '益生菌', '鱼油', 'health'] }
    ];
    const matched = args.productId
      ? { id: args.productId }
      : catalog.find((item) => item.keywords.some((kw) => query.includes(kw)));
    const productId = matched?.id || 'food-001';
    const quantity = Math.max(1, Number(args.quantity) || 1);
    const product = getShopProductById(productId);

    return {
      productId,
      quantity,
      product,
      totalPrice: (product?.price || 0) * quantity
    };
  };

  const getAgentPlanShopDecision = (plan) => {
    const shopStep = (plan?.steps || []).find((step) => step.tool?.startsWith('shop.'));
    if (!shopStep) return null;
    return resolveShopProductSelection(shopStep.args || {});
  };

  const planHasExecutableTools = (plan) => (
    Array.isArray(plan?.steps)
      && plan.steps.some((step) => step.tool && step.tool !== 'chat.append_message')
  );

  const planNeedsLogin = (plan) => (
    Array.isArray(plan?.steps) && plan.steps.some((step) => LOGIN_REQUIRED_TOOLS.has(step.tool))
  );

  const getDirectAssistantAnswer = (plan) => {
    const steps = Array.isArray(plan?.steps) ? plan.steps : [];
    if (steps.length === 0) return '';
    const appendSteps = steps.filter((step) => step.tool === 'chat.append_message');
    if (appendSteps.length !== steps.length) return '';
    return appendSteps
      .map((step) => String(step.args?.content || '').trim())
      .filter(Boolean)
      .join('\n\n');
  };

  const getLocalCapabilityAnswer = (content) => {
    if (!CAPABILITY_QUESTION_PATTERN.test(String(content || '').trim())) return '';
    return [
      '我可以帮你做这几类事：',
      '',
      '1. 宠物领养咨询：解释领养流程、匹配宠物、整理照护建议。',
      '2. 社区内容助手：检索帖子、总结帖子、提炼观点、草拟回复。',
      '3. 智能操作 Agent：在你明确授权后，帮你点赞、评论、关注作者。',
      '4. 商城辅助：根据你的需求匹配商品，并带你进入订单确认页；真正下单前还会再次确认。',
      '5. 自设规则 Agent：后续可以接入运营配置的关键词、正则或业务规则，把特定意图路由到专门流程。',
      '',
      '涉及写入、公开评论、关注或购买决策时，我会先展示计划并等你确认。'
    ].join('\n');
  };

  const getPlanIntentLabel = (intent) => {
    if (intent === 'commerce.ordering') return '商城下单';
    if (intent === 'community.interaction') return '论坛互动';
    if (intent === 'forum.search') return '论坛检索';
    if (intent === 'forum.topic_ai') return '帖子辅助';
    if (intent === 'navigation') return '页面导航';
    return intent || '智能任务';
  };

  const getAgentStepDetail = (step, shopDecision) => {
    const args = step.args || {};
    if (step.tool === 'forum.search_topics') return args.query ? `关键词：${args.query}` : '按你的描述检索相关帖子';
    if (step.tool === 'forum.resolve_topic') {
      if (args.topicId) return `帖子 ID：${args.topicId}`;
      if (args.targetIndex) return `第 ${args.targetIndex} 个帖子`;
      if (args.useCurrentTopic) return '当前帖子';
      if (args.useLastTopic) return '上一次定位的帖子';
      return '根据上下文定位';
    }
    if (step.tool === 'forum.comment_topic') return String(args.content || '发布模型规划的评论').slice(0, 80);
    if (step.tool === 'forum.like_topic') return '将以你的账号写入点赞状态';
    if (step.tool === 'forum.follow_author') return '将以你的账号关注帖子作者';
    if (step.tool === 'forum.verify_interaction') return '确认点赞或评论结果已生效';
    if (step.tool === 'forum.draft_reply') return args.userIntent || '生成回复草稿，不直接发布';
    if (step.tool === 'forum.summarize_topic') return args.focus || '提炼帖子关键内容';
    if (step.tool === 'shop.select_product') return shopDecision?.product?.name || shopDecision?.productId || '匹配商品';
    if (step.tool === 'shop.open_checkout') return shopDecision ? `合计 ${formatCurrency(shopDecision.totalPrice)}` : '进入订单确认页';
    if (step.tool === 'shop.open_product') return shopDecision?.product?.name || '打开商品详情';
    if (step.tool === 'ui.navigate') return args.path || '应用内页面';
    if (step.tool === 'chat.append_message') return String(args.content || '输出助手结果').slice(0, 80);
    return AGENT_TOOL_POLICIES[step.tool]?.label || step.tool || '执行工具';
  };

  const buildAgentPlanApprovalRequest = (planEnvelope) => {
    const plan = planEnvelope.plan;
    const shopDecision = getAgentPlanShopDecision(plan);
    const isShopPlan = plan.intent === 'commerce.ordering' || Boolean(shopDecision);
    const isForumWritePlan = (plan.steps || []).some((step) => step.tool?.startsWith('forum.') && ['forum.like_topic', 'forum.comment_topic', 'forum.follow_author'].includes(step.tool));
    const title = isShopPlan
      ? '确认 AI 购买方案'
      : (isForumWritePlan ? '授权 AI 执行论坛互动' : '确认 AI 执行计划');

    const meta = [
      { label: '意图', value: getPlanIntentLabel(plan.intent) },
      { label: 'Agent', value: AGENT_LABELS[plan.agent] || plan.agent || '智能 Planner' },
      { label: '规划方式', value: planEnvelope.source === 'llm' ? 'LLM 规划' : '兜底规划' },
      { label: '授权账号', value: user?.email || user?.id || '当前用户' }
    ];

    if (shopDecision) {
      meta.push(
        { label: '商品', value: shopDecision.product?.name || shopDecision.productId },
        { label: '数量', value: `x ${shopDecision.quantity}` },
        { label: '合计', value: formatCurrency(shopDecision.totalPrice) }
      );
    }

    return {
      id: createAuthorizationId(isShopPlan ? 'shop_plan' : 'agent_plan'),
      type: 'agent_plan',
      title,
      badge: isShopPlan ? '核心决策确认' : '工具计划需授权',
      summary: plan.summary || '确认后，助手才会按计划调用工具。取消不会产生写入动作。',
      primaryText: isShopPlan ? '确认方案并执行' : '授权并执行',
      plan,
      planEnvelope,
      meta,
      actions: (plan.steps || []).map((step) => {
        const policy = AGENT_TOOL_POLICIES[step.tool] || {};
        return {
          label: step.label || policy.label || step.tool,
          detail: getAgentStepDetail(step, shopDecision),
          tone: policy.tone || 'navigation'
        };
      })
    };
  };

  const requestAgentPlan = async (content) => {
    try {
      const response = await fetch(AGENT_API.PLAN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          sessionId,
          userId: user?.id || null,
          context: {
            route: window.location.pathname,
            search: window.location.search,
            currentTopicId: getCurrentTopicIdFromRoute(),
            taskContext: taskContext
              ? {
                  taskType: taskContext.taskType,
                  topicId: taskContext.topicId,
                  productId: taskContext.productId,
                  query: taskContext.query,
                }
              : null,
          }
        })
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        return {
          ok: false,
          plannerUnavailable: true,
          reason: data?.reason || 'planner_failed',
          error: data?.error || response.statusText
        };
      }
      return data;
    } catch (error) {
      return {
        ok: false,
        plannerUnavailable: true,
        reason: 'planner_unreachable',
        error: error.message || 'planner unreachable'
      };
    }
  };

  const buildForumApprovalRequest = (command) => {
    const commentText = String(command.commentText || '').trim();
    const actions = [
      { label: '打开帖子', detail: command.targetLabel || '目标帖子', tone: 'navigation' },
      { label: '点赞帖子', detail: '将以你的账号写入点赞状态', tone: 'write' }
    ];

    if (commentText) {
      actions.push({ label: '发布评论', detail: commentText, tone: 'public' });
    }

    if (command.followAuthor) {
      actions.push({ label: '关注作者', detail: '将以你的账号关注帖子作者', tone: 'write' });
    }

    return {
      id: createAuthorizationId('forum'),
      type: 'forum',
      title: '授权 AI 执行论坛互动',
      badge: '写操作需授权',
      summary: '确认后，助手才会按下面顺序执行。取消不会产生点赞、评论或关注。',
      primaryText: '授权并执行',
      command,
      meta: [
        { label: '目标', value: command.targetLabel || '目标帖子' },
        { label: '授权账号', value: user?.email || user?.id || '当前用户' }
      ],
      actions
    };
  };

  const buildShopApprovalRequest = (command) => {
    const quantity = Number(command.quantity) || 1;
    const product = getShopProductById(command.productId);
    const totalPrice = (product?.price || 0) * quantity;

    return {
      id: createAuthorizationId('shop'),
      type: 'shop',
      title: '确认 AI 购买方案',
      badge: '核心决策确认',
      summary: '确认后，助手会带你进入订单页；真正创建订单前还会再让你确认一次。',
      primaryText: '确认方案并前往',
      command: {
        ...command,
        quantity,
        productName: product?.name || command.productId,
        totalPrice
      },
      meta: [
        { label: '商品', value: product?.name || command.productId },
        { label: '数量', value: `x ${quantity}` },
        { label: '合计', value: formatCurrency(totalPrice) }
      ],
      actions: [
        { label: '选择商品', detail: product?.name || command.productId, tone: 'decision' },
        { label: '进入订单页', detail: `合计 ${formatCurrency(totalPrice)}`, tone: 'write' }
      ]
    };
  };

  const createConfirmedAuthorization = (request) => ({
    id: request.id,
    type: request.type,
    confirmedAt: new Date().toISOString(),
    confirmedBy: user?.id || null,
    title: request.title,
    actions: request.actions.map((action) => action.label)
  });

  const handleApproveAction = async () => {
    if (!approvalRequest) return;
    const request = approvalRequest;
    const authorization = createConfirmedAuthorization(request);
    setApprovalRequest(null);

    if (request.type === 'agent_plan') {
      await executeAgentPlan(request.plan, authorization);
      return;
    }

    if (request.type === 'shop') {
      await executeShopTask({ ...request.command, authorization });
      return;
    }

    await executeForumTask({ ...request.command, authorization });
  };

  const handleDeclineAction = () => {
    setApprovalRequest(null);
    setTaskHudVisible(true);
    setTaskRunning(false);
    setTaskFailed(false);
    setTaskTitle('任务已取消');
    setTaskStatusText('你已取消授权，助手没有执行任何写操作。');
    setCurrentTaskSteps([]);
    setTaskStepStates([]);
  };

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
    const agentPlan = await requestAgentPlan(trimmedInput);
    const directAssistantAnswer = agentPlan?.ok ? getDirectAssistantAnswer(agentPlan.plan) : '';
    if (directAssistantAnswer) {
      setInputValue('');
      appendAssistantMessage(directAssistantAnswer);
      return;
    }

    const localCapabilityAnswer = agentPlan?.plannerUnavailable
      ? getLocalCapabilityAnswer(trimmedInput)
      : '';
    if (localCapabilityAnswer) {
      setInputValue('');
      appendAssistantMessage(localCapabilityAnswer);
      return;
    }

    if (agentPlan?.ok && planHasExecutableTools(agentPlan.plan)) {
      if (planNeedsLogin(agentPlan.plan) && !user?.id) {
        setInputError('执行 AI 工具动作前请先登录');
        return;
      }

      setInputValue('');
      setIsOpen(false);
      setApprovalRequest(buildAgentPlanApprovalRequest(agentPlan));
      return;
    }

    const forumSearchCommand = agentPlan?.plannerUnavailable ? parseForumSearchCommand(trimmedInput) : null;
    if (forumSearchCommand) {
      setInputValue('');
      await executeForumSearchTask(forumSearchCommand);
      return;
    }

    const topicAiCommand = agentPlan?.plannerUnavailable ? parseTopicAiCommand(trimmedInput) : null;
    if (topicAiCommand) {
      setInputValue('');
      await executeTopicAiTask(topicAiCommand);
      return;
    }

    const shopCommand = agentPlan?.plannerUnavailable ? parseShopCommand(trimmedInput) : null;
    if (shopCommand) {
      if (!user?.id) {
        setInputError('执行商城下单前请先登录');
        return;
      }
      setInputValue('');
      setIsOpen(false);
      setApprovalRequest(buildShopApprovalRequest(shopCommand));
      return;
    }

    const command = agentPlan?.plannerUnavailable ? parseForumCommand(trimmedInput) : null;
    if (command) {
      if (!user?.id) {
        setInputError('执行互动任务前请先登录');
        return;
      }
      setInputValue('');
      setIsOpen(false);
      setApprovalRequest(buildForumApprovalRequest(command));
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
      const { targetIndex, targetTopicId, targetLabel, commentText, followAuthor, authorization } = command;
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
      setTaskContext({ topicId: target.id, commentText, targetIndex: targetIndex || 1, followAuthor, authorization, command });
      await new Promise((resolve) => setTimeout(resolve, 350));
      setStepStatus(1, 'ok');

      if (cancelTaskRef.current) throw new Error('任务已取消');

      // step 3: like
      setTaskStatusText('3/6 正在点赞帖子...');
      setStepStatus(2, 'running');
      const likeResp = await fetch(`${FORUM_API.LIST}/${target.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, authorizationId: authorization?.id || null })
      });
      if (!likeResp.ok) throw new Error('点赞失败');
      setStepStatus(2, 'ok');
      setTaskContext((prev) => ({
        ...(prev || {}),
        topicId: target.id,
        targetIndex: targetIndex || 1,
        commentText,
        followAuthor,
        authorization,
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
          body: JSON.stringify({
            topicId: target.id,
            content: commentText,
            userId: user.id,
            authorizationId: authorization?.id || null
          })
        });
        const precheckData = await precheckResp.json();
        if (!precheckResp.ok) throw new Error(precheckData.error || '评论预检查失败');

        const confirmResp = await fetch(FORUM_API.CONFIRM_REPLY, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            confirmToken: precheckData.confirmToken,
            userId: user.id,
            authorizationId: authorization?.id || null
          })
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
          body: JSON.stringify({ userId: user.id, authorizationId: authorization?.id || null })
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
          commentContains: hasComment ? commentText : '',
          authorizationId: authorization?.id || null
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
        authorization,
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

  const waitForTaskStep = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

  const fetchJsonOrThrow = async (url, options, fallbackMessage) => {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.error || fallbackMessage || '请求失败');
    }
    return data;
  };

  const fetchTopicDetail = async (topicId) => {
    const params = new URLSearchParams();
    if (user?.id) params.set('userId', user.id);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    const data = await fetchJsonOrThrow(`${FORUM_API.LIST}/${topicId}${suffix}`, undefined, '读取帖子详情失败');
    return data.topic || data;
  };

  const fetchForumTopics = async ({ targetIndex = 1, query = '', limit = 8, sort = 'hot' }) => {
    const params = new URLSearchParams({
      format: 'mcp',
      limit: String(Math.max(Number(limit) || 8, Number(targetIndex) || 1)),
      cursor: '0',
      sort
    });
    if (query) params.set('query', query);
    if (user?.id) params.set('userId', user.id);
    const data = await fetchJsonOrThrow(`${FORUM_API.LIST}?${params.toString()}`, undefined, '论坛检索失败');
    return Array.isArray(data.items) ? data.items : [];
  };

  const composeSearchResultsMessage = (query, items) => {
    if (!items.length) {
      return `未检索到“${query || '相关主题'}”相关帖子。你可以换更具体关键词，例如：新手领养、首次到家、行为训练。`;
    }

    const lines = items.slice(0, 5).map((item, idx) => (
      `${idx + 1}. ${item.title}（赞${item.likes ?? 0}/评${item.comments ?? item.comment_count ?? 0}）\n   跳转：/forum/${item.id}`
    ));
    return `帮你找到这些“${query || '相关'}”帖子：\n\n${lines.join('\n\n')}\n\n你可以继续让我总结、草拟回复或执行已授权互动。`;
  };

  const resolveTopicForAgentPlan = async (args, runtime) => {
    let topicId = args.topicId || runtime.topic?.id || null;
    if (!topicId && args.useCurrentTopic) topicId = getCurrentTopicIdFromRoute();
    if (!topicId && args.useLastTopic) topicId = taskContext?.topicId || null;

    if (topicId) {
      runtime.topic = await fetchTopicDetail(topicId);
      return runtime.topic;
    }

    const targetIndex = Math.max(1, Number(args.targetIndex || runtime.targetIndex || 1));
    if (runtime.searchResults?.[targetIndex - 1]) {
      runtime.topic = runtime.searchResults[targetIndex - 1];
      return runtime.topic;
    }

    const items = await fetchForumTopics({
      targetIndex,
      limit: Math.max(targetIndex, 8),
      sort: args.sort || 'hot'
    });
    runtime.searchResults = items;
    runtime.topic = items[targetIndex - 1] || items[0] || null;
    if (!runtime.topic) throw new Error('未找到目标帖子');
    return runtime.topic;
  };

  const ensureAgentTopic = async (runtime, args = {}) => {
    if (runtime.topic?.id) return runtime.topic;
    return resolveTopicForAgentPlan(args, runtime);
  };

  const runAgentToolStep = async (step, runtime, authorization) => {
    const args = step.args || {};

    if (step.tool === 'forum.search_topics') {
      const query = String(args.query || '').trim();
      const items = await fetchForumTopics({
        query,
        limit: args.limit || 8,
        sort: args.sort || 'hot'
      });
      runtime.searchQuery = query;
      runtime.searchResults = items;
      runtime.lastAssistantMessage = composeSearchResultsMessage(query, items);
      return;
    }

    if (step.tool === 'forum.resolve_topic' || step.tool === 'forum.get_topic') {
      const topic = await resolveTopicForAgentPlan(args, runtime);
      runtime.topic = topic;
      runtime.targetIndex = args.targetIndex || runtime.targetIndex || 1;
      return;
    }

    if (step.tool === 'ui.navigate') {
      const path = String(args.path || '').replace(/\{topicId\}/g, runtime.topic?.id || '');
      if (!path) throw new Error('缺少导航路径');
      navigate(path);
      await waitForTaskStep(250);
      return;
    }

    if (step.tool === 'forum.like_topic') {
      const topic = await ensureAgentTopic(runtime, args);
      const data = await fetchJsonOrThrow(`${FORUM_API.LIST}/${topic.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, authorizationId: authorization?.id || null })
      }, '点赞失败');
      runtime.liked = data?.liked !== false;
      return;
    }

    if (step.tool === 'forum.comment_topic') {
      const topic = await ensureAgentTopic(runtime, args);
      const content = String(args.content || runtime.commentText || '').trim();
      if (!content) throw new Error('缺少评论内容');
      const precheckData = await fetchJsonOrThrow(FORUM_API.PRECHECK_REPLY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: topic.id,
          content,
          userId: user.id,
          authorizationId: authorization?.id || null
        })
      }, '评论预检查失败');

      const confirmData = await fetchJsonOrThrow(FORUM_API.CONFIRM_REPLY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmToken: precheckData.confirmToken,
          userId: user.id,
          authorizationId: authorization?.id || null
        })
      }, '评论确认失败');
      if (!confirmData.ok) throw new Error(confirmData.error || '评论确认失败');
      runtime.commentText = content;
      return;
    }

    if (step.tool === 'forum.follow_author') {
      const topic = await ensureAgentTopic(runtime, args);
      await fetchJsonOrThrow(`${FORUM_API.LIST}/${topic.id}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, authorizationId: authorization?.id || null })
      }, '关注作者失败');
      runtime.followedAuthor = true;
      return;
    }

    if (step.tool === 'forum.verify_interaction') {
      const topic = await ensureAgentTopic(runtime, args);
      if (!runtime.liked) {
        runtime.verificationSkipped = true;
        return;
      }
      const verifyData = await fetchJsonOrThrow(FORUM_API.VERIFY_INTERACTION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: topic.id,
          userId: user.id,
          commentContains: runtime.commentText || '',
          authorizationId: authorization?.id || null
        })
      }, '校验失败');
      if (!verifyData.pass) throw new Error(verifyData.error || '校验失败：未检测到互动结果');
      return;
    }

    if (step.tool === 'forum.summarize_topic') {
      const topic = await ensureAgentTopic(runtime, args);
      const prompt = `请基于下面帖子内容，提炼3条关键观点。要求：\n1) 每条20-40字\n2) 直接用“1. 2. 3.”输出\n3) 不要输出额外解释\n\n帖子标题：${topic.title}\n帖子内容：${topic.content || topic.snippet || ''}`;
      await sendMessage(prompt);
      runtime.generatedOutput = true;
      return;
    }

    if (step.tool === 'forum.draft_reply') {
      const topic = await ensureAgentTopic(runtime, args);
      const data = await fetchJsonOrThrow(FORUM_API.DRAFT_REPLY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: topic.id,
          userIntent: args.userIntent || '礼貌回复并补充建议',
          tone: args.tone || 'friendly',
          length: args.length || 'medium',
          userId: user?.id || null
        })
      }, '草拟回复失败');
      appendAssistantMessage(`基于当前帖子生成的礼貌回复草稿：\n\n${data?.draft || '暂未生成草稿，请重试。'}`);
      runtime.generatedOutput = true;
      return;
    }

    if (step.tool === 'shop.select_product') {
      const selection = resolveShopProductSelection(args);
      runtime.productId = selection.productId;
      runtime.quantity = selection.quantity;
      runtime.product = selection.product;
      runtime.totalPrice = selection.totalPrice;
      await waitForTaskStep(250);
      return;
    }

    if (step.tool === 'shop.open_product') {
      const selection = resolveShopProductSelection({
        productId: args.productId || runtime.productId,
        productQuery: args.productQuery,
        quantity: args.quantity || runtime.quantity
      });
      runtime.productId = selection.productId;
      runtime.quantity = selection.quantity;
      navigate(`/shop/${selection.productId}`);
      await waitForTaskStep(300);
      return;
    }

    if (step.tool === 'shop.open_checkout') {
      const selection = resolveShopProductSelection({
        productId: args.productId || runtime.productId,
        productQuery: args.productQuery,
        quantity: args.quantity || runtime.quantity
      });
      runtime.productId = selection.productId;
      runtime.quantity = selection.quantity;
      runtime.product = selection.product;
      runtime.totalPrice = selection.totalPrice;
      const orderParams = new URLSearchParams({
        productId: selection.productId,
        quantity: String(selection.quantity),
        source: 'ai-assistant'
      });
      if (authorization?.id) orderParams.set('agentAuthorizationId', authorization.id);
      navigate(`/shop/order?${orderParams.toString()}`);
      await waitForTaskStep(300);
      return;
    }

    if (step.tool === 'chat.append_message') {
      const content = runtime.lastAssistantMessage || String(args.content || '').trim();
      if (content) appendAssistantMessage(content);
      runtime.generatedOutput = true;
      return;
    }

    throw new Error(`暂不支持的工具：${step.tool}`);
  };

  const executeAgentPlan = async (plan, authorization) => {
    const steps = Array.isArray(plan?.steps) ? plan.steps : [];
    if (steps.length === 0) return;

    const runtime = {};
    const stepLabels = steps.map((step) => step.label || AGENT_TOOL_POLICIES[step.tool]?.label || step.tool);

    try {
      cancelTaskRef.current = false;
      setTaskFailed(false);
      setTaskRunning(true);
      setTaskHudVisible(true);
      setIsOpen(false);
      setCurrentTaskSteps(stepLabels);
      setTaskStepStates(stepLabels.map(() => 'pending'));
      setTaskTitle(plan.title || '执行 AI 工具计划');

      for (let index = 0; index < steps.length; index += 1) {
        if (cancelTaskRef.current) throw new Error('任务已取消');
        const step = steps[index];
        const label = stepLabels[index];
        setTaskStatusText(`${index + 1}/${steps.length} ${label}...`);
        setStepStatus(index, 'running');
        await runAgentToolStep(step, runtime, authorization);
        setStepStatus(index, 'ok');
      }

      setTaskStatusText(plan.intent === 'commerce.ordering'
        ? '已完成：已进入订单页，请确认地址并支付'
        : '已完成：AI 工具计划执行完毕');
      setTaskContext((prev) => ({
        ...(prev || {}),
        taskType: 'agent_plan',
        intent: plan.intent,
        topicId: runtime.topic?.id || prev?.topicId || null,
        productId: runtime.productId || prev?.productId || null,
        query: runtime.searchQuery || prev?.query || null,
        commentText: runtime.commentText || '',
        authorization,
        command: { plan },
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
      const { productId, quantity, authorization } = command;
      const normalizedQuantity = Number(quantity) || 1;
      cancelTaskRef.current = false;
      setTaskFailed(false);
      setTaskRunning(true);
      setTaskHudVisible(true);
      setIsOpen(false);
      setCurrentTaskSteps(SHOP_TASK_STEPS);
      setTaskTitle('执行商城智能下单');
      setTaskStepStates(SHOP_TASK_STEPS.map(() => 'pending'));
      setTaskContext({ taskType: 'shop', command, productId, quantity: normalizedQuantity, authorization });

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
      const orderParams = new URLSearchParams({
        productId,
        quantity: String(normalizedQuantity),
        source: 'ai-assistant'
      });
      if (authorization?.id) orderParams.set('agentAuthorizationId', authorization.id);
      navigate(`/shop/order?${orderParams.toString()}`);
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
        quantity: normalizedQuantity,
        authorization,
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
    if (taskContext.taskType === 'agent_plan' && taskContext.command?.plan) {
      await executeAgentPlan(taskContext.command.plan, taskContext.authorization);
      return;
    }
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
        {approvalRequest && (
          <MotionDiv
            className="chat-approval-layer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="chat-approval-backdrop"
              onClick={handleDeclineAction}
              aria-label="关闭授权确认"
            />
            <MotionDiv
              role="dialog"
              aria-modal="true"
              aria-labelledby={`chat-approval-title-${approvalRequest.id}`}
              className="chat-approval-card"
              initial={{ y: 28, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 28, scale: 0.98 }}
              transition={{ duration: 0.18 }}
            >
              <div className="chat-approval-topline">
                <span className="chat-approval-badge">{approvalRequest.badge}</span>
                <span className="chat-approval-id">ID {approvalRequest.id.slice(-6)}</span>
              </div>
              <h2 id={`chat-approval-title-${approvalRequest.id}`} className="chat-approval-title">
                {approvalRequest.title}
              </h2>
              <p className="chat-approval-summary">{approvalRequest.summary}</p>

              <div className="chat-approval-meta">
                {approvalRequest.meta.map((item) => (
                  <div key={item.label} className="chat-approval-meta-row">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>

              <div className="chat-approval-actions" aria-label="授权动作清单">
                {approvalRequest.actions.map((action) => (
                  <div key={`${action.label}-${action.detail}`} className={`chat-approval-action chat-approval-action-${action.tone}`}>
                    <span className="chat-approval-action-dot" />
                    <div>
                      <p>{action.label}</p>
                      <small>{action.detail}</small>
                    </div>
                  </div>
                ))}
              </div>

              <div className="chat-approval-footer">
                <button type="button" className="chat-approval-secondary" onClick={handleDeclineAction}>
                  取消
                </button>
                <button type="button" className="chat-approval-primary" onClick={handleApproveAction}>
                  {approvalRequest.primaryText}
                </button>
              </div>
            </MotionDiv>
          </MotionDiv>
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
