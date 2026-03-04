-- ============================================
-- 权限管理系统迁移脚本
-- 创建时间: 2026-03-02
-- 说明: 为 profiles 表添加权限字段，使用位标志（bit flags）存储多个权限
-- ============================================

-- 1. 添加权限字段到 profiles 表
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS permissions INTEGER DEFAULT 0 NOT NULL;

-- 添加注释说明
COMMENT ON COLUMN public.profiles.permissions IS '用户权限位标志: 1=领养管理, 2=发布管理, 4=超级管理员';

-- 2. 添加索引以优化权限查询
CREATE INDEX IF NOT EXISTS idx_profiles_permissions
ON public.profiles(permissions)
WHERE permissions > 0;

-- 3. 添加约束确保权限值非负
ALTER TABLE public.profiles
ADD CONSTRAINT check_permissions_non_negative
CHECK (permissions >= 0);

-- ============================================
-- 权限位定义说明
-- ============================================
-- NONE: 0                (0b000) - 无权限
-- MANAGE_ADOPTIONS: 1    (0b001) - 领养管理权限
-- MANAGE_SUBMISSIONS: 2  (0b010) - 发布管理权限
-- SUPER_ADMIN: 4         (0b100) - 超级管理员权限（可管理其他用户权限）
--
-- 示例使用：
-- 设置用户为全权管理员: UPDATE profiles SET permissions = 7 WHERE email = 'admin@example.com';
-- 只给领养管理权限: UPDATE profiles SET permissions = 1 WHERE email = 'user@example.com';
-- 只给发布管理权限: UPDATE profiles SET permissions = 2 WHERE email = 'user@example.com';
-- 给领养和发布管理权限: UPDATE profiles SET permissions = 3 WHERE email = 'user@example.com';
-- 检查是否有领养管理权限: SELECT * FROM profiles WHERE (permissions & 1) > 0;
-- ============================================

-- 4. 设置第一个管理员（请替换为你的实际邮箱）
-- 取消注释并修改下面的 SQL，设置第一个超级管理员
-- UPDATE public.profiles
-- SET permissions = 7
-- WHERE email = 'your-email@example.com';
