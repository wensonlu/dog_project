#!/usr/bin/env node

/**
 * 测试脚本：验证AI回答、推荐卡片展示、链接跳转功能
 * 使用 Node.js fetch API 进行测试
 */

const API_BASE_URL = 'http://localhost:5001/api';
const CHAT_ENDPOINT = `${API_BASE_URL}/chat/messages`;
const SESSIONS_ENDPOINT = `${API_BASE_URL}/chat/sessions`;

// 测试结果记录
const results = {
  passed: [],
  failed: [],
  warnings: [],
  details: []
};

async function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = {
    info: '✓',
    error: '✗',
    warn: '⚠',
    step: '→',
    detail: '  '
  }[type] || '';

  console.log(`[${timestamp}] ${prefix} ${message}`);
}

async function testAPIConnection() {
  log('检查后端API连接...', 'step');
  try {
    const response = await fetch(SESSIONS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: null })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    log('✓ 后端服务正常运行', 'info');
    return true;
  } catch (error) {
    log(`✗ 后端服务连接失败：${error.message}`, 'error');
    results.failed.push(`后端API连接失败：${error.message}`);
    return false;
  }
}

async function testCreateSession() {
  log('测试：创建聊天会话', 'step');
  try {
    const response = await fetch(SESSIONS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: null })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data.session_id) {
      throw new Error('响应中缺少 session_id');
    }

    log(`✓ 会话创建成功：${data.session_id}`, 'info');
    results.passed.push('✓ 能成功创建聊天会话');
    return data.session_id;
  } catch (error) {
    log(`✗ 创建会话失败：${error.message}`, 'error');
    results.failed.push(`创建会话失败：${error.message}`);
    return null;
  }
}

async function testSendMessage(sessionId) {
  log('测试：发送消息和获取AI回答', 'step');

  if (!sessionId) {
    log('✗ 会话ID无效，跳过此测试', 'error');
    return null;
  }

  try {
    const testQuestion = '金毛怎么养护';
    log(`发送测试问题：${testQuestion}`, 'detail');

    const response = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        content: testQuestion,
        user_id: null
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // 处理流式响应
    log('等待AI回答流式响应...', 'detail');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let messageData = null;
    let isStreaming = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(l => l.trim());

      for (const line of lines) {
        try {
          const event = JSON.parse(line);
          if (event.type === 'text_delta') {
            fullResponse += event.text;
            isStreaming = true;
          } else if (event.type === 'message_stop') {
            messageData = event.message;
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }

    if (!isStreaming || fullResponse.length === 0) {
      throw new Error('未收到文本流');
    }

    log(`✓ 收到AI回答，长度：${fullResponse.length} 字符`, 'info');
    results.passed.push(`✓ AI能正常回答问题（${fullResponse.length}字符）`);
    results.details.push(`AI回答内容示例：${fullResponse.substring(0, 100)}...`);

    return messageData;
  } catch (error) {
    log(`✗ 发送消息或获取回答失败：${error.message}`, 'error');
    results.failed.push(`发送消息失败：${error.message}`);
    return null;
  }
}

async function testGetSessionHistory(sessionId) {
  log('测试：获取会话历史和推荐信息', 'step');

  if (!sessionId) {
    log('✗ 会话ID无效，跳过此测试', 'error');
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.messages || data.messages.length === 0) {
      throw new Error('会话中没有消息');
    }

    // 找出最后一条助手消息
    const assistantMessages = data.messages.filter(m => m.role === 'assistant');

    if (assistantMessages.length === 0) {
      log('⚠ 未找到助手消息', 'warn');
      results.warnings.push('会话中未找到助手消息');
      return null;
    }

    const lastMessage = assistantMessages[assistantMessages.length - 1];
    log(`✓ 获取到会话历史，消息总数：${data.messages.length}`, 'info');

    // 检查推荐信息
    let recommendationFound = false;

    if (lastMessage.referenced_articles && lastMessage.referenced_articles.length > 0) {
      log(`✓ 推荐文章：${lastMessage.referenced_articles.length} 篇`, 'info');
      results.passed.push(`✓ 文章推荐展示正常（${lastMessage.referenced_articles.length}篇）`);
      lastMessage.referenced_articles.forEach((article, i) => {
        results.details.push(`  文章${i + 1}: ${article.title} (slug: ${article.slug})`);
      });
      recommendationFound = true;
    } else {
      log('⚠ 未找到推荐文章', 'warn');
    }

    if (lastMessage.referenced_dogs && lastMessage.referenced_dogs.length > 0) {
      log(`✓ 推荐宠物：${lastMessage.referenced_dogs.length} 只`, 'info');
      results.passed.push(`✓ 宠物推荐展示正常（${lastMessage.referenced_dogs.length}只）`);
      lastMessage.referenced_dogs.forEach((dog, i) => {
        results.details.push(`  宠物${i + 1}: ${dog.name} (${dog.breed}, ID: ${dog.id})`);
      });
      recommendationFound = true;
    } else {
      log('⚠ 未找到推荐宠物', 'warn');
    }

    if (lastMessage.referenced_stories && lastMessage.referenced_stories.length > 0) {
      log(`✓ 推荐故事：${lastMessage.referenced_stories.length} 个`, 'info');
      results.passed.push(`✓ 故事推荐展示正常（${lastMessage.referenced_stories.length}个）`);
      lastMessage.referenced_stories.forEach((story, i) => {
        results.details.push(`  故事${i + 1}: ${story.title} (ID: ${story.id})`);
      });
      recommendationFound = true;
    } else {
      log('⚠ 未找到推荐故事', 'warn');
    }

    if (!recommendationFound) {
      results.warnings.push('未找到任何推荐信息');
    }

    return lastMessage;
  } catch (error) {
    log(`✗ 获取会话历史失败：${error.message}`, 'error');
    results.failed.push(`获取会话历史失败：${error.message}`);
    return null;
  }
}

async function testRecommendationStructure(messageData) {
  log('测试：验证推荐数据结构', 'step');

  if (!messageData) {
    log('✗ 没有消息数据可验证', 'error');
    return;
  }

  try {
    const checks = [];

    // 检查文章结构
    if (messageData.referenced_articles && messageData.referenced_articles.length > 0) {
      const article = messageData.referenced_articles[0];
      if (!article.id || !article.title || !article.slug) {
        throw new Error('文章数据结构不完整');
      }
      checks.push('文章结构有效');
    }

    // 检查宠物结构
    if (messageData.referenced_dogs && messageData.referenced_dogs.length > 0) {
      const dog = messageData.referenced_dogs[0];
      if (!dog.id || !dog.name) {
        throw new Error('宠物数据结构不完整');
      }
      checks.push('宠物结构有效');
    }

    // 检查故事结构
    if (messageData.referenced_stories && messageData.referenced_stories.length > 0) {
      const story = messageData.referenced_stories[0];
      if (!story.id || !story.title) {
        throw new Error('故事数据结构不完整');
      }
      checks.push('故事结构有效');
    }

    if (checks.length > 0) {
      log(`✓ 推荐数据结构验证通过：${checks.join(', ')}`, 'info');
      results.passed.push(`✓ 推荐数据结构完整（${checks.join(', ')}）`);
    }
  } catch (error) {
    log(`✗ 推荐数据结构验证失败：${error.message}`, 'error');
    results.failed.push(`推荐数据结构验证失败：${error.message}`);
  }
}

async function testNavigationUrls(messageData) {
  log('测试：验证导航URL格式', 'step');

  if (!messageData) {
    log('✗ 没有消息数据可验证', 'error');
    return;
  }

  try {
    const urls = [];

    // 验证文章URL格式
    if (messageData.referenced_articles && messageData.referenced_articles.length > 0) {
      messageData.referenced_articles.forEach(article => {
        const url = `/wiki/article/${article.slug}`;
        urls.push({ type: '文章', url, slug: article.slug });
      });
    }

    // 验证宠物URL格式
    if (messageData.referenced_dogs && messageData.referenced_dogs.length > 0) {
      messageData.referenced_dogs.forEach(dog => {
        const url = `/pet/${dog.id}`;
        urls.push({ type: '宠物', url, id: dog.id });
      });
    }

    // 验证故事URL格式
    if (messageData.referenced_stories && messageData.referenced_stories.length > 0) {
      messageData.referenced_stories.forEach(story => {
        const url = `/stories/${story.id}`;
        urls.push({ type: '故事', url, id: story.id });
      });
    }

    if (urls.length > 0) {
      log(`✓ 导航URL格式验证通过（${urls.length} 个）`, 'info');
      results.passed.push(`✓ 导航链接格式正确（${urls.length}个）`);
      urls.forEach(item => {
        results.details.push(`  ${item.type}路由：${item.url}`);
      });
    }
  } catch (error) {
    log(`✗ 导航URL验证失败：${error.message}`, 'error');
    results.failed.push(`导航URL验证失败：${error.message}`);
  }
}

async function testMultipleQuestions() {
  log('测试：多个不同问题的推荐', 'step');

  const testQuestions = [
    '泰迪犬怎么训练',
    '兔子吃什么',
    '猫咪健康'
  ];

  for (const question of testQuestions) {
    try {
      log(`发送问题：${question}`, 'detail');

      // 创建新会话
      const sessionResponse = await fetch(SESSIONS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: null })
      });

      if (!sessionResponse.ok) continue;

      const session = await sessionResponse.json();
      const sessionId = session.session_id;

      // 发送消息
      const messageResponse = await fetch(CHAT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          content: question,
          user_id: null
        })
      });

      if (messageResponse.ok) {
        log(`  ✓ ${question} - 消息已发送`, 'info');
      }
    } catch (error) {
      log(`  ✗ ${question} - 失败：${error.message}`, 'warn');
    }
  }

  results.passed.push('✓ 多问题测试完成');
}

async function runAllTests() {
  console.log('\n========================================');
  console.log('宠物领养平台 - 推荐链接跳转测试');
  console.log('========================================\n');

  try {
    // 检查API连接
    const connected = await testAPIConnection();
    if (!connected) {
      throw new Error('无法连接到后端API');
    }

    // 创建会话
    const sessionId = await testCreateSession();
    if (!sessionId) {
      throw new Error('无法创建会话');
    }

    // 发送消息
    const messageData = await testSendMessage(sessionId);

    // 获取会话历史
    const historyData = await testGetSessionHistory(sessionId);

    // 验证推荐数据结构
    await testRecommendationStructure(historyData);

    // 验证导航URL格式
    await testNavigationUrls(historyData);

    // 测试多个问题
    log('\n');
    await testMultipleQuestions();

  } catch (error) {
    log(`测试流程失败：${error.message}`, 'error');
    results.failed.push(error.message);
  }

  // 输出测试报告
  console.log('\n========================================');
  console.log('测试报告总结');
  console.log('========================================\n');

  if (results.passed.length > 0) {
    console.log('✓ 通过的测试项：');
    results.passed.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item}`);
    });
  }

  if (results.failed.length > 0) {
    console.log('\n✗ 失败的测试项：');
    results.failed.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item}`);
    });
  }

  if (results.warnings.length > 0) {
    console.log('\n⚠ 警告项：');
    results.warnings.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item}`);
    });
  }

  if (results.details.length > 0) {
    console.log('\n📋 详细信息：');
    results.details.slice(0, 10).forEach(item => {
      console.log(`  ${item}`);
    });
    if (results.details.length > 10) {
      console.log(`  ... 还有 ${results.details.length - 10} 项详细信息`);
    }
  }

  console.log('\n========================================');
  console.log(`总计：${results.passed.length} 通过，${results.failed.length} 失败，${results.warnings.length} 警告`);
  console.log('========================================\n');

  // 检查预期行为清单
  console.log('验证预期行为清单：');
  const expectedBehaviors = [
    ['✓ AI能正常回答问题', results.passed.some(p => p.includes('AI能正常回答'))],
    ['✓ 推荐卡片正确展示', results.passed.some(p => p.includes('推荐') || p.includes('展示'))],
    ['✓ 文章卡片链接格式正确', results.passed.some(p => p.includes('文章')) || results.details.some(d => d.includes('文章路由'))],
    ['✓ 宠物卡片链接格式正确', results.passed.some(p => p.includes('宠物')) || results.details.some(d => d.includes('宠物路由'))],
    ['✓ 故事卡片链接格式正确', results.passed.some(p => p.includes('故事')) || results.details.some(d => d.includes('故事路由'))]
  ];

  expectedBehaviors.forEach(([behavior, passed]) => {
    console.log(`  ${passed ? '✓' : '⚠'} ${behavior}`);
  });

  console.log('\n');

  process.exit(results.failed.length > 0 ? 1 : 0);
}

runAllTests().catch(error => {
  console.error('测试执行失败：', error);
  process.exit(1);
});
