// backend/utils/chatUtils.js

const { getSupabaseClient } = require('./supabaseClient');

/**
 * 搜索相关上下文（Wiki文章 + 宠物 + 故事）
 * @param {string} userMessage - 用户输入的问题
 * @param {Object} req - Express请求对象
 * @returns {Promise<Object>} - { articles, dogs, stories }
 */
async function searchContext(userMessage, req) {
  try {
    const supabase = getSupabaseClient(req);

    // 1. 搜索 Wiki 文章 (3条)
    const { data: articles, error: articlesError } = await supabase
      .from('wiki_articles')
      .select('id, title, summary, slug, content')
      .eq('is_published', true)
      .textSearch('fts', userMessage)  // fts是全文搜索字段
      .limit(3);

    if (articlesError) {
      console.error('Search articles error:', articlesError);
    }

    // 2. 搜索宠物数据 (2条)
    const { data: dogs, error: dogsError } = await supabase
      .from('dogs')
      .select('id, name, breed, description, age, temperament')
      .or(`breed.ilike.%${userMessage}%,temperament.ilike.%${userMessage}%,description.ilike.%${userMessage}%`)
      .limit(2);

    if (dogsError) {
      console.error('Search dogs error:', dogsError);
    }

    // 3. 搜索故事案例 (2条)
    const { data: stories, error: storiesError } = await supabase
      .from('stories')
      .select('id, title, content')
      .eq('is_published', true)
      .or(`title.ilike.%${userMessage}%,content.ilike.%${userMessage}%`)
      .limit(2);

    if (storiesError) {
      console.error('Search stories error:', storiesError);
    }

    return {
      articles: articles || [],
      dogs: dogs || [],
      stories: stories || []
    };
  } catch (error) {
    console.error('Search context error:', error);
    return { articles: [], dogs: [], stories: [] };
  }
}

/**
 * 构造系统提示词
 * @param {Object} context - { articles, dogs, stories }
 * @returns {string} - 系统提示词
 */
function constructSystemPrompt(context) {
  const { articles, dogs, stories } = context;

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

  prompt += `【回答规则】
- 用友好、专业的语气回答
- 优先基于平台数据回答，如果平台无相关数据则基于通用知识回答
- 鼓励用户探索推荐的资源
- 对于领养流程问题，提供清晰的步骤指导
- 回答简洁，避免超过300字`;

  return prompt;
}

/**
 * 格式化引用资源为JSONB
 * @param {Object} context - { articles, dogs, stories }
 * @returns {Object} - { referenced_articles, referenced_dogs, referenced_stories }
 */
function formatReferences(context) {
  const { articles, dogs, stories } = context;

  return {
    referenced_articles: articles.map(a => ({ id: a.id, title: a.title, slug: a.slug })) || null,
    referenced_dogs: dogs.map(d => ({ id: d.id, name: d.name, breed: d.breed })) || null,
    referenced_stories: stories.map(s => ({ id: s.id, title: s.title })) || null
  };
}

module.exports = {
  searchContext,
  constructSystemPrompt,
  formatReferences
};
