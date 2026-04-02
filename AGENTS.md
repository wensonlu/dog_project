# Dog Project - 宠物领养平台

## Overview

宠物领养平台应用,采用类似 Tinder 的卡片滑动交互方式。前后端分离架构,支持宠物浏览、收藏、领养申请和后台审核。

## Project Structure

| Path | Type | Purpose |
|------|------|---------|
| `backend/` | Backend Service | Express.js API server (Supabase integration) |
| `frontend/` | Frontend App | React + Vite 应用(Capacitor 移动端支持) |
| `docs/` | Documentation | 项目架构文档和知识库 |
| `supabase_schema.sql` | Database Schema | PostgreSQL 表结构定义 |

## Quick Reference

### Languages and Tooling

- Languages: JavaScript (Node.js 20.x+), JSX
- LSPs: `typescript-language-server` (已安装 5.1.3)

### Commands

```bash
# Frontend (cd frontend)
pnpm dev              # 启动开发服务器 (localhost:5173)
pnpm build            # 生产构建
pnpm lint             # ESLint 检查
pnpm test             # Vitest 单元测试

# Backend (cd backend)
npm run dev           # Nodemon 热重载 (默认端口 5001)
npm start             # 生产模式启动
```

### Environment

- 复制 `backend/.env.example` → `backend/.env` 配置 Supabase
- 必填变量: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

## Progressive Disclosure

开始开发前阅读相关文档:

| 主题 | 文档位置 |
|------|---------|
| 项目架构分析 | `docs/ARCHITECTURE.md` |
| 后端逻辑流程 | `docs/BACKEND_LOGIC.md` |
| Vercel 部署指南 | `docs/DEPLOYMENT.md` |
| 移动端部署 | `docs/MOBILE_DEPLOYMENT.md` |
| 权限系统设计 | 项目根目录 `README.md` 权限管理章节 |

## Universal Rules

1. **提交前验证**: 后端改动需手动测试 API; 前端改动运行 `pnpm lint`
2. **保持 PR 聚焦**: 每个 PR 只处理一个功能或修复
3. **文档同步**: 修改架构或 API 后更新对应 `docs/` 文档
4. **数据库迁移**: 添加表/字段后更新 `supabase_schema.sql`

## Code Quality

- Frontend: ESLint 自动格式化和检查 (`pnpm lint`)
- Backend: 无自动 linter,依赖手动测试和代码审查
- 提交前确保代码通过 lint 检查,无需手动调整格式

## GitNexus MCP Integration

项目已通过 GitNexus 索引(522 symbols, 863 relationships)。使用 GitNexus MCP 工具可快速探索代码库:

- **理解架构**: 阅读 `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md`
- **影响分析**: 阅读 `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md`
- **调试追踪**: 阅读 `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md`
- **重构操作**: 阅读 `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md`

**重要**: 开始任务前先阅读对应的 skill 文件并遵循其 workflow。