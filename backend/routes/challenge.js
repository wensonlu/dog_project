const express = require('express');
const router = express.Router();

const tasks = new Map();

function toTaskView(task) {
  return {
    id: task.id,
    userId: task.userId,
    topicId: task.topicId,
    orderRef: task.orderRef,
    productId: task.productId,
    durationDays: task.durationDays,
    progressDays: task.checkins.length,
    checkins: task.checkins,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    status: task.status
  };
}

router.post('/', async (req, res) => {
  const { userId, topicId, orderRef, productId, durationDays = 7 } = req.body || {};
  if (!userId || !topicId) {
    return res.status(400).json({ error: 'userId and topicId are required' });
  }

  // idempotent by user + topic + orderRef
  const existed = Array.from(tasks.values()).find(
    (t) => t.userId === userId && t.topicId === String(topicId) && t.orderRef === (orderRef || null)
  );
  if (existed) {
    return res.json({ ok: true, task: toTaskView(existed), idempotent: true });
  }

  const now = new Date().toISOString();
  const task = {
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    topicId: String(topicId),
    orderRef: orderRef || null,
    productId: productId || null,
    durationDays: Math.max(1, Math.min(Number(durationDays) || 7, 30)),
    checkins: [],
    createdAt: now,
    updatedAt: now,
    status: 'active'
  };

  tasks.set(task.id, task);
  return res.status(201).json({ ok: true, task: toTaskView(task) });
});

router.get('/my', async (req, res) => {
  const { userId } = req.query || {};
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  const data = Array.from(tasks.values())
    .filter((t) => t.userId === userId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .map(toTaskView);
  return res.json({ ok: true, data });
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query || {};
  const task = tasks.get(id);
  if (!task) return res.status(404).json({ error: 'task not found' });
  if (userId && task.userId !== userId) return res.status(403).json({ error: 'forbidden' });
  return res.json({ ok: true, task: toTaskView(task) });
});

router.post('/:id/checkin', async (req, res) => {
  const { id } = req.params;
  const { userId, note = '' } = req.body || {};
  const task = tasks.get(id);
  if (!task) return res.status(404).json({ error: 'task not found' });
  if (!userId || task.userId !== userId) return res.status(403).json({ error: 'forbidden' });

  const today = new Date().toISOString().slice(0, 10);
  const existed = task.checkins.find((c) => c.date === today);
  if (existed) {
    return res.json({ ok: true, checkin: existed, idempotent: true, task: toTaskView(task) });
  }

  const checkin = {
    id: `checkin_${Date.now()}`,
    dayIndex: task.checkins.length + 1,
    date: today,
    note: String(note).slice(0, 200)
  };
  task.checkins.push(checkin);
  task.updatedAt = new Date().toISOString();
  if (task.checkins.length >= task.durationDays) {
    task.status = 'completed';
  }

  tasks.set(task.id, task);
  return res.status(201).json({ ok: true, checkin, task: toTaskView(task) });
});

module.exports = router;
