# 🧪 汪星球前端测试文档

## 测试框架

- **Vitest** - Vite 原生测试框架
- **React Testing Library** - React 组件测试工具
- **jsdom** - 浏览器环境模拟

## 测试文件位置

```
frontend/src/test/
├── setup.js                    # 测试环境配置
├── BottomNav.test.jsx         # 底部导航测试
├── Home.test.jsx              # 首页测试
└── PetDetails.test.jsx        # 宠物详情页测试
```

## 运行测试

```bash
# 进入前端目录
cd frontend

# 运行所有测试
npm test

# 运行测试并监听文件变化（开发模式）
npm test -- --watch

# 运行特定测试文件
npm test -- BottomNav.test.jsx

# 生成测试覆盖率报告
npm run test:coverage

# 打开测试 UI 界面
npm run test:ui
```

## 测试覆盖范围

### ✅ BottomNav 组件
- [x] 渲染所有导航项
- [x] 点击"+"按钮弹出菜单
- [x] 点击"发布送养"导航正确
- [x] 点击"发布帖子"导航正确
- [x] 点击"取消"关闭菜单

### ✅ Home 页面
- [x] 渲染快速申请按钮
- [x] 点击快速申请跳转正确
- [x] 渲染消息图标
- [x] 点击消息图标跳转正确
- [x] 4个操作按钮都存在

### ✅ PetDetails 页面
- [x] 渲染"相关讨论"板块
- [x] 加载状态显示
- [x] 显示相关话题列表
- [x] 无话题时显示"发起讨论"按钮
- [x] 点击"发起讨论"跳转正确
- [x] 点击话题卡片跳转详情
- [x] 超过3个话题显示"查看全部"

## 添加新测试

创建新的测试文件：`[ComponentName].test.jsx`

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import YourComponent from '../components/YourComponent';

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## Mock 指南

### Mock React Router
```javascript
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '1' }),
    useLocation: () => ({ pathname: '/' }),
  };
});
```

### Mock Context
```javascript
vi.mock('../context/YourContext', () => ({
  useYourContext: () => ({
    data: 'mock data',
    method: vi.fn(),
  }),
}));
```

### Mock API
```javascript
global.fetch = vi.fn();
fetch.mockResolvedValue({
  ok: true,
  json: async () => ({ data: 'mock response' }),
});
```

## 测试最佳实践

1. **测试行为，而不是实现**
   - ✅ 测试"点击按钮后显示菜单"
   - ❌ 测试"点击后 setState(true)"

2. **使用 userEvent 代替 fireEvent**
   ```javascript
   import userEvent from '@testing-library/user-event';
   await userEvent.click(button);
   ```

3. **使用 findBy 处理异步**
   ```javascript
   const element = await screen.findByText('加载完成');
   ```

4. **清理 mock**
   ```javascript
   beforeEach(() => {
     vi.clearAllMocks();
   });
   ```

## 常见问题

### 问题：找不到模块
**解决**：检查导入路径是否正确，使用相对路径 `./` 或 `../`

### 问题：CSS 样式不生效
**解决**：已在 vitest.config.js 中启用 `css: true`

### 问题：动画测试失败
**解决**：使用 `waitFor` 等待动画完成
```javascript
await waitFor(() => {
  expect(screen.getByText('Content')).toBeVisible();
});
```

---

*最后更新：2026-02-12*
