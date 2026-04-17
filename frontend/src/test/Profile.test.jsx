import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Profile from '../pages/Profile';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../config/api', () => ({
  API_BASE_URL: 'http://localhost:3000/api',
}));

vi.mock('../config/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'token-1',
          },
        },
      }),
    },
  },
}));

vi.mock('../components/BottomNav', () => ({
  default: () => <div>BottomNav</div>,
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      email: 'user@test.com',
      full_name: '测试用户',
      phone: '13800000000',
      bio: '给狗狗一个家',
    },
    logout: vi.fn(),
    hasPermission: vi.fn().mockReturnValue(false),
  }),
}));

describe('Profile badges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([{ id: 1 }]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            id: 'app-1',
            status: 'approved',
            created_at: '2026-04-17T03:00:00.000Z',
            full_name: '测试用户',
            phone: '13800000000',
            dogs: { name: 'Lucky' },
          },
        ]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([]),
      });
  });

  it('renders profile badges for verified info and approved adoption progress', async () => {
    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('测试用户')).toBeInTheDocument();
    });

    expect(screen.getByText('资料已完善')).toBeInTheDocument();
    expect(screen.getByText('领养申请通过')).toBeInTheDocument();
  });
});
