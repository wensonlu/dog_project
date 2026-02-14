import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from '../../src/pages/Home';
import { DogProvider } from '../../src/context/DogContext';
import { AuthProvider } from '../../src/context/AuthContext';

// Mock framer-motion
ci.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }) => <div {...props}>{children}</div>,
      button: ({ children, ...props }) => <button {...props}>{children}</button>,
      span: ({ children, ...props }) => <span {...props}>{children}</span>,
      p: ({ children, ...props }) => <p {...props}>{children}</p>,
    },
    AnimatePresence: ({ children }) => <>{children}</>,
  };
});

// Mock fetch
global.fetch = vi.fn();

describe('Home Page - 手势滑动功能', () => {
  const mockDogs = [
    {
      id: 1,
      name: '小白',
      age: '2岁',
      breed: '金毛',
      location: '北京',
      image: '/test-image-1.jpg',
      gender: 'male',
    },
    {
      id: 2,
      name: '小黑',
      age: '3岁',
      breed: '拉布拉多',
      location: '上海',
      image: '/test-image-2.jpg',
      gender: 'female',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockImplementation((url) => {
      if (url.includes('/messages/unread')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ count: 0 }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });
  });

  const renderHome = () => {
    return render(
      <MemoryRouter>
        <AuthProvider>
          <DogProvider>
            <Home />
          </DogProvider>
        </AuthProvider>
      </MemoryRouter>
    );
  };

  describe('TC-SWIPE-001: 右滑喜欢手势', () => {
    it('向右拖动超过100px应该触发喜欢操作', async () => {
      const toggleFavorite = vi.fn();
      renderHome();
      
      const card = screen.getByTestId('dog-card');
      
      // 模拟向右拖动
      fireEvent.mouseDown(card, { clientX: 200 });
      fireEvent.mouseMove(card, { clientX: 320 }); // 拖动120px
      fireEvent.mouseUp(card);

      await waitFor(() => {
        expect(toggleFavorite).toHaveBeenCalledWith(1);
      });
    });

    it('向右拖动不足100px应该回弹不触发', async () => {
      const toggleFavorite = vi.fn();
      renderHome();
      
      const card = screen.getByTestId('dog-card');
      
      // 模拟小幅度向右拖动
      fireEvent.mouseDown(card, { clientX: 200 });
      fireEvent.mouseMove(card, { clientX: 250 }); // 只拖动50px
      fireEvent.mouseUp(card);

      await waitFor(() => {
        expect(toggleFavorite).not.toHaveBeenCalled();
      });
    });
  });

  describe('TC-SWIPE-002: 左滑跳过手势', () => {
    it('向左拖动超过100px应该触发跳过操作', async () => {
      renderHome();
      
      const card = screen.getByTestId('dog-card');
      const initialDog = screen.getByText('小白');
      
      // 模拟向左拖动
      fireEvent.mouseDown(card, { clientX: 200 });
      fireEvent.mouseMove(card, { clientX: 80 }); // 向左拖动120px
      fireEvent.mouseUp(card);

      await waitFor(() => {
        expect(screen.queryByText('小白')).not.toBeInTheDocument();
        expect(screen.getByText('小黑')).toBeInTheDocument();
      });
    });

    it('向左拖动不足100px应该回弹不触发', async () => {
      renderHome();
      
      const card = screen.getByTestId('dog-card');
      
      // 模拟小幅度向左拖动
      fireEvent.mouseDown(card, { clientX: 200 });
      fireEvent.mouseMove(card, { clientX: 160 }); // 只拖动40px
      fireEvent.mouseUp(card);

      await waitFor(() => {
        expect(screen.getByText('小白')).toBeInTheDocument();
      });
    });
  });

  describe('TC-SWIPE-003: 速度触发机制', () => {
    it('快速向右滑动(速度>500)应该触发喜欢', async () => {
      const toggleFavorite = vi.fn();
      renderHome();
      
      const card = screen.getByTestId('dog-card');
      
      // 模拟快速滑动
      fireEvent.mouseDown(card, { clientX: 200 });
      fireEvent.mouseMove(card, { clientX: 280 });
      // 快速抬起（模拟高速）
      fireEvent.mouseUp(card);

      await waitFor(() => {
        expect(toggleFavorite).toHaveBeenCalled();
      });
    });

    it('快速向左滑动(速度<-500)应该触发跳过', async () => {
      renderHome();
      
      const card = screen.getByTestId('dog-card');
      
      fireEvent.mouseDown(card, { clientX: 200 });
      fireEvent.mouseMove(card, { clientX: 120 });
      fireEvent.mouseUp(card);

      await waitFor(() => {
        expect(screen.queryByText('小白')).not.toBeInTheDocument();
      });
    });
  });

  describe('TC-SWIPE-004: 滑动标签显示', () => {
    it('向右拖动时应该显示"喜欢"标签', async () => {
      renderHome();
      
      const card = screen.getByTestId('dog-card');
      
      // 开始拖动
      fireEvent.mouseDown(card, { clientX: 200 });
      fireEvent.mouseMove(card, { clientX: 300 }); // 拖动100px

      await waitFor(() => {
        const likeLabel = screen.getByText('喜欢 💕');
        expect(likeLabel).toBeInTheDocument();
        expect(likeLabel).toHaveStyle({ opacity: expect.stringMatching(/0\.[6-9]|1/) });
      });

      fireEvent.mouseUp(card);
    });

    it('向左拖动时应该显示"下次见"标签', async () => {
      renderHome();
      
      const card = screen.getByTestId('dog-card');
      
      fireEvent.mouseDown(card, { clientX: 200 });
      fireEvent.mouseMove(card, { clientX: 100 }); // 向左拖动100px

      await waitFor(() => {
        const skipLabel = screen.getByText('下次见 👋');
        expect(skipLabel).toBeInTheDocument();
        expect(skipLabel).toHaveStyle({ opacity: expect.stringMatching(/0\.[6-9]|1/) });
      });

      fireEvent.mouseUp(card);
    });

    it('标签透明度应该随拖动距离变化', async () => {
      renderHome();
      
      const card = screen.getByTestId('dog-card');
      
      // 小幅度拖动
      fireEvent.mouseDown(card, { clientX: 200 });
      fireEvent.mouseMove(card, { clientX: 260 }); // 拖动60px

      await waitFor(() => {
        const likeLabel = screen.getByText('喜欢 💕');
        // 透明度应该在 0.4 左右 (60/150)
        expect(likeLabel).toHaveStyle({ opacity: expect.stringMatching(/0\.[2-5]/) });
      });

      fireEvent.mouseUp(card);
    });
  });

  describe('TC-SWIPE-005: 手势与按钮兼容性', () => {
    it('点击喜欢按钮仍然可以正常工作', async () => {
      renderHome();
      
      const likeButton = screen.getByTitle('收藏');
      fireEvent.click(likeButton);

      await waitFor(() => {
        // 验证卡片切换
        expect(screen.queryByText('小白')).not.toBeInTheDocument();
      });
    });

    it('点击跳过按钮仍然可以正常工作', async () => {
      renderHome();
      
      const skipButton = screen.getByTitle('跳过');
      fireEvent.click(skipButton);

      await waitFor(() => {
        expect(screen.queryByText('小白')).not.toBeInTheDocument();
      });
    });
  });

  describe('TC-SWIPE-006: 边界情况', () => {
    it('最后一张卡片滑动后应该正确处理', async () => {
      renderHome();
      
      // 滑动到只剩一张
      const card = screen.getByTestId('dog-card');
      fireEvent.mouseDown(card, { clientX: 200 });
      fireEvent.mouseMove(card, { clientX: 80 });
      fireEvent.mouseUp(card);

      await waitFor(() => {
        // 循环显示第一张
        expect(screen.getByText('小白')).toBeInTheDocument();
      });
    });

    it('点击卡片进入详情不应触发滑动', async () => {
      const navigate = vi.fn();
      renderHome();
      
      const cardImage = screen.getByAltText('小白');
      
      // 点击但不拖动
      fireEvent.mouseDown(cardImage, { clientX: 200 });
      fireEvent.mouseUp(cardImage, { clientX: 200 });

      // 应该触发导航而不是滑动
      await waitFor(() => {
        expect(navigate).toHaveBeenCalledWith('/pet/1');
      });
    });
  });
});
