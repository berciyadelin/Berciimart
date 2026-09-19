-- BerciiMart V4
-- Add the required order status workflow.
-- Existing PLACED orders are preserved by converting them to CONFIRMED.

UPDATE orders
SET status = 'CONFIRMED'
WHERE status = 'PLACED';

ALTER TABLE orders
ADD CONSTRAINT orders_status_check
CHECK (status IN ('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'));