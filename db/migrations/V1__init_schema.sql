CREATE TABLE IF NOT EXISTS public.users (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('BUYER', 'SELLER', 'ADMIN')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
    id BIGSERIAL PRIMARY KEY,
    seller_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price_cents BIGINT NOT NULL CHECK (price_cents >= 0),
    stock_qty INTEGER NOT NULL CHECK (stock_qty >= 0),
    category TEXT NOT NULL,
    image_url TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cart_items (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.orders (
    id BIGSERIAL PRIMARY KEY,
    buyer_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (status IN (
            'PENDING',
            'CONFIRMED',
            'SHIPPED',
            'DELIVERED',
            'CANCELLED'
        )),
    total_amount_cents BIGINT NOT NULL CHECK (total_amount_cents >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_cents BIGINT NOT NULL CHECK (unit_price_cents >= 0)
);

CREATE TABLE IF NOT EXISTS public.reviews (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (product_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_products_seller_id
    ON public.products(seller_id);

CREATE INDEX IF NOT EXISTS idx_products_category
    ON public.products(category);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id
    ON public.cart_items(user_id);

CREATE INDEX IF NOT EXISTS idx_cart_items_product_id
    ON public.cart_items(product_id);

CREATE INDEX IF NOT EXISTS idx_orders_buyer_id
    ON public.orders(buyer_id);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id
    ON public.order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_product_id
    ON public.order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id
    ON public.reviews(product_id);

CREATE INDEX IF NOT EXISTS idx_reviews_user_id
    ON public.reviews(user_id);

CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.schema_migrations (version)
VALUES ('V1__init_schema')
ON CONFLICT (version) DO NOTHING;