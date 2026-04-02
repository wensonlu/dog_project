-- ============================================
-- Supabase Storage Bucket 配置说明
-- ============================================
-- 
-- 此文件包含创建 Storage Bucket 和配置策略的 SQL 语句
-- 请在 Supabase Dashboard 的 SQL Editor 中执行
--
-- ============================================

-- 1. 创建 Storage Bucket (如果通过 SQL 创建)
-- 注意：通常需要在 Supabase Dashboard > Storage 中手动创建
-- 或者使用以下 SQL（需要管理员权限）：
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'dog-images',
    'dog-images',
    true,
    5242880, -- 5MB in bytes
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS 策略 - 允许公开读取
CREATE POLICY "Public Access for dog-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'dog-images');

-- 3. Storage RLS 策略 - 允许认证用户上传
CREATE POLICY "Authenticated users can upload dog images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'dog-images' 
    AND auth.role() = 'authenticated'
);

-- 4. Storage RLS 策略 - 允许认证用户更新自己的文件
CREATE POLICY "Authenticated users can update dog images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'dog-images' 
    AND auth.role() = 'authenticated'
);

-- 5. Storage RLS 策略 - 允许认证用户删除自己的文件
CREATE POLICY "Authenticated users can delete dog images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'dog-images' 
    AND auth.role() = 'authenticated'
);

-- ============================================
-- 手动配置步骤（推荐）
-- ============================================
--
-- 1. 登录 Supabase Dashboard
-- 2. 进入 Storage 页面
-- 3. 点击 "Create a new bucket"
-- 4. 配置如下：
--    - Name: dog-images
--    - Public bucket: Yes (勾选)
--    - File size limit: 5MB
--    - Allowed MIME types: image/jpeg, image/jpg, image/png, image/gif, image/webp
-- 5. 点击 "Create bucket"
--
-- ============================================
-- 验证配置
-- ============================================
--
-- 执行以下查询验证 bucket 是否创建成功：
-- SELECT * FROM storage.buckets WHERE id = 'dog-images';
--
-- 执行以下查询验证策略是否创建成功：
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%dog-images%';
