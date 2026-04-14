/**
 * Agent API Routes
 * 处理宠物 AI Agent 相关的 API 请求
 */

const express = require('express');
const router = express.Router();
const { generatePetBio, generateHealthAdvice } = require('../utils/ai');
const { getSupabaseClient } = require('../utils/supabaseClient');

/**
 * POST /api/agent/:dogId/generate
 * 触发 Agent 生成宠物简历
 */
router.post('/:dogId/generate', async (req, res) => {
  try {
    const { dogId } = req.params;
    const supabase = getSupabaseClient(req);

    // 1. 获取宠物信息
    const { data: dog, error: dogError } = await supabase
      .from('dogs')
      .select('*')
      .eq('id', dogId)
      .single();

    if (dogError || !dog) {
      return res.status(404).json({ error: '宠物不存在' });
    }

    // 2. 调用 AI 生成简历
    const result = await generatePetBio({
      name: dog.name,
      breed: dog.breed,
      age: dog.age,
      gender: dog.gender,
      photoUrl: dog.image,
    });

    // 3. 创建或更新 Pet Agent
    const agentData = {
      dog_id: dogId,
      generated_bio: result.bio,
      personality_traits: result.traits,
      status: 'active',
      last_active_at: new Date().toISOString(),
    };

    // 检查是否已存在 Agent
    const { data: existingAgent } = await supabase
      .from('pet_agents')
      .select('id')
      .eq('dog_id', dogId)
      .single();

    let agent;
    if (existingAgent) {
      // 更新现有 Agent
      const { data, error } = await supabase
        .from('pet_agents')
        .update(agentData)
        .eq('id', existingAgent.id)
        .select()
        .single();

      if (error) throw error;
      agent = data;
    } else {
      // 创建新 Agent
      const { data, error } = await supabase
        .from('pet_agents')
        .insert([agentData])
        .select()
        .single();

      if (error) throw error;
      agent = data;

      // 更新 dogs 表的 agent_id
      await supabase
        .from('dogs')
        .update({ agent_id: agent.id })
        .eq('id', dogId);
    }

    // 4. 记录 AI 使用日志
    await supabase
      .from('ai_usage_log')
      .insert([{
        agent_id: agent.id,
        operation: 'bio_generation',
        model: result.model,
        duration_ms: result.duration,
        success: true,
      }]);

    res.json({
      success: true,
      data: {
        agentId: agent.id,
        bio: result.bio,
        traits: result.traits,
      },
    });
  } catch (error) {
    console.error('生成宠物简历失败:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/agent/:dogId
 * 获取 Pet Agent 信息
 */
router.get('/:dogId', async (req, res) => {
  try {
    const { dogId } = req.params;
    const supabase = getSupabaseClient(req);

    const { data: agent, error } = await supabase
      .from('pet_agents')
      .select('*')
      .eq('dog_id', dogId)
      .single();

    if (error || !agent) {
      return res.status(404).json({ error: 'Agent 不存在' });
    }

    res.json({
      success: true,
      data: {
        agentId: agent.id,
        status: agent.status,
        generatedBio: agent.generated_bio,
        personalityTraits: agent.personality_traits,
        healthBaseline: agent.health_baseline,
        createdAt: agent.created_at,
      },
    });
  } catch (error) {
    console.error('获取 Agent 信息失败:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/agent/:dogId/content
 * 更新 Agent 生成的内容（用户编辑）
 */
router.put('/:dogId/content', async (req, res) => {
  try {
    const { dogId } = req.params;
    const { bio, personalityTraits } = req.body;
    const supabase = getSupabaseClient(req);

    const updateData = {};
    if (bio) updateData.generated_bio = bio;
    if (personalityTraits) updateData.personality_traits = personalityTraits;

    const { data: agent, error } = await supabase
      .from('pet_agents')
      .update(updateData)
      .eq('dog_id', dogId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: {
        agentId: agent.id,
        bio: agent.generated_bio,
        personalityTraits: agent.personality_traits,
      },
    });
  } catch (error) {
    console.error('更新 Agent 内容失败:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;