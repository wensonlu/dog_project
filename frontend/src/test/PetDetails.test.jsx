import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PetDetails from '../pages/PetDetails';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '1' }),
  };
});

// Mock DogContext
vi.mock('../context/DogContext', () => ({
  useDogs: () => ({
    DOGS: [
      {
        id: 1,
        name: 'Buddy',
        age: '2岁',
        breed: '金毛',
        location: '北京',
        image: 'https://example.com/dog1.jpg',
      },
    ],
  }),
}));

// Mock API_BASE_URL
vi.mock('../config/api', () => ({
  API_BASE_URL: 'http://localhost:3000/api',
}));

// Mock fetch
global.fetch = vi.fn();

describe('PetDetails - Related Topics Section', () => {
  beforeEach(() => {
    fetch.mockClear();
    mockNavigate.mockClear();
  });

  it('renders related topics section', async () => {
    // Mock empty response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <PetDetails />
        </BrowserRouter>
      );
    });

    // Check if section title is rendered
    expect(screen.getByText('💬 相关讨论')).toBeInTheDocument();
  });

  it('shows loading state initially', async () => {
    fetch.mockImplementationOnce(() => new Promise(() => {})); // Never resolve

    await act(async () => {
      render(
        <BrowserRouter>
          <PetDetails />
        </BrowserRouter>
      );
    });

    // Should show loading indicator
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('displays related topics when data is loaded', async () => {
    const mockTopics = [
      {
        id: 1,
        title: 'Buddy 的领养经历',
        content: 'Buddy 是一只非常可爱的金毛...',
        author_name: '爱心人士',
        comment_count: 5,
      },
      {
        id: 2,
        title: '金毛犬饲养指南',
        content: '金毛需要每天运动...',
        author_name: '宠物专家',
        comment_count: 12,
      },
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTopics,
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <PetDetails />
        </BrowserRouter>
      );
    });

    // Wait for topics to load
    await waitFor(() => {
      expect(screen.getByText('Buddy 的领养经历')).toBeInTheDocument();
    });

    expect(screen.getByText('金毛犬饲养指南')).toBeInTheDocument();
    expect(screen.getByText('(2)')).toBeInTheDocument(); // Topic count
  });

  it('shows "发起讨论" button when no related topics', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <PetDetails />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('暂无相关讨论')).toBeInTheDocument();
    });

    expect(screen.getByText('发起讨论 →')).toBeInTheDocument();
  });

  it('navigates to forum create when 发起讨论 is clicked', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <PetDetails />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('发起讨论 →')).toBeInTheDocument();
    });

    const createButton = screen.getByText('发起讨论 →');
    await act(async () => {
      fireEvent.click(createButton);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/forum/create', {
      state: { dogId: '1', dogName: 'Buddy' },
    });
  });

  it('navigates to topic detail when a topic is clicked', async () => {
    const mockTopics = [
      {
        id: 1,
        title: 'Buddy 的领养经历',
        content: 'Buddy 是一只非常可爱的金毛...',
        author_name: '爱心人士',
        comment_count: 5,
      },
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTopics,
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <PetDetails />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Buddy 的领养经历')).toBeInTheDocument();
    });

    const topicTitle = screen.getByText('Buddy 的领养经历');
    await act(async () => {
      fireEvent.click(topicTitle);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/forum/1');
  });

  it('shows "查看全部" button when there are more than 3 topics', async () => {
    const mockTopics = Array(5).fill(null).map((_, i) => ({
      id: i + 1,
      title: `话题 ${i + 1}`,
      content: '内容...',
      author_name: '用户',
      comment_count: i,
    }));

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTopics,
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <PetDetails />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('查看全部 5 个讨论 →')).toBeInTheDocument();
    });
  });
});
