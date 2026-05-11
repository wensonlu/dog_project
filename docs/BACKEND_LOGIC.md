# 后端逻辑文档

本文档详细说明后端代码的逻辑结构、业务流程和排障指南，方便后续开发、维护和问题排查。

## 项目结构

```
backend/
├── index.js                    # 应用入口，Express 服务器配置
├── config/
│   └── supabase.js            # Supabase 客户端配置和初始化
├── controllers/               # 业务逻辑控制器
│   ├── authController.js      # 用户认证逻辑
│   ├── dogsController.js      # 宠物数据逻辑
│   ├── favoritesController.js # 收藏功能逻辑
│   ├── applicationsController.js # 领养申请逻辑
│   └── messagesController.js  # 消息通知逻辑
├── routes/                    # API 路由定义
│   ├── auth.js               # 认证路由
│   ├── dogs.js               # 宠物路由
│   ├── favorites.js          # 收藏路由
│   ├── applications.js       # 申请路由
│   └── messages.js           # 消息路由
├── middleware/               # 中间件
│   └── supabaseCheck.js     # Supabase 初始化检查
└── utils/                    # 工具函数
    └── supabaseClient.js     # Supabase 客户端工具
```

## 核心模块说明

### 1. 应用入口 (index.js)

**职责**：
- 初始化 Express 应用
- 配置全局中间件（CORS、JSON 解析）
- 注册所有路由模块
- 启动 HTTP 服务器

**关键代码**：
```javascript
// 全局中间件
app.use(cors());              // 跨域支持
app.use(express.json());      // JSON 请求体解析

// 路由注册
app.use('/api/auth', authRoutes);
app.use('/api/dogs', dogsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/messages', messagesRoutes);
```

**健康检查端点**：
- `GET /health` - 返回服务器状态

### 2. Supabase 配置 (config/supabase.js)

**职责**：
- 从环境变量读取 Supabase 配置
- 初始化 Supabase 客户端
- 支持 Service Role Key 和 Anon Key 两种模式

**配置优先级**：
1. **Service Role Key**（推荐）：绕过 RLS，适合后端服务
2. **Anon Key**：需要传递 JWT token，受 RLS 限制

**环境变量**：
- `SUPABASE_URL` - Supabase 项目 URL（必需）
- `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key（推荐）
- `SUPABASE_ANON_KEY` - Anon Key（备选）
- `SUPABASE_KEY` - 向后兼容，作为 Anon Key 使用

**初始化逻辑**：
```javascript
if (supabaseServiceRoleKey) {
    // 使用 Service Role Key（绕过 RLS）
    supabase = createClient(url, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
} else if (supabaseAnonKey) {
    // 使用 Anon Key（受 RLS 限制）
    supabase = createClient(url, anonKey);
}
```

### 3. Supabase 客户端工具 (utils/supabaseClient.js)

**职责**：
- 提供 `getSupabaseClient(req)` 函数
- 根据配置和请求自动选择合适的客户端

**使用场景**：
- **Service Role Key 模式**：直接返回主客户端（绕过 RLS）
- **Anon Key 模式**：从请求头提取 JWT token，创建带认证上下文的客户端

**关键逻辑**：
```javascript
function getSupabaseClient(req = null) {
    // 如果使用 Service Role Key，直接返回（绕过 RLS）
    if (supabaseServiceRoleKey) {
        return supabase;
    }
    
    // 如果使用 Anon Key 且有 token，创建认证客户端
    if (req && authHeader) {
        const token = authHeader.substring(7);
        const authenticatedClient = createClient(url, anonKey, {
            global: { headers: { Authorization: `Bearer ${token}` } }
        });
        authenticatedClient.auth.setSession({ access_token: token });
        return authenticatedClient;
    }
    
    return supabase;
}
```

**使用位置**：
- `applicationsController.js` - 提交申请时使用（需要 RLS 支持）

### 4. 中间件 (middleware/supabaseCheck.js)

**职责**：
- 检查 Supabase 客户端是否已初始化
- 如果未初始化，返回 500 错误

**使用方式**：
```javascript
router.post('/register', checkSupabase, register);
```

**错误响应**：
```json
{
    "error": "Supabase client not initialized. Please check your environment variables."
}
```

## API 路由映射

### 论坛路由 (`/api/forum`)

| 方法 | 路径 | 控制器 | 说明 |
|------|------|--------|------|
| GET | `/:id` | `forumController.getTopicById` | 获取话题详情（含 `isFollowingAuthor`、`authorFollowers`） |
| GET | `/follows/me` | `forumController.getMyFollowingAuthors` | 获取当前用户关注的作者列表 |
| POST | `/:id/follow` | `forumController.toggleTopicAuthorFollow` | 关注/取消关注该话题作者 |

**关注接口请求示例**：
```javascript
POST /api/forum/123/follow
Body: { "userId": "uuid" }
```

**关注接口响应示例**：
```json
{ "followed": true, "authorFollowers": 12 }
```

### 认证路由 (`/api/auth`)

| 方法 | 路径 | 控制器 | 说明 |
|------|------|--------|------|
| POST | `/register` | `authController.register` | 用户注册 |
| POST | `/login` | `authController.login` | 用户登录 |

**请求示例**：
```javascript
// 注册
POST /api/auth/register
Body: { "email": "user@example.com", "password": "password123" }

// 登录
POST /api/auth/login
Body: { "email": "user@example.com", "password": "password123" }
```

**响应格式**：
```json
{
    "user": { "id": "...", "email": "..." },
    "session": { "access_token": "...", ... }
}
```

### 宠物路由 (`/api/dogs`)

| 方法 | 路径 | 控制器 | 说明 |
|------|------|--------|------|
| GET | `/` | `dogsController.getAllDogs` | 获取所有宠物 |
| GET | `/:id` | `dogsController.getDogById` | 获取特定宠物详情 |

**请求示例**：
```javascript
// 获取所有宠物
GET /api/dogs

// 获取特定宠物
GET /api/dogs/1
```

### 收藏路由 (`/api/favorites`)

| 方法 | 路径 | 控制器 | 说明 |
|------|------|--------|------|
| GET | `/:userId` | `favoritesController.getUserFavorites` | 获取用户收藏列表 |
| POST | `/` | `favoritesController.toggleFavorite` | 切换收藏状态（添加/删除） |

**请求示例**：
```javascript
// 获取用户收藏
GET /api/favorites/2ff4be55-ce6e-4a7f-94e2-f8a4cace91d2

// 切换收藏
POST /api/favorites
Body: { "userId": "...", "dogId": "1" }
```

**响应格式**：
```json
{ "status": "added" }  // 或 { "status": "removed" }
```

**业务逻辑**：
1. 检查是否已收藏（查询 `favorites` 表）
2. 如果已存在：删除收藏记录
3. 如果不存在：插入收藏记录

### 申请路由 (`/api/applications`)

| 方法 | 路径 | 控制器 | 说明 |
|------|------|--------|------|
| POST | `/` | `applicationsController.submitApplication` | 提交领养申请 |
| GET | `/` | `applicationsController.getAllApplications` | 获取所有申请（管理员） |
| POST | `/:id/approve` | `applicationsController.approveApplication` | 审核通过申请 |
| POST | `/:id/reject` | `applicationsController.rejectApplication` | 拒绝申请 |

**提交申请请求**：
```javascript
POST /api/applications
Body: {
    "userId": "2ff4be55-ce6e-4a7f-94e2-f8a4cace91d2",
    "dogId": "1",
    "fullName": "张三",
    "phone": "13800138000",
    "address": "上海市",
    "hasPets": false,
    "housingType": "公寓"
}
```

**审核申请请求**：
```javascript
POST /api/applications/123/approve
Body: {
    "userId": "...",
    "dogName": "小胖"
}
```

**业务逻辑流程**：

1. **提交申请**：
   - 使用 `getSupabaseClient(req)` 获取客户端（支持 RLS）
   - 插入申请记录到 `applications` 表
   - 状态默认为 `pending`

2. **审核通过**：
   - 更新申请状态为 `approved`
   - 自动发送系统通知消息到 `messages` 表

3. **拒绝申请**：
   - 更新申请状态为 `rejected`
   - 自动发送系统通知消息到 `messages` 表

### 消息路由 (`/api/messages`)

| 方法 | 路径 | 控制器 | 说明 |
|------|------|--------|------|
| GET | `/:userId` | `messagesController.getUserMessages` | 获取用户消息列表 |

**请求示例**：
```javascript
GET /api/messages/2ff4be55-ce6e-4a7f-94e2-f8a4cace91d2
```

**响应格式**：
```json
[
    {
        "id": 1,
        "user_id": "...",
        "sender_name": "系统通知",
        "content": "恭喜！您申请领养 小胖 的申请已通过审核。",
        "is_unread": true,
        "created_at": "2024-01-01T00:00:00Z"
    }
]
```

## 数据流说明

### 用户注册流程

```
前端请求
  ↓
POST /api/auth/register
  ↓
checkSupabase 中间件（检查 Supabase 是否初始化）
  ↓
authController.register
  ↓
supabase.auth.signUp()
  ↓
返回用户数据和 session
```

### 提交申请流程

```
前端请求
  ↓
POST /api/applications
Body: { userId, dogId, fullName, phone, address, hasPets, housingType }
  ↓
checkSupabase 中间件
  ↓
applicationsController.submitApplication
  ↓
getSupabaseClient(req) - 获取带认证上下文的客户端
  ↓
client.from('applications').insert([...])
  ↓
返回成功响应
```

### 审核申请流程

```
管理员操作
  ↓
POST /api/applications/:id/approve
Body: { userId, dogName }
  ↓
checkSupabase 中间件
  ↓
applicationsController.approveApplication
  ↓
1. supabase.from('applications').update({ status: 'approved' })
  ↓
2. supabase.from('messages').insert([通知消息])
  ↓
返回成功响应
```

## 错误处理

### 统一错误格式

所有错误响应都遵循以下格式：
```json
{
    "error": "错误消息"
}
```

### 常见错误场景

1. **Supabase 未初始化**：
   - 状态码：500
   - 消息：`"Supabase client not initialized. Please check your environment variables."`
   - 原因：环境变量配置缺失或错误

2. **认证错误**：
   - 状态码：400
   - 消息：Supabase Auth 返回的错误消息
   - 常见原因：邮箱已存在、密码错误等

3. **数据库错误**：
   - 状态码：500
   - 消息：Supabase 返回的错误消息
   - 常见原因：RLS 策略违反、数据格式错误等

4. **RLS 策略错误**：
   - 状态码：500
   - 消息：`"new row violates row-level security policy for table \"applications\""`
   - 解决方案：使用 Service Role Key 或确保传递正确的 JWT token

## 排障指南

### 问题1：Supabase 客户端未初始化

**症状**：
- 所有 API 返回 500 错误
- 错误消息：`"Supabase client not initialized"`

**排查步骤**：
1. 检查 `backend/.env` 文件是否存在
2. 确认 `SUPABASE_URL` 是否配置
3. 确认 `SUPABASE_SERVICE_ROLE_KEY` 或 `SUPABASE_ANON_KEY` 是否配置
4. 检查环境变量值是否正确（无多余空格、引号等）

**解决方案**：
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=5001
```

### 问题2：RLS 策略违反错误

**症状**：
- 插入数据时返回：`"new row violates row-level security policy"`

**排查步骤**：
1. 检查是否使用了 Service Role Key
2. 如果使用 Anon Key，检查是否传递了 JWT token
3. 检查数据库 RLS 策略是否正确配置

**解决方案**：
- **推荐**：使用 `SUPABASE_SERVICE_ROLE_KEY`（绕过 RLS）
- **备选**：确保前端传递 JWT token，后端使用 `getSupabaseClient(req)`

### 问题3：路由404错误

**症状**：
- 请求返回 404 Not Found

**排查步骤**：
1. 检查路由路径是否正确（注意大小写）
2. 检查 HTTP 方法是否正确（GET/POST）
3. 检查路由是否在 `index.js` 中正确注册

**路由注册位置**：
```javascript
// index.js
app.use('/api/auth', authRoutes);
app.use('/api/dogs', dogsRoutes);
// ...
```

### 问题4：CORS 错误

**症状**：
- 浏览器控制台显示 CORS 错误
- 请求被浏览器阻止

**排查步骤**：
1. 检查 `index.js` 中是否配置了 `cors()` 中间件
2. 检查前端请求的 URL 是否正确

**解决方案**：
```javascript
// index.js
app.use(cors()); // 允许所有来源（开发环境）
```

### 问题5：JSON 解析错误

**症状**：
- 请求体无法解析
- `req.body` 为 undefined

**排查步骤**：
1. 检查是否配置了 `express.json()` 中间件
2. 检查请求头 `Content-Type` 是否为 `application/json`

**解决方案**：
```javascript
// index.js
app.use(express.json()); // 解析 JSON 请求体
```

## 开发维护指南

### 添加新 API 端点

1. **创建控制器函数**（`controllers/`）：
   ```javascript
   // controllers/exampleController.js
   async function exampleFunction(req, res) {
       // 业务逻辑
   }
   module.exports = { exampleFunction };
   ```

2. **创建路由**（`routes/`）：
   ```javascript
   // routes/example.js
   const router = express.Router();
   router.get('/', checkSupabase, exampleFunction);
   module.exports = router;
   ```

3. **注册路由**（`index.js`）：
   ```javascript
   const exampleRoutes = require('./routes/example');
   app.use('/api/example', exampleRoutes);
   ```

### 修改业务逻辑

1. 定位对应的控制器文件（`controllers/`）
2. 修改对应的函数逻辑
3. 确保错误处理正确
4. 更新本文档（如有重大变更）

### 调试技巧

1. **查看日志**：
   - Supabase 初始化日志
   - 错误日志（console.error）

2. **使用 Postman/curl 测试**：
   ```bash
   # 测试健康检查
   curl http://localhost:5001/health
   
   # 测试获取宠物列表
   curl http://localhost:5001/api/dogs
   ```

3. **检查 Supabase Dashboard**：
   - 查看数据库表数据
   - 检查 RLS 策略
   - 查看 API 日志

### 性能优化建议

1. **数据库查询优化**：
   - 使用 `.select()` 只查询需要的字段
   - 使用 `.limit()` 限制返回数量
   - 使用索引优化查询

2. **错误处理优化**：
   - 统一错误响应格式
   - 记录详细错误日志
   - 区分客户端错误和服务器错误

3. **代码组织**：
   - 保持控制器函数简洁
   - 复杂逻辑提取到工具函数
   - 使用中间件处理通用逻辑

## 关键文件位置速查

| 功能 | 文件路径 |
|------|---------|
| 应用入口 | `backend/index.js` |
| Supabase 配置 | `backend/config/supabase.js` |
| 认证逻辑 | `backend/controllers/authController.js` |
| 宠物逻辑 | `backend/controllers/dogsController.js` |
| 收藏逻辑 | `backend/controllers/favoritesController.js` |
| 申请逻辑 | `backend/controllers/applicationsController.js` |
| 消息逻辑 | `backend/controllers/messagesController.js` |
| Supabase 检查 | `backend/middleware/supabaseCheck.js` |
| 客户端工具 | `backend/utils/supabaseClient.js` |

## 注意事项

1. **Service Role Key 安全**：
   - Service Role Key 具有完全权限，不要暴露给前端
   - 只在后端服务器使用
   - 不要提交到版本控制系统

2. **RLS 策略**：
   - 使用 Service Role Key 时，RLS 策略会被绕过
   - 使用 Anon Key 时，必须正确配置 RLS 策略
   - 参考 `supabase_schema.sql` 中的策略定义

3. **错误处理**：
   - 所有数据库操作都应该检查 `error`
   - 返回适当的 HTTP 状态码
   - 提供有意义的错误消息

4. **代码规范**：
   - 使用 async/await 处理异步操作
   - 保持函数单一职责
   - 添加必要的注释说明

---

**最后更新**：2024年（代码重构后）
