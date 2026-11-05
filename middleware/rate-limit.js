const { pool } = require('../config/db');

function rateLimit({ windowMs, max, keyPrefix }) {
    return async (req, res, next) => {
        try {
            const key = `${keyPrefix}:${req.ip || req.socket.remoteAddress || 'unknown'}`;
            const result = await pool.query(`
                INSERT INTO rate_limit_buckets (bucket_key, window_started_at, request_count)
                VALUES ($1, NOW(), 1)
                ON CONFLICT (bucket_key) DO UPDATE SET
                    window_started_at = CASE WHEN rate_limit_buckets.window_started_at <= NOW() - ($2 * INTERVAL '1 millisecond') THEN NOW() ELSE rate_limit_buckets.window_started_at END,
                    request_count = CASE WHEN rate_limit_buckets.window_started_at <= NOW() - ($2 * INTERVAL '1 millisecond') THEN 1 ELSE rate_limit_buckets.request_count + 1 END
                RETURNING request_count, GREATEST(1, CEIL(EXTRACT(EPOCH FROM (window_started_at + ($2 * INTERVAL '1 millisecond') - NOW()))))::INTEGER AS retry_after
            `, [key, windowMs]);
            const bucket = result.rows[0];
            if (bucket.request_count <= max) return next();
            res.set('Retry-After', String(bucket.retry_after));
            return res.status(429).json({ success: false, message: 'Too many attempts. Please wait and try again.' });
        } catch (error) {
            return next(error);
        }
    };
}

module.exports = rateLimit;
