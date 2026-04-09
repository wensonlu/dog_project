/**
 * 测试 AI API 配置是否可用
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// 从 .env 加载环境变量
import dotenv from 'dotenv';
dotenv.config();

console.log('测试配置:');
console.log('- AI_BASE_URL:', process.env.AI_BASE_URL);
console.log('- AI_API_KEY:', process.env.AI_API_KEY ? `${process.env.AI_API_KEY.slice(0, 10)}...` : '未设置');

// 创建 GLM provider
const glm = createOpenAI({
  baseURL: process.env.AI_BASE_URL,
  apiKey: process.env.AI_API_KEY,
  compatibility: 'compatible',
});

async function testAI() {
  try {
    console.log('\n开始测试 AI API...');

    const { text } = await generateText({
      model: glm.chat('glm-5'),
      prompt: '你好，请用一句话介绍你自己。',
      maxTokens: 50,
    });

    console.log('\n✅ API 调用成功！');
    console.log('响应内容:', text);
    console.log('\n配置验证通过，可以正常使用 GLM-5 API');

  } catch (error) {
    console.error('\n❌ API 调用失败:');
    console.error('错误信息:', error.message);

    if (error.message.includes('401')) {
      console.log('\n可能原因:');
      console.log('1. API_KEY 不正确');
      console.log('2. API_KEY 权限不足');
    } else if (error.message.includes('404')) {
      console.log('\n可能原因:');
      console.log('1. BASE_URL 不正确');
      console.log('2. API endpoint 路径错误');
    } else if (error.message.includes('timeout')) {
      console.log('\n可能原因:');
      console.log('1. 网络连接问题');
      console.log('2. API 服务响应慢');
    }

    console.log('\n建议检查:');
    console.log('1. .env 文件格式是否正确');
    console.log('2. API_KEY 和 BASE_URL 是否与官方文档一致');
    console.log('3. 网络是否能访问 API endpoint');
  }
}

testAI();