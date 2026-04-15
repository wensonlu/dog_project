/**
 * AI 工具函数
 * 封装 AI SDK 调用，提供成本监控和错误处理
 */

function isAiEnabled() {
  return process.env.AI_ENABLED === 'true';
}

function getAiRuntime() {
  const { generateText } = require('ai');
  const { createOpenAI } = require('@ai-sdk/openai');

  const glm = createOpenAI({
    baseURL: process.env.AI_BASE_URL,
    apiKey: process.env.AI_API_KEY,
    compatibility: 'compatible',
  });

  return {
    generateText,
    model: glm.chat('glm-5'),
  };
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

    let result;
    let modelName = 'mock-disabled';
    if (isAiEnabled()) {
      const { generateText, model } = getAiRuntime();
      const { text } = await generateText({ model, prompt });
      modelName = 'glm-5';

      console.log('AI 原始响应:', text);
      let jsonStr = text;
      const jsonMatch = text.match(/\{[\s\S]*"bio"[\s\S]*"traits"[\s\S]*\}/);
      if (jsonMatch) jsonStr = jsonMatch[0];
      result = JSON.parse(jsonStr);

      if (!result.bio || !Array.isArray(result.traits)) {
        throw new Error('AI 返回的数据格式不完整');
      }
    } else {
      result = {
        bio: `${name}是一只${gender === 'female' ? '可爱' : '阳光'}的${breed}，目前${age}。性格温和，亲人友好，适应力好，喜欢与人互动，也能在安静环境中放松休息。日常作息稳定，愿意学习新习惯，适合希望长期陪伴的家庭。领养后建议保持规律喂养与散步节奏，给予耐心和正向引导，相信它会很快成为家里不可或缺的一员。${photoUrl ? '已提供照片信息供参考。' : ''}`,
        traits: ['亲人', '温顺', '适应力强'],
      };
    }

    const duration = Date.now() - startTime;

    return {
      bio: result.bio,
      traits: result.traits,
      duration,
      model: modelName,
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

    const duration = Date.now() - startTime;
    if (isAiEnabled()) {
      const { generateText, model } = getAiRuntime();
      const { text } = await generateText({ model, prompt });
      return {
        advice: text.trim(),
        duration,
        model: 'glm-5',
      };
    }

    return {
      advice: `已记录${breed}${age}的${recordType}${description ? `（${description}）` : ''}。建议近期继续观察精神状态、食欲、排便与体温变化，按时复查并保留记录；如出现持续不适或异常反应，请尽快联系线下兽医进一步评估。`,
      duration,
      model: 'mock-disabled',
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

    const normalizedKeywords = keywords.trim();
    let result;
    let modelName = 'mock-disabled';
    if (isAiEnabled()) {
      const { generateText, model } = getAiRuntime();
      const { text } = await generateText({ model, prompt });
      modelName = 'glm-5';
      console.log('AI 原始响应:', text);

      let jsonStr = text;
      const jsonMatch = text.match(/\{[\s\S]*"title"[\s\S]*"content"[\s\S]*"category"[\s\S]*"tags"[\s\S]*\}/);
      if (jsonMatch) jsonStr = jsonMatch[0];
      result = JSON.parse(jsonStr);
      if (!result.title || !result.content || !result.category || !Array.isArray(result.tags)) {
        throw new Error('AI 返回的数据格式不完整');
      }
    } else {
      result = {
        title: `想聊聊：${normalizedKeywords.slice(0, 20)}`,
        content: `最近我在关注「${normalizedKeywords}」这个话题，想和大家交流一下真实经验。欢迎分享你们在日常照护、行为训练、领养准备或健康管理方面的做法，也欢迎说说踩过的坑和有效建议。希望这条帖子能帮到有类似困惑的朋友，一起把毛孩子照顾得更好。`,
        category: '日常分享',
        tags: normalizedKeywords.split(/\s+/).slice(0, 3),
      };
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
      model: modelName,
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
