# Pet Talking Card Handoff

## 文件清单
- `pet-talking-card-hifi.html`: 移动端高保真展示稿
- `pet-talking-card-hifi-sim.html`: 多状态切换模拟器

## 开发映射（data-ui）
- `pet-card-root`: 卡片容器
- `pet-card-bubble`: 梗文案气泡
- `start-execution`: 开始播放
- `inject-failure`: 失败注入
- `retry`: 重试
- `cancel`: 取消
- `event-log`: 事件日志区

## 交互约束
- 默认不自动播音，用户主动点击触发
- 单卡首播为完整语音，再次点击优先彩蛋短句
- 静音后仅展示文字，不发起 TTS 请求

## 埋点建议
- `talk_card_impression`
- `talk_card_play_click`
- `talk_card_play_3s`
- `talk_card_play_end`
- `talk_card_retry`
- `talk_card_cancel`
- `talk_card_share`
- `talk_card_favorite`
