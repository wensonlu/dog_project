# Dog Project - 宠物领养平台

## 项目简介

这是一个**宠物领养平台**应用，采用类似 Tinder 的卡片滑动交互方式。项目采用前后端分离架构，支持用户浏览宠物、收藏、提交领养申请和管理后台审核等功能。

## 技术栈

### 设计
- stitch

### 前端
- React 19.2.0 + Vite 7.2.4
- Tailwind CSS 3.4.19
- React Router DOM 7.12.0
- Framer Motion 12.26.2

### 后端
- Express.js 5.2.1
- Supabase (PostgreSQL)
- Supabase Auth

## 项目结构

```
dog_project/
├── backend/              # Express 后端服务
│   ├── index.js         # 主服务器文件，包含所有 API 路由
│   └── package.json
├── frontend/            # React 前端应用
│   ├── src/
│   │   ├── pages/       # 页面组件
│   │   ├── components/  # 可复用组件
│   │   ├── context/     # React Context 状态管理
│   │   └── main.jsx     # 应用入口
│   └── vite.config.js
├── docs/                # 项目文档和知识库
│   ├── README.md        # 知识库索引
│   └── ARCHITECTURE.md  # 项目架构文档
├── data/                # 数据存储
│   ├── raw/            # 原始数据
│   └── processed/      # 处理后的数据
├── models/              # 模型存储
│   └── checkpoints/    # 模型检查点
├── notebooks/           # Jupyter  notebooks
├── tests/               # 单元测试和集成测试
└── supabase_schema.sql  # 数据库表结构定义
```

## 快速开始

### 前置要求

- Node.js >= 18.0.0
- npm 或 pnpm
- Supabase 账号（可选，支持 Mock 模式）

### 安装依赖

#### 前端
```bash
cd frontend
npm install
```

#### 后端
```bash
cd backend
npm install
```

### 环境配置

在 `backend/` 目录下创建 `.env` 文件（可选，不配置将使用 Mock 模式）：

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # 推荐：绕过 RLS，适合后端服务
SUPABASE_ANON_KEY=your_anon_key                   # 备选：需要传递 auth token
# 或者使用旧的配置（向后兼容）
SUPABASE_KEY=your_supabase_key                    # 如果未设置 SERVICE_ROLE_KEY，将作为 ANON_KEY 使用
PORT=5001
```

**重要说明**：
- **推荐使用 `SUPABASE_SERVICE_ROLE_KEY`**：这是后端服务的推荐配置，可以绕过 Row Level Security (RLS) 限制，适合执行管理员操作
- 如果使用 `SUPABASE_ANON_KEY` 或 `SUPABASE_KEY`：需要在前端请求中传递 JWT token（通过 Authorization header），后端会使用该 token 创建带认证上下文的客户端
- Service Role Key 可以在 Supabase Dashboard 的 Settings > API 中找到

### 启动项目

#### 启动后端服务
```bash
cd backend
npm run dev  # 使用 nodemon 热重载（默认端口 5001）
```

#### 启动前端服务
```bash
cd frontend
npm run dev  # 开发服务器（默认端口 5173）
```

访问 `http://localhost:5173` 查看应用。

## 核心功能

- 🐕 **宠物浏览**: 卡片滑动式浏览宠物信息
- ❤️ **收藏功能**: 收藏喜欢的宠物
- 📝 **领养申请**: 多步骤表单提交领养申请
- 📬 **消息通知**: 接收申请审核结果通知
- 👤 **用户管理**: 用户注册、登录、个人中心
- 🔧 **后台管理**: 管理员审核领养申请
- 🔐 **权限管理**: 基于位标志的细粒度权限控制系统
- 🤖 **AI聊天助手**: 智能回答宠物相关问题，推荐相关资源（Wiki、宠物、成功案例）

## 项目文档

详细的架构文档和开发指南请查看 [项目知识库](./docs/README.md)：

- **[项目架构分析](./docs/ARCHITECTURE.md)** - 完整的技术架构文档
- **[知识库索引](./docs/README.md)** - 文档导航和快速查找指南

## 开发指南

### 修改代码前

建议先查阅 [项目架构文档](./docs/ARCHITECTURE.md)，了解：
- 相关模块的设计思路
- 数据流转过程
- API 端点设计

### 添加新功能

1. 查看对应的功能模块说明
2. 理解数据流架构
3. 确认 API 设计
4. 更新相关文档

## 数据库

数据库使用 Supabase (PostgreSQL)，表结构定义见 `supabase_schema.sql`。

主要数据表：
- `profiles` - 用户资料（包含 `permissions` 权限字段）
- `dogs` - 宠物信息
- `favorites` - 收藏关系
- `applications` - 领养申请
- `messages` - 消息通知

## 权限管理系统

### 系统概述

项目采用**位标志（Bit Flags）**权限设计，在 `profiles` 表的 `permissions` 字段中使用单个整数存储多个权限。这种设计具有以下优势：

- **高性能**: 位运算速度极快
- **节省空间**: 单字段存储多个权限
- **易于扩展**: 最多支持 32 种权限
- **查询简单**: 使用位运算即可快速检查权限

### 权限类型

系统定义了三种基本权限：

| 权限名称 | 权限值 | 二进制 | 说明 |
|---------|--------|--------|------|
| `MANAGE_ADOPTIONS` | 1 | 0b001 | 领养管理权限 - 可以审核领养申请 |
| `MANAGE_SUBMISSIONS` | 2 | 0b010 | 发布管理权限 - 可以审核宠物发布申请 |
| `SUPER_ADMIN` | 4 | 0b100 | 超级管理员权限 - 可以管理其他用户权限 |

### 权限值组合说明

通过位运算，可以将多个权限组合为一个整数：

| 权限组合 | 数值 | 含义 |
|---------|------|------|
| 无权限 | **0** | 普通用户，没有任何管理权限 |
| 只有领养管理 | **1** | 仅可访问"领养管理"页面 |
| 只有发布管理 | **2** | 仅可访问"发布管理"页面 |
| 领养 + 发布管理 | **3** | 可访问领养和发布管理页面（1+2） |
| 只有超级管理员 | **4** | 仅可访问"权限管理"页面 |
| 领养 + 超级管理员 | **5** | 领养管理 + 权限管理（1+4） |
| 发布 + 超级管理员 | **6** | 发布管理 + 权限管理（2+4） |
| **所有权限** | **7** | 领养 + 发布 + 超级管理员（1+2+4）⭐ 推荐 |

### 数据库迁移

首次使用权限系统需要执行数据库迁移，为 `profiles` 表添加 `permissions` 字段。

#### 步骤 1: 执行迁移 SQL

在 **Supabase Dashboard** 的 SQL Editor 中执行以下 SQL：

```sql
-- 添加权限字段到 profiles 表
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS permissions INTEGER DEFAULT 0 NOT NULL;

-- 添加注释说明
COMMENT ON COLUMN public.profiles.permissions IS '用户权限位标志: 1=领养管理, 2=发布管理, 4=超级管理员';

-- 添加索引以优化权限查询
CREATE INDEX IF NOT EXISTS idx_profiles_permissions
ON public.profiles(permissions)
WHERE permissions > 0;

-- 添加约束确保权限值非负
ALTER TABLE public.profiles
ADD CONSTRAINT check_permissions_non_negative
CHECK (permissions >= 0);
```

完整的迁移脚本位于：`backend/migrations/add_permissions_to_profiles.sql`

#### 步骤 2: 设置第一个超级管理员

**方法一：使用初始化脚本**（推荐）

```bash
cd backend
node scripts/setup-first-admin.js --email=你的邮箱@example.com
```

**方法二：直接执行 SQL**

在 Supabase SQL Editor 中执行：

```sql
-- 设置为全权管理员（权限值 7 = 所有权限）
UPDATE public.profiles
SET permissions = 7
WHERE email = '你的实际邮箱@example.com';
```

#### 步骤 3: 验证权限

执行以下 SQL 检查权限是否设置成功：

```sql
-- 查看你的用户权限
SELECT id, email, full_name, permissions
FROM public.profiles
WHERE email = '你的实际邮箱@example.com';
```

确认 `permissions` 列的值为 **7**。

### 使用权限管理

#### 登录管理员账号

使用已设置超级管理员权限的账号登录后：

1. 进入"我的"页面
2. 看到三个管理菜单：
   - **领养管理** - 审核领养申请
   - **发布管理** - 审核宠物发布
   - **权限管理** - 管理用户权限 ⭐

#### 权限管理页面功能

在"权限管理"页面可以：

- 查看所有注册用户列表
- 搜索用户（支持邮箱和姓名搜索）
- 为每个用户开启/关闭三种权限：
  - **领养管理权限** - 控制是否能访问 `/admin` 页面
  - **发布管理权限** - 控制是否能访问 `/admin-submissions` 页面
  - **超级管理员权限** - 控制是否能访问 `/permissions-management` 页面
- 实时生效，无需用户重新登录

#### 常见权限配置场景

**场景 1: 设置领养审核员**

只需要审核领养申请：
```sql
UPDATE public.profiles
SET permissions = 1  -- 只有领养管理权限
WHERE email = 'reviewer@example.com';
```

**场景 2: 设置发布审核员**

只需要审核宠物发布：
```sql
UPDATE public.profiles
SET permissions = 2  -- 只有发布管理权限
WHERE email = 'moderator@example.com';
```

**场景 3: 设置全能管理员**

拥有所有管理权限：
```sql
UPDATE public.profiles
SET permissions = 7  -- 所有权限
WHERE email = 'admin@example.com';
```

**场景 4: 移除所有权限**

将用户降级为普通用户：
```sql
UPDATE public.profiles
SET permissions = 0  -- 无权限
WHERE email = 'user@example.com';
```

### 权限检查机制

系统在三个层级进行权限保护：

1. **后端 API 层**：中间件验证 JWT token 并检查权限，无权限返回 403
2. **前端路由层**：`PermissionRoute` 组件阻止无权限用户访问管理页面
3. **UI 显示层**：Profile 页面根据权限动态显示/隐藏菜单项

即使用户绕过前端限制，后端仍会拒绝请求，确保安全性。

### 相关文件

**后端**：
- `backend/constants/permissions.js` - 权限常量定义
- `backend/middleware/checkPermission.js` - 权限验证中间件
- `backend/routes/permissions.js` - 权限管理 API
- `backend/controllers/permissionsController.js` - 权限控制器
- `backend/scripts/setup-first-admin.js` - 管理员初始化脚本
- `backend/migrations/add_permissions_to_profiles.sql` - 数据库迁移

**前端**：
- `frontend/src/constants/permissions.js` - 前端权限常量
- `frontend/src/components/PermissionRoute.jsx` - 权限路由保护
- `frontend/src/pages/PermissionsManagement.jsx` - 权限管理页面
- `frontend/src/context/AuthContext.jsx` - 包含权限检查函数

## 开发工具

- **前端构建**: Vite
- **代码检查**: ESLint
- **样式**: Tailwind CSS
- **动画**: Framer Motion

## 许可证

ISC
