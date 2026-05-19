# 宠物会说话卡片（搞笑玩梗）技术方案

## 1. 架构分层
- Frontend（React/Vite）
  - 卡片展示、播放控制、字幕同步、状态埋点
- Backend（Express）
  - 文案生成编排、事实校验、风险过滤、缓存命中
- AI Service
  - LLM 生成玩梗文本（结构化 JSON）
  - TTS 语音合成并回传音频 URL
- Data & Storage（Supabase）
  - `pets` 基础资料
  - `ai_talk_lines` 候选文案缓存
  - Storage 存储音频文件

## 2. MCP tools 清单（输入/输出）
- `LLM.generate`:
  - 输入：`pet_profile`, `persona`, `meme_style`, `safety_rules`
  - 输出：`hook`, `main_line`, `cta_line`, `risk_flags`
- `TTS.synthesize`:
  - 输入：`text`, `voice_id`, `speed`
  - 输出：`audio_bytes`/`audio_url`
- `Moderation.filter`:
  - 输入：`text`
  - 输出：`pass`, `category`, `reason`

## 3. 接口定义
- `POST /api/ai/pet-line`
  - req: `{ petId, style: "meme", seed? }`
  - res: `{ lineId, bubbleText, speechText, source: "cache|generated" }`
- `POST /api/ai/pet-voice`
  - req: `{ lineId, speechText }`
  - res: `{ audioUrl, durationMs, source: "cache|synthesized" }`
- `POST /api/ai/pet-feedback`
  - req: `{ lineId, action: "like|skip|report" }`
  - res: `{ ok: true }`

## 4. 执行状态机（Task/Step）
- Task: `PetTalkingCardSession`
  - Step 1 `INIT`: 卡片进入视窗
  - Step 2 `TAKEOVER`: 文案准备完毕
  - Step 3 `RUNNING`: 语音播放中
  - Step 4 `FAILED`: 文案或 TTS 失败
  - Step 5 `DONE`: 播放结束并可转化
- 迁移规则：
  - `INIT -> TAKEOVER` 需拿到可用文案
  - `RUNNING -> FAILED` 由超时/音频拉取失败触发
  - `FAILED -> RUNNING` 允许一次自动重试 + 手动重试

## 5. 事件协议
统一事件载荷：
```json
{
  "event": "talk_card_play_end",
  "petId": "uuid",
  "lineId": "uuid",
  "sessionId": "uuid",
  "ts": 1716123456789,
  "meta": { "source": "cache", "durationMs": 7420 }
}
```
核心事件：
- `talk_card_impression`
- `talk_card_play_click`
- `talk_card_play_3s`
- `talk_card_play_end`
- `talk_card_retry`
- `talk_card_cancel`
- `talk_card_switch_line`
- `talk_card_report_line`

## 6. 安全与幂等策略
- 安全策略
  - Prompt 约束：禁止医疗承诺、歧视、低俗、价格误导
  - 事实白名单：仅可引用 `pets` 表中的结构化字段
  - 输出审核：规则引擎 + moderation 双层过滤
- 幂等策略
  - 文案生成幂等键：`petId:style:version:seed`
  - 音频合成幂等键：`sha256(speechText + voiceId + speed)`
  - 重试时优先读缓存，避免重复计费

## 7. 测试计划与里程碑
- M1（第 1-2 天）
  - 完成接口桩与前端状态流
  - 验收：5 状态可切换，事件日志可见
- M2（第 3-4 天）
  - 接入 LLM 文案 + 风险过滤 + 文本缓存
  - 验收：成功/失败/降级链路可回归
- M3（第 5-6 天）
  - 接入 TTS + 音频缓存 + 埋点看板
  - 验收：点击播报成功率 >= 98%
- M4（第 7 天）
  - 小流量灰度与 A/B（玩梗强度）
  - 验收：播放率和收藏率较基线提升
