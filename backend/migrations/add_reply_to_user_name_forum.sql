-- 回复中记录「回复给谁」，用于展示「回复 xxx: 内容」
ALTER TABLE public.forum_replies
ADD COLUMN IF NOT EXISTS reply_to_user_name TEXT;
