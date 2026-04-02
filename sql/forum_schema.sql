-- Forum Topics Table
CREATE TABLE IF NOT EXISTS forum_topics (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '日常分享',
  tags JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum Comments Table
CREATE TABLE IF NOT EXISTS forum_comments (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  topic_id BIGINT NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum Replies Table
CREATE TABLE IF NOT EXISTS forum_replies (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  comment_id BIGINT NOT NULL REFERENCES forum_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum Topic Likes Table (用户对话题的点赞)
CREATE TABLE IF NOT EXISTS forum_topic_likes (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  topic_id BIGINT NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(topic_id, user_id)
);

-- Forum Comment Likes Table (用户对评论的点赞)
CREATE TABLE IF NOT EXISTS forum_comment_likes (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  comment_id BIGINT NOT NULL REFERENCES forum_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Forum Reply Likes Table (用户对回复的点赞)
CREATE TABLE IF NOT EXISTS forum_reply_likes (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  reply_id BIGINT NOT NULL REFERENCES forum_replies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reply_id, user_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_forum_topics_user_id ON forum_topics(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_topics_category ON forum_topics(category);
CREATE INDEX IF NOT EXISTS idx_forum_topics_created_at ON forum_topics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_comments_topic_id ON forum_comments(topic_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_comment_id ON forum_replies(comment_id);
CREATE INDEX IF NOT EXISTS idx_forum_topic_likes_topic_id ON forum_topic_likes(topic_id);
CREATE INDEX IF NOT EXISTS idx_forum_topic_likes_user_id ON forum_topic_likes(user_id);

-- Enable RLS
ALTER TABLE forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_topic_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_reply_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for forum_topics
DROP POLICY IF EXISTS "Anyone can view topics" ON forum_topics;
CREATE POLICY "Anyone can view topics" ON forum_topics
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create topics" ON forum_topics;
CREATE POLICY "Users can create topics" ON forum_topics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own topics" ON forum_topics;
CREATE POLICY "Users can update their own topics" ON forum_topics
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own topics" ON forum_topics;
CREATE POLICY "Users can delete their own topics" ON forum_topics
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for forum_comments
DROP POLICY IF EXISTS "Anyone can view comments" ON forum_comments;
CREATE POLICY "Anyone can view comments" ON forum_comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create comments" ON forum_comments;
CREATE POLICY "Users can create comments" ON forum_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON forum_comments;
CREATE POLICY "Users can update their own comments" ON forum_comments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON forum_comments;
CREATE POLICY "Users can delete their own comments" ON forum_comments
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for forum_replies
DROP POLICY IF EXISTS "Anyone can view replies" ON forum_replies;
CREATE POLICY "Anyone can view replies" ON forum_replies
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create replies" ON forum_replies;
CREATE POLICY "Users can create replies" ON forum_replies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own replies" ON forum_replies;
CREATE POLICY "Users can update their own replies" ON forum_replies
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own replies" ON forum_replies;
CREATE POLICY "Users can delete their own replies" ON forum_replies
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for forum_topic_likes
DROP POLICY IF EXISTS "Anyone can view topic likes" ON forum_topic_likes;
CREATE POLICY "Anyone can view topic likes" ON forum_topic_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can like/unlike topics" ON forum_topic_likes;
CREATE POLICY "Users can like/unlike topics" ON forum_topic_likes
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for forum_comment_likes
DROP POLICY IF EXISTS "Anyone can view comment likes" ON forum_comment_likes;
CREATE POLICY "Anyone can view comment likes" ON forum_comment_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can like/unlike comments" ON forum_comment_likes;
CREATE POLICY "Users can like/unlike comments" ON forum_comment_likes
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for forum_reply_likes
DROP POLICY IF EXISTS "Anyone can view reply likes" ON forum_reply_likes;
CREATE POLICY "Anyone can view reply likes" ON forum_reply_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can like/unlike replies" ON forum_reply_likes;
CREATE POLICY "Users can like/unlike replies" ON forum_reply_likes
  FOR ALL USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_forum_topics_updated_at BEFORE UPDATE ON forum_topics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_comments_updated_at BEFORE UPDATE ON forum_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_replies_updated_at BEFORE UPDATE ON forum_replies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
