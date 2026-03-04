/**
 * 权限管理控制器
 *
 * 处理用户权限的查询和更新
 */

const { supabase } = require('../config/supabase');
const { getPermissionDescription } = require('../constants/permissions');

/**
 * 获取所有用户及其权限
 * 需要 SUPER_ADMIN 权限
 * GET /api/permissions/users
 */
async function getAllUsers(req, res) {
  try {
    // 获取所有用户的 profile 信息
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url, permissions, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取用户列表失败:', error);
      return res.status(500).json({
        error: '获取用户列表失败',
        message: error.message,
      });
    }

    // 为每个用户添加权限描述
    const usersWithPermissions = profiles.map(profile => ({
      ...profile,
      permissionDescription: getPermissionDescription(profile.permissions || 0),
    }));

    res.json({
      users: usersWithPermissions,
      total: usersWithPermissions.length,
    });
  } catch (error) {
    console.error('获取用户列表异常:', error);
    res.status(500).json({
      error: '服务器错误',
      message: error.message,
    });
  }
}

/**
 * 更新用户权限
 * 需要 SUPER_ADMIN 权限
 * PUT /api/permissions/users/:userId
 * Body: { permissions: number }
 */
async function updateUserPermissions(req, res) {
  try {
    const { userId } = req.params;
    const { permissions } = req.body;

    // 验证 permissions 参数
    if (typeof permissions !== 'number' || permissions < 0) {
      return res.status(400).json({
        error: '无效的权限值',
        message: '权限值必须是非负整数',
      });
    }

    // 防止超级管理员移除自己的超级管理员权限
    if (req.user.userId === userId) {
      const { PERMISSIONS } = require('../constants/permissions');
      const { hasPermission } = require('../constants/permissions');

      const currentHasSuperAdmin = hasPermission(req.user.permissions, PERMISSIONS.SUPER_ADMIN);
      const newHasSuperAdmin = hasPermission(permissions, PERMISSIONS.SUPER_ADMIN);

      if (currentHasSuperAdmin && !newHasSuperAdmin) {
        return res.status(400).json({
          error: '操作被拒绝',
          message: '不能移除自己的超级管理员权限',
        });
      }
    }

    // 更新用户权限
    const { data, error } = await supabase
      .from('profiles')
      .update({ permissions })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('更新权限失败:', error);
      return res.status(500).json({
        error: '更新权限失败',
        message: error.message,
      });
    }

    res.json({
      message: '权限更新成功',
      user: {
        ...data,
        permissionDescription: getPermissionDescription(data.permissions || 0),
      },
    });
  } catch (error) {
    console.error('更新权限异常:', error);
    res.status(500).json({
      error: '服务器错误',
      message: error.message,
    });
  }
}

/**
 * 获取当前用户的权限
 * 任何登录用户都可以调用
 * GET /api/permissions/me
 */
async function getMyPermissions(req, res) {
  try {
    console.log('[getMyPermissions] 开始处理请求');
    console.log('[getMyPermissions] req.user:', req.user);

    // req.user 由 authenticateUser 中间件设置
    const { userId, permissions } = req.user;

    const result = {
      userId,
      permissions,
      permissionDescription: getPermissionDescription(permissions || 0),
    };

    console.log('[getMyPermissions] 返回结果:', result);
    res.json(result);
  } catch (error) {
    console.error('[getMyPermissions] 异常:', error);
    res.status(500).json({
      error: '服务器错误',
      message: error.message,
    });
  }
}

module.exports = {
  getAllUsers,
  updateUserPermissions,
  getMyPermissions,
};
