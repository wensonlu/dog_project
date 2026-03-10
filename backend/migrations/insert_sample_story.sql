-- 插入示例领养故事
-- 使用实际存在的用户ID和狗狗ID

-- 查询第一个用户ID（如果有的话）
DO $$
DECLARE
    v_user_id UUID;
    v_dog_id INTEGER := 1; -- 小胖
BEGIN
    -- 获取第一个用户ID
    SELECT id INTO v_user_id FROM profiles LIMIT 1;

    -- 如果有用户，插入示例故事
    IF v_user_id IS NOT NULL THEN
        INSERT INTO adoption_stories (
            dog_id,
            adopter_id,
            title,
            content,
            cover_image,
            images,
            status,
            created_at
        ) VALUES (
            v_dog_id,
            v_user_id,
            '从流浪到被宠：小胖的幸福生活',
            '三个月前，我在汪星球看到了小胖的照片。它是一只性格温柔的金毛，当时眼神里满是期待。

## 第一次见面

记得第一次去看小胖的时候，它小心翼翼地靠近我，用鼻子轻轻蹭我的手。那一刻我就知道，它就是我要找的家人。

## 适应新家

刚到家时，小胖有点拘谨，总是安静地待在角落。我给它准备了舒适的狗窝、好吃的狗粮，还买了很多玩具。慢慢地，它开始放松下来。

## 现在的生活

现在小胖已经完全融入我们的家庭：
- 每天早上会准时叫我起床
- 超级喜欢散步和游泳
- 对邻居家的小朋友特别友善
- 最爱吃的是胡萝卜和苹果

## 感恩

感谢汪星球让我遇到小胖，也感谢原主人的爱心送养。**领养代替购买**，让更多毛孩子找到温暖的家！

每天看着小胖开心的样子，我就觉得这个决定太对了。它不仅是我的宠物，更是我的家人和陪伴。',
            'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=800',
            '["https://images.unsplash.com/photo-1552053831-71594a27632d?w=800", "https://images.unsplash.com/photo-1558788353-f76d92427f16?w=800"]'::jsonb,
            'approved',
            NOW() - INTERVAL '5 days'
        );

        RAISE NOTICE '示例故事创建成功！';
    ELSE
        RAISE NOTICE '未找到用户，请先注册用户后再插入故事';
    END IF;
END $$;
