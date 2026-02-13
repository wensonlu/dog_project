# 宠物领养评价系统 - 实施文档

## 功能概述

为宠物详情页添加完整的评价系统，允许成功领养的用户分享领养故事，包括星级评分、文字评价、照片上传和点赞互动功能。

## 实施内容

### 1. 数据库层 (Backend)

#### 新增表结构
**文件位置**: `/backend/migrations/create_reviews_table.sql`

- **reviews 表**: 存储评价核心数据
  - `id`: 主键
  - `application_id`: 关联领养申请 (外键，确保一次申请只能评价一次)
  - `user_id`: 评价用户 (外键)
  - `dog_id`: 被评价的宠物 (外键)
  - `rating`: 星级评分 (1-5，CHECK 约束)
  - `content`: 评价内容 (TEXT)
  - `photos`: 照片列表 (JSON 格式)
  - `created_at`: 创建时间

- **review_likes 表**: 存储点赞记录
  - `id`: 主键
  - `review_id`: 关联评价 (外键)
  - `user_id`: 点赞用户 (外键)
  - 复合唯一索引 (review_id, user_id) 防止重复点赞

### 2. API 层 (Backend)

**文件位置**: `/backend/routes/reviews.js`

#### 实现的 API 端点

1. **GET `/api/reviews/:dogId`** - 获取指定宠物的所有评价
   - 支持游客访问
   - 已登录用户可查看自己的点赞状态
   - 自动解析照片 JSON 数据

2. **POST `/api/reviews`** - 创建新评价
   - 需要身份验证
   - 支持上传最多 3 张照片 (5MB 限制)
   - 验证逻辑:
     - 必填字段检查 (applicationId, dogId, rating, content)
     - 评分范围 (1-5)
     - 内容长度 (10-500 字)
     - 领养申请验证 (必须是已批准的申请)
     - 防止重复评价

3. **POST `/api/reviews/:reviewId/like`** - 点赞/取消点赞
   - 需要身份验证
   - 切换点赞状态

4. **GET `/api/reviews/check-eligibility/:dogId`** - 检查评价资格
   - 需要身份验证
   - 返回用户是否有资格评价及原因
   - 返回可用的 applicationId

#### 图片上传配置
- 存储目录: `uploads/reviews/`
- 文件命名: `review-{timestamp}-{random}.{ext}`
- 支持格式: JPEG, JPG, PNG, WebP
- 大小限制: 5MB/张

### 3. 前端组件层

#### ReviewForm.jsx (评价表单组件)
**文件位置**: `/frontend/src/components/ReviewForm.jsx`

**功能特性**:
- 交互式星级评分选择器 (1-5 星)
- 文字评价输入框 (10-500 字，实时字数统计)
- 照片上传功能:
  - 最多 3 张
  - 实时预览
  - 可删除已选照片
- 表单验证:
  - 内容长度检查
  - 提交前禁用逻辑
- 动画效果 (Framer Motion)

**Props**:
- `dogId`: 宠物 ID
- `applicationId`: 领养申请 ID
- `onSuccess`: 提交成功回调
- `onCancel`: 取消操作回调

#### ReviewSection.jsx (评价展示组件)
**文件位置**: `/frontend/src/components/ReviewSection.jsx`

**功能特性**:
- 评价列表展示:
  - 用户头像和用户名
  - 星级评分可视化
  - 评价内容
  - 上传的照片网格 (可点击查看大图)
  - 点赞按钮和计数
  - 相对时间显示 (今天/昨天/N天前等)
- 条件渲染"写评价"按钮 (仅有资格用户可见)
- 评价表单动画展开/收起
- 空状态友好提示

**Props**:
- `dogId`: 宠物 ID
- `reviews`: 初始评价列表
- `canReview`: 用户是否有资格评价
- `applicationId`: 用户的领养申请 ID
- `onReviewAdded`: 新评价添加后的回调

### 4. 页面集成

**文件位置**: `/frontend/src/pages/PetDetails.jsx`

**集成内容**:
1. 导入依赖:
   - `useAuth` Hook (获取当前用户)
   - `ReviewSection` 组件

2. 状态管理:
   ```javascript
   const [reviews, setReviews] = useState([]);
   const [canReview, setCanReview] = useState(false);
   const [applicationId, setApplicationId] = useState(null);
   const [loadingReviews, setLoadingReviews] = useState(true);
   ```

3. 数据获取:
   - `fetchReviews()`: 获取评价列表
   - `checkEligibility()`: 检查用户评价资格

4. 组件插入:
   - 位置: "相关讨论"板块和"所在地"板块之间
   - 传递必要的 props 和回调函数

## 技术亮点

### 安全性
- JWT 身份验证保护敏感 API
- 严格的权限验证 (只有已批准的领养者才能评价)
- 防止重复评价 (数据库级别的唯一约束)
- 文件类型和大小验证

### 用户体验
- 实时预览上传的照片
- 优雅的动画效果 (Framer Motion)
- 响应式设计 (暗色模式支持)
- 相对时间显示增强可读性
- 表单验证和错误提示友好

### 数据完整性
- 外键约束确保关联数据一致性
- CHECK 约束限制评分范围
- 唯一索引防止重复点赞和重复评价
- JSON 格式存储照片列表便于扩展

## 待执行步骤

### 1. 数据库迁移
执行以下命令创建表结构:
```bash
# 连接到数据库
mysql -u your_username -p your_database

# 执行迁移脚本
source /path/to/backend/migrations/create_reviews_table.sql
```

### 2. 创建上传目录
```bash
mkdir -p backend/uploads/reviews
```

### 3. 配置静态文件服务
确保 Express 应用配置了静态文件服务:
```javascript
app.use('/uploads', express.static('uploads'));
```

### 4. 测试流程
1. 创建一个已批准的领养申请
2. 登录为领养者账户
3. 访问宠物详情页
4. 验证"写评价"按钮显示
5. 提交评价 (包含照片上传)
6. 验证评价显示和点赞功能

## 文件清单

### 后端文件
- ✅ `/backend/migrations/create_reviews_table.sql` - 数据库表结构
- ✅ `/backend/routes/reviews.js` - API 路由实现
- ✅ `/backend/index.js` - 路由注册 (已修改)

### 前端文件
- ✅ `/frontend/src/components/ReviewForm.jsx` - 评价表单组件
- ✅ `/frontend/src/components/ReviewSection.jsx` - 评价展示组件
- ✅ `/frontend/src/pages/PetDetails.jsx` - 宠物详情页 (已集成)

### 文档文件
- ✅ `/docs/review-system-implementation.md` - 本文档

## 注意事项

1. **生产环境部署**:
   - 确保 `uploads/reviews/` 目录有正确的写入权限
   - 考虑使用 CDN 存储用户上传的图片
   - 定期清理未关联的孤立图片文件

2. **性能优化**:
   - 评价列表可考虑分页加载
   - 图片可添加缩略图生成逻辑
   - 添加缓存策略减少数据库查询

3. **功能扩展**:
   - 可添加举报不当评价功能
   - 可添加管理员审核机制
   - 可添加评价回复功能
   - 可添加照片水印防止盗用

## 总结

评价系统已完整实现，包括:
- ✅ 完整的数据库表结构设计
- ✅ 安全的后端 API 实现
- ✅ 美观的前端组件开发
- ✅ 无缝的页面集成

系统遵循现有代码规范，与论坛功能保持一致的设计模式。所有代码已提交，等待数据库迁移后即可投入使用。
