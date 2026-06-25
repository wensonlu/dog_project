const test = require('node:test');
const assert = require('node:assert/strict');

const { createAgentPlan } = require('../utils/agentPlanner');

test('creates an executable plan from LLM JSON and requires user confirmation', async () => {
  const plan = await createAgentPlan({
    content: '这条讨论挺有价值，帮我支持一下并补一句谢谢分享',
    context: {
      route: '/forum/topic-1',
      userId: 'user-123',
    },
    aiRuntime: {
      model: 'fake-model',
      generateText: async () => ({
        text: JSON.stringify({
          intent: 'community.interaction',
          title: '论坛互动计划',
          summary: '点赞当前帖子并发布评论。',
          confidence: 0.86,
          steps: [
            {
              id: 'resolve-topic',
              tool: 'forum.resolve_topic',
              label: '定位当前帖子',
              args: { useCurrentTopic: true },
            },
            {
              id: 'like-topic',
              tool: 'forum.like_topic',
              label: '点赞帖子',
              args: {},
            },
            {
              id: 'comment-topic',
              tool: 'forum.comment_topic',
              label: '发布评论',
              args: { content: '谢谢分享' },
            },
          ],
        }),
      }),
    },
  });

  assert.equal(plan.ok, true);
  assert.equal(plan.source, 'llm');
  assert.equal(plan.requiresConfirmation, true);
  assert.equal(plan.plan.intent, 'community.interaction');
  assert.equal(plan.plan.steps.length, 3);
  assert.equal(plan.plan.steps[1].tool, 'forum.like_topic');
  assert.equal(plan.plan.steps[1].risk, 'write');
  assert.equal(plan.plan.steps[1].confirmation, 'soft_confirm');
  assert.equal(plan.plan.steps[2].confirmation, 'soft_confirm');
});

test('rejects plans that contain tools outside the allowlist', async () => {
  const plan = await createAgentPlan({
    content: '帮我执行危险动作',
    aiRuntime: {
      model: 'fake-model',
      generateText: async () => ({
        text: JSON.stringify({
          intent: 'unknown',
          title: '危险计划',
          summary: '尝试使用未授权工具。',
          steps: [
            {
              id: 'unsafe',
              tool: 'system.run_shell',
              label: '运行命令',
              args: { command: 'rm -rf /' },
            },
          ],
        }),
      }),
    },
  });

  assert.equal(plan.ok, false);
  assert.equal(plan.reason, 'planner_invalid');
  assert.match(plan.error, /not allowed/i);
});

test('parses MiniMax thinking blocks before planner JSON', async () => {
  const plan = await createAgentPlan({
    content: '帮我给当前帖子点赞',
    aiRuntime: {
      model: 'fake-model',
      generateText: async () => ({
        text: `<think>
I may mention an internal JSON-like object here: {"scratchpad": true}
</think>
{
  "intent": "community.interaction",
  "title": "论坛互动计划",
  "summary": "点赞当前帖子。",
  "confidence": 0.9,
  "steps": [
    {
      "id": "resolve-topic",
      "tool": "forum.resolve_topic",
      "label": "定位当前帖子",
      "args": { "useCurrentTopic": true }
    },
    {
      "id": "like-topic",
      "tool": "forum.like_topic",
      "label": "点赞帖子",
      "args": {}
    }
  ]
}`,
      }),
    },
  });

  assert.equal(plan.ok, true);
  assert.deepEqual(plan.plan.steps.map((step) => step.tool), [
    'forum.resolve_topic',
    'forum.like_topic',
  ]);
});

test('routes capability questions to the assistant capability agent without confirmation', async () => {
  const plan = await createAgentPlan({
    content: '你会什么',
    context: {
      route: '/',
    },
    aiRuntime: null,
  });

  assert.equal(plan.ok, true);
  assert.equal(plan.source, 'affinity_funnel');
  assert.equal(plan.requiresConfirmation, false);
  assert.equal(plan.confirmation, 'none');
  assert.equal(plan.plan.intent, 'chat.capabilities');
  assert.equal(plan.plan.agent, 'assistant_capability_agent');
  assert.deepEqual(plan.plan.routing.affinityFunnel, [
    'capability',
    'assistant_capability_agent',
  ]);
  assert.deepEqual(plan.plan.steps.map((step) => step.tool), ['chat.append_message']);
  assert.match(plan.plan.steps[0].args.content, /点赞|评论|下单/);
});

test('does not call the LLM planner for deterministic capability questions', async () => {
  const plan = await createAgentPlan({
    content: '你能做什么',
    context: {
      route: '/',
    },
    aiRuntime: {
      model: 'fake-model',
      generateText: async () => {
        throw new Error('provider requires messages');
      },
    },
  });

  assert.equal(plan.ok, true);
  assert.equal(plan.source, 'affinity_funnel');
  assert.equal(plan.requiresConfirmation, false);
  assert.equal(plan.plan.intent, 'chat.capabilities');
  assert.equal(plan.plan.agent, 'assistant_capability_agent');
});
