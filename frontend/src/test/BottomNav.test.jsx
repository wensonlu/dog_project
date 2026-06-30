import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BottomNav from '../components/BottomNav';

const mockNavigate = vi.fn();
const platform = vi.hoisted(() => ({ native: false, name: 'web' }));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/' }),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => platform.native,
    getPlatform: () => platform.name,
  },
}));

const dogContext = vi.hoisted(() => ({
  dogs: [{ id: 7, name: '小胖' }],
}));

vi.mock('../context/DogContext', () => ({
  useDogs: () => ({ DOGS: dogContext.dogs }),
}));

describe('BottomNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    platform.native = false;
    platform.name = 'web';
    dogContext.dogs = [{ id: 7, name: '小胖' }];
    window.localStorage.clear();
  });

  it('renders the current five bottom tabs outside native iOS', () => {
    render(<BottomNav />);

    ['探索', '论坛', '商城', '故事', '我的'].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
    expect(screen.queryByText('RN')).not.toBeInTheDocument();
  });

  it('adds the RN tab inside the native iOS app', () => {
    platform.native = true;
    platform.name = 'ios';

    render(<BottomNav />);

    expect(screen.getByText('RN')).toBeInTheDocument();
    expect(screen.getByLabelText('打开 RN 预览入口')).toBeInTheDocument();
  });

  it('opens RN preview entries from the native iOS RN tab', async () => {
    platform.native = true;
    platform.name = 'ios';
    const originalLocation = window.location;
    delete window.location;
    window.location = { href: '' };

    try {
      render(<BottomNav />);

      fireEvent.click(screen.getByLabelText('打开 RN 预览入口'));
      fireEvent.click(screen.getByText('内容中心'));

      await waitFor(() => {
        expect(window.location.href).toBe('dogproject://content');
      });
    } finally {
      window.location = originalLocation;
    }
  });

  it('opens pet detail RN preview with the first loaded dog id', async () => {
    platform.native = true;
    platform.name = 'ios';
    const originalLocation = window.location;
    delete window.location;
    window.location = { href: '' };

    try {
      render(<BottomNav />);

      fireEvent.click(screen.getByLabelText('打开 RN 预览入口'));
      fireEvent.click(screen.getByText('宠物详情'));

      await waitFor(() => {
        expect(window.location.href).toBe('dogproject://pet/7');
      });
    } finally {
      window.location = originalLocation;
    }
  });

  it('opens forum detail RN preview with the known seeded topic id 16', async () => {
    platform.native = true;
    platform.name = 'ios';
    const originalLocation = window.location;
    delete window.location;
    window.location = { href: '' };

    try {
      render(<BottomNav />);

      fireEvent.click(screen.getByLabelText('打开 RN 预览入口'));
      fireEvent.click(screen.getByText('论坛详情'));

      await waitFor(() => {
        expect(window.location.href).toBe('dogproject://forum/16');
      });
    } finally {
      window.location = originalLocation;
    }
  });

  it('opens forum list RN preview from the native iOS RN tab', async () => {
    platform.native = true;
    platform.name = 'ios';
    const originalLocation = window.location;
    delete window.location;
    window.location = { href: '' };

    try {
      render(<BottomNav />);

      fireEvent.click(screen.getByLabelText('打开 RN 预览入口'));
      fireEvent.click(screen.getByText('论坛列表'));

      await waitFor(() => {
        expect(window.location.href).toBe('dogproject://forum');
      });
    } finally {
      window.location = originalLocation;
    }
  });

  it('opens RN forum detail with a mobile auth ticket when the H5 app is logged in', async () => {
    platform.native = true;
    platform.name = 'ios';
    window.localStorage.setItem('pawmate_session', JSON.stringify({ access_token: 'token-123' }));
    window.localStorage.setItem('pawmate_user', JSON.stringify({ id: 'user-7' }));
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ticket: 'ticket-abc' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const originalLocation = window.location;
    delete window.location;
    window.location = { href: '' };

    try {
      render(<BottomNav />);

      fireEvent.click(screen.getByLabelText('打开 RN 预览入口'));
      fireEvent.click(screen.getByText('论坛详情'));

      await waitFor(() => {
        expect(window.location.href).toBe('dogproject://forum/16?ticket=ticket-abc');
      });
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/auth/mobile-ticket'), expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer token-123' }),
      }));
    } finally {
      window.location = originalLocation;
      vi.unstubAllGlobals();
    }
  });

  it('does not open pet detail RN preview before dog data is loaded', () => {
    platform.native = true;
    platform.name = 'ios';
    dogContext.dogs = [];
    const originalLocation = window.location;
    delete window.location;
    window.location = { href: '' };

    try {
      render(<BottomNav />);

      fireEvent.click(screen.getByLabelText('打开 RN 预览入口'));
      const petButton = screen.getByRole('button', { name: /宠物详情/ });

      expect(petButton).toBeDisabled();
      expect(window.location.href).toBe('');
    } finally {
      window.location = originalLocation;
    }
  });

  it('keeps the story tab in the H5 application', () => {
    render(<BottomNav />);

    fireEvent.click(screen.getByText('故事'));

    expect(mockNavigate).toHaveBeenCalledWith('/content');
  });

  it('keeps normal H5 navigation for the other tabs', () => {
    render(<BottomNav />);

    fireEvent.click(screen.getByText('论坛'));

    expect(mockNavigate).toHaveBeenCalledWith('/forum');
  });
});
