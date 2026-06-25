import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ChatAssistant from '../components/ChatAssistant';
import { TaskProvider } from '../context/TaskContext';

const mockNavigate = vi.fn();
const mockSetMessages = vi.fn();
const mockSendMessage = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'tester@example.com' },
  }),
}));

vi.mock('../hooks/useChatSession', () => ({
  useChatSession: () => ({
    sessionId: 'session-123',
    loading: false,
  }),
}));

vi.mock('../hooks/useChat', () => ({
  useChat: () => ({
    messages: [],
    loading: false,
    error: null,
    sendMessage: mockSendMessage,
    regenerateLastReply: vi.fn(),
    stopGeneration: vi.fn(),
    setMessages: mockSetMessages,
  }),
}));

vi.mock('../config/api', () => ({
  AGENT_API: {
    PLAN: 'http://api.test/agent/plan',
  },
  FORUM_API: {
    LIST: 'http://api.test/forum',
    PRECHECK_REPLY: 'http://api.test/forum/precheck/reply',
    CONFIRM_REPLY: 'http://api.test/forum/confirm/reply',
    VERIFY_INTERACTION: 'http://api.test/forum/verify-interaction',
    DRAFT_REPLY: 'http://api.test/forum/draft-reply',
  },
  SHOP_API: {
    CREATE_ORDER: 'http://api.test/shop/orders',
  },
}));

function renderAssistant() {
  return render(
    <TaskProvider>
      <ChatAssistant />
    </TaskProvider>
  );
}

function openAssistant() {
  fireEvent.click(screen.getByTitle('打开聊天助手'));
}

function sendCommand(text) {
  fireEvent.change(screen.getByPlaceholderText('问我任何宠物相关的问题...'), {
    target: { value: text },
  });
  fireEvent.click(screen.getByTitle('发送'));
}

function plannerResponse(plan) {
  return Promise.resolve({
    ok: true,
    json: async () => ({
      ok: true,
      source: 'llm',
      requiresConfirmation: true,
      plan,
    }),
  });
}

describe('ChatAssistant action authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.removeAttribute('style');
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    window.scrollTo = vi.fn();
    window.fetch = vi.fn((url) => {
      if (url === 'http://api.test/agent/plan') {
        return plannerResponse({
          intent: 'community.interaction',
          title: '论坛互动计划',
          summary: '点赞第一个帖子并发布评论。',
          steps: [
            {
              id: 'resolve-topic',
              tool: 'forum.resolve_topic',
              label: '定位目标帖子',
              args: { targetIndex: 1 },
              risk: 'read',
              confirmation: 'soft_confirm',
            },
            {
              id: 'like-topic',
              tool: 'forum.like_topic',
              label: '点赞帖子',
              args: {},
              risk: 'write',
              confirmation: 'soft_confirm',
            },
            {
              id: 'comment-topic',
              tool: 'forum.comment_topic',
              label: '发布评论',
              args: { content: '支持你，写得很好' },
              risk: 'public_write',
              confirmation: 'soft_confirm',
            },
          ],
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({
          items: [
            {
              id: 'topic-1',
              title: '新手领养准备',
              likes: 3,
              comments: 1,
            },
          ],
        }),
      });
    });
  });

  it('requires user authorization before executing forum write actions', async () => {
    renderAssistant();
    openAssistant();

    sendCommand('帮我给第一个帖子点赞并评论：支持你，写得很好');

    expect(await screen.findByRole('dialog', { name: /授权 AI 执行论坛互动/ })).toBeInTheDocument();
    expect(screen.getByText('点赞帖子')).toBeInTheDocument();
    expect(screen.getByText('发布评论')).toBeInTheDocument();
    expect(window.fetch).toHaveBeenCalledTimes(1);
    expect(window.fetch).toHaveBeenCalledWith(
      'http://api.test/agent/plan',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('locks the background page scroll while the assistant sheet is open', async () => {
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 240,
    });

    renderAssistant();
    openAssistant();

    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.top).toBe('-240px');
    expect(document.body.style.width).toBe('100%');
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.click(screen.getByTitle('关闭'));

    await waitFor(() => {
      expect(document.body.style.position).toBe('');
    });
    expect(document.body.style.top).toBe('');
    expect(document.body.style.width).toBe('');
    expect(window.scrollTo).toHaveBeenCalledWith(0, 240);
  });

  it('requires user authorization before navigating through the AI shop order flow', async () => {
    window.fetch = vi.fn((url) => {
      if (url === 'http://api.test/agent/plan') {
        return plannerResponse({
          intent: 'commerce.ordering',
          title: '商城下单计划',
          summary: '选择主粮并前往订单确认页。',
          steps: [
            {
              id: 'select-product',
              tool: 'shop.select_product',
              label: '选择商品',
              args: { productId: 'food-001', quantity: 1 },
              risk: 'decision',
              confirmation: 'soft_confirm',
            },
            {
              id: 'open-checkout',
              tool: 'shop.open_checkout',
              label: '进入订单页',
              args: { productId: 'food-001', quantity: 1 },
              risk: 'purchase_decision',
              confirmation: 'hard_confirm',
            },
          ],
        });
      }

      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    renderAssistant();
    openAssistant();

    sendCommand('帮我买一份主粮并下单');

    const dialog = await screen.findByRole('dialog', { name: /确认 AI 购买方案/ });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getAllByText('幼犬低敏主粮 2kg').length).toBeGreaterThan(0);
    expect(within(dialog).getByText('合计 ¥129')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalledWith(expect.stringContaining('/shop/order'));
  });

  it('uses the LLM planner for flexible intents that do not match legacy command keywords', async () => {
    renderAssistant();
    openAssistant();

    sendCommand('这条讨论挺有价值，帮我支持一下并补一句谢谢分享');

    expect(await screen.findByRole('dialog', { name: /授权 AI 执行论坛互动/ })).toBeInTheDocument();
    expect(screen.getByText('点赞帖子')).toBeInTheDocument();
    expect(screen.getByText('发布评论')).toBeInTheDocument();
    expect(window.fetch).toHaveBeenCalledWith(
      'http://api.test/agent/plan',
      expect.objectContaining({
        body: expect.stringContaining('这条讨论挺有价值'),
      })
    );
  });

  it('answers capability questions through the planner without calling the chat stream endpoint', async () => {
    window.fetch = vi.fn((url) => {
      if (url === 'http://api.test/agent/plan') {
        return plannerResponse({
          intent: 'chat.capabilities',
          agent: 'assistant_capability_agent',
          title: '助手能力说明',
          summary: '说明宠物小助手当前可以做的事情。',
          steps: [
            {
              id: 'answer-capabilities',
              tool: 'chat.append_message',
              label: '说明助手能力',
              args: {
                content: '我可以帮你找宠物、总结帖子、草拟回复，也可以在你授权后执行点赞、评论、关注和进入订单页。'
              },
              risk: 'read',
              confirmation: 'none',
            },
          ],
        });
      }

      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    renderAssistant();
    openAssistant();

    await act(async () => {
      sendCommand('你会什么');
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(mockSetMessages).toHaveBeenCalled();
    });
    expect(mockSendMessage).not.toHaveBeenCalled();

    const appendUpdate = mockSetMessages.mock.calls.at(-1)[0];
    const appendedMessages = appendUpdate([]);
    expect(appendedMessages[0]).toEqual(expect.objectContaining({
      role: 'assistant',
      content: expect.stringContaining('我可以帮你找宠物'),
    }));
  });

  it('falls back locally for capability questions when the planner is unavailable', async () => {
    window.fetch = vi.fn((url) => {
      if (url === 'http://api.test/agent/plan') {
        return Promise.resolve({
          ok: false,
          statusText: 'Internal Server Error',
          json: async () => ({
            ok: false,
            reason: 'planner_failed',
            error: 'provider requires messages',
          }),
        });
      }

      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    renderAssistant();
    openAssistant();

    await act(async () => {
      sendCommand('你会什么');
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(mockSetMessages).toHaveBeenCalled();
    });
    expect(mockSendMessage).not.toHaveBeenCalled();

    const appendUpdate = mockSetMessages.mock.calls.at(-1)[0];
    const appendedMessages = appendUpdate([]);
    expect(appendedMessages[0].content).toContain('智能操作');
  });
});
