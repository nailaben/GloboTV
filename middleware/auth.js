const jwt = require('jsonwebtoken');
const { readCookie } = require('./session-cookies');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
    const token = readCookie(req, 'globotv_seller_session');

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'seller' || !decoded.id) {
            return res.status(403).json({ success: false, message: 'Seller access required' });
        }
        req.seller = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
};

module.exports = authMiddleware;
