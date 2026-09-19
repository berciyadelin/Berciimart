-- BerciiMart V2
-- Required indexes for foreign keys and common lookups.

CREATE INDEX IF NOT EXISTS idx_cart_user_id
ON cart(user_id);

CREATE INDEX IF NOT EXISTS idx_cart_product_id
ON cart(product_id);

CREATE INDEX IF NOT EXISTS idx_orders_user_id
ON orders(user_id);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id
ON order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_product_id
ON order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_reviews_user_id
ON reviews(user_id);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id
ON reviews(product_id);

CREATE INDEX IF NOT EXISTS idx_products_category_id
ON products(category_id);