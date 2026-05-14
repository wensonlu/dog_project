const express = require('express');
const { getSupabaseClient } = require('../utils/supabaseClient');

const router = express.Router();

const memoryOrders = [];

const toSafeInt = (value, fallback = 1) => {
    const num = Number.parseInt(value, 10);
    if (Number.isNaN(num) || num <= 0) return fallback;
    return num;
};

const formatOrder = (order) => ({
    id: order.id,
    userId: order.user_id,
    productId: order.product_id,
    quantity: order.quantity,
    status: order.status || 'created',
    source: order.source || 'ai-assistant',
    clientRequestId: order.client_request_id || null,
    createdAt: order.created_at || new Date().toISOString()
});

router.post('/orders', async (req, res) => {
    try {
        const userId = String(req.body?.userId || '').trim();
        const productId = String(req.body?.productId || '').trim();
        const quantity = toSafeInt(req.body?.quantity, 1);
        const source = String(req.body?.source || 'ai-assistant').trim();
        const clientRequestId = String(req.body?.clientRequestId || '').trim();
        const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        if (!userId || !productId) {
            return res.status(400).json({ error: 'userId and productId are required' });
        }

        // Memory idempotency fallback
        if (clientRequestId) {
            const existedMemoryOrder = memoryOrders.find(
                (item) => item.user_id === userId && item.client_request_id === clientRequestId
            );
            if (existedMemoryOrder) {
                return res.json({ ok: true, order: formatOrder(existedMemoryOrder), idempotent: true, storage: 'memory' });
            }
        }

        const supabase = getSupabaseClient(req);
        if (supabase) {
            // DB idempotency check
            if (clientRequestId) {
                const { data: existedDbOrder } = await supabase
                    .from('shop_orders')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('client_request_id', clientRequestId)
                    .limit(1)
                    .maybeSingle();

                if (existedDbOrder) {
                    return res.json({ ok: true, order: formatOrder(existedDbOrder), idempotent: true, storage: 'supabase' });
                }
            }

            const payload = {
                id: orderId,
                user_id: userId,
                product_id: productId,
                quantity,
                status: 'created',
                source,
                client_request_id: clientRequestId || null
            };

            const { data, error } = await supabase
                .from('shop_orders')
                .insert(payload)
                .select('*')
                .single();

            if (!error && data) {
                return res.status(201).json({ ok: true, order: formatOrder(data), storage: 'supabase' });
            }

            // If table not found or DB failed, fallback to memory store for MVP continuity
            console.warn('[shop/orders] Supabase insert failed, fallback to memory:', error?.message || error);
        }

        const memoryOrder = {
            id: `mem_order_${Date.now()}`,
            user_id: userId,
            product_id: productId,
            quantity,
            status: 'created',
            source,
            client_request_id: clientRequestId || null,
            created_at: new Date().toISOString()
        };
        memoryOrders.unshift(memoryOrder);
        return res.status(201).json({ ok: true, order: formatOrder(memoryOrder), storage: 'memory' });
    } catch (error) {
        console.error('Create shop order error:', error);
        return res.status(500).json({ error: 'Failed to create shop order' });
    }
});

router.get('/orders', async (req, res) => {
    try {
        const userId = String(req.query?.userId || '').trim();
        const limit = toSafeInt(req.query?.limit, 20);
        if (!userId) return res.status(400).json({ error: 'userId is required' });

        const supabase = getSupabaseClient(req);
        if (supabase) {
            const { data, error } = await supabase
                .from('shop_orders')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(Math.min(limit, 50));

            if (!error && data) {
                return res.json({ ok: true, data: data.map(formatOrder), storage: 'supabase' });
            }
        }

        const data = memoryOrders
            .filter((item) => item.user_id === userId)
            .slice(0, Math.min(limit, 50))
            .map(formatOrder);
        return res.json({ ok: true, data, storage: 'memory' });
    } catch (error) {
        console.error('List shop orders error:', error);
        return res.status(500).json({ error: 'Failed to list shop orders' });
    }
});

router.get('/orders/:id', async (req, res) => {
    try {
        const orderId = String(req.params?.id || '').trim();
        if (!orderId) return res.status(400).json({ error: 'order id is required' });

        const supabase = getSupabaseClient(req);
        if (supabase) {
            const { data, error } = await supabase
                .from('shop_orders')
                .select('*')
                .eq('id', orderId)
                .maybeSingle();
            if (!error && data) {
                return res.json({ ok: true, order: formatOrder(data), storage: 'supabase' });
            }
        }

        const memoryOrder = memoryOrders.find((item) => item.id === orderId);
        if (memoryOrder) {
            return res.json({ ok: true, order: formatOrder(memoryOrder), storage: 'memory' });
        }

        return res.status(404).json({ error: 'Order not found' });
    } catch (error) {
        console.error('Get shop order error:', error);
        return res.status(500).json({ error: 'Failed to get shop order' });
    }
});

module.exports = router;
