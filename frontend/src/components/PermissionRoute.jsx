import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * 权限路由保护组件
 * 检查用户是否登录且拥有所需权限
 *
 * @param {React.ReactNode} children - 子组件
 * @param {number} requiredPermission - 所需权限（来自 PERMISSIONS 常量）
 * @param {string} redirectTo - 无权限时重定向路径，默认为首页
 */
const PermissionRoute = ({ children, requiredPermission, redirectTo = '/' }) => {
  const { user, loading, hasPermission } = useAuth();

  console.log('[PermissionRoute] 检查权限:', {
    loading,
    user: user ? { id: user.id, email: user.email, permissions: user.permissions } : null,
    requiredPermission,
    hasPermission: user ? hasPermission(requiredPermission) : false
  });

  // 加载中，不渲染任何内容
  if (loading) {
    console.log('[PermissionRoute] 加载中...');
    return null;
  }

  // 未登录，重定向到登录页
  if (!user) {
    console.log('[PermissionRoute] 用户未登录，重定向到登录页');
    return <Navigate to="/login" />;
  }

  // 已登录但无权限，重定向到指定页面
  if (!hasPermission(requiredPermission)) {
    console.log('[PermissionRoute] 权限不足，重定向到:', redirectTo);
    return <Navigate to={redirectTo} />;
  }

  // 有权限，渲染子组件
  console.log('[PermissionRoute] 权限验证通过');
  return children;
};

export default PermissionRoute;
