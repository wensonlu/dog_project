/**
 * AI 工具函数
 * 封装 AI SDK 调用，提供成本监控和错误处理
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// 自定义 GLM-5 provider - 从环境变量读取配置
const glm = createOpenAI({
  baseURL: process.env.AI_BASE_URL,
  apiKey: process.env.AI_API_KEY,
  compatibility: 'compatible', // 使用兼容模式，强制 chat completions API
});

// 模型配置
const MODELS = {
  // GLM-5 模型
  glm5: glm.chat('glm-5'), // 使用 .chat() 明确指定 chat completions
};

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
export async function generatePetBio({ name, breed, age, gender, photoUrl }) {
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
      model: MODELS.glm5,
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
export async function generateHealthAdvice({ breed, age, recordType, description }) {
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
      model: MODELS.glm5,
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