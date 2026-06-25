# 环境配置维护说明

这个项目把配置结构提交到代码库，把真实密钥保留在运行环境里。即使仓库设为 private，也不要提交模型 Token、Supabase service role key、平台访问密钥或任何长期有效的 secret。

## 本地开发

后端：

```bash
cp backend/.env.example backend/.env
```

前端：

```bash
cp frontend/.env.example frontend/.env
```

把真实值填入本地 `.env` 文件。`.gitignore` 已经忽略 `.env`，但如果文件曾经被 Git 跟踪过，需要先从索引中移除：

```bash
git rm --cached backend/.env frontend/.env
```

这个命令只停止跟踪文件，不会删除本地 `.env`。

## 后端变量

| 变量 | 用途 | 是否敏感 | 备注 |
|------|------|----------|------|
| `SUPABASE_URL` | Supabase 项目地址 | 否 | 本地和部署环境都需要 |
| `SUPABASE_SERVICE_ROLE_KEY` | 后端服务角色密钥 | 是 | 可绕过 RLS，只能放在后端环境 |
| `SUPABASE_ANON_KEY` | Supabase anon key | 通常否 | 后端使用 anon key 时需配合用户 JWT |
| `SUPABASE_KEY` | 旧配置名兼容 | 通常否 | 新环境优先使用 `SUPABASE_ANON_KEY` |
| `AI_ENABLED` | 是否启用 AI 功能 | 否 | 设为 `true` 后还需要 AI 地址和密钥 |
| `AI_BASE_URL` | OpenAI-compatible 网关地址 | 否 | 例如企业网关或模型服务地址 |
| `AI_API_KEY` | 模型服务 API key | 是 | 不提交到仓库 |
| `AI_MODEL` | 模型名称 | 否 | 默认逻辑见 `backend/utils/aiRuntime.js` |
| `ANTHROPIC_API_KEY` | 旧模型服务配置名 | 是 | 当前运行时优先使用 `AI_API_KEY` |
| `PORT` | 本地服务端口 | 否 | 默认 `5001` |
| `DEBUG` | 调试日志开关 | 否 | 本地可设为 `true` |

## 前端变量

| 变量 | 用途 | 是否敏感 | 备注 |
|------|------|----------|------|
| `VITE_SUPABASE_URL` | Supabase 项目地址 | 否 | 会打包进前端 |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon public key | 通常否 | 会打包进前端，不要放 service role key |
| `VITE_API_URL` | 后端 API 地址 | 否 | 不填时按运行环境自动回退 |
| `VITE_DISABLE_SUPABASE_CLIENT_AUTH` | 是否禁用前端 Supabase Auth | 否 | 大陆部署建议 `true` |
| `VITE_ENABLE_RN_PET_DETAILS` | RN 试点入口开关 | 否 | 可按环境启用 |

## 部署环境

把真实 secret 存在部署平台的环境变量或 Secret Manager 中，例如 Vercel Project Settings、CloudBase 环境变量、GitHub Actions Secrets 或 Supabase Dashboard。代码库只保存 `.env.example` 和这份说明，便于维护变量清单和默认约定。
