const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const authMiddleware = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// Generate unique order number
const generateOrderNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PLY-${timestamp}-${random}`;
};

// POST /api/orders - Create new order (public)
router.post('/', async (req, res) => {
    const { customer_name, customer_phone, customer_email, notes, items, payment_provider } = req.body;

    if (!customer_name || !customer_phone || !customer_email || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'All required fields must be provided' });
    }

    let client;
    try {
        client = await pool.connect();
        await client.query('BEGIN');

        // Validate products and calculate total
        let subtotal = 0;
        const validatedItems = [];

        for (const item of items) {
            const quantity = Number(item.quantity);
            if (!Number.isInteger(quantity) || quantity < 1) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'Each item must have a valid quantity' });
            }
            const productResult = await client.query(
                'SELECT * FROM products WHERE id = $1 AND is_active = true FOR UPDATE',
                [item.product_id]
            );

            if (productResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: `Product ${item.product_id} not found` });
            }

            const product = productResult.rows[0];

            if (product.stock_quantity < quantity) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name_en}` });
            }

            const offerResult = await client.query('SELECT * FROM product_offers WHERE id=$1 AND product_id=$2 AND is_active=true', [item.offer_id, product.id]);
            if (!item.offer_id || offerResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: `Choose a valid offer for ${product.name_en}` });
            }
            const offer = offerResult.rows[0];
            const itemSubtotal = Number(offer.price_eur) * quantity;
            subtotal += itemSubtotal;

            // Reserve stock while the product row is locked. This also handles
            // duplicate product lines in one cart and concurrent checkouts.
            await client.query(
                'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
                [quantity, product.id]
            );

            validatedItems.push({
                product,
                offer,
                quantity,
                unit_price: Number(offer.price_eur),
                subtotal: itemSubtotal
            });
        }

        const total_amount = subtotal;
        const order_number = generateOrderNumber();

        let paymentLink = null;
        if (payment_provider === 'oneclick') {
            const configuredUrl = process.env.ONECLICK_PAYMENT_URL;
            let parsedUrl;
            try { parsedUrl = new URL(configuredUrl); } catch { parsedUrl = null; }
            if (parsedUrl?.origin !== 'https://pay.ocdz.link') {
                await client.query('ROLLBACK');
                return res.status(503).json({ success: false, message: 'A valid OneClick payment link is not configured yet.' });
            }
            paymentLink = parsedUrl.toString();
        }

        // Create order
        let customerId = null;
        const bearer = req.headers.authorization?.split(' ')[1];
        if (bearer) {
            try {
                const decoded = jwt.verify(bearer, process.env.JWT_SECRET);
                if (decoded.type === 'customer') customerId = decoded.id;
            } catch { /* Guest checkout remains available if the token is invalid or expired. */ }
        }

        const orderResult = await client.query(`
            INSERT INTO orders (order_number, customer_name, customer_phone, customer_email, customer_id, notes, subtotal, total_amount, currency, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'EUR', 'pending')
            RETURNING *
        `, [order_number, customer_name, customer_phone, customer_email, customerId, notes || '', subtotal, total_amount]);

        const order = orderResult.rows[0];

        // Create order items and update stock
        for (const item of validatedItems) {
            await client.query(`
                INSERT INTO order_items (order_id, product_id, product_name_ar, product_name_en, product_name_fr, offer_id, offer_label_en, offer_label_fr, quantity, unit_price, subtotal)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [order.id, item.product.id, item.product.name_ar, item.product.name_en, item.product.name_fr || item.product.name_en, item.offer.id, item.offer.label_en, item.offer.label_fr, item.quantity, item.unit_price, item.subtotal]);

        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            order: {
                ...order,
                items: validatedItems.map(i => ({
                    product_name_ar: i.product.name_ar,
                    product_name_en: i.product.name_en,
                    product_name_fr: i.product.name_fr || i.product.name_en,
                    offer_label_en: i.offer.label_en,
                    offer_label_fr: i.offer.label_fr,
                    quantity: i.quantity,
                    unit_price: i.unit_price,
                    subtotal: i.subtotal
                })),
                payment_url: paymentLink
            }
        });
    } catch (err) {
        if (client) await client.query('ROLLBACK').catch(() => {});
        console.error('Create order error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    } finally {
        client?.release();
    }
});

// GET /api/orders - Get all orders (seller only)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = `SELECT o.*,
            (SELECT COUNT(*) FROM order_items oi
             JOIN products p ON p.id = oi.product_id
             WHERE oi.order_id = o.id AND p.seller_id = $1) as items_count
            FROM orders o
            WHERE EXISTS (
                SELECT 1 FROM order_items oi
                JOIN products p ON p.id = oi.product_id
                WHERE oi.order_id = o.id AND p.seller_id = $1
            )`;
        const params = [req.seller.id];

        if (status && status !== 'all') {
            params.push(status);
            query += ` AND o.status = $${params.length}`;
        }

        query += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        const countParams = [req.seller.id];
        let countQuery = `SELECT COUNT(*) FROM orders o
            WHERE EXISTS (
                SELECT 1 FROM order_items oi
                JOIN products p ON p.id = oi.product_id
                WHERE oi.order_id = o.id AND p.seller_id = $1
            )`;
        if (status && status !== 'all') {
            countParams.push(status);
            countQuery += ` AND o.status = $2`;
        }
        const countResult = await pool.query(countQuery, countParams);

        res.json({
            success: true,
            orders: result.rows,
            total: parseInt(countResult.rows[0].count),
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (err) {
        console.error('Get orders error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/orders/:id - Get single order with items (seller only)
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const orderResult = await pool.query(`
            SELECT o.* FROM orders o
            WHERE o.id = $1 AND EXISTS (
                SELECT 1 FROM order_items oi
                JOIN products p ON p.id = oi.product_id
                WHERE oi.order_id = o.id AND p.seller_id = $2
            )
        `, [req.params.id, req.seller.id]);

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const itemsResult = await pool.query(`
            SELECT oi.*, p.image_url FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = $1 AND p.seller_id = $2
        `, [req.params.id, req.seller.id]);

        res.json({
            success: true,
            order: orderResult.rows[0],
            items: itemsResult.rows
        });
    } catch (err) {
        console.error('Get order error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PATCH /api/orders/:id/status - Update order status (seller only)
router.patch('/:id/status', authMiddleware, async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'shipped', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    try {
        const result = await pool.query(
            `UPDATE orders o SET status = $1
             WHERE o.id = $2 AND EXISTS (
                SELECT 1 FROM order_items oi
                JOIN products p ON p.id = oi.product_id
                WHERE oi.order_id = o.id AND p.seller_id = $3
             ) RETURNING o.*`,
            [status, req.params.id, req.seller.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.json({ success: true, order: result.rows[0] });
    } catch (err) {
        console.error('Update order status error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
