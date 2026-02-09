# 部署配置指南

本文档说明如何在 Vercel 上部署后端服务，包括环境变量配置和常见问题排查。

## Vercel 环境变量配置

### 必需的环境变量

在 Vercel Dashboard 中配置以下环境变量：

#### 1. Supabase 配置（必需）

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**获取方式**：
1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **Settings** → **API**
4. 复制以下信息：
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** (secret) → `SUPABASE_SERVICE_ROLE_KEY`

**重要提示**：
- `SUPABASE_SERVICE_ROLE_KEY` 是**推荐**使用的密钥，可以绕过 Row Level Security (RLS)
- 如果使用 `SUPABASE_ANON_KEY`，需要前端传递 JWT token，且受 RLS 策略限制

#### 2. 可选环境变量

```env
SUPABASE_ANON_KEY=your_supabase_anon_key  # 如果不使用 Service Role Key，则需要此项
PORT=5001  # 本地开发使用，Vercel 会自动处理端口
```

### 配置步骤

1. **登录 Vercel Dashboard**
   - 访问 [vercel.com](https://vercel.com)
   - 进入你的项目

2. **进入环境变量设置**
   - 点击项目 → **Settings** → **Environment Variables**

3. **添加环境变量**
   - 点击 **Add New**
   - 输入变量名和值
   - 选择环境（Production、Preview、Development）
   - 点击 **Save**

4. **重新部署**
   - 配置环境变量后，需要重新部署项目
   - 进入 **Deployments** → 点击最新部署的 **⋯** → **Redeploy**

## Vercel 项目设置

### Root Directory 配置（Monorepo 项目）

如果项目是 monorepo 结构（前后端在同一仓库），需要设置 Root Directory：

1. 进入项目 **Settings** → **General**
2. 找到 **Root Directory**
3. 设置为 `backend`
4. 保存设置

### Build Settings

Vercel 会自动检测 Node.js 项目，通常不需要额外配置。如果需要自定义：

1. 进入 **Settings** → **General**
2. 找到 **Build & Development Settings**
3. 确认以下设置：
   - **Framework Preset**: Other
   - **Build Command**: (留空，Vercel 会自动处理)
   - **Output Directory**: (留空)
   - **Install Command**: `npm install` 或 `yarn install`

## 文件结构要求

### 后端部署结构

```
backend/
├── api/
│   └── index.js          # Vercel serverless function 入口
├── index.js              # Express 应用主文件
├── vercel.json           # Vercel 配置文件（可选）
├── package.json
└── ...其他文件
```

### vercel.json 配置

最简单的配置（推荐）：

```json
{
  "version": 2
}
```

Vercel 会自动识别 `api/` 目录下的文件作为 serverless functions。

## 常见问题排查

### 1. 前端刷新页面 404 错误

**症状**：刷新前端页面（如 `/login`）时返回 404

**原因**：SPA (Single Page Application) 路由问题。刷新时服务器尝试查找 `/login` 文件，但这是前端路由。

**解决方案**：
1. 确认 `frontend/vercel.json` 文件存在，内容如下：
```json
{
  "rewrites": [
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```
2. 重新部署前端项目

### 2. 后端 API 404 错误

**症状**：所有 `/api/*` 请求返回 404

**可能原因**：
- `api/index.js` 文件不存在或路径错误
- Root Directory 配置不正确
- 路由配置问题（路径前缀不匹配）

**解决方案**：
1. 确认 `backend/api/index.js` 文件存在
2. 检查 Vercel 项目设置中的 Root Directory（应设置为 `backend`）
3. 确认 `api/index.js` 中的路由**不包含** `/api` 前缀（Vercel 会自动去掉）
4. 查看部署日志，确认文件是否正确上传
5. 测试健康检查端点：`GET /api/health`

### 3. 环境变量缺失错误

**症状**：日志显示 `ERROR: SUPABASE_URL missing` 或 `Supabase client not initialized`

**原因分析**：
- Vercel serverless 环境中，`.env` 文件不会被自动加载
- 环境变量必须通过 Vercel Dashboard 手动配置
- `dotenv` 包在 serverless 环境中不会自动工作

**解决方案**：

1. **检查环境变量配置**：
   - 进入 Vercel Dashboard → 项目 → **Settings** → **Environment Variables**
   - 确认以下变量已配置：
     - `SUPABASE_URL` ✓
     - `SUPABASE_SERVICE_ROLE_KEY` ✓（推荐）
     - 或 `SUPABASE_ANON_KEY`（备选）

2. **验证环境变量**：
   - 访问健康检查端点：`GET /api/health`
   - 查看响应中的 `env` 字段，确认环境变量状态：
     ```json
     {
       "status": "ok",
       "supabase": "initialized",
       "env": {
         "hasSupabaseUrl": true,
         "hasServiceRoleKey": true,
         "hasAnonKey": false,
         "nodeEnv": "production",
         "vercel": "1"
       }
     }
     ```

3. **调试模式**（临时）：
   - 在 Vercel 环境变量中添加 `DEBUG=true`
   - 重新部署后，查看日志会显示详细的环境变量检查信息
   - 调试完成后记得删除此变量

4. **常见错误**：
   - ❌ 只在本地 `.env` 文件中配置，忘记在 Vercel 中配置
   - ❌ 环境变量名称拼写错误（区分大小写）
   - ❌ 环境变量未应用到正确的环境（Production/Preview/Development）
   - ❌ 配置后未重新部署

5. **重新部署**：
   - 配置或修改环境变量后，**必须重新部署**才能生效
   - 进入 **Deployments** → 点击最新部署的 **⋯** → **Redeploy**

### 4. Supabase 连接失败

**症状**：API 返回数据库相关错误

**可能原因**：
- Supabase URL 或密钥配置错误
- 使用了 `SUPABASE_ANON_KEY` 但未传递认证 token
- RLS 策略限制

**解决方案**：
1. 验证 Supabase 环境变量是否正确
2. 推荐使用 `SUPABASE_SERVICE_ROLE_KEY`（绕过 RLS）
3. 检查 Supabase Dashboard 中的 RLS 策略

### 5. CORS 跨域错误

**症状**：浏览器控制台显示 `Access-Control-Allow-Origin` 错误，请求被阻止

**可能原因**：
- 后端 CORS 配置未允许前端域名
- 预检请求（OPTIONS）未正确处理


**解决方案**：
1. 确认后端 `api/index.js` 中的 CORS 配置已正确设置
2. 默认配置已允许：
   - 所有 `vercel.app` 域名
   - 所有包含 `wensons-projects-bb20578e.vercel.app` 的域名
   - 本地开发环境（`http://localhost:*`）
3. 如需添加其他域名，可在 Vercel 环境变量中配置 `ALLOWED_ORIGINS`（逗号分隔）：
   ```
   ALLOWED_ORIGINS=https://example.com,https://another-domain.com
   ```
4. 重新部署后端项目

### 6. 本地开发正常，部署后失败

**可能原因**：
- 环境变量未在 Vercel 中配置
- 代码中使用了本地文件路径
- 依赖包版本不兼容

**解决方案**：
1. 对比本地 `.env` 文件和 Vercel 环境变量
2. 检查代码中是否有硬编码的本地路径
3. 查看 Vercel 部署日志中的错误信息

## 验证部署

### 1. 健康检查

访问健康检查端点：

```
GET https://your-domain.vercel.app/api/health
```

预期响应（正常）：
```json
{
  "status": "ok",
  "message": "Server is running",
  "supabase": "initialized",
  "env": {
    "hasSupabaseUrl": true,
    "hasServiceRoleKey": true,
    "hasAnonKey": false,
    "nodeEnv": "production",
    "vercel": "1"
  }
}
```

如果 `supabase` 为 `"not initialized"`，说明环境变量未正确配置，请参考"环境变量缺失错误"部分。

### 2. API 测试

测试登录接口：

```bash
curl -X POST https://your-domain.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### 3. 查看日志

1. 进入 Vercel Dashboard
2. 选择项目 → **Deployments**
3. 点击最新部署 → **Logs**
4. 查看实时日志和错误信息

## 最佳实践

1. **使用 Service Role Key**：后端服务推荐使用 `SUPABASE_SERVICE_ROLE_KEY`，避免 RLS 限制
2. **环境分离**：为 Production、Preview、Development 分别配置环境变量
3. **敏感信息保护**：不要在代码中硬编码密钥，始终使用环境变量
4. **日志监控**：定期查看 Vercel 部署日志，及时发现问题
5. **版本控制**：将 `vercel.json` 提交到 Git，但不要提交 `.env` 文件

## 相关文档

- [Vercel 官方文档](https://vercel.com/docs)
- [Supabase 官方文档](https://supabase.com/docs)
- [项目架构文档](./ARCHITECTURE.md)
- [后端逻辑文档](./BACKEND_LOGIC.md)
