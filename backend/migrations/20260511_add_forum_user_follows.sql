-- Add forum author follow feature
CREATE TABLE IF NOT EXISTS forum_user_follows (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  follower_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_user_id, following_user_id),
  CHECK (follower_user_id <> following_user_id)
);

CREATE INDEX IF NOT EXISTS idx_forum_user_follows_follower ON forum_user_follows(follower_user_id);
CREATE INDEX IF NOT EXISTS idx_forum_user_follows_following ON forum_user_follows(following_user_id);

ALTER TABLE forum_user_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view user follows" ON forum_user_follows;
CREATE POLICY "Anyone can view user follows" ON forum_user_follows
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can follow others" ON forum_user_follows;
CREATE POLICY "Users can follow others" ON forum_user_follows
  FOR INSERT WITH CHECK (auth.uid() = follower_user_id AND follower_user_id <> following_user_id);

DROP POLICY IF EXISTS "Users can unfollow others" ON forum_user_follows;
CREATE POLICY "Users can unfollow others" ON forum_user_follows
  FOR DELETE USING (auth.uid() = follower_user_id);
