const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { testConnection } = require('./config/db');
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
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'GloboTV API is running 🚀', timestamp: new Date() });
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
    try {
        await ordersRouter.ensurePaymentSchema();
        await ordersRouter.releaseExpiredOrders();
    } catch (error) {
        console.error('Order payment schema initialization failed:', error.message);
    }

    const paymentCleanupTimer = setInterval(() => {
        ordersRouter.releaseExpiredOrders().catch(error => {
            console.error('Expired order cleanup failed:', error.message);
        });
    }, 5 * 60 * 1000);
    paymentCleanupTimer.unref();

    app.listen(PORT, '0.0.0.0', () => {
    console.log(`\nGloboTV Server running on port ${PORT}`);
    console.log(`Store: http://localhost:${PORT}`);
    console.log(`Dashboard: http://localhost:${PORT}/seller/login.html`);
    console.log(`API: http://localhost:${PORT}/api/health\n`);
    });
}

startServer();
