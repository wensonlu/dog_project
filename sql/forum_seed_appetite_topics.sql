-- ============================================
-- 论坛专项种子数据：宠物不吃饭 / 厌食 / 食欲差
-- 目标：提升搜索“宠物不吃饭”时的召回数量，保障 AI 总结稳定输出
-- 可重复执行：按 title 去重
-- ============================================

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM auth.users) = 0 THEN
    RAISE EXCEPTION 'auth.users is empty. Please create test users first.';
  END IF;
END $$;

WITH seed_topics(title, content, category, tags, likes_count, comments_count, views_count, created_at) AS (
  VALUES
  (
    '狗狗突然不吃饭但精神还行，需要立刻去医院吗？',
    '我家柴犬昨晚开始不吃狗粮，今天早上也只闻一闻。精神状态还可以，能玩，但明显没胃口。最近刚换了新粮，也有点降温。大家遇到过类似情况吗？是先观察24小时还是直接就医？',
    '求助问答',
    '["狗狗不吃饭", "柴犬", "求助"]'::jsonb,
    34, 16, 260,
    NOW() - INTERVAL '2 days'
  ),
  (
    '猫咪厌食三天，最后确诊口腔问题（经验分享）',
    '记录一下：我家英短连续三天食欲差，以为是挑食，后来发现牙龈红肿。去医院处理后第二天就恢复进食。建议如果超过24小时不进食，尤其伴随流口水或口臭，尽快排查口腔和消化道。',
    '领养经验',
    '["猫咪厌食", "口腔问题", "经验分享"]'::jsonb,
    58, 22, 410,
    NOW() - INTERVAL '7 days'
  ),
  (
    '换粮后狗狗没胃口，怎么做平稳过渡？',
    '这周把旧粮直接换成新粮，结果狗狗明显食欲下降。后来改成7天过渡（旧粮占比逐步下降）才恢复。想问下大家一般换粮几天最稳？有没有适合肠胃敏感狗的方案？',
    '求助问答',
    '["换粮", "食欲差", "肠胃敏感"]'::jsonb,
    41, 18, 305,
    NOW() - INTERVAL '5 days'
  ),
  (
    '领养回家第一周不吃饭是正常应激吗？',
    '刚领养的小体比熊到家第三天，白天基本不吃，晚上吃一点。没有呕吐，排便正常，但会躲角落。是不是环境应激？大家一般怎么帮助狗狗在新家建立安全感和食欲？',
    '求助问答',
    '["领养适应", "应激", "不吃饭"]'::jsonb,
    29, 14, 228,
    NOW() - INTERVAL '3 days'
  ),
  (
    '夏天高温导致食欲下降，我家狗狗的处理方法',
    '连续高温天，狗狗白天几乎不吃，傍晚才愿意吃。我们调整为清晨和晚间喂食、补充饮水和少量湿粮，食欲改善明显。分享给同样遇到季节性食欲波动的朋友。',
    '日常分享',
    '["高温", "食欲下降", "喂养"]'::jsonb,
    47, 11, 336,
    NOW() - INTERVAL '10 days'
  ),
  (
    '幼犬不吃饭还拉稀，先做哪些检查？',
    '2个月幼犬今天开始不吃饭，晚上出现软便。还没发烧，但精神一般。准备明天去医院，想先了解要重点排查哪些项目，避免到院手忙脚乱。',
    '求助问答',
    '["幼犬", "拉稀", "不吃饭"]'::jsonb,
    52, 24, 389,
    NOW() - INTERVAL '1 day'
  ),
  (
    '猫咪挑食还是生病？3个观察点很实用',
    '很多人分不清“挑食”和“生病性厌食”。我自己的观察是：精神状态、饮水量、排泄情况。只要其中两项异常，就不要拖。也欢迎大家补充判断经验。',
    '领养经验',
    '["猫咪", "挑食", "厌食"]'::jsonb,
    66, 27, 520,
    NOW() - INTERVAL '12 days'
  ),
  (
    '狗狗打疫苗后食欲变差正常吗？',
    '昨天打完疫苗后，狗狗今天食欲明显下降，但没有呕吐和腹泻。想确认这种情况通常持续多久，需要特别处理吗？',
    '求助问答',
    '["疫苗", "食欲差", "术后观察"]'::jsonb,
    31, 13, 244,
    NOW() - INTERVAL '6 days'
  ),
  (
    '老年犬不爱吃饭，如何提升进食意愿？',
    '家里12岁老年犬最近食量越来越小。体检显示轻度牙结石和肾指标边缘异常。大家有没有“少量多餐+软化粮”之外的经验？',
    '求助问答',
    '["老年犬", "食欲差", "慢病管理"]'::jsonb,
    63, 29, 462,
    NOW() - INTERVAL '9 days'
  ),
  (
    '我家狗狗不吃饭，原来是误食玩具导致',
    '分享个教训：连续不吃饭24小时，还偶尔干呕，最后拍片发现胃里有异物。提醒大家家里小物件一定要收好，尤其是会咬玩具的狗。',
    '领养经验',
    '["误食", "异物", "不吃饭"]'::jsonb,
    88, 35, 610,
    NOW() - INTERVAL '14 days'
  ),
  (
    '新环境猫咪没胃口，几天后恢复正常（记录）',
    '搬家后猫咪两天几乎不吃，只在夜里少量进食。我们做了“固定角落+熟悉气味+安静喂食”，第三天开始恢复。给同样遇到应激性厌食的家庭一个参考。',
    '日常分享',
    '["猫咪", "新环境", "没胃口"]'::jsonb,
    44, 12, 298,
    NOW() - INTERVAL '8 days'
  ),
  (
    '犬猫不吃饭时，哪些信号必须马上就医？',
    '总结贴：持续超过24小时不进食、反复呕吐、便血、明显脱水、精神沉郁这几项都不建议拖。欢迎补充你们在急诊时的经验。',
    '领养经验',
    '["就医信号", "不吃饭", "急诊"]'::jsonb,
    95, 41, 720,
    NOW() - INTERVAL '15 days'
  )
)
INSERT INTO forum_topics (user_id, title, content, category, tags, images, likes_count, comments_count, views_count, created_at)
SELECT
  (SELECT id FROM auth.users ORDER BY RANDOM() LIMIT 1) AS user_id,
  s.title,
  s.content,
  s.category,
  s.tags,
  CASE s.title
    WHEN '狗狗突然不吃饭但精神还行，需要立刻去医院吗？' THEN '["https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&h=800&fit=crop&auto=format"]'::jsonb
    WHEN '猫咪厌食三天，最后确诊口腔问题（经验分享）' THEN '["https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&h=800&fit=crop&auto=format"]'::jsonb
    WHEN '换粮后狗狗没胃口，怎么做平稳过渡？' THEN '["https://images.unsplash.com/photo-1560743641-3914f2c45636?w=1200&h=800&fit=crop&auto=format"]'::jsonb
    WHEN '领养回家第一周不吃饭是正常应激吗？' THEN '["https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&h=800&fit=crop&auto=format"]'::jsonb
    WHEN '夏天高温导致食欲下降，我家狗狗的处理方法' THEN '["https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=1200&h=800&fit=crop&auto=format"]'::jsonb
    WHEN '幼犬不吃饭还拉稀，先做哪些检查？' THEN '["https://images.unsplash.com/photo-1601758177266-bc599de87707?w=1200&h=800&fit=crop&auto=format"]'::jsonb
    WHEN '猫咪挑食还是生病？3个观察点很实用' THEN '["https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=1200&h=800&fit=crop&auto=format"]'::jsonb
    WHEN '狗狗打疫苗后食欲变差正常吗？' THEN '["https://images.unsplash.com/photo-1517849845537-4d257902454a?w=1200&h=800&fit=crop&auto=format"]'::jsonb
    WHEN '老年犬不爱吃饭，如何提升进食意愿？' THEN '["https://images.unsplash.com/photo-1551717743-49959800b1f6?w=1200&h=800&fit=crop&auto=format"]'::jsonb
    WHEN '我家狗狗不吃饭，原来是误食玩具导致' THEN '["https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1200&h=800&fit=crop&auto=format"]'::jsonb
    WHEN '新环境猫咪没胃口，几天后恢复正常（记录）' THEN '["https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=1200&h=800&fit=crop&auto=format"]'::jsonb
    WHEN '犬猫不吃饭时，哪些信号必须马上就医？' THEN '["https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=1200&h=800&fit=crop&auto=format"]'::jsonb
    ELSE '[]'::jsonb
  END AS images,
  s.likes_count,
  s.comments_count,
  s.views_count,
  s.created_at
FROM seed_topics s
WHERE NOT EXISTS (
  SELECT 1 FROM forum_topics t WHERE t.title = s.title
);

-- 为新帖子补一批短评论，增强“最多评论/最热”排序测试价值
WITH target_topics AS (
  SELECT id, title
  FROM forum_topics
  WHERE title IN (
    '狗狗突然不吃饭但精神还行，需要立刻去医院吗？',
    '幼犬不吃饭还拉稀，先做哪些检查？',
    '犬猫不吃饭时，哪些信号必须马上就医？',
    '老年犬不爱吃饭，如何提升进食意愿？'
  )
), comment_seed(topic_title, body) AS (
  VALUES
  ('狗狗突然不吃饭但精神还行，需要立刻去医院吗？', '先看饮水和精神，超过24小时建议就医，不要硬拖。'),
  ('狗狗突然不吃饭但精神还行，需要立刻去医院吗？', '最近换粮的话，先做过渡，但如果伴随呕吐就别等了。'),
  ('幼犬不吃饭还拉稀，先做哪些检查？', '幼犬优先排查寄生虫和肠胃炎，脱水风险高。'),
  ('幼犬不吃饭还拉稀，先做哪些检查？', '建议带上近三天喂食和排便记录，医生判断会更快。'),
  ('犬猫不吃饭时，哪些信号必须马上就医？', '这个总结很全，便血和持续呕吐真的要第一时间去。'),
  ('犬猫不吃饭时，哪些信号必须马上就医？', '补充一个：幼宠和老年宠要更谨慎，别等太久。'),
  ('老年犬不爱吃饭，如何提升进食意愿？', '我们家是少量多餐+温热湿粮，食欲会好一些。'),
  ('老年犬不爱吃饭，如何提升进食意愿？', '建议复查牙口和慢病指标，很多时候是复合原因。')
)
INSERT INTO forum_comments (topic_id, user_id, content, likes_count, replies_count, created_at)
SELECT
  t.id,
  (SELECT id FROM auth.users ORDER BY RANDOM() LIMIT 1) AS user_id,
  c.body,
  (RANDOM() * 10)::int,
  0,
  NOW() - (RANDOM() * INTERVAL '5 days')
FROM target_topics t
JOIN comment_seed c ON c.topic_title = t.title
WHERE NOT EXISTS (
  SELECT 1
  FROM forum_comments fc
  WHERE fc.topic_id = t.id
    AND fc.content = c.body
);

-- 对齐 comments_count 统计
UPDATE forum_topics
SET comments_count = sub.cnt
FROM (
  SELECT topic_id, COUNT(*)::int AS cnt
  FROM forum_comments
  GROUP BY topic_id
) sub
WHERE forum_topics.id = sub.topic_id;

-- 给已存在的专项帖子补图（仅在 images 为空时生效）
UPDATE forum_topics
SET images = CASE title
  WHEN '狗狗突然不吃饭但精神还行，需要立刻去医院吗？' THEN '["https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&h=800&fit=crop&auto=format"]'::jsonb
  WHEN '猫咪厌食三天，最后确诊口腔问题（经验分享）' THEN '["https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&h=800&fit=crop&auto=format"]'::jsonb
  WHEN '换粮后狗狗没胃口，怎么做平稳过渡？' THEN '["https://images.unsplash.com/photo-1560743641-3914f2c45636?w=1200&h=800&fit=crop&auto=format"]'::jsonb
  WHEN '领养回家第一周不吃饭是正常应激吗？' THEN '["https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&h=800&fit=crop&auto=format"]'::jsonb
  WHEN '夏天高温导致食欲下降，我家狗狗的处理方法' THEN '["https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=1200&h=800&fit=crop&auto=format"]'::jsonb
  WHEN '幼犬不吃饭还拉稀，先做哪些检查？' THEN '["https://images.unsplash.com/photo-1601758177266-bc599de87707?w=1200&h=800&fit=crop&auto=format"]'::jsonb
  WHEN '猫咪挑食还是生病？3个观察点很实用' THEN '["https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=1200&h=800&fit=crop&auto=format"]'::jsonb
  WHEN '狗狗打疫苗后食欲变差正常吗？' THEN '["https://images.unsplash.com/photo-1517849845537-4d257902454a?w=1200&h=800&fit=crop&auto=format"]'::jsonb
  WHEN '老年犬不爱吃饭，如何提升进食意愿？' THEN '["https://images.unsplash.com/photo-1551717743-49959800b1f6?w=1200&h=800&fit=crop&auto=format"]'::jsonb
  WHEN '我家狗狗不吃饭，原来是误食玩具导致' THEN '["https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1200&h=800&fit=crop&auto=format"]'::jsonb
  WHEN '新环境猫咪没胃口，几天后恢复正常（记录）' THEN '["https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=1200&h=800&fit=crop&auto=format"]'::jsonb
  WHEN '犬猫不吃饭时，哪些信号必须马上就医？' THEN '["https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=1200&h=800&fit=crop&auto=format"]'::jsonb
  ELSE images
END
WHERE title IN (
  '狗狗突然不吃饭但精神还行，需要立刻去医院吗？',
  '猫咪厌食三天，最后确诊口腔问题（经验分享）',
  '换粮后狗狗没胃口，怎么做平稳过渡？',
  '领养回家第一周不吃饭是正常应激吗？',
  '夏天高温导致食欲下降，我家狗狗的处理方法',
  '幼犬不吃饭还拉稀，先做哪些检查？',
  '猫咪挑食还是生病？3个观察点很实用',
  '狗狗打疫苗后食欲变差正常吗？',
  '老年犬不爱吃饭，如何提升进食意愿？',
  '我家狗狗不吃饭，原来是误食玩具导致',
  '新环境猫咪没胃口，几天后恢复正常（记录）',
  '犬猫不吃饭时，哪些信号必须马上就医？'
)
AND (images IS NULL OR images = '[]'::jsonb);
