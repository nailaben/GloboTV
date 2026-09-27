-- =============================================
-- PLAYORA Database Schema
-- PostgreSQL
-- =============================================

-- Create sellers table
CREATE TABLE IF NOT EXISTS sellers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add usernames to existing seller accounts, using the email prefix as a starting point.
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS username VARCHAR(50);
UPDATE sellers
SET username = CASE
    WHEN lower(email) = 'admin@playora.com' THEN 'charaf_ben'
    ELSE COALESCE(NULLIF(lower(regexp_replace(split_part(email, '@', 1), '[^a-zA-Z0-9_]+', '_', 'g')), ''), 'seller')
END
WHERE username IS NULL;
UPDATE sellers SET username = 'charaf_ben'
WHERE lower(email) = 'admin@playora.com' AND username = 'admin';
WITH duplicate_usernames AS (
    SELECT id, username, ROW_NUMBER() OVER (PARTITION BY lower(username) ORDER BY id) AS row_num
    FROM sellers
)
UPDATE sellers AS seller
SET username = duplicate_usernames.username || seller.id::text
FROM duplicate_usernames
WHERE seller.id = duplicate_usernames.id AND duplicate_usernames.row_num > 1;
ALTER TABLE sellers ALTER COLUMN username SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS sellers_username_lower_unique ON sellers (lower(username));

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    name_fr VARCHAR(100) NOT NULL DEFAULT '',
    icon VARCHAR(50) DEFAULT 'category',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS categories_name_en_lower_unique ON categories (lower(name_en));

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER REFERENCES sellers(id) ON DELETE CASCADE,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_fr VARCHAR(255) NOT NULL DEFAULT '',
    description_ar TEXT,
    description_en TEXT,
    description_fr TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    stock_quantity INTEGER DEFAULT 0,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_offers (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    label_en VARCHAR(120) NOT NULL,
    label_fr VARCHAR(120) NOT NULL,
    price_eur DECIMAL(10,2) NOT NULL CHECK (price_eur >= 0),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS customers_email_lower_unique ON customers (lower(email));

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_address TEXT NOT NULL,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    notes TEXT,
    subtotal DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'USD';

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name_ar VARCHAR(255) NOT NULL,
    product_name_en VARCHAR(255) NOT NULL,
    product_name_fr VARCHAR(255) NOT NULL DEFAULT '',
    offer_label_en VARCHAR(120) NOT NULL DEFAULT '',
    offer_label_fr VARCHAR(120) NOT NULL DEFAULT '',
    offer_id INTEGER REFERENCES product_offers(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
-- Create triggers for updated_at safely
DROP TRIGGER IF EXISTS update_products_updated_at ON products;

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
-- Insert default categories
INSERT INTO categories (name_ar, name_en, name_fr, icon) VALUES
    ('IP-TV', 'IP-TV', 'IP-TV', 'live_tv')
ON CONFLICT DO NOTHING;

UPDATE categories SET name_fr = name_en WHERE name_fr = '';

-- Insert default seller (password: admin123)
INSERT INTO sellers (name, email, username, password_hash) VALUES
    ('PLAYORA Admin', 'admin@playora.com', 'charaf_ben', '$2a$10$LP4IPBr.AI/wi6YYfFFvne0ks8eS4iptKZll7oy5zn/31ChhxhI0S')
ON CONFLICT (email) DO NOTHING;

-- Product images in public/images are kept; products are added by the seller from the dashboard.
