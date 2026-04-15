/**
 * AI 工具函数
 * 封装 AI SDK 调用，提供成本监控和错误处理
 */

const { generateText } = require('ai');
const { createOpenAI } = require('@ai-sdk/openai');

function getGlmModel() {
  const glm = createOpenAI({
    baseURL: process.env.AI_BASE_URL,
    apiKey: process.env.AI_API_KEY,
    compatibility: 'compatible',
  });
  return glm.chat('glm-5');
}

/**
 * 生成宠物简历
 * @param {Object} params
 * @param {string} params.name - 宠物名称
 * @param {string} params.breed - 品种
 * @param {string} params.age - 年龄
 * @param {string} params.gender - 性别
 * @param {string} [params.photoUrl] - 照片URL（可选）
 * @returns {Promise<{bio: string, traits: string[]}>}
 */
async function generatePetBio({ name, breed, age, gender, photoUrl }) {
  const startTime = Date.now();

  try {
    const prompt = photoUrl
      ? `请为这只宠物生成一段吸引人的领养简历。

宠物信息：
- 名称：${name}
- 品种：${breed}
- 年龄：${age}
- 性别：${gender}
- 照片：${photoUrl}

请根据照片和基本信息，生成：
1. 一段200-300字的领养简历，突出这只宠物的特点和魅力
2. 3-5个性格标签（如：活泼、亲人、爱玩球等）

请以JSON格式返回：
{
  "bio": "领养简历内容",
  "traits": ["标签1", "标签2", "标签3"]
}`
      : `请为这只宠物生成一段吸引人的领养简历。

宠物信息：
- 名称：${name}
- 品种：${breed}
- 年龄：${age}
- 性别：${gender}

请根据基本信息，生成：
1. 一段200-300字的领养简历，突出这只宠物的特点和魅力
2. 3-5个性格标签（如：活泼、亲人、爱玩球等）

请以JSON格式返回：
{
  "bio": "领养简历内容",
  "traits": ["标签1", "标签2", "标签3"]
}`;

    const { text } = await generateText({
      model: getGlmModel(),
      prompt,
    });

    // 打印原始响应以便调试
    console.log('AI 原始响应:', text);

    // 尝试提取 JSON（GLM-5 可能在 JSON 前后添加文本）
    let jsonStr = text;

    // 尝试找到 JSON 块
    const jsonMatch = text.match(/\{[\s\S]*"bio"[\s\S]*"traits"[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    // 解析 JSON 响应
    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON 解析失败，原始文本:', text);
      throw new Error('AI 返回的格式不正确，请重试');
    }

    // 验证必需字段
    if (!result.bio || !Array.isArray(result.traits)) {
      console.error('缺少必需字段:', result);
      throw new Error('AI 返回的数据格式不完整');
    }

    const duration = Date.now() - startTime;

    return {
      bio: result.bio,
      traits: result.traits,
      duration,
      model: 'glm-5',
    };
  } catch (error) {
    console.error('生成宠物简历失败:', error);
    throw new Error(`生成宠物简历失败: ${error.message}`);
  }
}

/**
 * 生成健康建议
 * @param {Object} params
 * @param {string} params.breed - 品种
 * @param {string} params.age - 年龄
 * @param {string} params.recordType - 记录类型（vaccine, deworming, checkup等）
 * @param {string} [params.description] - 记录描述
 * @returns {Promise<{advice: string}>}
 */
async function generateHealthAdvice({ breed, age, recordType, description }) {
  const startTime = Date.now();

  try {
    const prompt = `作为宠物健康顾问，请根据以下信息提供专业建议：

宠物信息：
- 品种：${breed}
- 年龄：${age}
- 记录类型：${recordType}
${description ? `- 详细信息：${description}` : ''}

请提供：
1. 针对这次健康记录的专业建议（100-200字）
2. 下一步需要注意的事项

直接返回建议文本即可。`;

    const { text } = await generateText({
      model: getGlmModel(),
      prompt,
    });

    const duration = Date.now() - startTime;

    return {
      advice: text.trim(),
      duration,
      model: 'glm-5',
    };
  } catch (error) {
    console.error('生成健康建议失败:', error);
    throw new Error(`生成健康建议失败: ${error.message}`);
  }
}

/**
 * 生成论坛话题内容
 * @param {string} keywords - 用户输入的关键词
 * @returns {Promise<{title: string, content: string, category: string, tags: string[], duration: number, model: string}>}
 */
async function generateTopicContent(keywords) {
  const startTime = Date.now();

  try {
    // 验证关键词长度
    if (!keywords || keywords.trim().length < 3) {
      throw new Error('关键词至少需要3个字符');
    }

    if (keywords.trim().length > 200) {
      throw new Error('关键词不能超过200个字符');
    }

    const prompt = `根据用户输入的关键词，生成一个完整的论坛话题。

关键词：${keywords}

请生成以下内容（以JSON格式返回）：
{
  "title": "吸引人的话题标题（10-30字）",
  "content": "话题正文内容（200-500字，鼓励互动）",
  "category": "领养经验|日常分享|求助问答",
  "tags": ["标签1", "标签2", "标签3"]
}

生成要求：
- 标题要吸引人，能引发讨论
- 内容要真诚、有温度，鼓励其他用户参与互动
- 分类要根据关键词内容智能判断：
  * 领养经验：分享领养故事、经验、建议
  * 日常分享：宠物日常、趣事、照片分享
  * 求助问答：提问、寻求帮助、咨询问题
- 标签要准确概括话题主题（3-5个）

请只返回JSON，不要包含其他文本。`;

    const { text } = await generateText({
      model: getGlmModel(),
      prompt,
    });

    console.log('AI 原始响应:', text);

    // 提取JSON块
    let jsonStr = text;
    const jsonMatch = text.match(/\{[\s\S]*"title"[\s\S]*"content"[\s\S]*"category"[\s\S]*"tags"[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    // 解析JSON响应
    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON 解析失败，原始文本:', text);
      throw new Error('AI 返回的格式不正确，请重试');
    }

    // 验证必需字段
    if (!result.title || !result.content || !result.category || !Array.isArray(result.tags)) {
      console.error('缺少必需字段:', result);
      throw new Error('AI 返回的数据格式不完整');
    }

    // 验证分类是否合法
    const validCategories = ['领养经验', '日常分享', '求助问答'];
    if (!validCategories.includes(result.category)) {
      // 尝试匹配最接近的分类
      if (result.category.includes('领养') || result.category.includes('经验')) {
        result.category = '领养经验';
      } else if (result.category.includes('日常') || result.category.includes('分享')) {
        result.category = '日常分享';
      } else if (result.category.includes('求助') || result.category.includes('问答')) {
        result.category = '求助问答';
      } else {
        result.category = '日常分享'; // 默认分类
      }
    }

    const duration = Date.now() - startTime;

    return {
      title: result.title,
      content: result.content,
      category: result.category,
      tags: result.tags,
      duration,
      model: 'glm-5',
    };
  } catch (error) {
    console.error('生成话题内容失败:', error);
    throw new Error(`生成话题内容失败: ${error.message}`);
  }
}

module.exports = {
  generatePetBio,
  generateHealthAdvice,
  generateTopicContent,
};
