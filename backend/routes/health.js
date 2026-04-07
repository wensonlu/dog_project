/**
 * Health API Routes
 * 处理宠物健康记录和提醒相关的 API 请求
 */

const express = require('express');
const router = express.Router();
const { generateHealthAdvice } = require('../utils/ai');
const { getSupabaseClient } = require('../utils/supabaseClient');

/**
 * POST /api/health/:dogId/records
 * 添加健康记录并触发 AI 分析
 */
router.post('/:dogId/records', async (req, res) => {
  try {
    const { dogId } = req.params;
    const { recordType, recordDate, description, attachments } = req.body;
    const userId = req.user?.id; // 从认证中间件获取用户 ID
    const supabase = getSupabaseClient(req);

    // 1. 验证宠物存在
    const { data: dog, error: dogError } = await supabase
      .from('dogs')
      .select('id, breed, age')
      .eq('id', dogId)
      .single();

    if (dogError || !dog) {
      return res.status(404).json({ error: '宠物不存在' });
    }

    // 2. 创建健康记录
    const { data: record, error: recordError } = await supabase
      .from('health_records')
      .insert([
        {
          dog_id: dogId,
          user_id: userId,
          record_type: recordType,
          record_date: recordDate,
          description,
          attachments,
        },
      ])
      .select()
      .single();

    if (recordError) throw recordError;

    // 3. 调用 AI 生成健康建议
    let aiAnalysis = null;
    try {
      const result = await generateHealthAdvice({
        breed: dog.breed,
        age: dog.age,
        recordType,
        description,
      });

      aiAnalysis = result.advice;

      // 更新记录，添加 AI 分析
      await supabase
        .from('health_records')
        .update({ ai_analysis: aiAnalysis })
        .eq('id', record.id);

      // 4. 自动创建健康提醒
      if (recordType === 'vaccine' || recordType === 'deworming') {
        const frequencyDays = recordType === 'vaccine' ? 365 : 90; // 疫苗1年，驱虫3个月
        const nextDate = new Date(recordDate);
        nextDate.setDate(nextDate.getDate() + frequencyDays);

        await supabase.from('health_reminders').insert([
          {
            dog_id: dogId,
            user_id: userId,
            reminder_type: recordType,
            next_date: nextDate.toISOString().split('T')[0],
            frequency_days: frequencyDays,
          },
        ]);
      }
    } catch (aiError) {
      console.error('AI 分析失败:', aiError);
      // AI 失败不影响主流程，继续返回记录
    }

    res.json({
      success: true,
      data: {
        recordId: record.id,
        recordType: record.record_type,
        recordDate: record.record_date,
        description: record.description,
        aiAnalysis,
      },
    });
  } catch (error) {
    console.error('添加健康记录失败:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/health/:dogId/records
 * 获取健康记录列表
 */
router.get('/:dogId/records', async (req, res) => {
  try {
    const { dogId } = req.params;
    const supabase = getSupabaseClient(req);

    const { data: records, error } = await supabase
      .from('health_records')
      .select('*')
      .eq('dog_id', dogId)
      .order('record_date', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: records,
    });
  } catch (error) {
    console.error('获取健康记录失败:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/health/:dogId/reminders
 * 获取即将到期的健康提醒
 */
router.get('/:dogId/reminders', async (req, res) => {
  try {
    const { dogId } = req.params;
    const supabase = getSupabaseClient(req);

    // 获取所有 active 状态的提醒，按日期排序
    const { data: reminders, error } = await supabase
      .from('health_reminders')
      .select('*')
      .eq('dog_id', dogId)
      .eq('status', 'active')
      .order('next_date', { ascending: true });

    if (error) throw error;

    // 标记即将到期的提醒（7天内）
    const now = new Date();

    const processedReminders = reminders.map((reminder) => {
      const nextDate = new Date(reminder.next_date);
      const daysUntilDue = Math.ceil(
        (nextDate - now) / (1000 * 60 * 60 * 24)
      );

      return {
        ...reminder,
        daysUntilDue,
        isUrgent: daysUntilDue <= 7,
      };
    });

    res.json({
      success: true,
      data: processedReminders,
    });
  } catch (error) {
    console.error('获取健康提醒失败:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/health/reminders/:id
 * 更新提醒状态（标记完成或延期）
 */
router.put('/reminders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, snoozeDays } = req.body;
    const supabase = getSupabaseClient(req);

    const updateData = { status };

    // 如果延期，更新下次提醒日期
    if (status === 'snoozed' && snoozeDays) {
      const { data: currentReminder } = await supabase
        .from('health_reminders')
        .select('next_date')
        .eq('id', id)
        .single();

      const newDate = new Date(currentReminder.next_date);
      newDate.setDate(newDate.getDate() + snoozeDays);

      updateData.next_date = newDate.toISOString().split('T')[0];
    }

    // 如果完成，更新最后通知时间
    if (status === 'completed') {
      updateData.last_notified_at = new Date().toISOString();
    }

    const { data: reminder, error } = await supabase
      .from('health_reminders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: reminder,
    });
  } catch (error) {
    console.error('更新健康提醒失败:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;