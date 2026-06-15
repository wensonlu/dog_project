import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BottomNav from '../components/BottomNav';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/' }),
}));

describe('BottomNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the current five bottom tabs', () => {
    render(<BottomNav />);

    ['探索', '论坛', '商城', '故事', '我的'].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
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
