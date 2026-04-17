import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Admin from '../pages/Admin';

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

describe('Admin reject templates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.alert = vi.fn();
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            id: 'app-1',
            user_id: 'user-1',
            dog_name: 'Lucky',
            full_name: '测试申请人',
            phone: '13800000000',
            address: '北京市朝阳区',
            housing_type: '公寓',
            has_pets: false,
            created_at: '2026-04-17T03:00:00.000Z',
            status: 'pending',
          },
        ]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([]),
      });
  });

  it('opens reject template sheet and submits selected reason', async () => {
    render(
      <BrowserRouter>
        <Admin />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('测试申请人')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '拒绝' }));

    expect(screen.getByText('选择拒绝原因模板')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /居住条件暂不匹配/i }));
    fireEvent.click(screen.getByRole('button', { name: '确认拒绝' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/applications/app-1/reject',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            userId: 'user-1',
            dogName: 'Lucky',
            reason: '居住条件暂不匹配',
          }),
        })
      );
    });
  });
});
