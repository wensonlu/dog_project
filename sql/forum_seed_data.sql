-- ============================================
-- 论坛种子数据：插入10条高质量帖子和评论
-- ============================================
-- 
-- 使用说明：
-- 1. 确保数据库中已有用户（auth.users 表中有数据）
-- 2. 如果还没有用户，请先注册一些用户，或者使用以下方式创建测试用户：
--    - 通过前端注册功能创建用户
--    - 或者使用 Supabase Dashboard 创建用户
-- 3. 执行此脚本前，可以先运行以下查询检查用户数量：
--    SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;
-- 4. 如果用户数量少于3个，脚本可能会失败，请先创建足够的用户
--
-- 脚本内容：
-- - 10条高质量帖子（涵盖：领养经验、日常分享、求助问答）
-- - 每个帖子2-5条评论
-- - 部分评论有回复
-- - 自动更新评论数和回复数统计
-- ============================================

-- ============================================
-- 插入论坛帖子
-- ============================================

-- 帖子1：领养经验分享
INSERT INTO forum_topics (user_id, title, content, category, tags, images, likes_count, comments_count, views_count, created_at)
VALUES (
  (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 0),
  '第一次领养金毛的完整经验分享',
  '大家好！我上个月成功领养了一只3岁的金毛，想和大家分享一下整个领养过程。

**领养前的准备：**
1. 心理准备：金毛需要大量运动，每天至少1-2小时
2. 空间准备：确保家里有足够的活动空间
3. 经济准备：每月狗粮、医疗、玩具等费用约800-1500元

**领养过程：**
- 在平台上看到信息后，第一时间联系了原主人
- 约好时间线下见面，观察狗狗的性格和健康状况
- 确认领养后，签署了领养协议

**领养后的适应：**
前两周比较困难，狗狗需要适应新环境。现在已经完全适应了，每天都很开心！

希望我的经验能帮助到想领养的朋友们！',
  '领养经验',
  '["金毛", "领养经验", "新手必看"]'::jsonb,
  '["https://images.unsplash.com/photo-1551717743-49959800b1f6?w=1200&h=800&fit=crop&auto=format", "https://images.unsplash.com/photo-1534361960057-19889db9621e?w=1200&h=800&fit=crop&auto=format"]'::jsonb,
  45,
  12,
  320,
  NOW() - INTERVAL '5 days'
);

-- 帖子2：日常分享
INSERT INTO forum_topics (user_id, title, content, category, tags, images, likes_count, comments_count, views_count, created_at)
VALUES (
  (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 1),
  '我家柯基的搞笑日常，每天都被萌化',
  '养柯基已经一年了，每天都有新的惊喜！

今天早上，它居然学会了开冰箱门（虽然只是为了找吃的😂）

最搞笑的是，每次我工作的时候，它就会叼着玩具过来，用那种"陪我玩"的眼神看着我，完全无法拒绝！

周末带它去公园，遇到其他狗狗就特别兴奋，社交能力满分！

有没有养柯基的朋友，分享一下你们家宝贝的趣事吧～',
  '日常分享',
  '["柯基", "日常", "萌宠"]'::jsonb,
  '["https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1200&h=800&fit=crop&auto=format", "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=1200&h=800&fit=crop&auto=format", "https://images.unsplash.com/photo-1552053831-71594a27632d?w=1200&h=800&fit=crop&auto=format"]'::jsonb,
  78,
  23,
  560,
  NOW() - INTERVAL '3 days'
);

-- 帖子3：求助问答
INSERT INTO forum_topics (user_id, title, content, category, tags, images, likes_count, comments_count, views_count, created_at)
VALUES (
  (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 2),
  '急！狗狗突然不吃东西，还呕吐，是什么原因？',
  '我家泰迪3岁，平时很健康。昨天开始突然不吃东西，今天早上还吐了两次，精神也不太好。

具体情况：
- 昨天早上还正常吃早餐
- 中午开始不吃东西
- 今天早上呕吐，是黄色的液体
- 精神状态明显下降，不爱动

已经预约了下午的宠物医院，但想先问问大家有没有遇到过类似情况？可能是什么原因？

很担心，希望有经验的朋友能给点建议！',
  '求助问答',
  '["求助", "健康", "泰迪"]'::jsonb,
  '["https://images.unsplash.com/photo-1616190174793-9158b32d8b1c?w=1200&h=800&fit=crop&auto=format"]'::jsonb,
  12,
  18,
  280,
  NOW() - INTERVAL '1 day'
);

-- 帖子4：领养经验
INSERT INTO forum_topics (user_id, title, content, category, tags, images, likes_count, comments_count, views_count, created_at)
VALUES (
  (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 0),
  '如何判断一只狗狗是否适合领养？我的经验总结',
  '作为已经领养过3只狗狗的"老手"，想和大家分享一些判断标准：

**性格评估：**
- 观察狗狗与人的互动，是否友好
- 测试对陌生人的反应
- 观察与其他狗狗的相处

**健康检查：**
- 眼睛清澈，无分泌物
- 鼻子湿润，无异常
- 毛发有光泽，无皮肤病
- 行动正常，无跛行

**环境适应：**
- 询问原主人的生活习惯
- 了解狗狗的作息时间
- 确认是否有特殊需求

**心理准备：**
- 确认自己有能力照顾
- 了解狗狗的品种特性
- 准备好应对各种情况

希望这些经验能帮助到大家！',
  '领养经验',
  '["领养", "经验分享", "新手指导"]'::jsonb,
  '["https://images.unsplash.com/photo-1518717758536-85e29035b6bc?w=1200&h=800&fit=crop&auto=format", "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&h=800&fit=crop&auto=format"]'::jsonb,
  56,
  15,
  420,
  NOW() - INTERVAL '7 days'
);

-- 帖子5：日常分享
INSERT INTO forum_topics (user_id, title, content, category, tags, images, likes_count, comments_count, views_count, created_at)
VALUES (
  (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 1),
  '记录我家二哈的拆家日常，真的是又爱又恨',
  '养哈士奇真的需要强大的心理承受能力😂

昨天回家，发现它把沙发垫子撕了，棉花到处都是...

但是看到它那种"我错了但我很可爱"的表情，真的生不起气来。

不过说真的，二哈虽然调皮，但真的很聪明。现在已经学会了坐下、握手、趴下等基本指令。

而且运动量大的狗狗，带它出去跑步，我自己也瘦了5斤！算是意外收获吧😄

有没有养二哈的朋友，分享一下你们的"血泪史"？',
  '日常分享',
  '["哈士奇", "拆家", "日常"]'::jsonb,
  '["https://images.unsplash.com/photo-1517849845537-4d257902454a?w=1200&h=800&fit=crop&auto=format", "https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=1200&h=800&fit=crop&auto=format", "https://images.unsplash.com/photo-1518717758536-85e29035b6bc?w=1200&h=800&fit=crop&auto=format"]'::jsonb,
  92,
  31,
  680,
  NOW() - INTERVAL '2 days'
);

-- 帖子6：求助问答
INSERT INTO forum_topics (user_id, title, content, category, tags, images, likes_count, comments_count, views_count, created_at)
VALUES (
  (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 2),
  '新手求助：狗狗刚到新家，一直叫怎么办？',
  '昨天刚领养了一只2个月的小比熊，晚上一直叫，吵得邻居都有意见了。

具体情况：
- 白天还好，晚上就开始叫
- 把它放在笼子里就叫得更厉害
- 放出来就安静一些，但会到处乱跑

我试过：
- 给它玩具
- 放音乐
- 不理它（但邻居受不了）

请问有经验的朋友，这种情况正常吗？一般多久会适应？有什么好的方法吗？

真的很着急，希望得到帮助！',
  '求助问答',
  '["新手", "求助", "比熊"]'::jsonb,
  '["https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1200&h=800&fit=crop&auto=format"]'::jsonb,
  28,
  25,
  390,
  NOW() - INTERVAL '4 days'
);

-- 帖子7：领养经验
INSERT INTO forum_topics (user_id, title, content, category, tags, images, likes_count, comments_count, views_count, created_at)
VALUES (
  (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 0),
  '领养老年犬的温暖故事：给它们一个家',
  '上个月领养了一只8岁的拉布拉多，很多人不理解，为什么要领养一只"老狗"。

但我想说，老年犬同样值得被爱！

**为什么选择老年犬：**
- 性格稳定，不需要太多训练
- 运动量适中，适合上班族
- 它们更需要一个温暖的家

**领养后的感受：**
虽然它可能陪伴我的时间不会很长，但每一天都很珍贵。它很懂事，很安静，也很感恩。

每天早上醒来，看到它安静地睡在床边，就觉得特别温暖。

希望有更多人能关注老年犬的领养，它们同样值得被爱！',
  '领养经验',
  '["老年犬", "领养", "温暖故事"]'::jsonb,
  '["https://images.unsplash.com/photo-1534361960057-19889db9621e?w=1200&h=800&fit=crop&auto=format", "https://images.unsplash.com/photo-1551717743-49959800b1f6?w=1200&h=800&fit=crop&auto=format"]'::jsonb,
  134,
  42,
  890,
  NOW() - INTERVAL '6 days'
);

-- 帖子8：日常分享
INSERT INTO forum_topics (user_id, title, content, category, tags, images, likes_count, comments_count, views_count, created_at)
VALUES (
  (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 1),
  '带狗狗去海边玩，它第一次见到大海的反应太可爱了',
  '周末带我家边牧去海边，这是它第一次见到大海！

一开始它有点害怕，不敢靠近，只是远远地看着。

后来慢慢试探，用爪子碰了碰水，发现没什么危险，就开始兴奋了！

在海边跑来跑去，追着海浪，玩得不亦乐乎。

最搞笑的是，它居然想喝海水，被我及时制止了😂

回家的路上，在车里就累得睡着了，看来是真的玩累了。

下次还要带它去！有带狗狗去海边的朋友吗？需要注意什么？',
  '日常分享',
  '["边牧", "海边", "出游"]'::jsonb,
  '["https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&h=800&fit=crop&auto=format", "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=1200&h=800&fit=crop&auto=format"]'::jsonb,
  67,
  19,
  510,
  NOW() - INTERVAL '1 day'
);

-- 帖子9：求助问答
INSERT INTO forum_topics (user_id, title, content, category, tags, images, likes_count, comments_count, views_count, created_at)
VALUES (
  (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 2),
  '狗狗训练问题：如何让狗狗不在家里大小便？',
  '我家柴犬4个月大，已经带回家2周了，但还是会在家里大小便。

我试过的方法：
- 定时带它出去（早上、中午、晚上）
- 看到它要上厕所就立刻带出去
- 在它乱拉的地方用除味剂清理
- 在正确的地方上厕所就奖励

但效果不明显，还是会偶尔在家里拉。

请问有经验的朋友：
1. 4个月大的狗狗，多久能完全学会？
2. 有什么更好的训练方法吗？
3. 是不是我哪里做错了？

真的很困扰，希望得到专业的建议！',
  '求助问答',
  '["训练", "求助", "柴犬"]'::jsonb,
  '["https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=1200&h=800&fit=crop&auto=format", "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=1200&h=800&fit=crop&auto=format"]'::jsonb,
  35,
  22,
  450,
  NOW() - INTERVAL '3 days'
);

-- 帖子10：日常分享
INSERT INTO forum_topics (user_id, title, content, category, tags, images, likes_count, comments_count, views_count, created_at)
VALUES (
  (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 0),
  '分享我家狗狗的成长记录，从2个月到1岁',
  '不知不觉，我家小萨摩已经1岁了！想和大家分享一下它的成长记录。

**2-3个月：** 小奶狗时期，特别可爱，但也很脆弱，需要特别小心照顾。

**4-6个月：** 开始换牙，喜欢咬东西，家里的拖鞋、数据线都遭殃了😂

**7-9个月：** 进入青春期，开始有自己的想法，训练需要更多耐心。

**10-12个月：** 性格逐渐稳定，越来越懂事，也越来越粘人。

现在1岁了，已经完全是个大狗狗了，但在我心里，它永远是我的小宝贝。

养狗真的是一件很幸福的事情，看着它一天天长大，每一天都有新的惊喜！

大家也分享一下自家宝贝的成长故事吧～',
  '日常分享',
  '["萨摩耶", "成长记录", "分享"]'::jsonb,
  '["https://images.unsplash.com/photo-1552053831-71594a27632d?w=1200&h=800&fit=crop&auto=format", "https://images.unsplash.com/photo-1616190174793-9158b32d8b1c?w=1200&h=800&fit=crop&auto=format", "https://images.unsplash.com/photo-1518717758536-85e29035b6bc?w=1200&h=800&fit=crop&auto=format"]'::jsonb,
  89,
  28,
  720,
  NOW() - INTERVAL '4 days'
);

-- ============================================
-- 插入评论（为每个帖子添加2-5条评论）
-- ============================================

-- 帖子1的评论
INSERT INTO forum_comments (topic_id, user_id, content, likes_count, replies_count, created_at)
VALUES 
  ((SELECT id FROM forum_topics ORDER BY created_at DESC LIMIT 1 OFFSET 9), 
   (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 1),
   '感谢分享！我也准备领养一只金毛，这些经验太有用了！', 8, 2, NOW() - INTERVAL '4 days'),
  ((SELECT id FROM forum_topics ORDER BY created_at DESC LIMIT 1 OFFSET 9),
   (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 2),
   '金毛真的很温顺，我家也有一只，每天下班回家它都会在门口等我，特别暖心！', 12, 1, NOW() - INTERVAL '4 days'),
  ((SELECT id FROM forum_topics ORDER BY created_at DESC LIMIT 1 OFFSET 9),
   (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 0),
   '请问领养协议一般包含哪些内容？需要注意什么？', 5, 3, NOW() - INTERVAL '3 days');

-- 帖子2的评论
INSERT INTO forum_comments (topic_id, user_id, content, likes_count, replies_count, created_at)
VALUES 
  ((SELECT id FROM forum_topics ORDER BY created_at DESC LIMIT 1 OFFSET 8),
   (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 2),
   '哈哈哈，我家柯基也是，每次我工作它就来打扰，完全无法专心工作！', 15, 1, NOW() - INTERVAL '2 days'),
  ((SELECT id FROM forum_topics ORDER BY created_at DESC LIMIT 1 OFFSET 8),
   (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 0),
   '柯基的小短腿真的太萌了！我家也有一只，每天看它跑步就特别治愈', 22, 0, NOW() - INTERVAL '2 days'),
  ((SELECT id FROM forum_topics ORDER BY created_at DESC LIMIT 1 OFFSET 8),
   (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 1),
   '开冰箱门这个技能太厉害了！我家狗狗只会开抽屉😂', 9, 2, NOW() - INTERVAL '1 day');

-- 帖子3的评论
INSERT INTO forum_comments (topic_id, user_id, content, likes_count, replies_count, created_at)
VALUES 
  ((SELECT id FROM forum_topics ORDER BY created_at DESC LIMIT 1 OFFSET 7),
   (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 0),
   '建议尽快去医院检查，可能是肠胃炎或者吃了不该吃的东西。先不要给狗狗吃东西，只给水。', 18, 4, NOW() - INTERVAL '1 day'),
  ((SELECT id FROM forum_topics ORDER BY created_at DESC LIMIT 1 OFFSET 7),
   (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 1),
   '我家狗狗之前也有类似情况，后来发现是吃了变质的食物。检查一下最近有没有给它吃什么东西？', 12, 2, NOW() - INTERVAL '1 day'),
  ((SELECT id FROM forum_topics ORDER BY created_at DESC LIMIT 1 OFFSET 7),
   (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 2),
   '希望狗狗快点好起来！记得检查一下家里有没有它可能误食的东西', 6, 0, NOW() - INTERVAL '23 hours');

-- 帖子4的评论
INSERT INTO forum_comments (topic_id, user_id, content, likes_count, replies_count, created_at)
VALUES 
  ((SELECT id FROM forum_topics ORDER BY created_at DESC LIMIT 1 OFFSET 6),
   (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 1),
   '非常实用的经验！我正准备领养第一只狗狗，这些建议太有帮助了', 14, 1, NOW() - INTERVAL '6 days'),
  ((SELECT id FROM forum_topics ORDER BY created_at DESC LIMIT 1 OFFSET 6),
   (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 2),
   '性格评估真的很重要，我之前领养的一只就是因为性格不合，后来重新找了更适合的', 9, 2, NOW() - INTERVAL '6 days');

-- 帖子5的评论
INSERT INTO forum_comments (topic_id, user_id, content, likes_count, replies_count, created_at)
VALUES 
  ((SELECT id FROM forum_topics ORDER BY created_at DESC LIMIT 1 OFFSET 5),
   (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 0),
   '哈哈哈，二哈的拆家能力真的是名不虚传！我家沙发已经被换过两次了', 28, 3, NOW() - INTERVAL '1 day'),
  ((SELECT id FROM forum_topics ORDER BY created_at DESC LIMIT 1 OFFSET 5),
   (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 2),
   '同感！虽然拆家，但二哈真的很聪明，而且运动量大，带它跑步我自己也瘦了不少', 16, 1, NOW() - INTERVAL '1 day'),
  ((SELECT id FROM forum_topics ORDER BY created_at DESC LIMIT 1 OFFSET 5),
   (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 1),
   '我家二哈现在2岁了，拆家情况好多了，但偶尔还是会"犯案"😂', 11, 0, NOW() - INTERVAL '23 hours');

-- 帖子6的评论
INSERT INTO forum_comments (topic_id, user_id, content, likes_count, replies_count, created_at)
VALUES 
  ((SELECT id FROM forum_topics ORDER BY created_at DESC LIMIT 1 OFFSET 4),
   (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 0),
   '这是正常的，小狗刚到新环境会害怕。建议在笼子里放一些有你气味的衣服，让它有安全感', 19, 2, NOW() - INTERVAL '3 days'),
  ((SELECT id FROM forum_topics ORDER BY created_at DESC LIMIT 1 OFFSET 4),
   (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 1),
   '我家小狗也是，大概一周左右就适应了。晚上可以放一个闹钟在旁边，滴答声会让它觉得有陪伴', 15, 1, NOW() - INTERVAL '3 days'),
  ((SELECT id FROM forum_topics ORDER BY created_at DESC LIMIT 1 OFFSET 4),
   (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 2),
   '可以试试在笼子上盖一块布，营造一个"洞穴"的感觉，很多小狗会更有安全感', 12, 0, NOW() - INTERVAL '2 days');

-- 帖子7的评论
INSERT INTO forum_comments (topic_id, user_id, content, likes_count, replies_count, created_at)
VALUES 
  ((SELECT id FROM forum_topics ORDER BY created_at DESC LIMIT 1 OFFSET 3),
   (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 1),
   '太感动了！老年犬真的需要更多关爱，你做得很好！', 45, 3, NOW() - INTERVAL '5 days'),
  ((SELECT id FROM forum_topics ORDER BY created_at DESC LIMIT 1 OFFSET 3),
   (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 2),
   '我也领养过一只老年犬，虽然只陪伴了2年，但每一天都很珍贵。支持你！', 38, 2, NOW() - INTERVAL '5 days'),
  ((SELECT id FROM forum_topics ORDER BY created_at DESC LIMIT 1 OFFSET 3),
   (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 0),
   '老年犬领养真的很有意义，它们更需要一个温暖的家。为你点赞！', 29, 1, NOW() - INTERVAL '4 days');

-- 帖子8的评论
INSERT INTO forum_comments (topic_id, user_id, content, likes_count, replies_count, created_at)
VALUES 
  ((SELECT id FROM forum_topics ORDER BY created_at DESC LIMIT 1 OFFSET 2),
   (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 1),
   '带狗狗去海边要注意安全，不要让它们喝海水，也不要让它们游太远', 13, 2, NOW() - INTERVAL '1 day'),
  ((SELECT id FROM forum_topics ORDER BY created_at DESC LIMIT 1 OFFSET 2),
   (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 2),
   '我家边牧也超爱海边！每次去都玩得特别开心，回家路上就累得不行了', 10, 1, NOW() - INTERVAL '1 day');

-- 帖子9的评论
INSERT INTO forum_comments (topic_id, user_id, content, likes_count, replies_count, created_at)
VALUES 
  ((SELECT id FROM forum_topics ORDER BY created_at DESC LIMIT 1 OFFSET 1),
   (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 0),
   '4个月的狗狗还在学习阶段，需要更多耐心。建议每次带它出去上厕所后，如果成功了就立刻奖励', 22, 3, NOW() - INTERVAL '2 days'),
  ((SELECT id FROM forum_topics ORDER BY created_at DESC LIMIT 1 OFFSET 1),
   (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 1),
   '我家柴犬也是4个月开始训练的，大概用了1个月左右就完全学会了。坚持就是胜利！', 18, 1, NOW() - INTERVAL '2 days'),
  ((SELECT id FROM forum_topics ORDER BY created_at DESC LIMIT 1 OFFSET 1),
   (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 2),
   '可以试试在固定时间带它出去，比如饭后15-30分钟，建立规律', 14, 0, NOW() - INTERVAL '1 day');

-- 帖子10的评论
INSERT INTO forum_comments (topic_id, user_id, content, likes_count, replies_count, created_at)
VALUES 
  ((SELECT id FROM forum_topics ORDER BY created_at DESC LIMIT 1 OFFSET 0),
   (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 1),
   '萨摩耶真的太可爱了！我家也有一只，现在3岁了，还是那么粘人', 21, 2, NOW() - INTERVAL '3 days'),
  ((SELECT id FROM forum_topics ORDER BY created_at DESC LIMIT 1 OFFSET 0),
   (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 2),
   '看着狗狗一天天长大真的很幸福！我家狗狗也快1岁了，时间过得好快', 16, 1, NOW() - INTERVAL '3 days'),
  ((SELECT id FROM forum_topics ORDER BY created_at DESC LIMIT 1 OFFSET 0),
   (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 0),
   '成长记录太有意义了！我也要开始记录我家狗狗的成长过程', 12, 0, NOW() - INTERVAL '2 days');

-- ============================================
-- 插入回复（为部分评论添加回复）
-- ============================================

-- 为帖子1的第一条评论添加回复
INSERT INTO forum_replies (comment_id, user_id, content, likes_count, created_at)
VALUES 
  ((SELECT id FROM forum_comments WHERE topic_id = (SELECT id FROM forum_topics ORDER BY created_at DESC LIMIT 1 OFFSET 9) ORDER BY created_at LIMIT 1),
   (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 0),
   '不客气！有什么问题随时问我', 3, NOW() - INTERVAL '3 days'),
  ((SELECT id FROM forum_comments WHERE topic_id = (SELECT id FROM forum_topics ORDER BY created_at DESC LIMIT 1 OFFSET 9) ORDER BY created_at LIMIT 1),
   (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 2),
   '我也准备领养金毛，可以一起交流经验！', 2, NOW() - INTERVAL '3 days');

-- 为帖子3的第一条评论添加回复
INSERT INTO forum_replies (comment_id, user_id, content, likes_count, created_at)
VALUES 
  ((SELECT id FROM forum_comments WHERE topic_id = (SELECT id FROM forum_topics ORDER BY created_at DESC LIMIT 1 OFFSET 7) ORDER BY created_at LIMIT 1),
   (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 2),
   '谢谢建议！已经带去医院了，医生说是肠胃炎，现在在治疗中', 5, NOW() - INTERVAL '23 hours'),
  ((SELECT id FROM forum_comments WHERE topic_id = (SELECT id FROM forum_topics ORDER BY created_at DESC LIMIT 1 OFFSET 7) ORDER BY created_at LIMIT 1),
   (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 1),
   '希望狗狗快点好起来！', 4, NOW() - INTERVAL '22 hours');

-- 为帖子5的第一条评论添加回复
INSERT INTO forum_replies (comment_id, user_id, content, likes_count, created_at)
VALUES 
  ((SELECT id FROM forum_comments WHERE topic_id = (SELECT id FROM forum_topics ORDER BY created_at DESC LIMIT 1 OFFSET 5) ORDER BY created_at LIMIT 1),
   (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 1),
   '哈哈哈，同病相怜！我家沙发也换过，现在都不敢买太贵的了', 8, NOW() - INTERVAL '23 hours'),
  ((SELECT id FROM forum_comments WHERE topic_id = (SELECT id FROM forum_topics ORDER BY created_at DESC LIMIT 1 OFFSET 5) ORDER BY created_at LIMIT 1),
   (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 2),
   '二哈的拆家能力真的是天生的😂', 6, NOW() - INTERVAL '22 hours');

-- 更新评论的回复数量
UPDATE forum_comments 
SET replies_count = (
  SELECT COUNT(*) 
  FROM forum_replies 
  WHERE forum_replies.comment_id = forum_comments.id
);

-- 更新帖子的评论数量
UPDATE forum_topics 
SET comments_count = (
  SELECT COUNT(*) 
  FROM forum_comments 
  WHERE forum_comments.topic_id = forum_topics.id
);
