const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
require('dotenv').config();

// POST /api/seller/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    try {
        const result = await pool.query('SELECT * FROM sellers WHERE username = $1', [username.trim().toLowerCase()]);
        const seller = result.rows[0];

        if (!seller) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isValid = await bcrypt.compare(password, seller.password_hash);
        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: seller.id, username: seller.username, email: seller.email, name: seller.name },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            seller: { id: seller.id, name: seller.name, username: seller.username, email: seller.email }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/seller/stats
const authMiddleware = require('../middleware/auth');
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const [productsResult, ordersResult, revenueResult, pendingResult] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM products WHERE seller_id = $1', [req.seller.id]),
            pool.query('SELECT COUNT(DISTINCT o.id) FROM orders o JOIN order_items oi ON oi.order_id=o.id JOIN products p ON p.id=oi.product_id WHERE p.seller_id=$1', [req.seller.id]),
            pool.query("SELECT COALESCE(SUM(oi.subtotal), 0) AS total FROM order_items oi JOIN orders o ON o.id=oi.order_id JOIN products p ON p.id=oi.product_id WHERE p.seller_id=$1 AND o.status != 'cancelled' AND o.currency='EUR'", [req.seller.id]),
            pool.query("SELECT COUNT(DISTINCT o.id) FROM orders o JOIN order_items oi ON oi.order_id=o.id JOIN products p ON p.id=oi.product_id WHERE p.seller_id=$1 AND o.status = 'pending'", [req.seller.id])
        ]);

        res.json({
            success: true,
            stats: {
                totalProducts: parseInt(productsResult.rows[0].count),
                totalOrders: parseInt(ordersResult.rows[0].count),
                totalRevenue: parseFloat(revenueResult.rows[0].total),
                pendingOrders: parseInt(pendingResult.rows[0].count)
            }
        });
    } catch (err) {
        console.error('Stats error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
