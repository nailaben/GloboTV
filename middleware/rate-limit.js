const buckets = new Map();
let lastCleanupAt = 0;

function rateLimit({ windowMs, max, keyPrefix }) {
    return (req, res, next) => {
        const now = Date.now();
        if (now - lastCleanupAt > 60_000) {
            lastCleanupAt = now;
            for (const [bucketKey, value] of buckets) {
                if (value.resetAt <= now) buckets.delete(bucketKey);
            }
        }
        const key = `${keyPrefix}:${req.ip || req.socket.remoteAddress || 'unknown'}`;
        let bucket = buckets.get(key);
        if (!bucket || bucket.resetAt <= now) {
            bucket = { count: 0, resetAt: now + windowMs };
            buckets.set(key, bucket);
        }

        bucket.count += 1;
        if (bucket.count <= max) return next();

        res.set('Retry-After', String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
        return res.status(429).json({ success: false, message: 'Too many attempts. Please wait and try again.' });
    };
}

module.exports = rateLimit;
