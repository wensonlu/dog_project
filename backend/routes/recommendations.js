const express = require('express');
const router = express.Router();
const recommendationService = require('../services/recommendationService');

/**
 * POST /api/recommendations/calculate
 * 根据用户偏好计算推荐宠物列表
 */
router.post('/calculate', async (req, res) => {
  try {
    const { preferences } = req.body;

    // 验证必填字段
    const requiredFields = ['living_space', 'companion_time', 'family_members', 'activity_level', 'grooming_tolerance'];
    const missingFields = requiredFields.filter(field => !preferences || !preferences[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `缺少必填字段: ${missingFields.join(', ')}`
      });
    }

    // 调用推荐服务计算结果
    const result = await recommendationService.calculateRecommendations(preferences);

    res.json(result);
  } catch (error) {
    console.error('推荐API错误:', error);
    res.status(500).json({
      success: false,
      message: '推荐服务暂时不可用',
      error: error.message
    });
  }
});

module.exports = router;
