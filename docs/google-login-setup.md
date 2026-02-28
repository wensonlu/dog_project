# Google 登录配置指南

## 前置条件

✅ 已在 Supabase Dashboard 中配置好 Google OAuth Provider

## 配置步骤

### 1. 获取 Supabase 配置信息

登录 [Supabase Dashboard](https://app.supabase.com)，进入你的项目：

1. 进入 **Settings** → **API**
2. 复制以下信息：
   - **Project URL** (用于 `VITE_SUPABASE_URL`)
   - **anon public** key (用于 `VITE_SUPABASE_ANON_KEY`)

### 2. 配置前端环境变量

在 `frontend/` 目录下创建 `.env` 文件（参考 `.env.example`）：

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. 配置重定向 URL

在 Supabase Dashboard 中：

1. 进入 **Authentication** → **URL Configuration**
2. 在 **Redirect URLs** 中添加：
   - 开发环境：`http://localhost:5173`
   - 生产环境：你的实际域名（例如 `https://your-domain.com`）

### 4. 验证 Google OAuth 配置

在 Supabase Dashboard 中：

1. 进入 **Authentication** → **Providers**
2. 确认 **Google** 已启用
3. 检查 **Client ID** 和 **Client Secret** 已正确配置

## 使用方式

### 前端实现

项目已集成 Google 登录功能，用户可以：

1. 在登录页面点击 "使用 Google 登录" 按钮
2. 在注册页面点击 "使用 Google 注册" 按钮
3. 系统会自动跳转到 Google OAuth 授权页面
4. 授权成功后自动跳转回应用并完成登录

### 认证流程

1. 用户点击 Google 登录按钮
2. 调用 `supabase.auth.signInWithOAuth({ provider: 'google' })`
3. 跳转到 Google 授权页面
4. 用户授权后返回应用
5. Supabase 自动处理认证并创建会话
6. `AuthContext` 自动更新用户状态

### 用户信息获取

登录成功后，可以通过以下方式获取用户信息：

```javascript
const { user } = useAuth();

// 用户信息包含：
// - id: UUID (来自 Supabase Auth)
// - email: 邮箱地址
// - name: 用户名（来自 Google profile）
// - avatar: 头像 URL（来自 Google profile）
```

## 技术实现

### 核心文件

1. **frontend/src/config/supabase.js** - Supabase 客户端配置
2. **frontend/src/context/AuthContext.jsx** - 认证上下文（新增 Google 登录支持）
3. **frontend/src/pages/Login.jsx** - 登录页面（新增 Google 登录按钮）
4. **frontend/src/pages/Register.jsx** - 注册页面（新增 Google 注册按钮）

### 会话管理

- Supabase 自动管理认证会话
- 会话信息存储在 localStorage
- `AuthContext` 监听 `onAuthStateChange` 事件自动更新用户状态
- 刷新页面会自动恢复会话

### 安全性

- 使用 Supabase Auth 的标准 OAuth 2.0 流程
- anon key 仅用于客户端，受 RLS（Row Level Security）保护
- 用户信息通过 Supabase JWT token 验证
- 前端不存储敏感信息（如 access token）

## 常见问题

### Q: Google 登录后无法获取用户信息？

A: 检查 Supabase 的 RLS 策略，确保 `auth.users` 表的访问权限配置正确。

### Q: 重定向失败？

A: 确认在 Supabase Dashboard 的 Redirect URLs 中已添加当前域名。

### Q: 本地开发时 Google 登录失败？

A: 确保：
1. `.env` 文件配置正确
2. Redirect URLs 包含 `http://localhost:5173`
3. Google OAuth 应用允许本地开发域名

## 后续优化建议

1. **用户资料同步**：首次 Google 登录后，将用户信息同步到 `users` 表
2. **错误处理增强**：添加更详细的错误提示（网络错误、权限错误等）
3. **加载状态优化**：添加登录过程的 loading 动画
4. **账号关联**：支持将 Google 账号与现有邮箱账号关联
