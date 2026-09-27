-- Run once on the existing PLAYORA database to enable buyer accounts and order history.
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

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'USD';

ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_fr VARCHAR(100) NOT NULL DEFAULT '';
UPDATE categories SET name_fr = CASE id
    WHEN 1 THEN 'Cartes numériques'
    WHEN 2 THEN 'Jeux vidéo'
    WHEN 3 THEN 'Streaming'
    WHEN 4 THEN 'Logiciels'
    WHEN 5 THEN 'Téléphones et électronique'
    ELSE COALESCE(NULLIF(name_fr, ''), name_en)
END WHERE name_fr = '';

ALTER TABLE products ADD COLUMN IF NOT EXISTS name_fr VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_fr TEXT;
UPDATE products SET name_fr = name_en WHERE name_fr = '';
UPDATE products SET description_fr = description_en WHERE description_fr IS NULL;

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name_fr VARCHAR(255) NOT NULL DEFAULT '';
UPDATE order_items SET product_name_fr = product_name_en WHERE product_name_fr = '';

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
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS offer_label_en VARCHAR(120) NOT NULL DEFAULT '';
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS offer_label_fr VARCHAR(120) NOT NULL DEFAULT '';
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS offer_id INTEGER REFERENCES product_offers(id) ON DELETE SET NULL;
