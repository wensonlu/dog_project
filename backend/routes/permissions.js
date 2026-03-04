/**
 * 权限管理路由
 *
 * 提供用户权限的查询和管理接口
 */

const express = require('express');
const router = express.Router();
const checkSupabase = require('../middleware/supabaseCheck');
const { checkPermission, authenticateUser } = require('../middleware/checkPermission');
const { PERMISSIONS } = require('../constants/permissions');
const {
  getAllUsers,
  updateUserPermissions,
  getMyPermissions,
} = require('../controllers/permissionsController');

// 获取所有用户及其权限（需要超级管理员权限）
router.get('/users', checkSupabase, checkPermission(PERMISSIONS.SUPER_ADMIN), getAllUsers);

// 更新指定用户的权限（需要超级管理员权限）
router.put('/users/:userId', checkSupabase, checkPermission(PERMISSIONS.SUPER_ADMIN), updateUserPermissions);

// 获取当前用户的权限（任何登录用户都可以访问）
router.get('/me', checkSupabase, authenticateUser(), getMyPermissions);

module.exports = router;
