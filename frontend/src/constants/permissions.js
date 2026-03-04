/**
 * 权限常量定义（前端）
 *
 * 与后端权限定义保持一致
 * 使用位标志（bit flags）存储和检查权限
 */

// 权限位定义（与后端完全一致）
export const PERMISSIONS = {
  NONE: 0,                      // 0b000 - 无权限
  MANAGE_ADOPTIONS: 1 << 0,     // 0b001 - 领养管理权限 (值为 1)
  MANAGE_SUBMISSIONS: 1 << 1,   // 0b010 - 发布管理权限 (值为 2)
  SUPER_ADMIN: 1 << 2,          // 0b100 - 超级管理员权限 (值为 4)
};

// 预设角色组合
export const ROLE_PRESETS = {
  // 只有领养管理权限
  ADOPTION_ADMIN: PERMISSIONS.MANAGE_ADOPTIONS,

  // 只有发布管理权限
  SUBMISSION_ADMIN: PERMISSIONS.MANAGE_SUBMISSIONS,

  // 拥有所有管理权限（包括权限管理）
  FULL_ADMIN: PERMISSIONS.MANAGE_ADOPTIONS | PERMISSIONS.MANAGE_SUBMISSIONS | PERMISSIONS.SUPER_ADMIN,

  // 拥有领养和发布管理权限，但不能管理其他用户权限
  CONTENT_ADMIN: PERMISSIONS.MANAGE_ADOPTIONS | PERMISSIONS.MANAGE_SUBMISSIONS,
};

// 权限检查函数
export const hasPermission = (userPermissions, requiredPermission) => {
  if (userPermissions === undefined || userPermissions === null) return false;
  return (userPermissions & requiredPermission) !== 0;
};

// 检查是否拥有任一权限
export const hasAnyPermission = (userPermissions, permissions) => {
  if (userPermissions === undefined || userPermissions === null) return false;
  return permissions.some(permission => hasPermission(userPermissions, permission));
};

// 检查是否拥有所有权限
export const hasAllPermissions = (userPermissions, permissions) => {
  if (userPermissions === undefined || userPermissions === null) return false;
  return permissions.every(permission => hasPermission(userPermissions, permission));
};

// 获取权限描述（用于 UI 显示）
export const getPermissionDescription = (permissions) => {
  if (permissions === undefined || permissions === null) return '无权限';

  const descriptions = [];

  if (hasPermission(permissions, PERMISSIONS.MANAGE_ADOPTIONS)) {
    descriptions.push('领养管理');
  }
  if (hasPermission(permissions, PERMISSIONS.MANAGE_SUBMISSIONS)) {
    descriptions.push('发布管理');
  }
  if (hasPermission(permissions, PERMISSIONS.SUPER_ADMIN)) {
    descriptions.push('超级管理员');
  }

  return descriptions.length > 0 ? descriptions.join(', ') : '无权限';
};

// 获取权限名称映射（用于 UI 显示）
export const PERMISSION_NAMES = {
  [PERMISSIONS.MANAGE_ADOPTIONS]: '领养管理',
  [PERMISSIONS.MANAGE_SUBMISSIONS]: '发布管理',
  [PERMISSIONS.SUPER_ADMIN]: '超级管理员',
};
