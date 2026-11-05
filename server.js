const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { pool, testConnection } = require('./config/db');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const sellerRouter = require('./routes/seller');
const customerRouter = require('./routes/customer');

const app = express();
const PORT = process.env.PORT || 3000;

// Render terminates HTTPS at its proxy. Trust its forwarded protocol/host so
// OAuth redirect URLs and secure-cookie handling reflect the public request.
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Product uploads can use a persistent Render disk by setting PRODUCT_UPLOAD_DIR.
const productImagesDir = process.env.PRODUCT_UPLOAD_DIR || path.join(__dirname, 'public/images/products');
if (!fs.existsSync(productImagesDir)) fs.mkdirSync(productImagesDir, { recursive: true });

// Serve static files
app.use('/images/products', express.static(productImagesDir, { maxAge: '1d' }));
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/seller', sellerRouter);
app.use('/api/customer', customerRouter);

// Health check
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ success: true, status: 'ok', database: 'connected', timestamp: new Date() });
    } catch (error) {
        console.error('Health check database failure:', error.message);
        res.status(503).json({ success: false, status: 'unavailable', database: 'disconnected', timestamp: new Date() });
    }
});

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
    const filePath = path.join(__dirname, 'public', req.path);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        res.sendFile(filePath);
    } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// Initialize the payment fields before accepting traffic, including on an
// existing Render database that predates the PayPal integration.
async function startServer() {
    await testConnection();
    await ordersRouter.ensurePaymentSchema();
    await pool.query(`CREATE TABLE IF NOT EXISTS rate_limit_buckets (bucket_key TEXT PRIMARY KEY, window_started_at TIMESTAMPTZ NOT NULL, request_count INTEGER NOT NULL)`);
    await ordersRouter.releaseExpiredOrders();

    const paymentCleanupTimer = setInterval(() => {
        ordersRouter.releaseExpiredOrders().catch(error => {
            console.error('Expired order cleanup failed:', error.message);
        });
    }, 5 * 60 * 1000);
    paymentCleanupTimer.unref();

    const rateLimitCleanupTimer = setInterval(() => {
        pool.query(`DELETE FROM rate_limit_buckets WHERE window_started_at < NOW() - INTERVAL '2 hours'`).catch(error => {
            console.error('Rate limit cleanup failed:', error.message);
        });
    }, 15 * 60 * 1000);
    rateLimitCleanupTimer.unref();

    app.listen(PORT, '0.0.0.0', () => {
    console.log(`\nGloboTV Server running on port ${PORT}`);
    console.log(`Store: http://localhost:${PORT}`);
    console.log(`Dashboard: http://localhost:${PORT}/seller/login.html`);
    console.log(`API: http://localhost:${PORT}/api/health\n`);
    });
}

startServer();
