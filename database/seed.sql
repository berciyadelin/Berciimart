INSERT INTO products (name, description, price, quantity, category_id, category, image_url)
VALUES
('Laptop', 'High performance laptop', 65000.00, 10, 1, 'Electronics', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80'),
('Smartphone', 'Modern Android smartphone', 30000.00, 20, 1, 'Electronics', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80'),
('Headphones', 'Wireless headphones', 5000.00, 15, 1, 'Electronics', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80')
ON CONFLICT DO NOTHING;
