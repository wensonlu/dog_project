import { fireEvent, render, screen } from '@testing-library/react';
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

describe('BottomNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    platform.native = false;
    platform.name = 'web';
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

  it('opens RN preview entries from the native iOS RN tab', () => {
    platform.native = true;
    platform.name = 'ios';
    const originalLocation = window.location;
    delete window.location;
    window.location = { href: '' };

    try {
      render(<BottomNav />);

      fireEvent.click(screen.getByLabelText('打开 RN 预览入口'));
      fireEvent.click(screen.getByText('内容中心'));

      expect(window.location.href).toBe('dogproject://content');
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
