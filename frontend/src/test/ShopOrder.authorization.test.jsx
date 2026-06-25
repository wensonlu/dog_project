import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ShopOrder from '../pages/ShopOrder';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'tester@example.com' },
  }),
}));

vi.mock('../config/api', () => ({
  SHOP_API: {
    CREATE_ORDER: 'http://api.test/shop/orders',
  },
  CHALLENGE_API: {
    CREATE: 'http://api.test/challenge',
  },
}));

function renderOrderPage() {
  return render(
    <MemoryRouter initialEntries={['/shop/order?productId=food-001&quantity=2&source=ai-assistant&agentAuthorizationId=auth-123']}>
      <ShopOrder />
    </MemoryRouter>
  );
}

function fillAddress() {
  fireEvent.change(screen.getByPlaceholderText('收货人'), { target: { value: '王小明' } });
  fireEvent.change(screen.getByPlaceholderText('手机号'), { target: { value: '13800000000' } });
  fireEvent.change(screen.getByPlaceholderText('省市区'), { target: { value: '上海市 徐汇区' } });
  fireEvent.change(screen.getByPlaceholderText('详细地址（街道/门牌号）'), { target: { value: '漕溪北路 1 号' } });
}

describe('ShopOrder order authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.alert = vi.fn();
    window.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ order: { id: 'order-123' } }),
    });
  });

  it('requires a strong confirmation before creating an AI-assisted direct order', async () => {
    renderOrderPage();
    fillAddress();

    const directOrderButtons = screen.getAllByRole('button', { name: '直接购买' });
    fireEvent.click(directOrderButtons[directOrderButtons.length - 1]);

    const dialog = await screen.findByRole('dialog', { name: /确认创建订单/ });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('幼犬低敏主粮 2kg')).toBeInTheDocument();
    expect(within(dialog).getByText('数量 x 2')).toBeInTheDocument();
    expect(within(dialog).getByText('合计 ¥258')).toBeInTheDocument();
    expect(window.fetch).not.toHaveBeenCalled();
  });

  it('requires confirmation before creating a challenge task from checkout', async () => {
    render(
      <MemoryRouter initialEntries={['/shop/order?productId=food-001&quantity=1&topicId=topic-1']}>
        <ShopOrder />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: '去打卡任务页' }));

    const dialog = await screen.findByRole('dialog', { name: /确认创建打卡任务/ });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('幼犬低敏主粮 2kg')).toBeInTheDocument();
    expect(within(dialog).getByText('7天用品打卡')).toBeInTheDocument();
    expect(window.fetch).not.toHaveBeenCalled();
  });
});
