const { getOpenAiRuntime, isAiEnabled } = require('./aiRuntime');

const TOOL_POLICIES = {
  'forum.search_topics': {
    risk: 'read',
    confirmation: 'none',
    label: '检索论坛帖子',
    description: '按关键词检索论坛帖子列表。',
  },
  'forum.resolve_topic': {
    risk: 'read',
    confirmation: 'none',
    label: '定位目标帖子',
    description: '根据帖子 id、当前页面、上一条上下文或列表序号定位帖子。',
  },
  'forum.get_topic': {
    risk: 'read',
    confirmation: 'none',
    label: '读取帖子详情',
    description: '读取单个帖子详情和互动上下文。',
  },
  'forum.summarize_topic': {
    risk: 'read',
    confirmation: 'none',
    label: '总结帖子',
    description: '基于帖子内容生成摘要或观点提炼。',
  },
  'forum.draft_reply': {
    risk: 'draft',
    confirmation: 'soft_confirm',
    label: '草拟回复',
    description: '生成回复草稿，不直接发布。',
  },
  'forum.like_topic': {
    risk: 'write',
    confirmation: 'soft_confirm',
    label: '点赞帖子',
    description: '以当前用户身份写入点赞状态。',
  },
  'forum.comment_topic': {
    risk: 'public_write',
    confirmation: 'soft_confirm',
    label: '发布评论',
    description: '通过评论预检查和确认接口发布公开评论。',
  },
  'forum.follow_author': {
    risk: 'write',
    confirmation: 'soft_confirm',
    label: '关注作者',
    description: '以当前用户身份关注帖子作者。',
  },
  'forum.verify_interaction': {
    risk: 'read',
    confirmation: 'none',
    label: '校验互动结果',
    description: '校验点赞、评论或关注是否完成。',
  },
  'shop.select_product': {
    risk: 'decision',
    confirmation: 'soft_confirm',
    label: '选择商品',
    description: '根据购买意图选择商品和数量。',
  },
  'shop.open_product': {
    risk: 'navigation',
    confirmation: 'none',
    label: '打开商品页',
    description: '跳转到商品详情页。',
  },
  'shop.open_checkout': {
    risk: 'purchase_decision',
    confirmation: 'hard_confirm',
    label: '进入订单页',
    description: '带着商品、数量和授权信息进入订单确认页。',
  },
  'ui.navigate': {
    risk: 'navigation',
    confirmation: 'none',
    label: '页面跳转',
    description: '在应用内导航到指定页面。',
  },
  'chat.append_message': {
    risk: 'read',
    confirmation: 'none',
    label: '输出结果',
    description: '把工具结果整理成助手消息。',
  },
};

const TOOL_CATALOG = Object.entries(TOOL_POLICIES).map(([name, policy]) => ({
  name,
  risk: policy.risk,
  confirmation: policy.confirmation,
  description: policy.description,
}));

const AGENT_REGISTRY = {
  assistant_capability_agent: {
    label: '助手能力 Agent',
    description: '回答助手能做什么、如何配合用户，以及当前安全边界。',
    intents: ['chat.capabilities'],
  },
  intelligent_action_agent: {
    label: '智能操作 Agent',
    description: '处理下单、点赞、评论、关注等需要授权的工具计划。',
    intents: ['commerce.ordering', 'community.interaction'],
  },
  forum_research_agent: {
    label: '论坛研究 Agent',
    description: '处理论坛检索、帖子总结、回复草稿等读操作或草稿任务。',
    intents: ['forum.search', 'forum.topic_ai'],
  },
  navigation_agent: {
    label: '导航 Agent',
    description: '处理应用内页面跳转。',
    intents: ['navigation'],
  },
  custom_rule_agent: {
    label: '自设规则 Agent',
    description: '预留给后续配置化规则、正则和运营自定义意图。',
    intents: ['custom.rule'],
  },
  chat_answer_agent: {
    label: '普通对话 Agent',
    description: '处理没有工具动作的普通问答。',
    intents: ['chat.answer', 'unknown'],
  },
};

const INTENT_AGENT_MAP = Object.entries(AGENT_REGISTRY).reduce((acc, [agent, config]) => {
  config.intents.forEach((intent) => {
    acc[intent] = agent;
  });
  return acc;
}, {});

function inferAgentForIntent(intent) {
  return INTENT_AGENT_MAP[intent] || 'chat_answer_agent';
}

function inferAffinityStage(intent) {
  if (intent === 'chat.capabilities') return 'capability';
  if (intent === 'commerce.ordering' || intent === 'community.interaction') return 'action';
  if (intent === 'forum.search' || intent === 'forum.topic_ai') return 'knowledge';
  if (intent === 'navigation') return 'navigation';
  if (intent === 'custom.rule') return 'custom_rule';
  return 'chat';
}

function createRoutingMetadata(plan, agent) {
  const routing = plan.routing && typeof plan.routing === 'object' && !Array.isArray(plan.routing)
    ? plan.routing
    : {};
  const affinityFunnel = Array.isArray(routing.affinityFunnel) && routing.affinityFunnel.length > 0
    ? routing.affinityFunnel.map(String)
    : [inferAffinityStage(plan.intent), agent];

  return {
    ...routing,
    affinityFunnel,
    agent,
  };
}

function getDefaultAiRuntime() {
  if (!isAiEnabled()) return null;
  return getOpenAiRuntime();
}

function extractJsonObject(text) {
  const raw = String(text || '').trim();
  const cleaned = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();

  for (let start = cleaned.indexOf('{'); start >= 0; start = cleaned.indexOf('{', start + 1)) {
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = start; index < cleaned.length; index += 1) {
      const char = cleaned[index];
      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === '"') {
          inString = false;
        }
        continue;
      }

      if (char === '"') {
        inString = true;
      } else if (char === '{') {
        depth += 1;
      } else if (char === '}') {
        depth -= 1;
        if (depth === 0) {
          const candidate = cleaned.slice(start, index + 1);
          return JSON.parse(candidate);
        }
      }
    }
  }

  return JSON.parse(cleaned);
}

function normalizePlanCandidate(candidate) {
  const plan = candidate?.plan && typeof candidate.plan === 'object' ? candidate.plan : candidate;
  if (!plan || typeof plan !== 'object') {
    throw new Error('Planner response is not an object');
  }

  const rawSteps = Array.isArray(plan.steps) ? plan.steps : [];
  if (rawSteps.length === 0) {
    throw new Error('Planner response has no executable steps');
  }

  const steps = rawSteps.map((step, index) => {
    const tool = String(step?.tool || '').trim();
    const policy = TOOL_POLICIES[tool];
    if (!policy) {
      throw new Error(`Tool "${tool || '(empty)'}" is not allowed`);
    }

    return {
      id: String(step.id || `${tool}-${index + 1}`),
      tool,
      label: String(step.label || policy.label),
      args: step.args && typeof step.args === 'object' && !Array.isArray(step.args) ? step.args : {},
      risk: policy.risk,
      confirmation: policy.confirmation,
    };
  });

  const intent = String(plan.intent || 'unknown');
  const agent = String(plan.agent || inferAgentForIntent(intent));

  return {
    intent,
    agent,
    title: String(plan.title || 'AI 执行计划'),
    summary: String(plan.summary || '助手已拆解为可执行步骤，请确认后继续。'),
    confidence: Number.isFinite(Number(plan.confidence)) ? Math.max(0, Math.min(1, Number(plan.confidence))) : 0,
    routing: createRoutingMetadata({ ...plan, intent }, agent),
    steps,
  };
}

function getPlanConfirmationLevel(plan) {
  const confirmations = plan.steps.map((step) => step.confirmation);
  if (confirmations.includes('hard_confirm')) return 'hard_confirm';
  if (confirmations.includes('soft_confirm')) return 'soft_confirm';
  return 'none';
}

function isCapabilityQuestion(text) {
  return /(你会什么|你能做什么|你可以做什么|有什么能力|功能介绍|能力介绍|怎么帮我)/.test(String(text || '').trim());
}

function buildCapabilityAnswer() {
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
}

function createCapabilityPlan() {
  return normalizePlanCandidate({
    intent: 'chat.capabilities',
    agent: 'assistant_capability_agent',
    title: '助手能力说明',
    summary: '说明宠物小助手当前可以做的事情。',
    confidence: 0.9,
    routing: {
      affinityFunnel: ['capability', 'assistant_capability_agent'],
    },
    steps: [
      {
        tool: 'chat.append_message',
        label: '说明助手能力',
        args: { content: buildCapabilityAnswer() },
      },
    ],
  });
}

function createDeterministicAffinityPlan({ content }) {
  if (isCapabilityQuestion(content)) {
    return createCapabilityPlan();
  }
  return null;
}

function buildPlannerPrompt({ content, context }) {
  return `你是宠物领养 App 的端智能 Planner。你只做意图拆解和工具计划，不执行工具。

用户输入：
${content}

当前页面与上下文：
${JSON.stringify(context || {}, null, 2)}

可用工具目录：
${JSON.stringify(TOOL_CATALOG, null, 2)}

规划原则：
1. 必须只使用可用工具目录里的 tool name，禁止发明工具。
2. 任意写操作、购买决策、公开评论、关注、点赞，都必须进入计划，由前端弹窗授权后才能执行。
3. 下单只能规划到 shop.open_checkout，真正创建订单由订单页再次确认。
4. 评论必须规划为 forum.comment_topic，执行层会自动走 precheck -> confirm -> send。
5. 如果用户只是普通聊天或无法映射到工具，请返回一个 chat.append_message 步骤解释你能做什么。
6. 输出必须是纯 JSON，不要 Markdown，不要解释。

JSON 结构：
{
  "intent": "community.interaction|commerce.ordering|forum.search|forum.topic_ai|navigation|chat.answer|unknown",
  "title": "短标题",
  "summary": "用一句话说明你准备做什么",
  "confidence": 0.0,
  "steps": [
    {
      "id": "step-id",
      "tool": "forum.resolve_topic",
      "label": "用户可读步骤名",
      "args": {}
    }
  ]
}

常见 args 约定：
- forum.resolve_topic: {"topicId":"...", "targetIndex":1, "useCurrentTopic":true, "useLastTopic":true}
- forum.search_topics: {"query":"关键词", "limit":8, "sort":"hot"}
- forum.comment_topic: {"content":"评论内容"}
- shop.select_product/shop.open_checkout: {"productId":"food-001", "productQuery":"主粮", "quantity":1}
- ui.navigate: {"path":"/forum"}
- chat.append_message: {"content":"要展示给用户的文本"}`;
}

function createFallbackPlan({ content, context = {} }) {
  const normalized = String(content || '').trim();
  const currentTopicMatch = String(context.route || '').match(/^\/forum\/([^/]+)$/);
  const topicArgs = currentTopicMatch
    ? { useCurrentTopic: true }
    : (/第[一二三四五六七八九十\d]+个帖子/.test(normalized) ? { targetIndex: 1 } : { useLastTopic: true });

  if (isCapabilityQuestion(normalized)) return createCapabilityPlan();

  if (/(买|购买|下单)/.test(normalized)) {
    let productId = 'food-001';
    if (/(零食|冻干|鸡胸肉)/.test(normalized)) productId = 'snack-001';
    if (/(清洁|洗护|抑菌|除味)/.test(normalized)) productId = 'clean-001';
    if (/(出行|牵引|胸背|背包)/.test(normalized)) productId = 'travel-001';
    if (/(健康|关节|益生菌|鱼油)/.test(normalized)) productId = 'health-001';
    return normalizePlanCandidate({
      intent: 'commerce.ordering',
      agent: 'intelligent_action_agent',
      title: '商城下单计划',
      summary: '选择匹配商品并进入订单确认页。',
      confidence: 0.54,
      routing: {
        affinityFunnel: ['action', 'intelligent_action_agent'],
      },
      steps: [
        { tool: 'shop.select_product', args: { productId, quantity: 1 } },
        { tool: 'shop.open_checkout', args: { productId, quantity: 1 } },
      ],
    });
  }

  if (/(搜索|查找|检索|找找|看看).*(帖子|话题)/.test(normalized)) {
    const query = normalized
      .replace(/帮我|请|在论坛中|论坛里|论坛中|帖子|话题|相关的|相关|找找|查找|搜索|检索|看看/g, ' ')
      .replace(/[，。！？]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() || '新手领养';
    return normalizePlanCandidate({
      intent: 'forum.search',
      agent: 'forum_research_agent',
      title: '论坛检索计划',
      summary: `检索“${query}”相关帖子并整理结果。`,
      confidence: 0.52,
      routing: {
        affinityFunnel: ['knowledge', 'forum_research_agent'],
      },
      steps: [
        { tool: 'forum.search_topics', args: { query, limit: 8, sort: 'hot' } },
        { tool: 'chat.append_message', args: { content: `整理“${query}”相关帖子。` } },
      ],
    });
  }

  if (/(点赞|支持一下|赞一下|关注作者|评论|回复|补一句)/.test(normalized)) {
    const commentMatch = normalized.match(/(?:评论|回复|补一句|说一句)[：:\s]*([\s\S]+)$/);
    const comment = commentMatch?.[1]?.trim();
    const steps = [
      { tool: 'forum.resolve_topic', args: topicArgs },
      { tool: 'forum.like_topic', args: {} },
    ];
    if (comment) steps.push({ tool: 'forum.comment_topic', args: { content: comment } });
    if (/关注作者/.test(normalized)) steps.push({ tool: 'forum.follow_author', args: {} });
    steps.push({ tool: 'forum.verify_interaction', args: {} });
    return normalizePlanCandidate({
      intent: 'community.interaction',
      agent: 'intelligent_action_agent',
      title: '论坛互动计划',
      summary: '定位帖子并执行已授权的互动动作。',
      confidence: 0.5,
      routing: {
        affinityFunnel: ['action', 'intelligent_action_agent'],
      },
      steps,
    });
  }

  return normalizePlanCandidate({
    intent: 'chat.answer',
    agent: 'chat_answer_agent',
    title: '助手回复计划',
    summary: '将作为普通对话回复。',
    confidence: 0.35,
    routing: {
      affinityFunnel: ['chat', 'chat_answer_agent'],
    },
    steps: [
      {
        tool: 'chat.append_message',
        args: {
          content: '这个意图暂时没有匹配到可执行工具，我会先按普通聊天方式回答。',
        },
      },
    ],
  });
}

async function createAgentPlan({ content, context = {}, aiRuntime = getDefaultAiRuntime() }) {
  if (!content || !String(content).trim()) {
    return {
      ok: false,
      reason: 'empty_content',
      error: 'content is required',
    };
  }

  try {
    const deterministicPlan = createDeterministicAffinityPlan({ content, context });
    if (deterministicPlan) {
      const confirmation = getPlanConfirmationLevel(deterministicPlan);
      return {
        ok: true,
        source: 'affinity_funnel',
        requiresConfirmation: confirmation !== 'none',
        confirmation,
        plan: deterministicPlan,
      };
    }

    let plan;
    let source = 'llm';
    if (aiRuntime?.generateText && aiRuntime?.model) {
      const { text } = await aiRuntime.generateText({
        model: aiRuntime.model,
        prompt: buildPlannerPrompt({ content, context }),
      });
      plan = normalizePlanCandidate(extractJsonObject(text));
    } else {
      source = 'fallback';
      plan = createFallbackPlan({ content, context });
    }

    return {
      ok: true,
      source,
      requiresConfirmation: getPlanConfirmationLevel(plan) !== 'none',
      confirmation: getPlanConfirmationLevel(plan),
      plan,
    };
  } catch (error) {
    return {
      ok: false,
      reason: 'planner_invalid',
      error: error.message || 'planner failed',
    };
  }
}

module.exports = {
  AGENT_REGISTRY,
  TOOL_CATALOG,
  TOOL_POLICIES,
  buildPlannerPrompt,
  createAgentPlan,
  createDeterministicAffinityPlan,
  inferAgentForIntent,
  normalizePlanCandidate,
};
