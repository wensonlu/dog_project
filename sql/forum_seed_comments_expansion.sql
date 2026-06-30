-- ============================================
-- 论坛评论/回复扩容种子数据
-- 目标：
-- - 当前最热帖子（likes_count 最高）补足到 100 条评论
-- - 其他帖子补足到约 10 条评论
-- - 为自动补充的评论生成 1-2 条回复
--
-- 可重复执行：按自动生成内容去重，只补缺口，不删除已有数据
-- ============================================

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM auth.users) = 0 THEN
    RAISE EXCEPTION 'auth.users is empty. Please create test users first.';
  END IF;
END $$;

WITH ranked_topics AS (
  SELECT
    id,
    title,
    ROW_NUMBER() OVER (ORDER BY likes_count DESC, comments_count DESC, created_at DESC, id DESC) AS hot_rank
  FROM forum_topics
), topic_targets AS (
  SELECT
    rt.id AS topic_id,
    rt.title,
    CASE WHEN rt.hot_rank = 1 THEN 100 ELSE 10 END AS target_comments,
    COALESCE(existing_comments.cnt, 0) AS existing_comment_count
  FROM ranked_topics rt
  LEFT JOIN (
    SELECT topic_id, COUNT(*)::int AS cnt
    FROM forum_comments
    GROUP BY topic_id
  ) existing_comments ON existing_comments.topic_id = rt.id
), user_pool AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY created_at DESC, id) AS rn,
    COUNT(*) OVER () AS total_users
  FROM auth.users
), generated_comments AS (
  SELECT
    tt.topic_id,
    tt.title,
    gs.comment_no,
    CASE (gs.comment_no % 10)
      WHEN 0 THEN '这个讨论很有参考价值，尤其是细节描述很清楚。'
      WHEN 1 THEN '我家也遇到过类似情况，先记录变化再行动会稳一些。'
      WHEN 2 THEN '建议把时间线、饮食和精神状态都补充一下，大家更好判断。'
      WHEN 3 THEN '收藏了，后面领养或照顾狗狗时可以反复看。'
      WHEN 4 THEN '如果有异常症状持续，还是尽快问医生更安心。'
      WHEN 5 THEN '楼主的经验很实用，尤其适合第一次养宠的朋友。'
      WHEN 6 THEN '我补充一点：环境变化也可能影响食欲和行为。'
      WHEN 7 THEN '同意上面的建议，先保证安全和基础观察。'
      WHEN 8 THEN '希望后续可以更新进展，这类案例对大家很有帮助。'
      ELSE '看完很有共鸣，养宠确实需要耐心和长期投入。'
    END AS body
  FROM topic_targets tt
  CROSS JOIN LATERAL generate_series(tt.existing_comment_count + 1, tt.target_comments) AS gs(comment_no)
  WHERE tt.existing_comment_count < tt.target_comments
), inserted_comments AS (
  INSERT INTO forum_comments (topic_id, user_id, content, likes_count, replies_count, created_at)
  SELECT
    gc.topic_id,
    up.id,
    format('[自动扩容评论 #%s] %s', gc.comment_no, gc.body) AS content,
    ((gc.comment_no * 7) % 31)::int AS likes_count,
    0 AS replies_count,
    NOW() - ((gc.comment_no % 14) * INTERVAL '8 hours')
  FROM generated_comments gc
  CROSS JOIN (SELECT MAX(total_users) AS total_users FROM user_pool) us
  JOIN user_pool up ON up.rn = ((gc.comment_no - 1) % us.total_users) + 1
  WHERE NOT EXISTS (
    SELECT 1
    FROM forum_comments fc
    WHERE fc.topic_id = gc.topic_id
      AND fc.content = format('[自动扩容评论 #%s] %s', gc.comment_no, gc.body)
  )
  RETURNING id, topic_id, user_id, content, created_at
), reply_targets AS (
  SELECT
    fc.id AS comment_id,
    fc.topic_id,
    reply_series.reply_no,
    CASE reply_series.reply_no
      WHEN 1 THEN '谢谢分享，补充得很具体。'
      ELSE '这个角度也有帮助，我会一起参考。'
    END AS body
  FROM forum_comments fc
  JOIN topic_targets tt ON tt.topic_id = fc.topic_id
  CROSS JOIN LATERAL generate_series(
    1,
    CASE
      WHEN fc.content LIKE '[自动扩容评论 #%]' AND (fc.id % 3) = 0 THEN 2
      WHEN fc.content LIKE '[自动扩容评论 #%]' THEN 1
      ELSE 0
    END
  ) AS reply_series(reply_no)
  WHERE fc.content LIKE '[自动扩容评论 #%]'
), inserted_replies AS (
  INSERT INTO forum_replies (comment_id, user_id, content, likes_count, created_at)
  SELECT
    rt.comment_id,
    up.id,
    format('[自动扩容回复 #%s] %s', rt.reply_no, rt.body) AS content,
    ((rt.comment_id + rt.reply_no) % 9)::int AS likes_count,
    NOW() - ((rt.reply_no + rt.comment_id % 7) * INTERVAL '2 hours')
  FROM reply_targets rt
  CROSS JOIN (SELECT MAX(total_users) AS total_users FROM user_pool) us
  JOIN user_pool up ON up.rn = (((rt.comment_id + rt.reply_no)::int - 1) % us.total_users) + 1
  WHERE NOT EXISTS (
    SELECT 1
    FROM forum_replies fr
    WHERE fr.comment_id = rt.comment_id
      AND fr.content = format('[自动扩容回复 #%s] %s', rt.reply_no, rt.body)
  )
  RETURNING id
)
UPDATE forum_comments
SET replies_count = reply_counts.cnt
FROM (
  SELECT comment_id, COUNT(*)::int AS cnt
  FROM forum_replies
  GROUP BY comment_id
) reply_counts
WHERE forum_comments.id = reply_counts.comment_id;

UPDATE forum_comments
SET replies_count = 0
WHERE id NOT IN (
  SELECT DISTINCT comment_id
  FROM forum_replies
);

UPDATE forum_topics
SET comments_count = comment_counts.cnt
FROM (
  SELECT topic_id, COUNT(*)::int AS cnt
  FROM forum_comments
  GROUP BY topic_id
) comment_counts
WHERE forum_topics.id = comment_counts.topic_id;

UPDATE forum_topics
SET comments_count = 0
WHERE id NOT IN (
  SELECT DISTINCT topic_id
  FROM forum_comments
);
