# dog_project AI Agent 增强架构方案

> 目标：构建具备 RAG 知识库问答、多模型编排、AI Agent 能力的智能宠物领养助手

---

## 目录

1. [现状分析](#现状分析)
2. [目标架构](#目标架构)
3. [核心模块设计](#核心模块设计)
4. [RAG 知识库设计](#rag-知识库设计)
5. [多模型编排设计](#多模型编排设计)
6. [AI Agent 框架](#ai-agent-框架)
7. [数据库扩展](#数据库扩展)
8. [API 设计](#api-设计)
9. [实施路径](#实施路径)
10. [技术选型](#技术选型)

---

## 现状分析

### 现有 AI 能力

```
backend/utils/ai.js
├── generatePetBio()        # 生成宠物简历
├── generateHealthAdvice()  # 生成健康建议
└── generateTopicContent()  # 生成论坛话题
```

**问题**：
- ❌ 无 RAG，每次生成是"幻觉"
- ❌ 单模型调用，无编排能力
- ❌ 无工具调用（Tool Use）
- ❌ 无知识库沉淀
- ❌ 无多轮对话上下文

---

## 目标架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户交互层                                │
│  (宠物详情页 AI 助手 / 领养咨询 / 健康问答 / 匹配推荐)            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                     AI Agent 调度层                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ 意图识别器   │  │ 任务路由器   │  │   多模型编排器          │  │
│  │ Intent      │  │ Task Router │  │   Model Orchestrator    │  │
│  │ Classifier  │  │             │  │                         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                     能力层                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   RAG 引擎    │  │  工具调用    │  │   对话管理器         │   │
│  │  Retrieval   │  │  Tool Use   │  │   Conversation        │   │
│  │   Augmented  │  │             │  │   Manager             │   │
│  │   Generation │  │  - 查宠物    │  │                      │   │
│  │              │  │  - 查申请    │  │  - 多轮上下文         │   │
│  │              │  │  - 查知识库  │  │  - Session 管理       │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                     模型层                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │  GLM-5   │  │ Embedding│  │  Rerank  │  │  Function│         │
│  │ (主模型) │  │ 模型     │  │ 模型     │  │  模型    │         │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │
└─────────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                     数据层                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Supabase  │  │ VectorDB │  │ 知识库   │  │  缓存    │         │
│  │ PostgreSQL│  │ 向量库   │  │ Documents│  │  Redis   │         │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 核心模块设计

### 1. 意图识别器 (Intent Classifier)

**职责**：识别用户 query 的意图类型

```typescript
enum IntentType {
  GREETING = 'greeting',                    // 打招呼
  KNOWLEDGE_Q&A = 'knowledge_qa',           // 知识问答
  PET_MATCHING = 'pet_matching',            // 宠物匹配
  APPLICATION_HELP = 'application_help',    // 申请帮助
  HEALTH_ADVICE = 'health_advice',          // 健康咨询
  ADOPTION_STORY = 'adoption_story',        // 领养故事
  PLATFORM_INFO = 'platform_info',          // 平台信息
  CHITCHAT = 'chitchat',                    // 闲聊
  UNKNOWN = 'unknown',                      // 未知
}

interface IntentResult {
  type: IntentType;
  confidence: number;
  entities: {
    breed?: string;
    age?: string;
    trait?: string;
    healthTopic?: string;
  };
}
```

**实现**：
- 使用 Embedding 模型提取 query 特征
- 与预设意图模板做余弦相似度匹配
- 置信度 > 0.8 直接返回，否则标记 UNKNOWN 降级到主模型

---

### 2. 任务路由器 (Task Router)

**职责**：根据意图类型，分发到不同处理 pipeline

```typescript
interface TaskRoute {
  pipeline: 'qa' | 'matching' | 'application' | 'health' | 'creative' | 'chat';
  priority: 'high' | 'normal' | 'low';
  requiredTools: string[];
  ragEnabled: boolean;
  model: 'glm-5' | 'embedding' | 'rerank';
}

// 路由规则配置
const ROUTE_RULES: Record<IntentType, TaskRoute> = {
  [IntentType.KNOWLEDGE_QA]: {
    pipeline: 'qa',
    priority: 'high',
    requiredTools: ['searchKnowledgeBase'],
    ragEnabled: true,
    model: 'glm-5',
  },
  [IntentType.PET_MATCHING]: {
    pipeline: 'matching',
    priority: 'high',
    requiredTools: ['listDogs', 'getUserProfile', 'getFavorites'],
    ragEnabled: true,
    model: 'glm-5',
  },
  [IntentType.HEALTH_ADVICE]: {
    pipeline: 'health',
    priority: 'high',
    requiredTools: ['searchKnowledgeBase'],
    ragEnabled: true,
    model: 'glm-5',
  },
  [IntentType.APPLICATION_HELP]: {
    pipeline: 'application',
    priority: 'normal',
    requiredTools: ['getApplicationStatus', 'validateApplication'],
    ragEnabled: true,
    model: 'glm-5',
  },
  [IntentType.GREETING]: {
    pipeline: 'chat',
    priority: 'low',
    requiredTools: [],
    ragEnabled: false,
    model: 'glm-5',
  },
};
```

---

### 3. 多模型编排器 (Model Orchestrator)

**职责**：协调多个模型的调用顺序和数据流转

```typescript
interface ModelPipeline {
  // Stage 1: Query 理解
  understanding: {
    model: 'embedding';
    input: string;  // 用户 query
    output: DenseVector;
  };

  // Stage 2: 检索（RAG 核心）
  retrieval: {
    model: 'embedding';
    input: DenseVector;
    output: RetrievedChunk[];
    topK: number;
  };

  // Stage 3: 重排序
  rerank: {
    model: 'rerank';
    input: {
      query: string;
      chunks: RetrievedChunk[];
    };
    output: RerankedChunk[];
    topN: number;
  };

  // Stage 4: 生成
  generation: {
    model: 'glm-5';
    input: {
      query: string;
      context: RerankedChunk[];
      conversationHistory: Message[];
    };
    output: string;
  };
}

/**
 * 多模型编排执行流程
 */
async function orchestrate(query: string, sessionId: string): Promise<string> {
  // 1. 获取对话历史
  const history = await conversationManager.getHistory(sessionId);

  // 2. Query 向量化
  const queryEmbedding = await embeddingModel.embed(query);

  // 3. 向量检索（从知识库）
  const retrievedChunks = await vectorStore.search(queryEmbedding, { topK: 10 });

  // 4. 重排序
  const rerankedChunks = await rerankModel.rerank(query, retrievedChunks, { topN: 5 });

  // 5. 构建 prompt（包含 RAG context）
  const prompt = buildPromptWithContext(query, rerankedChunks, history);

  // 6. 主模型生成
  const response = await glmModel.generate(prompt);

  // 7. 保存对话历史
  await conversationManager.addMessage(sessionId, { role: 'user', content: query });
  await conversationManager.addMessage(sessionId, { role: 'assistant', content: response });

  return response;
}
```

---

## RAG 知识库设计

### 知识库内容分类

```typescript
interface KnowledgeBase {
  // 宠物品种知识
  breedKnowledge: {
    id: string;
    breed: string;
    traits: string[];           // 性格特征
    healthRisks: string[];       // 健康风险
    careGuide: string;           // 饲养指南
    idealOwners: string[];       // 适合的主人
  }[];

  // 领养流程知识
  adoptionKnowledge: {
    id: string;
    step: number;
    title: string;
    content: string;
    commonMistakes: string[];   // 常见错误
    tips: string[];              // 小贴士
  }[];

  // 健康护理知识
  healthKnowledge: {
    id: string;
    category: 'vaccine' | 'disease' | 'nutrition' | 'behavior' | 'emergency';
    title: string;
    content: string;
    tags: string[];
  }[];

  // 成功案例
  adoptionStories: {
    id: string;
    petName: string;
    owner: string;
    story: string;
    timeline: string;
    lessons: string[];
  }[];

  // 平台规则
  platformRules: {
    id: string;
    category: string;
    title: string;
    content: string;
  }[];
}
```

### 知识库向量化和检索流程

```typescript
/**
 * 知识库文档处理流程
 */
async function processKnowledgeDocuments() {
  // 1. 文档分块 (Chunking)
  const chunks = await chunkDocuments(knowledgeBase, {
    chunkSize: 500,       // 每块 500 tokens
    chunkOverlap: 50,     // 50 tokens 重叠
  });

  // 2. 生成 Embedding
  const embeddings = await embeddingModel.embedBatch(
    chunks.map(c => c.content)
  );

  // 3. 存储到向量数据库
  await vectorStore.upsert({
    ids: chunks.map(c => c.id),
    embeddings: embeddings,
    documents: chunks.map(c => c.content),
    metadatas: chunks.map(c => ({
      category: c.category,
      source: c.source,
      title: c.title,
    })),
  });
}

/**
 * RAG 检索 + 生成流程
 */
async function ragQuery(query: string, filters?: FilterOptions) {
  // 1. Query 向量化
  const queryEmbedding = await embeddingModel.embed(query);

  // 2. 向量相似度检索
  let results = await vectorStore.search(queryEmbedding, {
    topK: 10,
    filters: filters ? buildFilterExpression(filters) : undefined,
  });

  // 3. 混合检索（向量 + BM25）
  const bm25Results = await bm25Search(query, topK=10);
  results = hybridFusion(results, bm25Results, { alpha: 0.7 }); // 70%向量 + 30%BM25

  // 4. 重排序
  const reranked = await rerankModel.rerank(query, results, { topN: 5 });

  // 5. 构建上下文
  const context = reranked
    .map(r => `[${r.metadata.category}] ${r.content}`)
    .join('\n\n');

  // 6. 生成回答
  const prompt = `
你是宠物领养平台的 AI 助手，基于以下知识回答用户问题。

## 知识库参考：
${context}

## 用户问题：
${query}

## 回答要求：
1. 基于知识库内容回答，不要编造信息
2. 如果知识库没有相关信息，坦诚说明"这个我暂时不了解"
3. 回答要温暖、有同理心
4. 如有需要，适当引导到平台功能
`;

  return await glmModel.generate(prompt);
}
```

---

## 多模型编排设计

### 模型能力矩阵

| 模型 | 能力 | 适用场景 | 成本 |
|------|------|----------|------|
| **GLM-5** | 通用对话、推理、生成 | 主模型、内容生成 | 高 |
| **Embedding** | 向量嵌入 | 检索、向量化 | 中 |
| **Rerank** | 重排序 | 搜索结果精排 | 中 |
| **BM25** | 关键词检索 | 冷启动、简单查询 | 低 |

### 模型调用策略

```typescript
interface ModelStrategy {
  // 简单知识问答 → 直接 RAG
  simple_qa: {
    flow: ['embedding', 'vector_search', 'rerank', 'glm5'],
    fallback: ['bm25_search', 'glm5'],
  };

  // 复杂推理 → RAG + 思维链
  complex_reasoning: {
    flow: ['embedding', 'vector_search', 'glm5_with_cot'],  // Chain of Thought
    fallback: ['glm5_without_context'],
  };

  // 宠物匹配 → RAG + 工具调用
  pet_matching: {
    flow: ['embedding', 'vector_search', 'get_user_profile', 'calculate_match', 'glm5'],
    tools: ['listDogs', 'getFavorites', 'getApplications'],
  };

  // 健康咨询 → RAG（严格）
  health_consultation: {
    flow: ['embedding', 'vector_search', 'strict_rerank', 'glm5'],
    constraints: { minRelevanceScore: 0.85 },
  };
}
```

### 模型调用链路优化

```typescript
/**
 * 模型调用链路优化策略
 */
class ModelPipelineOptimizer {
  // 1. 缓存复用
  async cachedEmbedding(text: string): Promise<DenseVector> {
    const cacheKey = `emb:${hash(text)}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const embedding = await this.embeddingModel.embed(text);
    await redis.setex(cacheKey, 3600, JSON.stringify(embedding)); // 1小时缓存
    return embedding;
  }

  // 2. 并行化独立调用
  async parallelRetrieval(embeddings: DenseVector[]) {
    return Promise.all(
      embeddings.map(e => this.vectorStore.search(e, { topK: 5 }))
    );
  }

  // 3. 早退策略（Early Exit）
  async searchWithEarlyExit(query: string) {
    const embedding = await this.embed(query);

    // 第一轮快速检索
    const fastResults = await this.vectorStore.search(embedding, { topK: 20 });

    // 如果 top1 置信度极高，直接返回
    if (fastResults[0].score > 0.95) {
      return fastResults.slice(0, 3);
    }

    // 否则完整重排序
    return await this.rerankModel.rerank(query, fastResults, { topN: 5 });
  }

  // 4. 批量请求合并
  async batchEmbed(texts: string[]) {
    // 最大并发 10 条，避免限流
    return chunk(texts, 10).flatMap(batch =>
      this.embeddingModel.embedBatch(batch)
    );
  }
}
```

---

## AI Agent 框架

### Agent 架构

```typescript
interface AIAgent {
  id: string;
  name: string;
  role: 'pet_consultant' | 'health_advisor' | 'matching_expert' | 'application_helper';
  systemPrompt: string;
  availableTools: Tool[];
  ragEnabled: boolean;
  knowledgeBaseIds: string[];
}

/**
 * 宠物顾问 Agent
 */
const petConsultantAgent: AIAgent = {
  id: 'pet_consultant',
  name: '小宠',
  role: 'pet_consultant',
  systemPrompt: `你是"小宠"，宠物领养平台的 AI 顾问助手。

你的职责：
1. 帮助用户了解宠物品种、性格、饲养要点
2. 回答养宠相关的日常问题
3. 引导用户找到合适的宠物
4. 提供领养后的护理建议

回答风格：
- 温暖、有爱心，像一个懂宠物的朋友
- 不用过于专业术语，要接地气
- 适当用 emoji 增加亲切感
- 如果不确定，坦诚说明，不要瞎说

当用户询问健康、医疗相关问题时：
- 建议咨询专业兽医
- 提供一般性知识参考
- 不要替代专业医疗建议`,
  availableTools: [
    'searchBreedKnowledge',
    'searchHealthKnowledge',
    'listPets',
    'getPetDetail',
    'searchSuccessStories',
  ],
  ragEnabled: true,
  knowledgeBaseIds: ['breed', 'health', 'stories'],
};

/**
 * 领养匹配 Expert Agent
 */
const matchingExpertAgent: AIAgent = {
  id: 'matching_expert',
  name: '小配',
  role: 'matching_expert',
  systemPrompt: `你是"小配"，宠物领养平台的 AI 匹配专家。

你的职责：
1. 通过提问了解用户的居住环境、生活习惯、偏好
2. 根据用户的画像推荐最合适的宠物
3. 解释为什么推荐这只宠物（可解释的 AI）
4. 帮助用户做好领养准备

匹配维度：
- 居住空间（公寓/house/有院子）
- 家庭成员（独居/有老人/有小孩/有其他宠物）
- 作息时间（朝九晚五/自由职业/经常出差）
- 运动习惯（爱运动/宅/无特殊要求）
- 过敏体质
- 养宠经验（新手/有经验）

推荐时给出匹配度分数和理由：
"根据您的情况，我推荐【豆豆】这只柯基，匹配度 92%。
理由：
✅ 柯基性格温顺，适合有孩子的家庭
✅ 您说家里有院子，柯基需要一定活动空间
⚠️ 需要注意：柯基掉毛较严重，建议每天梳毛"`,
  availableTools: [
    'getUserProfile',
    'getUserPreferences',
    'listPets',
    'calculateMatchScore',
    'getMatchReasons',
    'submitPreference',
  ],
  ragEnabled: true,
  knowledgeBaseIds: ['breed', 'adoption'],
};
```

### 工具定义 (Tools)

```typescript
/**
 * 可用工具定义
 */
const TOOLS = {
  // 知识库检索
  searchBreedKnowledge: {
    name: 'searchBreedKnowledge',
    description: '搜索宠物品种相关知识',
    parameters: {
      breed: { type: 'string', description: '宠物品种' },
      topic: { type: 'string', description: '想了解的具体话题' },
    },
  },

  searchHealthKnowledge: {
    name: 'searchHealthKnowledge',
    description: '搜索宠物健康护理相关知识',
    parameters: {
      category: { type: 'string', enum: ['vaccine', 'disease', 'nutrition', 'behavior', 'emergency'] },
      keywords: { type: 'string', description: '关键词' },
    },
  },

  searchSuccessStories: {
    name: 'searchSuccessStories',
    description: '搜索成功领养案例',
    parameters: {
      breed: { type: 'string', description: '品种（可选）' },
      limit: { type: 'number', default: 3 },
    },
  },

  // 宠物数据查询
  listPets: {
    name: 'listPets',
    description: '获取宠物列表',
    parameters: {
      filters: {
        type: 'object',
        properties: {
          breed: { type: 'string' },
          size: { type: 'string' },
          age: { type: 'string' },
          gender: { type: 'string' },
          location: { type: 'string' },
        },
      },
      limit: { type: 'number', default: 20 },
      offset: { type: 'number', default: 0 },
    },
  },

  getPetDetail: {
    name: 'getPetDetail',
    description: '获取宠物详细信息',
    parameters: {
      petId: { type: 'string', required: true },
    },
  },

  // 用户数据查询
  getUserProfile: {
    name: 'getUserProfile',
    description: '获取用户资料和偏好',
    parameters: {
      userId: { type: 'string', required: true },
    },
  },

  getFavorites: {
    name: 'getFavorites',
    description: '获取用户收藏的宠物',
    parameters: {
      userId: { type: 'string', required: true },
    },
  },

  // 匹配计算
  calculateMatchScore: {
    name: 'calculateMatchScore',
    description: '计算用户与宠物的匹配度',
    parameters: {
      userId: { type: 'string', required: true },
      petId: { type: 'string', required: true },
    },
  },

  getMatchReasons: {
    name: 'getMatchReasons',
    description: '获取推荐宠物的匹配理由',
    parameters: {
      userId: { type: 'string', required: true },
      petId: { type: 'string', required: true },
    },
  },

  // 申请相关
  getApplicationStatus: {
    name: 'getApplicationStatus',
    description: '获取用户领养申请状态',
    parameters: {
      userId: { type: 'string', required: true },
    },
  },

  validateApplication: {
    name: 'validateApplication',
    description: '预审用户领养申请',
    parameters: {
      userId: { type: 'string', required: true },
      petId: { type: 'string', required: true },
    },
  },
};
```

### 对话管理器 (Conversation Manager)

```typescript
interface ConversationSession {
  sessionId: string;
  userId: string;
  agentId: string;
  messages: Message[];
  context: {
    currentPet?: string;      // 当前正在了解的宠物
    currentStep?: string;    // 当前流程步骤
    preferences?: object;    // 已收集的偏好
  };
  createdAt: Date;
  updatedAt: Date;
}

class ConversationManager {
  private sessions: Map<string, ConversationSession>;

  async createSession(userId: string, agentId: string): Promise<string> {
    const sessionId = generateSessionId();
    this.sessions.set(sessionId, {
      sessionId,
      userId,
      agentId,
      messages: [],
      context: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return sessionId;
  }

  async addMessage(sessionId: string, message: Message) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    session.messages.push(message);
    session.updatedAt = new Date();

    // 持久化到数据库
    await db.conversation_logs.insert({
      session_id: sessionId,
      role: message.role,
      content: message.content,
      created_at: new Date(),
    });
  }

  async getHistory(sessionId: string, limit = 10): Promise<Message[]> {
    // 优先从内存取，内存没有则从数据库加载
    const session = this.sessions.get(sessionId);
    if (session) {
      return session.messages.slice(-limit);
    }

    // 从数据库加载历史
    const logs = await db.conversation_logs
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return logs.reverse().map(log => ({
      role: log.role,
      content: log.content,
    }));
  }

  async updateContext(sessionId: string, updates: Partial<ConversationSession['context']>) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    session.context = { ...session.context, ...updates };
    session.updatedAt = new Date();
  }
}
```

---

## 数据库扩展

### 新增表结构

```sql
-- AI 对话会话表
CREATE TABLE conversation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  agent_id VARCHAR(50) NOT NULL,  -- 'pet_consultant', 'matching_expert', etc.
  context JSONB DEFAULT '{}',      -- 会话上下文
  status VARCHAR(20) DEFAULT 'active',  -- 'active', 'closed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI 对话消息日志表
CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES conversation_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,       -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  intent_type VARCHAR(50),          -- 识别的意图类型
  model_used VARCHAR(50),          -- 使用的模型
  tokens_used INTEGER,             -- 消耗的 tokens
  latency_ms INTEGER,              -- 响应延迟
  metadata JSONB DEFAULT '{}',    -- 额外元数据
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI 工具调用日志表
CREATE TABLE tool_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES conversation_sessions(id) ON DELETE CASCADE,
  message_id UUID REFERENCES conversation_messages(id) ON DELETE CASCADE,
  tool_name VARCHAR(100) NOT NULL,
  tool_input JSONB,
  tool_output JSONB,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 知识库文档表
CREATE TABLE knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,  -- 'breed', 'health', 'adoption', 'story', 'platform'
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  source VARCHAR(100),             -- 来源
  metadata JSONB DEFAULT '{}',
  embedding_id VARCHAR(100),       -- 向量数据库中的 ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户偏好表（用于匹配）
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) UNIQUE,
  living_space VARCHAR(50),        -- 'apartment', 'house', 'house_with_yard'
  has_children BOOLEAN,
  has_elderly BOOLEAN,
  has_other_pets BOOLEAN,
  work_schedule VARCHAR(50),       -- '9to5', 'flexible', 'remote', 'frequent_travel'
  exercise_habit VARCHAR(50),     -- 'active', 'moderate', 'sedentary'
  allergy VARCHAR(100),
  experience_level VARCHAR(50),   -- 'none', 'some', 'experienced'
  preferred_size VARCHAR(50),     -- 'small', 'medium', 'large'
  preferred_age VARCHAR(50),      -- 'puppy', 'young', 'adult', 'senior'
  preferred_traits TEXT[],        -- ['calm', 'playful', 'friendly']
  completed_onboarding BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pet Agent 表（宠物数字分身）
CREATE TABLE pet_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id UUID REFERENCES dogs(id),
  generated_bio TEXT,
  personality_traits TEXT[],
  health_baseline JSONB,          -- 健康基线数据
  voice_style VARCHAR(50),         -- 声音风格
  status VARCHAR(20) DEFAULT 'active',
  last_active_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 向量索引（使用 pgvector 或 Supabase Vector）
ALTER TABLE knowledge_documents ADD COLUMN embedding vector(1536);

-- 创建向量索引
CREATE INDEX idx_knowledge_embedding ON knowledge_documents USING ivfflat (embedding vector_cosine_ops);

-- RLS 策略
ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 用户只能看到自己的会话
CREATE POLICY "Users can only view own sessions" ON conversation_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only view own messages" ON conversation_messages
  FOR ALL USING (
    session_id IN (SELECT id FROM conversation_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can only view own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);
```

---

## API 设计

### 新增 API 端点

```typescript
// routes/ai.js

/**
 * POST /api/ai/chat
 * AI 对话主入口
 */
router.post('/chat', requireAuth, async (req, res) => {
  const { message, sessionId, agentId } = req.body;

  // 1. 获取或创建会话
  let session;
  if (sessionId) {
    session = await conversationManager.getSession(sessionId);
  } else {
    const newSessionId = await conversationManager.createSession(req.user.id, agentId);
    session = await conversationManager.getSession(newSessionId);
  }

  // 2. 意图识别
  const intent = await intentClassifier.classify(message);

  // 3. 任务路由
  const route = taskRouter.route(intent);

  // 4. 执行 pipeline
  let response;
  switch (route.pipeline) {
    case 'qa':
      response = await qaPipeline.execute(message, session, route);
      break;
    case 'matching':
      response = await matchingPipeline.execute(message, session, route);
      break;
    case 'application':
      response = await applicationPipeline.execute(message, session, route);
      break;
    default:
      response = await chatPipeline.execute(message, session, route);
  }

  // 5. 返回结果
  res.json({
    success: true,
    data: {
      sessionId: session.id,
      message: response.content,
      intent: intent.type,
      usedTools: response.toolsUsed,
      sources: response.sources,  // RAG 引用来源
      suggestions: response.suggestions,  // 追问建议
    },
  });
});

/**
 * GET /api/ai/sessions
 * 获取用户的 AI 对话历史
 */
router.get('/sessions', requireAuth, async (req, res) => {
  const sessions = await db.conversation_sessions
    .select('*')
    .eq('user_id', req.user.id)
    .order('last_message_at', { ascending: false })
    .limit(20);

  res.json({ success: true, data: sessions });
});

/**
 * GET /api/ai/sessions/:sessionId/messages
 * 获取会话消息历史
 */
router.get('/sessions/:sessionId/messages', requireAuth, async (req, res) => {
  const messages = await conversationManager.getHistory(req.params.sessionId, 50);
  res.json({ success: true, data: messages });
});

/**
 * POST /api/ai/preferences
 * 保存用户偏好（用于匹配）
 */
router.post('/preferences', requireAuth, async (req, res) => {
  const preferences = req.body;

  const { data, error } = await db.user_preferences.upsert({
    user_id: req.user.id,
    ...preferences,
    updated_at: new Date(),
  }, {
    onConflict: 'user_id',
  });

  if (error) throw error;
  res.json({ success: true, data });
});

/**
 * GET /api/ai/preferences
 * 获取用户偏好
 */
router.get('/preferences', requireAuth, async (req, res) => {
  const { data } = await db.user_preferences
    .select('*')
    .eq('user_id', req.user.id)
    .single();

  res.json({ success: true, data });
});

/**
 * POST /api/ai/match
 * 获取宠物匹配推荐
 */
router.post('/match', requireAuth, async (req, res) => {
  const { topK = 5 } = req.body;

  // 1. 获取用户偏好
  const preferences = await getUserPreferences(req.user.id);
  if (!preferences) {
    return res.status(400).json({ error: '请先完成偏好设置' });
  }

  // 2. 向量检索匹配
  const userEmbedding = await embeddingModel.embed(JSON.stringify(preferences));
  const matchedPets = await vectorStore.search(userEmbedding, {
    index: 'pets',
    topK: topK,
    filters: { status: 'available' },
  });

  // 3. 获取详细信息并返回
  const results = await Promise.all(
    matchedPets.map(async ({ id, score }) => {
      const pet = await getPetDetail(id);
      const reasons = await getMatchReasons(req.user.id, id);
      return { ...pet, matchScore: score, reasons };
    })
  );

  res.json({ success: true, data: results });
});

/**
 * POST /api/ai/knowledge/query
 * 直接查询知识库（管理员用）
 */
router.post('/knowledge/query', requireAuth, requireAdmin, async (req, res) => {
  const { query, category, limit = 10 } = req.body;

  const results = await ragQuery(query, { category, topK: limit });
  res.json({ success: true, data: results });
});
```

---

## 实施路径

### Phase 1: 基础 RAG 能力（1-2周）

```
目标：让 AI 助手能够回答宠物知识问题
```

- [ ] 搭建向量数据库（Supabase Vector 或 Qdrant）
- [ ] 设计知识库 schema
- [ ] 实现文档分块和向量化 pipeline
- [ ] 实现基础 RAG 检索 + 生成
- [ ] 接入现有 AI 聊天界面

**里程碑**：用户问"柯基有什么常见疾病"，AI 能准确回答

---

### Phase 2: 意图识别 + 任务路由（1周）

```
目标：AI 能理解用户意图，分发到不同处理流程
```

- [ ] 设计意图分类模板
- [ ] 实现 Embedding + 相似度匹配
- [ ] 实现任务路由器
- [ ] 定义不同意图的处理 pipeline

**里程碑**：用户说"我想领养一只狗"，AI 自动进入匹配流程

---

### Phase 3: 宠物匹配 Agent（1周）

```
目标：AI 能通过对话了解用户偏好，推荐合适宠物
```

- [ ] 设计用户偏好收集问卷
- [ ] 实现匹配算法（向量检索 + 规则）
- [ ] 实现匹配理由生成
- [ ] 对接宠物数据

**里程碑**：用户完成 5 个问题，AI 推荐 3 只宠物并给出理由

---

### Phase 4: 多模型编排优化（1周）

```
目标：降低延迟、提升准确性
```

- [ ] 实现 Embedding 缓存
- [ ] 实现 BM25 + Vector 混合检索
- [ ] 实现 Rerank 模型精排
- [ ] 实现早退策略

**里程碑**：P95 延迟 < 1s，知识引用准确率 > 85%

---

### Phase 5: 对话上下文 + 记忆（1周）

```
目标：支持多轮对话，AI 记住之前的内容
```

- [ ] 实现会话管理
- [ ] 实现上下文窗口管理
- [ ] 实现会话持久化

**里程碑**：用户说"刚才那只呢"，AI 能理解指代

---

### Phase 6: 工具调用扩展（1周）

```
目标：AI 能执行实际操作（查宠物、查申请）
```

- [ ]