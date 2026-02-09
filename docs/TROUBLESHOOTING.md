# 故障排查指南

## 问题：前端页面看不到效果

### 可能的原因

1. **Supabase 连接失败**（当前问题）
   - DNS 无法解析 Supabase 域名
   - 网络连接问题
   - Supabase 项目可能被暂停或删除

2. **用户未登录**
   - 前端会重定向到登录页
   - 需要先登录才能看到首页内容

3. **API 调用失败**
   - 后端服务未启动
   - CORS 配置问题
   - 端口冲突

### 诊断步骤

#### 1. 检查网络连接

```bash
# 测试 Supabase 域名解析
ping djvhueamitqvosgruioo.supabase.co

# 测试 Supabase API 连接
curl -v https://djvhueamitqvosgruioo.supabase.co/rest/v1/
```

#### 2. 检查后端服务

```bash
# 检查后端是否运行
curl http://localhost:5001/health

# 检查 API 是否正常
curl http://localhost:5001/api/dogs
```

#### 3. 检查前端服务

```bash
# 检查前端是否运行
curl http://localhost:5173

# 在浏览器中打开
open http://localhost:5173
```

#### 4. 检查用户登录状态

- 打开浏览器开发者工具（F12）
- 查看 Console 标签页的错误信息
- 查看 Application > Local Storage 中是否有 `pawmate_user` 键

### 解决方案

#### 方案 1：修复 Supabase 连接

1. **检查 Supabase 项目状态**
   - 登录 Supabase Dashboard
   - 确认项目是否仍然存在
   - 检查项目是否被暂停

2. **验证环境变量**
   ```bash
   cd backend
   cat .env | grep SUPABASE
   ```

3. **更新 Supabase URL 和密钥**
   - 如果项目已迁移，更新 `.env` 文件中的 `SUPABASE_URL`
   - 从 Supabase Dashboard > Settings > API 获取最新的密钥

4. **检查网络配置**
   - 确认网络连接正常
   - 检查防火墙或代理设置
   - 尝试使用 VPN 或更换网络

#### 方案 2：使用 Mock 数据模式

如果 Supabase 暂时无法连接，可以启用 Mock 模式：

1. **修改后端配置**
   - 在 `backend/config/supabase.js` 中，当 Supabase 未初始化时，返回 mock 数据
   - 或创建一个 mock 模式开关

2. **临时解决方案**
   - 使用本地 JSON 文件作为数据源
   - 或使用其他数据库服务

#### 方案 3：确保用户已登录

1. **访问登录页**
   - 打开 `http://localhost:5173/login`
   - 输入邮箱和密码登录

2. **注册新用户**
   - 如果还没有账号，访问 `http://localhost:5173/register`
   - 注册后会自动登录

### 当前问题诊断

根据检查结果：
- ✅ 前端服务正常运行（端口 5173）
- ✅ 后端服务正常运行（端口 5001）
- ✅ 后端健康检查正常
- ❌ Supabase DNS 无法解析
- ❌ API `/api/dogs` 返回错误

### 建议操作

1. **立即操作**：
   - 检查 Supabase Dashboard 确认项目状态
   - 验证 `.env` 文件中的 Supabase URL 是否正确
   - 尝试在浏览器中直接访问 Supabase URL

2. **如果 Supabase 项目不存在**：
   - 创建新的 Supabase 项目
   - 更新 `.env` 文件中的配置
   - 重新运行数据库迁移脚本

3. **如果网络问题**：
   - 检查 DNS 设置
   - 尝试使用其他网络
   - 检查代理或防火墙配置
