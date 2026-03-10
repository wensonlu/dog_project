/**
 * 权限常量定义
 *
 * 使用位标志（bit flags）存储和检查权限
 * 每个权限占用一个二进制位，可以通过位运算快速检查和组合
 */

// 权限位定义
const PERMISSIONS = {
  NONE: 0,                      // 0b000 - 无权限
  MANAGE_ADOPTIONS: 1 << 0,     // 0b001 - 领养管理权限 (值为 1)
  MANAGE_SUBMISSIONS: 1 << 1,   // 0b010 - 发布管理权限 (值为 2)
  SUPER_ADMIN: 1 << 2,          // 0b100 - 超级管理员权限 (值为 4)
};

// 预设角色组合
const ROLE_PRESETS = {
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
const hasPermission = (userPermissions, requiredPermission) => {
  return (userPermissions & requiredPermission) !== 0;
};

// 检查是否拥有任一权限
const hasAnyPermission = (userPermissions, permissions) => {
  return permissions.some(permission => hasPermission(userPermissions, permission));
};

// 检查是否拥有所有权限
const hasAllPermissions = (userPermissions, permissions) => {
  return permissions.every(permission => hasPermission(userPermissions, permission));
};

// 添加权限
const addPermission = (userPermissions, permission) => {
  return userPermissions | permission;
};

// 移除权限
const removePermission = (userPermissions, permission) => {
  return userPermissions & ~permission;
};

// 切换权限（有则移除，无则添加）
const togglePermission = (userPermissions, permission) => {
  return userPermissions ^ permission;
};

// 获取权限描述（用于日志和调试）
const getPermissionDescription = (permissions) => {
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

module.exports = {
  PERMISSIONS,
  ROLE_PRESETS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  addPermission,
  removePermission,
  togglePermission,
  getPermissionDescription,
};
