const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const authMiddleware = require('../middleware/auth');
const jwt = require('jsonwebtoken');

let paymentSchemaPromise;
function ensurePaymentSchema() {
    if (!paymentSchemaPromise) {
        paymentSchemaPromise = pool.query(`
            ALTER TABLE orders
                ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(30),
                ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) NOT NULL DEFAULT 'unpaid',
                ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255),
                ADD COLUMN IF NOT EXISTS payment_capture_id VARCHAR(255),
                ADD COLUMN IF NOT EXISTS stock_reserved BOOLEAN NOT NULL DEFAULT FALSE,
                ADD COLUMN IF NOT EXISTS stock_released_at TIMESTAMPTZ,
                ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ
        `).catch(error => {
            paymentSchemaPromise = null;
            throw error;
        });
    }
    return paymentSchemaPromise;
}

async function releaseReservedStock(client, order) {
    if (!order.stock_reserved) return;
    const items = await client.query(`
        SELECT product_id, SUM(quantity)::INTEGER AS quantity
        FROM order_items WHERE order_id = $1 AND product_id IS NOT NULL
        GROUP BY product_id
    `, [order.id]);
    for (const item of items.rows) {
        await client.query('UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2', [item.quantity, item.product_id]);
    }
    await client.query(`UPDATE orders SET stock_reserved = FALSE, stock_released_at = NOW() WHERE id = $1`, [order.id]);
}

async function expireStalePaypalOrders(client) {
    const stale = await client.query(`
        SELECT * FROM orders
        WHERE payment_provider IN ('paypal', 'oneclick') AND payment_status = 'pending'
            AND stock_reserved = TRUE AND created_at < NOW() - INTERVAL '30 minutes'
        FOR UPDATE SKIP LOCKED
    `);
    for (const order of stale.rows) {
        await releaseReservedStock(client, order);
        await client.query(`
            UPDATE orders SET payment_status = 'expired', status = 'cancelled', updated_at = NOW()
            WHERE id = $1 AND payment_status = 'pending'
        `, [order.id]);
    }
}

async function releaseExpiredOrders() {
    await ensurePaymentSchema();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await expireStalePaypalOrders(client);
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
    } finally {
        client.release();
    }
}

const paypalBaseUrl = () => process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

function getPublicBaseUrl(req) {
    const configured = process.env.PUBLIC_BASE_URL;
    if (configured) {
        try {
            const url = new URL(configured);
            const isLocal = ['localhost', '127.0.0.1'].includes(url.hostname);
            if ((!isLocal && url.protocol === 'https:') || process.env.NODE_ENV !== 'production') {
                return url.origin;
            }
        } catch { /* Fall back to the current request origin. */ }
    }
    return `${req.protocol}://${req.get('host')}`;
}

async function paypalRequest(path, options = {}) {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new Error('PayPal credentials are not configured.');

    const tokenResponse = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) throw new Error('Could not authenticate with PayPal.');

    const response = await fetch(`${paypalBaseUrl()}${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'PayPal request failed.');
    return data;
}

// Generate unique order number
const generateOrderNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PLY-${timestamp}-${random}`;
};

// POST /api/orders - Create new order (public)
router.post('/', async (req, res) => {
    const { customer_name, customer_phone, customer_email, notes, items, payment_provider, checkoutVerificationToken } = req.body;

    if (!customer_name || !customer_phone || !customer_email || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'All required fields must be provided' });
    }
    if (payment_provider !== 'paypal') {
        return res.status(400).json({ success: false, message: 'PayPal is the supported payment provider.' });
    }

    let customerSession;
    let checkoutVerification;
    try {
        const bearer = req.headers.authorization?.split(' ')[1];
        customerSession = jwt.verify(bearer || '', process.env.JWT_SECRET);
        checkoutVerification = jwt.verify(String(checkoutVerificationToken || ''), process.env.JWT_SECRET);
        const normalizedPhone = String(customer_phone).replace(/\s/g, '');
        if (customerSession.type !== 'customer' || checkoutVerification.type !== 'checkout_verification' ||
            String(customerSession.id) !== String(checkoutVerification.id) ||
            String(customer_email).trim().toLowerCase() !== String(checkoutVerification.email).toLowerCase() ||
            normalizedPhone !== checkoutVerification.phone || !checkoutVerification.verificationId) {
            throw new Error('Checkout verification does not match the order.');
        }
    } catch {
        return res.status(403).json({ success: false, message: 'Verify your email before placing the order.' });
    }

    let client;
    try {
        await ensurePaymentSchema();
        client = await pool.connect();
        await client.query('BEGIN');
        await expireStalePaypalOrders(client);

        const verification = await client.query(
            `SELECT id FROM customer_checkout_verifications
             WHERE id = $1 AND customer_id = $2 AND email = $3 AND phone = $4
                AND email_verified_at IS NOT NULL AND verified_at IS NOT NULL AND consumed_at IS NULL AND expires_at > NOW()
             FOR UPDATE`,
            [checkoutVerification.verificationId, customerSession.id, checkoutVerification.email, checkoutVerification.phone]
        );
        if (!verification.rows[0]) {
            await client.query('ROLLBACK');
            return res.status(403).json({ success: false, message: 'Your email verification expired or was already used. Verify your email again.' });
        }
        await client.query('UPDATE customer_checkout_verifications SET consumed_at = NOW() WHERE id = $1', [checkoutVerification.verificationId]);

        // Validate products and calculate total
        let subtotalCents = 0;
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
            const unitPriceCents = Math.round(Number(offer.price_eur) * 100);
            const itemSubtotal = (unitPriceCents * quantity) / 100;
            subtotalCents += unitPriceCents * quantity;

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
                unit_price: unitPriceCents / 100,
                subtotal: itemSubtotal
            });
        }

        const subtotal = subtotalCents / 100;
        const total_amount = subtotal;
        const order_number = generateOrderNumber();

        let paymentLink = null;
        if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
            await client.query('ROLLBACK');
            return res.status(503).json({ success: false, message: 'PayPal is not configured yet. Add the PayPal API credentials to the server environment.' });
        }

        // Create order
        const customerId = customerSession.id;

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

        const baseUrl = getPublicBaseUrl(req);
        const paypalOrder = await paypalRequest('/v2/checkout/orders', {
            method: 'POST',
            headers: { 'PayPal-Request-Id': order_number },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [{
                    reference_id: order_number,
                    custom_id: order_number,
                    description: `GloboTV order ${order_number}`,
                    amount: { currency_code: 'EUR', value: subtotal.toFixed(2) }
                }],
                payment_source: {
                    paypal: {
                        experience_context: {
                            brand_name: 'GloboTV',
                            user_action: 'PAY_NOW',
                            shipping_preference: 'NO_SHIPPING',
                            return_url: `${baseUrl}/api/orders/paypal/return`,
                            cancel_url: `${baseUrl}/api/orders/paypal/cancel`
                        }
                    }
                }
            })
        });
        paymentLink = paypalOrder.links?.find(link => link.rel === 'payer-action' || link.rel === 'approve')?.href || null;
        if (!paypalOrder.id || !paymentLink) throw new Error('PayPal did not return an approval link.');
        await client.query(`
            UPDATE orders SET payment_provider = 'paypal', payment_status = 'pending',
                payment_reference = $1, stock_reserved = TRUE WHERE id = $2
        `, [paypalOrder.id, order.id]);

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

// PayPal returns here after the buyer approves. Verify the order against our
// database, capture it on the server, and only then mark the local order paid.
router.get('/paypal/return', async (req, res) => {
    const paypalOrderId = String(req.query.token || '');
    if (!paypalOrderId) return res.redirect('/checkout.html?payment=error');

    try {
        await ensurePaymentSchema();
        const paypalOrder = await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`);
        const purchase = paypalOrder.purchase_units?.[0];
        if (!['APPROVED', 'COMPLETED'].includes(paypalOrder.status) || !purchase?.custom_id) {
            return res.redirect('/checkout.html?payment=not-approved');
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const orderResult = await client.query('SELECT * FROM orders WHERE order_number = $1 FOR UPDATE', [purchase.custom_id]);
            const order = orderResult.rows[0];
            if (!order || order.payment_provider !== 'paypal' || order.payment_reference !== paypalOrderId ||
                purchase.amount?.currency_code !== order.currency || Number(purchase.amount?.value) !== Number(order.total_amount)) {
                await client.query('ROLLBACK');
                return res.redirect('/checkout.html?payment=verification-error');
            }

            if (order.payment_status === 'paid' && order.payment_capture_id) {
                await client.query('COMMIT');
                return res.redirect('/order-success.html?payment=paypal');
            }
            if (order.payment_status !== 'pending' || !order.stock_reserved) {
                await client.query('ROLLBACK');
                return res.redirect('/checkout.html?payment=verification-error');
            }

            const capture = paypalOrder.status === 'COMPLETED'
                ? paypalOrder
                : await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, { method: 'POST', body: '{}' });
            const capturedPurchase = capture.purchase_units?.[0];
            const captureInfo = capturedPurchase?.payments?.captures?.[0];
            if (capture.status !== 'COMPLETED' || captureInfo?.status !== 'COMPLETED' ||
                capturedPurchase?.custom_id !== order.order_number ||
                captureInfo?.amount?.currency_code !== order.currency ||
                Number(captureInfo?.amount?.value) !== Number(order.total_amount)) {
                await client.query('ROLLBACK');
                return res.redirect('/checkout.html?payment=capture-error');
            }

            await client.query(`
                UPDATE orders SET payment_status = 'paid', payment_capture_id = $1,
                    paid_at = NOW(), stock_reserved = FALSE, status = 'confirmed', updated_at = NOW()
                WHERE id = $2
            `, [captureInfo.id || null, order.id]);
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK').catch(() => {});
            throw error;
        } finally {
            client.release();
        }
        return res.redirect('/order-success.html?payment=paypal');
    } catch (error) {
        console.error('PayPal return error:', error);
        return res.redirect('/checkout.html?payment=error');
    }
});

router.get('/paypal/cancel', async (req, res) => {
    const paypalOrderId = String(req.query.token || '');
    if (!paypalOrderId) return res.redirect('/checkout.html?payment=cancelled');
    let client;
    try {
        await ensurePaymentSchema();
        client = await pool.connect();
        await client.query('BEGIN');
        const result = await client.query(`
            SELECT * FROM orders WHERE payment_provider = 'paypal' AND payment_reference = $1 FOR UPDATE
        `, [paypalOrderId]);
        const order = result.rows[0];
        if (order?.payment_status === 'pending') {
            await releaseReservedStock(client, order);
            await client.query(`
                UPDATE orders SET payment_status = 'cancelled', status = 'cancelled', updated_at = NOW()
                WHERE id = $1 AND payment_status = 'pending'
            `, [order.id]);
        }
        await client.query('COMMIT');
    } catch (error) {
        if (client) await client.query('ROLLBACK').catch(() => {});
        console.error('PayPal cancellation error:', error.message);
    } finally {
        client?.release();
    }
    return res.redirect('/checkout.html?payment=cancelled');
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

    let client;
    try {
        await ensurePaymentSchema();
        client = await pool.connect();
        await client.query('BEGIN');
        const selected = await client.query(`
            SELECT o.* FROM orders o
            WHERE o.id = $1 AND EXISTS (
                SELECT 1 FROM order_items oi JOIN products p ON p.id = oi.product_id
                WHERE oi.order_id = o.id AND p.seller_id = $2
            ) FOR UPDATE
        `, [req.params.id, req.seller.id]);
        const order = selected.rows[0];
        if (!order) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        if (status === 'cancelled' && order.payment_status === 'pending' && order.stock_reserved) {
            await releaseReservedStock(client, order);
            await client.query(`UPDATE orders SET payment_status = 'cancelled' WHERE id = $1`, [order.id]);
        }
        const updated = await client.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [status, order.id]);
        await client.query('COMMIT');
        res.json({ success: true, order: updated.rows[0] });
    } catch (err) {
        if (client) await client.query('ROLLBACK').catch(() => {});
        console.error('Update order status error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    } finally {
        client?.release();
    }
});

module.exports = router;
module.exports.ensurePaymentSchema = ensurePaymentSchema;
module.exports.releaseExpiredOrders = releaseExpiredOrders;
