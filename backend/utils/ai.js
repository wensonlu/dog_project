/**
 * AI 工具函数
 * 封装 AI SDK 调用，提供成本监控和错误处理
 */

import { generateText } from 'ai';

// 模型配置 - 使用 AI Gateway 格式
// 格式: "provider/model" - AI SDK 自动路由到 AI Gateway
const MODELS = {
  // 高质量模型（用于简历生成、图像分析）
  sonnet: 'anthropic/claude-sonnet-4.6',
  // 快速便宜模型（用于健康建议）
  haiku: 'anthropic/claude-haiku-4.5',
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
      model: MODELS.sonnet,
      prompt,
    });

    // 解析 JSON 响应
    const result = JSON.parse(text);

    const duration = Date.now() - startTime;

    return {
      bio: result.bio,
      traits: result.traits,
      duration,
      model: MODELS.sonnet,
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
      model: MODELS.haiku,
      prompt,
    });

    const duration = Date.now() - startTime;

    return {
      advice: text.trim(),
      duration,
      model: MODELS.haiku,
    };
  } catch (error) {
    console.error('生成健康建议失败:', error);
    throw new Error(`生成健康建议失败: ${error.message}`);
  }
}