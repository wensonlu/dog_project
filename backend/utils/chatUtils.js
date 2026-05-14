// backend/utils/chatUtils.js

const { getSupabaseClient } = require('./supabaseClient');

function normalizeQuery(input) {
  return String(input || '').trim().replace(/\s+/g, ' ');
}

function escapeLikeQuery(input) {
  return input.replace(/[,%_]/g, ' ');
}

function dedupeById(items) {
  const seen = new Set();
  return (items || []).filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function buildIlikeClauses(columns, rawText) {
  const text = String(rawText || '').trim();
  const base = [];
  if (text) {
    columns.forEach((col) => base.push(`${col}.ilike.%${text}%`));
  }

  const tokens = text
    .split(/[\s,，。！？、;；]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
    .slice(0, 6);

  tokens.forEach((token) => {
    columns.forEach((col) => base.push(`${col}.ilike.%${token}%`));
  });

  return [...new Set(base)].join(',');
}

/**
 * 搜索相关上下文（Wiki文章 + 宠物 + 故事）
 * @param {string} userMessage - 用户输入的问题
 * @param {Object} req - Express请求对象
 * @returns {Promise<Object>} - { articles, dogs, stories, topics }
 */
async function searchContext(userMessage, req) {
  try {
    const supabase = getSupabaseClient(req);
    const normalized = normalizeQuery(userMessage);
    const likeKeyword = escapeLikeQuery(normalized);

    if (!normalized) {
      return { articles: [], dogs: [], stories: [], topics: [] };
    }

    // 1. 搜索 Wiki 文章 (3条)
    let { data: articles, error: articlesError } = await supabase
      .from('wiki_articles')
      .select('id, title, summary, slug, content')
      .eq('is_published', true)
      .textSearch('fts', normalized)  // fts是全文搜索字段
      .limit(3);

    if (articlesError) {
      console.error('Search articles error:', articlesError);
      articles = [];
    }

    // FTS无结果时，回退到ILike检索，避免因为分词导致完全找不到
    if (!articles || articles.length === 0) {
      const { data: fallbackArticles, error: fallbackArticlesError } = await supabase
        .from('wiki_articles')
        .select('id, title, summary, slug, content')
        .eq('is_published', true)
        .or(`title.ilike.%${likeKeyword}%,summary.ilike.%${likeKeyword}%,content.ilike.%${likeKeyword}%`)
        .limit(3);

      if (fallbackArticlesError) {
        console.error('Fallback search articles error:', fallbackArticlesError);
      } else {
        articles = fallbackArticles || [];
      }
    }

    // 2. 搜索宠物数据 (2条)
    const { data: dogs, error: dogsError } = await supabase
      .from('dogs')
      .select('id, name, breed, description, age, temperament')
      .or(`breed.ilike.%${likeKeyword}%,temperament.ilike.%${likeKeyword}%,description.ilike.%${likeKeyword}%`)
      .limit(2);

    if (dogsError) {
      console.error('Search dogs error:', dogsError);
    }

    // 3. 搜索故事案例 (2条)
    const { data: stories, error: storiesError } = await supabase
      .from('stories')
      .select('id, title, content')
      .eq('is_published', true)
      .or(`title.ilike.%${likeKeyword}%,content.ilike.%${likeKeyword}%`)
      .limit(2);

    if (storiesError) {
      console.error('Search stories error:', storiesError);
    }

    // 4. 搜索论坛话题 (5条)
    const topicOr = buildIlikeClauses(['title', 'content'], likeKeyword);
    let topics = [];
    let topicsError = null;

    if (topicOr) {
      const topicsResp = await supabase
        .from('forum_topics')
        .select('id, title, content, category, tags, likes_count, comments_count, created_at')
        .or(topicOr)
        .order('likes_count', { ascending: false })
        .order('comments_count', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(8);
      topics = topicsResp.data || [];
      topicsError = topicsResp.error || null;
    }

    if (topicsError) {
      console.error('Search topics error:', topicsError);
    }

    return {
      articles: dedupeById(articles),
      dogs: dedupeById(dogs),
      stories: dedupeById(stories),
      topics: dedupeById(topics)
    };
  } catch (error) {
    console.error('Search context error:', error);
    return { articles: [], dogs: [], stories: [], topics: [] };
  }
}

/**
 * 构造系统提示词
 * @param {Object} context - { articles, dogs, stories, topics }
 * @returns {string} - 系统提示词
 */
function constructSystemPrompt(context) {
  const { articles, dogs, stories, topics } = context;

  let prompt = `你是宠物领养平台的智能助手。你的职责是：
1. 基于平台数据准确回答关于宠物品种、养护、疾病的问题
2. 指导用户完成领养申请流程
3. 推荐相关资源帮助用户做出决策

【平台相关信息】

`;

  if (articles.length > 0) {
    prompt += `相关Wiki文章：\n`;
    articles.forEach((article, i) => {
      prompt += `${i + 1}. "${article.title}": ${article.summary}\n`;
    });
    prompt += '\n';
  }

  if (dogs.length > 0) {
    prompt += `平台相似宠物：\n`;
    dogs.forEach((dog, i) => {
      prompt += `${i + 1}. ${dog.name}(${dog.breed}, ${dog.age}岁): ${dog.temperament || dog.description}\n`;
    });
    prompt += '\n';
  }

  if (stories.length > 0) {
    prompt += `成功案例：\n`;
    stories.forEach((story, i) => {
      const excerpt = story.content.slice(0, 100).replace(/\n/g, ' ');
      prompt += `${i + 1}. ${story.title}: ${excerpt}...\n`;
    });
    prompt += '\n';
  }

  if (topics.length > 0) {
    prompt += `论坛相关讨论：\n`;
    topics.forEach((topic, i) => {
      const excerpt = String(topic.content || '').slice(0, 90).replace(/\n/g, ' ');
      prompt += `${i + 1}. [${topic.category || '未分类'}] ${topic.title}（赞${topic.likes_count || 0}/评${topic.comments_count || 0}）: ${excerpt}...\n`;
    });
    prompt += '\n';
  }

  prompt += `【回答规则】
- 用友好、专业的语气回答
- 优先基于平台数据回答，如果平台无相关数据则基于通用知识回答
- 不要说“我无法访问平台数据/论坛数据”；你已经拿到了平台检索结果
- 若检索结果为空，明确说“当前未检索到相关帖子”，并给出可执行的下一步检索建议
- 鼓励用户探索推荐的资源
- 对于领养流程问题，提供清晰的步骤指导
- 回答简洁，避免超过300字`;

  return prompt;
}

/**
 * 格式化引用资源为JSONB
 * @param {Object} context - { articles, dogs, stories, topics }
 * @returns {Object} - { referenced_articles, referenced_dogs, referenced_stories, referenced_topics }
 */
function formatReferences(context) {
  const { articles, dogs, stories, topics } = context;

  return {
    referenced_articles: articles.map(a => ({ id: a.id, title: a.title, slug: a.slug })) || null,
    referenced_dogs: dogs.map(d => ({ id: d.id, name: d.name, breed: d.breed })) || null,
    referenced_stories: stories.map(s => ({ id: s.id, title: s.title })) || null,
    referenced_topics: topics.map(t => ({ id: t.id, title: t.title })) || null
  };
}

module.exports = {
  searchContext,
  constructSystemPrompt,
  formatReferences
};
