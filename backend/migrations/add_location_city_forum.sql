-- 论坛评论/回复增加定位城市字段（回复时获取并展示）
ALTER TABLE public.forum_comments
ADD COLUMN IF NOT EXISTS location_city TEXT;

ALTER TABLE public.forum_replies
ADD COLUMN IF NOT EXISTS location_city TEXT;
