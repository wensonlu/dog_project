-- 创建评价表 (Supabase 版本)
-- 注意：Supabase 的用户在 auth.users 表中，我们使用 UUID 类型的 user_id

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL,
    user_id UUID NOT NULL,  -- Supabase auth.users 使用 UUID
    dog_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    content TEXT NOT NULL,
    photos JSONB DEFAULT NULL,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- 外键约束
    CONSTRAINT fk_reviews_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    -- Supabase auth.users 的外键引用
    CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_dog FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE,

    -- 确保每个申请只能评价一次
    CONSTRAINT unique_review_per_application UNIQUE (application_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_reviews_dog_id ON reviews(dog_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- 创建自动更新 updated_at 的触发器
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_reviews_updated_at();

-- 创建评价点赞表
CREATE TABLE IF NOT EXISTS review_likes (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL,
    user_id UUID NOT NULL,  -- Supabase auth.users 使用 UUID
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_review_likes_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_likes_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,

    -- 确保每个用户对每条评价只能点赞一次
    CONSTRAINT unique_like_per_user UNIQUE (review_id, user_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_review_likes_review_id ON review_likes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_likes_user_id ON review_likes(user_id);

-- 启用 RLS (Row Level Security) - Supabase 最佳实践
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_likes ENABLE ROW LEVEL SECURITY;

-- RLS 策略：允许所有人查看评价
CREATE POLICY "Allow public read access on reviews"
    ON reviews FOR SELECT
    USING (true);

-- RLS 策略：只允许认证用户创建评价
CREATE POLICY "Allow authenticated users to create reviews"
    ON reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS 策略：只允许创建者更新自己的评价
CREATE POLICY "Allow users to update their own reviews"
    ON reviews FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS 策略：只允许创建者删除自己的评价
CREATE POLICY "Allow users to delete their own reviews"
    ON reviews FOR DELETE
    USING (auth.uid() = user_id);

-- RLS 策略：允许所有人查看点赞
CREATE POLICY "Allow public read access on review_likes"
    ON review_likes FOR SELECT
    USING (true);

-- RLS 策略：只允许认证用户点赞
CREATE POLICY "Allow authenticated users to like reviews"
    ON review_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS 策略：只允许用户删除自己的点赞
CREATE POLICY "Allow users to delete their own likes"
    ON review_likes FOR DELETE
    USING (auth.uid() = user_id);
