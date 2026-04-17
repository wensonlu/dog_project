import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Application from '../pages/Application';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '42' }),
  };
});

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'user@test.com' },
  }),
}));

vi.mock('../config/api', () => ({
  API_BASE_URL: 'http://localhost:3000/api',
}));

describe('Application page timeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'application-1' }),
    });
  });

  it('shows application progress timeline after submit succeeds', async () => {
    render(
      <BrowserRouter>
        <Application />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('请输入真实姓名'), {
      target: { value: '测试用户' },
    });
    fireEvent.change(screen.getByPlaceholderText('请输入手机号码'), {
      target: { value: '13800000000' },
    });
    fireEvent.change(screen.getByPlaceholderText('请输入详细地址'), {
      target: { value: '上海市徐汇区' },
    });

    fireEvent.click(screen.getByRole('button', { name: /下一步/i }));
    fireEvent.click(screen.getByRole('button', { name: /提交申请/i }));

    await waitFor(() => {
      expect(screen.getByText('申请进度')).toBeInTheDocument();
    });

    expect(screen.getByText('已提交申请')).toBeInTheDocument();
    expect(screen.getAllByText('资料审核中').length).toBeGreaterThan(0);
    expect(screen.getByText('等待签约')).toBeInTheDocument();
    expect(screen.getByText('完成领养')).toBeInTheDocument();
    expect(screen.getAllByText('当前阶段').length).toBeGreaterThan(0);
  });
});
