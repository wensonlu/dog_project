# 汪星球功能8&9技术方案

> 功能8：领养成功故事墙  
> 功能9：宠物知识百科  
> 创建日期：2026-03-05  
> 版本：v1.0

---

## 一、功能8：领养成功故事墙

### 1.1 功能概述
展示已领养宠物的幸福生活，形成情感共鸣，鼓励更多人领养。支持送养人与领养人互动，记录宠物成长时间线。

### 1.2 核心功能点

| 功能 | 说明 |
|------|------|
| 故事列表 | 瀑布流展示领养成功案例 |
| 故事详情 | 宠物照片、领养前后对比、成长时间线 |
| 发布故事 | 领养人上传照片和文字记录 |
| 互动功能 | 点赞、评论、送养人回应 |
| 关联宠物 | 链接到原宠物信息和送养人 |

### 1.3 数据库设计

```sql
-- 领养故事表
CREATE TABLE adoption_stories (
    id SERIAL PRIMARY KEY,
    dog_id INTEGER REFERENCES dogs(id),
    adopter_id UUID REFERENCES profiles(id),
    foster_id UUID REFERENCES profiles(id),
    title VARCHAR(200) NOT NULL,
    content TEXT,
    cover_image VARCHAR(500),
    images JSONB DEFAULT '[]', -- 多张图片数组
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 故事时间线（成长记录）
CREATE TABLE story_timeline (
    id SERIAL PRIMARY KEY,
    story_id INTEGER REFERENCES adoption_stories(id) ON DELETE CASCADE,
    title VARCHAR(200),
    content TEXT,
    image VARCHAR(500),
    milestone_date DATE, -- 记录日期（如到家第30天）
    created_at TIMESTAMP DEFAULT NOW()
);

-- 故事点赞表
CREATE TABLE story_likes (
    id SERIAL PRIMARY KEY,
    story_id INTEGER REFERENCES adoption_stories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(story_id, user_id)
);

-- 故事评论表
CREATE TABLE story_comments (
    id SERIAL PRIMARY KEY,
    story_id INTEGER REFERENCES adoption_stories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    content TEXT NOT NULL,
    parent_id INTEGER REFERENCES story_comments(id), -- 支持回复
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 1.4 API 设计

```javascript
// 故事相关 API
GET    /api/stories              // 获取故事列表（分页、筛选）
GET    /api/stories/:id          // 获取故事详情
POST   /api/stories              // 发布故事
PUT    /api/stories/:id          // 更新故事
DELETE /api/stories/:id          // 删除故事

// 时间线 API
GET    /api/stories/:id/timeline // 获取故事时间线
POST   /api/stories/:id/timeline // 添加时间线记录

// 互动 API
POST   /api/stories/:id/like     // 点赞/取消点赞
GET    /api/stories/:id/comments // 获取评论列表
POST   /api/stories/:id/comments // 发表评论
```

### 1.5 前端页面

| 页面 | 路径 | 说明 |
|------|------|------|
| 故事墙首页 | /stories | 瀑布流展示 |
| 故事详情 | /stories/:id | 完整故事 + 时间线 |
| 发布故事 | /stories/create | 表单页面 |
| 我的故事 | /profile/stories | 个人发布的故事 |

---

## 二、功能9：宠物知识百科

### 2.1 功能概述
提供品种介绍、养护指南、疾病科普等知识内容，与宠物医院/专家合作，通过内容营销实现SEO引流。

### 2.2 核心功能点

| 功能 | 说明 |
|------|------|
| 文章分类 | 品种百科、养护指南、疾病科普、行为训练 |
| 文章列表 | 按分类、标签筛选 |
| 文章详情 | 富文本内容、相关文章推荐 |
| 搜索功能 | 全文搜索 |
| 收藏文章 | 用户收藏感兴趣的内容 |
| 专家问答 | 用户提问，专家回答（扩展功能） |

### 2.3 数据库设计

```sql
-- 文章分类表
CREATE TABLE wiki_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 文章标签表
CREATE TABLE wiki_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 文章表
CREATE TABLE wiki_articles (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES wiki_categories(id),
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    cover_image VARCHAR(500),
    author_id UUID REFERENCES profiles(id),
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 文章标签关联表
CREATE TABLE wiki_article_tags (
    article_id INTEGER REFERENCES wiki_articles(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES wiki_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, tag_id)
);

-- 文章收藏表
CREATE TABLE wiki_favorites (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES wiki_articles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(article_id, user_id)
);
```

### 2.4 API 设计

```javascript
// 分类 API
GET /api/wiki/categories           // 获取所有分类

// 文章 API
GET /api/wiki/articles             // 获取文章列表（支持分类、标签筛选）
GET /api/wiki/articles/:slug       // 获取文章详情
GET /api/wiki/articles/search      // 搜索文章
POST /api/wiki/articles            // 创建文章（管理员）
PUT /api/wiki/articles/:id         // 更新文章

// 收藏 API
GET /api/wiki/favorites            // 获取用户收藏
POST /api/wiki/favorites           // 收藏文章
DELETE /api/wiki/favorites/:id     // 取消收藏
```

### 2.5 前端页面

| 页面 | 路径 | 说明 |
|------|------|------|
| 百科首页 | /wiki | 分类入口、热门文章 |
| 分类列表 | /wiki/:category | 按分类查看文章 |
| 文章详情 | /wiki/article/:slug | 完整文章内容 |
| 搜索结果 | /wiki/search | 搜索结果显示 |
| 我的收藏 | /profile/wiki-favorites | 收藏的文章 |

---

## 三、技术实现要点

### 3.1 图片存储
- 使用 Supabase Storage
- 路径规划：
  - `stories/` - 领养故事图片
  - `wiki/` - 百科文章图片

### 3.2 性能优化
- 图片懒加载
- 列表分页（cursor-based）
- 内容缓存（Redis，后续扩展）

### 3.3 SEO 优化（百科）
- 服务端渲染或预渲染
- 结构化数据（Schema.org）
- 友好的 URL slug
- Meta 标签优化

### 3.4 权限控制
- 故事发布：仅领养人可发布
- 文章发布：仅管理员/专家
- 评论：登录用户

---

## 四、实施计划

### Phase 1：基础功能（2-3天）
1. 数据库表创建
2. 后端 API 开发
3. 基础页面实现

### Phase 2：完善功能（2-3天）
1. 图片上传功能
2. 互动功能（点赞、评论）
3. 搜索功能

### Phase 3：优化迭代（1-2天）
1. UI 优化
2. 性能优化
3. 测试修复

---

*文档生成时间：2026-03-05*
