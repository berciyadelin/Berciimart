-- BerciiMart V5
-- Indexes for created_at / order_date lookups.

CREATE INDEX IF NOT EXISTS idx_users_created_at
ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_products_created_at
ON products(created_at);

CREATE INDEX IF NOT EXISTS idx_orders_order_date
ON orders(order_date);

CREATE INDEX IF NOT EXISTS idx_reviews_created_at
ON reviews(created_at);