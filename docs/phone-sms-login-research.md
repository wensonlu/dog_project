# 手机号验证码登录/注册接入调研

> 调研目标：在现有「邮箱 + 密码」登录基础上，接入「手机号 + 短信验证码」登录/注册方式。  
> 当前技术栈：前端 React，后端 Express + **Supabase Auth**。

---

## 1. 结论摘要

- **Supabase 原生支持**手机号 OTP 登录（`signInWithOtp({ phone })` + `verifyOtp()`），无需自建验证码服务。
- 需要在 **Supabase Dashboard** 开启 Phone 认证并配置 **SMS 服务商**（如 Twilio、Vonage、MessageBird 等）。
- 后端可继续用现有 Express 做一层封装，或改为前端直连 Supabase（需妥善保管 anon key）；**Session/用户信息** 仍可按现有方式同步到本地（如 localStorage + AuthContext）。
- **与现有邮箱密码登录可并存**，同属 Supabase Auth 用户体系。

---

## 2. Supabase 手机号 OTP 能力

### 2.1 流程概述

| 步骤 | 说明 |
|------|------|
| 1. 用户输入手机号 | 需带国家码，如 `+8613800138000` |
| 2. 请求 OTP | 调用 `signInWithOtp({ phone: '+8613800138000' })`，Supabase 通过已配置的 SMS 服务商下发 6 位验证码 |
| 3. 用户输入验证码 | 60 秒内有效（可配置），默认 OTP 1 小时过期 |
| 4. 验证并登录 | 调用 `verifyOtp({ phone, token: '123456', type: 'sms' })`，成功后得到 session，即视为登录/注册完成 |

**注册与登录合一**：手机号首次使用时自动完成注册，无需单独「注册」接口。

### 2.2 官方文档

- [Phone Login \| Supabase Docs](https://supabase.com/docs/guides/auth/phone-login)（开启方式、SMS 服务商、限流与安全）
- [verifyOtp](https://supabase.com/docs/reference/javascript/auth-verifyotp)（验证 OTP 并拿到 session）

### 2.3 限制与注意点

- **频率**：同一手机号默认 60 秒内只能请求一次 OTP，需在 Dashboard 或自托管配置中调整。
- **成本**：每条短信由所选 SMS 服务商计费，建议配合 **CAPTCHA** 与 **Rate Limit** 控制滥用（见 [Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)）。
- **地区合规**：部分国家/地区对商业短信有要求（如印度 TRAI DLT），上线前需确认合规。

---

## 3. SMS 服务商（Supabase 支持）

| 服务商 | 说明 | 文档 |
|--------|------|------|
| **Twilio** | 常用，支持 Verify 与 Programmable Messaging | [Phone Auth with Twilio](https://supabase.com/docs/guides/auth/phone-login/twilio) |
| **Vonage** | 国际短信能力成熟 | Dashboard 内可选 Vonage |
| **MessageBird** | 欧洲常用 | Dashboard 内可选 MessageBird |
| **TextLocal** | 社区支持 | 需自行查阅 Supabase 自托管/社区配置 |

国内正式环境若需发国内手机号，需额外确认：  
- Twilio/Vonage 等对**中国大陆号码**的到达率与合规（部分需报备、签名等）；  
- 或考虑**国内短信服务商 + Supabase Auth Hooks**（[Send SMS Hook](https://supabase.com/docs/guides/auth/auth-hooks/send-sms-hook)）自建发码逻辑，由 Supabase 只做校验与 session 签发。

---

## 4. 接入方式与架构建议

### 4.1 Supabase Dashboard 配置

1. **Auth → Providers**：开启 **Phone** 认证。
2. **Auth → SMS**（或 Settings → Auth）：选择并配置 SMS 服务商（如 Twilio 的 Account SID、Auth Token、发送号码等）。
3. **Auth → Rate Limits**：按需调整「每手机号请求 OTP 间隔」等。
4. **Auth → Templates**：可自定义短信模板，使用变量如 `{{ .Code }}` 作为验证码。

### 4.2 后端（Express）两种思路

**方案 A：后端代理 Supabase（推荐，与现有架构一致）**

- 现有登录/注册走 Express，再调 Supabase；手机号 OTP 可同样由 Express 转发：
  - `POST /auth/send-otp`：body `{ phone }`，后端用 **Service Role** 或 **Anon** 调 `supabase.auth.signInWithOtp({ phone })`，仅把成功/失败返回前端。
  - `POST /auth/verify-otp`：body `{ phone, token }`，后端调 `supabase.auth.verifyOtp({ phone, token, type: 'sms' })`，拿到 session 后按现有逻辑返回用户信息并让前端写入 localStorage + AuthContext。
- 优点：不暴露 Supabase anon key 给前端（若当前未暴露）；可统一日志、限流、风控。

**方案 B：前端直连 Supabase**

- 前端引入 `@supabase/supabase-js`，用 anon key 直接调 `signInWithOtp` 和 `verifyOtp`，成功后把返回的 `user/session` 同步到现有 AuthContext 和 localStorage。
- 优点：实现快；缺点：anon key 暴露在前端（Supabase 设计如此，但需配合 RLS 与 rate limit）。

当前项目若前端未直连 Supabase，建议采用 **方案 A**，与现有 `authController.js` 风格一致。

### 4.3 前端改动要点

- **登录页**：在现有「邮箱 + 密码」旁增加 **「手机号登录」** 入口（如 Tab 或切换链接）。
- **手机号登录流程**：  
  1）输入手机号（带国家码选择，如 +86）→ 调用发码接口；  
  2）展示「输入 6 位验证码」+ 倒计时（60s 内不可重发）；  
  3）提交验证码 → 调用验码接口 → 拿到 user/session 后写入 AuthContext 并跳转首页。
- **AuthContext**：增加 `loginWithPhone(phone)`、`verifyPhoneOtp(phone, token)`（或统一为一个「手机号登录」方法内部调两个接口），与现有 `login(email, password)` 并存；本地存储仍用 `pawmate_user` 等现有 key，便于与现有鉴权逻辑兼容。

### 4.4 与现有邮箱登录的关系

- 同一 Supabase 项目中，**邮箱用户** 与 **手机号用户** 都是 `auth.users` 中的用户，可并存。
- 若未来要做「一个账号既绑邮箱又绑手机」，需在用户已登录后调用 Supabase 的 `updateUser` 等能力做绑定，并注意二次验证与安全策略。

---

## 5. 实现步骤建议（落地顺序）

1. **确认 SMS 服务商**：先选 Twilio 或 Vonage，在 Supabase Dashboard 完成配置并测试向目标国家/地区发码。
2. **后端**：新增 `POST /auth/send-otp`、`POST /auth/verify-otp`，内部调 Supabase `signInWithOtp` 与 `verifyOtp`，返回格式与现有 login 对齐（如 `{ user, session }` 或仅 `user`）。
3. **AuthContext**：新增手机号登录相关方法，并统一写入当前用户与 token（若后端返回 session，可只把 user 写入 localStorage，或按现有方式存）。
4. **登录页**：增加「手机号登录」Tab/区块，实现发码 → 输入验证码 → 验码登录的完整流程，并做错误与 loading 状态处理。
5. **可选**：Rate limit、CAPTCHA、短信模板与文案优化。

---

## 6. 参考链接

- [Supabase Phone Login](https://supabase.com/docs/guides/auth/phone-login)
- [Supabase verifyOtp](https://supabase.com/docs/reference/javascript/auth-verifyotp)
- [Phone Auth with Twilio \| Supabase](https://supabase.com/docs/guides/auth/phone-login/twilio)
- [Send SMS Hook（自建发码）](https://supabase.com/docs/guides/auth/auth-hooks/send-sms-hook)
- [Production Checklist（含 CAPTCHA、限流）](https://supabase.com/docs/guides/platform/going-into-prod)

---

*文档版本：2026-02-26，基于当前 Supabase 文档与项目架构整理。*
