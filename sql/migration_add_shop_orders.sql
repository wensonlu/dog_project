-- Migration: add shop_orders table for AI shop checkout flow
-- Date: 2026-05-14

CREATE TABLE IF NOT EXISTS shop_orders (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  status TEXT NOT NULL DEFAULT 'created',
  source TEXT NOT NULL DEFAULT 'ai-assistant',
  client_request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_orders_user_created_at
  ON shop_orders(user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_shop_orders_user_client_request
  ON shop_orders(user_id, client_request_id)
  WHERE client_request_id IS NOT NULL;

ALTER TABLE shop_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own shop orders" ON shop_orders;
CREATE POLICY "Users can view own shop orders" ON shop_orders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own shop orders" ON shop_orders;
CREATE POLICY "Users can create own shop orders" ON shop_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
