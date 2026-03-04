/**
 * 权限验证中间件
 *
 * 从请求中提取 JWT token，验证用户身份并检查权限
 */

const { supabase } = require('../config/supabase');
const { hasPermission, hasAnyPermission, getPermissionDescription } = require('../constants/permissions');

/**
 * 从请求中获取用户信息和权限
 * @param {Object} req - Express request object
 * @returns {Promise<{userId: string, permissions: number}>}
 */
async function getUserFromRequest(req) {
  const authHeader = req.headers.authorization;
  console.log('[checkPermission] Authorization header:', authHeader?.substring(0, 20) + '...');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('未提供认证 Token');
  }

  const token = authHeader.substring(7);

  // 使用 Supabase Auth 验证 token 并获取用户信息
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  console.log('[checkPermission] Supabase getUser result:', {
    userId: user?.id,
    email: user?.email,
    error: authError?.message
  });

  if (authError || !user) {
    throw new Error('无效的认证 Token');
  }

  // 从 profiles 表获取用户权限
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('permissions')
    .eq('id', user.id)
    .single();

  console.log('[checkPermission] Profile query result:', {
    userId: user.id,
    permissions: profile?.permissions,
    error: profileError?.message
  });

  if (profileError) {
    console.error('[checkPermission] Profile error:', profileError);
    throw new Error('获取用户权限失败');
  }

  const result = {
    userId: user.id,
    email: user.email,
    permissions: profile?.permissions || 0,
  };

  console.log('[checkPermission] Final user info:', result);
  return result;
}

/**
 * 检查用户是否拥有指定权限的中间件
 * @param {number} requiredPermission - 所需权限（来自 PERMISSIONS 常量）
 * @returns {Function} Express middleware
 */
function checkPermission(requiredPermission) {
  return async (req, res, next) => {
    try {
      const userInfo = await getUserFromRequest(req);

      // 检查用户是否拥有所需权限
      if (!hasPermission(userInfo.permissions, requiredPermission)) {
        return res.status(403).json({
          error: '权限不足',
          message: `您没有访问此资源的权限。当前权限: ${getPermissionDescription(userInfo.permissions)}`,
        });
      }

      // 将用户信息附加到 request 对象，供后续中间件使用
      req.user = userInfo;
      next();
    } catch (error) {
      return res.status(401).json({
        error: '认证失败',
        message: error.message,
      });
    }
  };
}

/**
 * 检查用户是否拥有多个权限中的任一权限
 * @param {Array<number>} permissions - 权限数组
 * @returns {Function} Express middleware
 */
function checkAnyPermission(permissions) {
  return async (req, res, next) => {
    try {
      const userInfo = await getUserFromRequest(req);

      // 检查用户是否拥有任一权限
      if (!hasAnyPermission(userInfo.permissions, permissions)) {
        return res.status(403).json({
          error: '权限不足',
          message: `您没有访问此资源的权限。当前权限: ${getPermissionDescription(userInfo.permissions)}`,
        });
      }

      // 将用户信息附加到 request 对象
      req.user = userInfo;
      next();
    } catch (error) {
      return res.status(401).json({
        error: '认证失败',
        message: error.message,
      });
    }
  };
}

/**
 * 仅验证用户身份，不检查权限
 * 将用户信息和权限附加到 req.user
 * @returns {Function} Express middleware
 */
function authenticateUser() {
  return async (req, res, next) => {
    try {
      const userInfo = await getUserFromRequest(req);
      req.user = userInfo;
      next();
    } catch (error) {
      return res.status(401).json({
        error: '认证失败',
        message: error.message,
      });
    }
  };
}

module.exports = {
  checkPermission,
  checkAnyPermission,
  authenticateUser,
  getUserFromRequest,
};
