-- =============================================
-- PLAYORA DATABASE SCHEMA
-- PostgreSQL
-- =============================================

-- =============================================
-- 1. SELLERS
-- =============================================

CREATE TABLE IF NOT EXISTS sellers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- If old database has user_name, rename it to username
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'sellers'
        AND column_name = 'user_name'
    )
    AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'sellers'
        AND column_name = 'username'
    )
    THEN
        ALTER TABLE sellers
        RENAME COLUMN user_name TO username;
    END IF;
END $$;


-- Generate username for old sellers that don't have one
UPDATE sellers
SET username =
    CASE
        WHEN id = 1 THEN 'charaf_ben'
        ELSE 'seller_' || id
    END
WHERE username IS NULL OR TRIM(username) = '';


-- Make username required
ALTER TABLE sellers
ALTER COLUMN username SET NOT NULL;


-- Unique username
CREATE UNIQUE INDEX IF NOT EXISTS sellers_username_unique
ON sellers (LOWER(TRIM(username)));


-- =============================================
-- 2. CATEGORIES
-- =============================================

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name_ar VARCHAR(100) NOT NULL DEFAULT '',
    name_en VARCHAR(100) NOT NULL,
    name_fr VARCHAR(100) NOT NULL DEFAULT '',
    icon VARCHAR(50) DEFAULT 'category',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Add Arabic name if old table doesn't have it
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS name_ar VARCHAR(100) NOT NULL DEFAULT '';


-- Add French name if old table doesn't have it
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS name_fr VARCHAR(100) NOT NULL DEFAULT '';


-- =============================================
-- 3. PRODUCTS
-- =============================================

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,

    seller_id INTEGER
        REFERENCES sellers(id)
        ON DELETE CASCADE,

    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_fr VARCHAR(255) NOT NULL DEFAULT '',

    description_ar TEXT,
    description_en TEXT,
    description_fr TEXT,

    price DECIMAL(10,2) NOT NULL,

    category_id INTEGER
        REFERENCES categories(id)
        ON DELETE SET NULL,

    stock_quantity INTEGER DEFAULT 0,

    image_url VARCHAR(500),

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Add missing columns to old products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS name_fr VARCHAR(255) NOT NULL DEFAULT '';

ALTER TABLE products
ADD COLUMN IF NOT EXISTS description_fr TEXT;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- Fill French names from English if empty
UPDATE products
SET name_fr = name_en
WHERE name_fr IS NULL OR TRIM(name_fr) = '';


UPDATE products
SET description_fr = description_en
WHERE description_fr IS NULL
AND description_en IS NOT NULL;


-- =============================================
-- 4. PRODUCT OFFERS
-- =============================================

CREATE TABLE IF NOT EXISTS product_offers (
    id SERIAL PRIMARY KEY,

    product_id INTEGER NOT NULL
        REFERENCES products(id)
        ON DELETE CASCADE,

    label_en VARCHAR(120) NOT NULL,
    label_fr VARCHAR(120) NOT NULL,

    price_eur DECIMAL(10,2) NOT NULL
        CHECK (price_eur >= 0),

    sort_order INTEGER NOT NULL DEFAULT 0,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =============================================
-- 5. CUSTOMERS
-- =============================================

CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,

    name VARCHAR(150) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    phone VARCHAR(30),

    address TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Case-insensitive unique email
CREATE UNIQUE INDEX IF NOT EXISTS customers_email_lower_unique
ON customers (LOWER(TRIM(email)));


-- =============================================
-- 6. ORDERS
-- =============================================

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,

    order_number VARCHAR(20) UNIQUE NOT NULL,

    customer_name VARCHAR(255) NOT NULL,

    customer_phone VARCHAR(20) NOT NULL,

    customer_email VARCHAR(255) NOT NULL,

    customer_address TEXT NOT NULL,

    customer_id INTEGER
        REFERENCES customers(id)
        ON DELETE SET NULL,

    notes TEXT,

    subtotal DECIMAL(10,2) NOT NULL,

    total_amount DECIMAL(10,2) NOT NULL,

    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',

    status VARCHAR(50) DEFAULT 'pending',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Add missing columns
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS customer_id INTEGER;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'EUR';


-- Add foreign key only if needed
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'orders_customer_id_fkey'
    )
    THEN
        ALTER TABLE orders
        ADD CONSTRAINT orders_customer_id_fkey
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE SET NULL;
    END IF;
END $$;


-- =============================================
-- 7. ORDER ITEMS
-- =============================================

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,

    order_id INTEGER
        REFERENCES orders(id)
        ON DELETE CASCADE,

    product_id INTEGER
        REFERENCES products(id)
        ON DELETE SET NULL,

    product_name_ar VARCHAR(255) NOT NULL,

    product_name_en VARCHAR(255) NOT NULL,

    product_name_fr VARCHAR(255) NOT NULL DEFAULT '',

    offer_label_en VARCHAR(120) NOT NULL DEFAULT '',

    offer_label_fr VARCHAR(120) NOT NULL DEFAULT '',

    offer_id INTEGER
        REFERENCES product_offers(id)
        ON DELETE SET NULL,

    quantity INTEGER NOT NULL,

    unit_price DECIMAL(10,2) NOT NULL,

    subtotal DECIMAL(10,2) NOT NULL
);


-- Add missing columns
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS product_name_fr VARCHAR(255) NOT NULL DEFAULT '';

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS offer_label_en VARCHAR(120) NOT NULL DEFAULT '';

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS offer_label_fr VARCHAR(120) NOT NULL DEFAULT '';

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS offer_id INTEGER;


-- Add offer foreign key
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'order_items_offer_id_fkey'
    )
    THEN
        ALTER TABLE order_items
        ADD CONSTRAINT order_items_offer_id_fkey
        FOREIGN KEY (offer_id)
        REFERENCES product_offers(id)
        ON DELETE SET NULL;
    END IF;
END $$;


-- Fill French product name
UPDATE order_items
SET product_name_fr = product_name_en
WHERE product_name_fr IS NULL
OR TRIM(product_name_fr) = '';


-- =============================================
-- 8. UPDATED_AT FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =============================================
-- 9. PRODUCTS TRIGGER
-- =============================================

DROP TRIGGER IF EXISTS update_products_updated_at ON products;

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- =============================================
-- 10. ORDERS TRIGGER
-- =============================================

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- =============================================
-- 11. DEFAULT CATEGORY
-- =============================================

INSERT INTO categories (
    name_ar,
    name_en,
    name_fr,
    icon
)
SELECT
    'IP-TV',
    'IP-TV',
    'IP-TV',
    'live_tv'
WHERE NOT EXISTS (
    SELECT 1
    FROM categories
    WHERE LOWER(TRIM(name_en)) = 'ip-tv'
);


-- =============================================
-- 12. DEFAULT ADMIN SELLER
-- =============================================

-- Username:
-- charaf_ben
--
-- Password:
-- admin123

INSERT INTO sellers (
    name,
    username,
    password_hash
)
SELECT
    'PLAYORA Admin',
    'charaf_ben',
    '$2a$10$LP4IPBr.AI/wi6YYfFFvne0ks8eS4iptKZll7oy5zn/31ChhxhI0S'
WHERE NOT EXISTS (
    SELECT 1
    FROM sellers
    WHERE LOWER(TRIM(username)) = 'charaf_ben'
);


-- =============================================
-- 13. CHECK DATABASE
-- =============================================

SELECT
    id,
    name,
    username,
    created_at
FROM sellers
ORDER BY id;


SELECT
    id,
    name_ar,
    name_en,
    name_fr,
    icon
FROM categories
ORDER BY id;


SELECT
    id,
    name_ar,
    name_en,
    price,
    stock_quantity,
    is_active
FROM products
ORDER BY id;