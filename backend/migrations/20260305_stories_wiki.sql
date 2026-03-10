-- ============================================
-- 功能8：领养成功故事墙 + 功能9：宠物知识百科
-- 数据库迁移脚本
-- 创建日期：2026-03-05
-- ============================================

-- ============================================
-- 一、领养成功故事墙表
-- ============================================

-- 领养故事表
CREATE TABLE IF NOT EXISTS adoption_stories (
    id SERIAL PRIMARY KEY,
    dog_id INTEGER REFERENCES dogs(id) ON DELETE SET NULL,
    adopter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    foster_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    cover_image VARCHAR(500),
    images JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'pending',
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 故事时间线（成长记录）
CREATE TABLE IF NOT EXISTS story_timeline (
    id SERIAL PRIMARY KEY,
    story_id INTEGER REFERENCES adoption_stories(id) ON DELETE CASCADE,
    title VARCHAR(200),
    content TEXT,
    image VARCHAR(500),
    milestone_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 故事点赞表
CREATE TABLE IF NOT EXISTS story_likes (
    id SERIAL PRIMARY KEY,
    story_id INTEGER REFERENCES adoption_stories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(story_id, user_id)
);

-- 故事评论表
CREATE TABLE IF NOT EXISTS story_comments (
    id SERIAL PRIMARY KEY,
    story_id INTEGER REFERENCES adoption_stories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id INTEGER REFERENCES story_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 二、宠物知识百科表
-- ============================================

-- 文章分类表
CREATE TABLE IF NOT EXISTS wiki_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 文章标签表
CREATE TABLE IF NOT EXISTS wiki_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 文章表
CREATE TABLE IF NOT EXISTS wiki_articles (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES wiki_categories(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    cover_image VARCHAR(500),
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 文章标签关联表
CREATE TABLE IF NOT EXISTS wiki_article_tags (
    article_id INTEGER REFERENCES wiki_articles(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES wiki_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, tag_id)
);

-- 文章收藏表
CREATE TABLE IF NOT EXISTS wiki_favorites (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES wiki_articles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(article_id, user_id)
);

-- ============================================
-- 三、初始化数据
-- ============================================

-- 插入百科分类
INSERT INTO wiki_categories (name, slug, description, icon, sort_order) VALUES
('品种百科', 'breeds', '各类宠物犬品种详细介绍', 'pets', 1),
('养护指南', 'care', '日常养护、饮食、美容指南', 'spa', 2),
('疾病科普', 'health', '常见疾病预防与治疗知识', 'local_hospital', 3),
('行为训练', 'training', '宠物行为解读与训练技巧', 'school', 4),
('领养知识', 'adoption', '领养流程、注意事项、准备工作', 'favorite', 5)
ON CONFLICT (slug) DO NOTHING;

-- 插入示例文章
INSERT INTO wiki_articles (category_id, title, slug, summary, content, is_published, published_at) VALUES
(
    (SELECT id FROM wiki_categories WHERE slug = 'breeds'),
    '金毛寻回犬：温暖的大天使',
    'golden-retriever-guide',
    '金毛寻回犬是最受欢迎的宠物犬之一，性格温顺、智商高、对人友善，是家庭宠物的理想选择。',
    '# 金毛寻回犬：温暖的大天使

## 品种简介

金毛寻回犬（Golden Retriever）原产于苏格兰，是一种中大型犬种。它们以金色的被毛、友善的性格和高智商而闻名于世。

## 性格特点

- **温顺友善**：对人和其他动物都非常友好
- **智商高**：在犬类智商排名中位列第四
- **易于训练**：服从性强，适合新手养犬
- **活泼好动**：需要充足的运动量

## 饲养建议

### 饮食
- 每日食量：成年犬约 300-400g 狗粮
- 注意控制体重，避免肥胖

### 运动
- 每天至少需要 1-2 小时的户外活动
- 喜欢游泳和接球游戏

### 护理
- 每周梳理 2-3 次毛发
- 定期洗澡，保持清洁

## 适合人群

金毛寻回犬适合有充足时间陪伴、喜欢户外活动的家庭。它们对孩子特别友善，是理想的家庭伴侣犬。',
    true,
    NOW()
),
(
    (SELECT id FROM wiki_categories WHERE slug = 'care'),
    '新手养狗必备清单',
    'new-dog-owner-checklist',
    '第一次养狗不知道准备什么？这份清单帮你搞定所有必需品，让毛孩子快乐安家。',
    '# 新手养狗必备清单

## 基础用品

### 饮食类
- [ ] 狗粮（根据犬龄选择幼犬/成犬粮）
- [ ] 食盆和水盆（建议不锈钢或陶瓷材质）
- [ ] 零食（用于训练和奖励）

### 居住类
- [ ] 狗窝或垫子
- [ ] 围栏或笼子（用于训练和安全）
- [ ] 玩具（磨牙棒、球类、绳结玩具）

### 护理类
- [ ] 梳子（根据毛发类型选择）
- [ ] 指甲剪
- [ ] 宠物专用洗发水
- [ ] 毛巾

### 出行类
- [ ] 牵引绳和项圈/胸背带
- [ ] 拾便袋
- [ ] 便携水碗

## 健康准备

- [ ] 找到附近的宠物医院
- [ ] 预约疫苗接种
- [ ] 准备体内外驱虫药
- [ ] 购买宠物保险（推荐）

## 环境准备

1. **安全检查**：移除家中对狗狗有毒的植物和危险物品
2. **划定区域**：为狗狗准备专属的活动和休息区域
3. **收纳物品**：将鞋子、电线等收好，避免被咬坏

准备好这些，你就可以迎接新家庭成员啦！',
    true,
    NOW()
),
(
    (SELECT id FROM wiki_categories WHERE slug = 'adoption'),
    '领养流程详解：从申请到接回家',
    'adoption-process-guide',
    '了解完整的领养流程，让你和毛孩子的相遇更加顺利。',
    '# 领养流程详解：从申请到接回家

## 第一步：浏览与选择

在汪星球浏览待领养的宠物，通过筛选功能找到符合你条件的狗狗。

## 第二步：提交申请

点击"申请领养"，填写详细信息：
- 个人基本信息
- 居住条件
- 养宠经验
- 联系方式

## 第三步：等待审核

送养人会在 3-5 个工作日内审核你的申请，可能包括：
- 电话访谈
- 家访（部分情况）
- 参考人核实

## 第四步：见面互动

审核通过后，安排与狗狗见面：
- 观察狗狗性格
- 确认彼此是否合适
- 与送养人沟通细节

## 第五步：签署协议

签署领养协议，明确双方责任：
- 不得转卖或遗弃
- 定期疫苗和体检
- 接受回访

## 第六步：接回家

准备好所有用品，迎接新家庭成员！

## 领养后支持

汪星球提供领养后的持续支持：
- 养宠知识库
- 专家问答
- 社区交流

**每一只被领养的狗狗，都值得我们用心对待。**',
    true,
    NOW()
);

-- 示例故事数据已移除（需要真实用户 ID 才能插入）
-- 可以在应用中通过 UI 创建故事

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要自动更新 updated_at 的表创建触发器
DROP TRIGGER IF EXISTS update_adoption_stories_updated_at ON adoption_stories;
CREATE TRIGGER update_adoption_stories_updated_at
    BEFORE UPDATE ON adoption_stories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wiki_articles_updated_at ON wiki_articles;
CREATE TRIGGER update_wiki_articles_updated_at
    BEFORE UPDATE ON wiki_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 添加表注释
COMMENT ON TABLE adoption_stories IS '领养成功故事表';
COMMENT ON TABLE story_timeline IS '故事时间线（成长记录）';
COMMENT ON TABLE story_likes IS '故事点赞表';
COMMENT ON TABLE story_comments IS '故事评论表';
COMMENT ON TABLE wiki_categories IS '百科文章分类表';
COMMENT ON TABLE wiki_tags IS '百科文章标签表';
COMMENT ON TABLE wiki_articles IS '百科文章表';
COMMENT ON TABLE wiki_article_tags IS '文章标签关联表';
COMMENT ON TABLE wiki_favorites IS '文章收藏表';
