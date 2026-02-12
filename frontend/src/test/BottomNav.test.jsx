import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

// Mock useNavigate and useLocation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/' }),
  };
});

describe('BottomNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all navigation items', () => {
    render(
      <BrowserRouter>
        <BottomNav />
      </BrowserRouter>
    );

    // Check if all nav items are rendered by their text
    expect(screen.getByText('探索')).toBeInTheDocument();
    expect(screen.getByText('论坛')).toBeInTheDocument();
    expect(screen.getByText('消息')).toBeInTheDocument();
    expect(screen.getByText('我的')).toBeInTheDocument();
    
    // Center button doesn't have text "发布", it has icon
    // Check that we have 5 buttons total
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(5);
  });

  it('opens add menu when center button is clicked', async () => {
    render(
      <BrowserRouter>
        <BottomNav />
      </BrowserRouter>
    );

    // Find the center button by its distinctive class
    const buttons = screen.getAllByRole('button');
    const centerButton = buttons.find(btn => 
      btn.className.includes('rounded-full') && 
      btn.className.includes('bg-primary')
    );
    
    expect(centerButton).toBeDefined();
    
    await act(async () => {
      fireEvent.click(centerButton);
    });

    // Check if menu items appear
    await waitFor(() => {
      expect(screen.getByText('选择发布类型')).toBeInTheDocument();
      expect(screen.getByText('发布送养')).toBeInTheDocument();
      expect(screen.getByText('发布帖子')).toBeInTheDocument();
      expect(screen.getByText('取消')).toBeInTheDocument();
    });
  });

  it('navigates to submit-dog when 发布送养 is clicked', async () => {
    render(
      <BrowserRouter>
        <BottomNav />
      </BrowserRouter>
    );

    // Open menu
    const buttons = screen.getAllByRole('button');
    const centerButton = buttons.find(btn => 
      btn.className.includes('rounded-full') && 
      btn.className.includes('bg-primary')
    );
    
    await act(async () => {
      fireEvent.click(centerButton);
    });

    // Wait for menu to appear and click 发布送养
    await waitFor(() => {
      const submitDogButton = screen.getByText('发布送养');
      expect(submitDogButton).toBeInTheDocument();
    });

    const submitDogButton = screen.getByText('发布送养');
    await act(async () => {
      fireEvent.click(submitDogButton);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/submit-dog');
  });

  it('navigates to forum/create when 发布帖子 is clicked', async () => {
    render(
      <BrowserRouter>
        <BottomNav />
      </BrowserRouter>
    );

    // Open menu
    const buttons = screen.getAllByRole('button');
    const centerButton = buttons.find(btn => 
      btn.className.includes('rounded-full') && 
      btn.className.includes('bg-primary')
    );
    
    await act(async () => {
      fireEvent.click(centerButton);
    });

    // Wait for menu to appear and click 发布帖子
    await waitFor(() => {
      const createTopicButton = screen.getByText('发布帖子');
      expect(createTopicButton).toBeInTheDocument();
    });

    const createTopicButton = screen.getByText('发布帖子');
    await act(async () => {
      fireEvent.click(createTopicButton);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/forum/create');
  });

  it('closes menu when 取消 is clicked', async () => {
    render(
      <BrowserRouter>
        <BottomNav />
      </BrowserRouter>
    );

    // Open menu
    const buttons = screen.getAllByRole('button');
    const centerButton = buttons.find(btn => 
      btn.className.includes('rounded-full') && 
      btn.className.includes('bg-primary')
    );
    
    await act(async () => {
      fireEvent.click(centerButton);
    });

    await waitFor(() => {
      expect(screen.getByText('发布送养')).toBeInTheDocument();
    });

    // Click cancel
    const cancelButton = screen.getByText('取消');
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    // Menu should be closed
    await waitFor(() => {
      expect(screen.queryByText('发布送养')).not.toBeInTheDocument();
    });
  });
});
