-- ============================================
-- 仅更新缺失的 RLS 策略
-- 在 Supabase SQL Editor 中执行此文件
-- ============================================

-- 为 applications 表添加 UPDATE 策略（新增）
-- 允许用户更新自己的申请
DROP POLICY IF EXISTS "Users can update their own applications" ON applications;
CREATE POLICY "Users can update their own applications" ON applications
  FOR UPDATE USING (auth.uid() = user_id);

-- 验证：检查所有策略是否已创建
-- 执行后可以在 Supabase Dashboard > Authentication > Policies 中查看
