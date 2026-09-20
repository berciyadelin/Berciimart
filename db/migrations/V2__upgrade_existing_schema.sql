-- V2: Safely upgrade the existing BerciiMart schema
-- Existing data is preserved.

BEGIN;

-- ------------------------------------------------------------
-- 1. Add seller ownership to products
-- ------------------------------------------------------------

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS seller_id INTEGER;

-- ------------------------------------------------------------
-- 2. Add product fields required by the capstone
-- ------------------------------------------------------------

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '';

-- Category is currently represented by category_id.
-- Keep the existing category relationship and add a searchable
-- category name column for the new API.
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'General';

-- ------------------------------------------------------------
-- 3. Add created_at if missing
-- ------------------------------------------------------------

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ------------------------------------------------------------
-- 4. Create a system seller account for existing products
-- ------------------------------------------------------------

INSERT INTO public.users
    (name, email, password_hash, role)
VALUES
    (
        'BerciiMart Seller',
        'seller@berciimart.local',
        'MIGRATION_ACCOUNT_CHANGE_PASSWORD',
        'SELLER'
    )
ON CONFLICT (email) DO NOTHING;

-- ------------------------------------------------------------
-- 5. Assign existing products to the migration seller
-- ------------------------------------------------------------

UPDATE public.products
SET seller_id = (
    SELECT id
    FROM public.users
    WHERE email = 'seller@berciimart.local'
    AND role = 'SELLER'
)
WHERE seller_id IS NULL;

-- ------------------------------------------------------------
-- 6. Make seller_id required after existing products are assigned
-- ------------------------------------------------------------

ALTER TABLE public.products
ALTER COLUMN seller_id SET NOT NULL;

-- ------------------------------------------------------------
-- 7. Add seller foreign key
-- ------------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_products_seller'
    ) THEN
        ALTER TABLE public.products
        ADD CONSTRAINT fk_products_seller
        FOREIGN KEY (seller_id)
        REFERENCES public.users(id)
        ON DELETE CASCADE;
    END IF;
END
$$;

-- ------------------------------------------------------------
-- 8. Add useful product indexes
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_products_seller_id
    ON public.products(seller_id);

CREATE INDEX IF NOT EXISTS idx_products_category
    ON public.products(category);

-- ------------------------------------------------------------
-- 9. Add unique constraint for reviews
--    One review per user/product.
-- ------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_user_product_unique
    ON public.reviews(user_id, product_id);

-- ------------------------------------------------------------
-- 10. Add schema migration record
-- ------------------------------------------------------------

INSERT INTO public.schema_migrations (version)
VALUES ('V2__upgrade_existing_schema')
ON CONFLICT (version) DO NOTHING;

COMMIT;