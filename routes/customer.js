const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../config/db');

const router = express.Router();

function customerAuth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Sign in required' });
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (payload.type !== 'customer') throw new Error('Invalid token type');
        req.customer = payload;
        next();
    } catch {
        res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' });
    }
}

function createToken(customer) {
    return jwt.sign({ id: customer.id, email: customer.email, type: 'customer' }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

async function ensureVerificationTable() {
    await pool.query(`CREATE TABLE IF NOT EXISTS customer_email_verifications (
        email VARCHAR(255) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        code_hash CHAR(64) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
}

function verificationCodeHash(email, code) {
    return crypto.createHash('sha256').update(`${email}:${code}:${process.env.JWT_SECRET}`).digest('hex');
}

async function sendVerificationCode(email, code) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (!apiKey || !from) throw new Error('Email verification is not configured.');

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            from,
            to: [email],
            subject: 'Your GloboTV verification code',
            text: `Your GloboTV verification code is ${code}. It expires in 15 minutes.`,
            html: `<p>Your GloboTV verification code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>This code expires in 15 minutes.</p>`
        })
    });
    if (!response.ok) {
        const providerError = await response.json().catch(() => ({}));
        console.error('Email verification delivery failed:', response.status, providerError.message || providerError.name || 'provider_error');
        throw new Error('Could not send the verification email. Check the email service settings and try again.');
    }
}

function oauthRedirectUri(req) {
    const baseUrl = (process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    return `${baseUrl}/api/customer/google/callback`;
}

function cookieValue(req, key) {
    const entry = (req.headers.cookie || '').split(';').map(value => value.trim()).find(value => value.startsWith(`${key}=`));
    return entry ? decodeURIComponent(entry.slice(key.length + 1)) : '';
}

function redirectAuthError(res, reason) {
    return res.redirect(`/auth.html?error=${encodeURIComponent(reason)}`);
}

async function startOAuth(req, res) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) return redirectAuthError(res, 'google_unconfigured');

    const state = crypto.randomBytes(32).toString('hex');
    res.cookie('playora_oauth_google', state, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 10 * 60 * 1000,
        path: '/api/customer/google/callback'
    });
    const redirectUri = oauthRedirectUri(req);
    const authorizeUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authorizeUrl.search = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        state,
        scope: 'openid email profile',
        prompt: 'select_account'
    }).toString();
    res.redirect(authorizeUrl.toString());
}

async function finishOAuth(req, res) {
    const stateCookie = cookieValue(req, 'playora_oauth_google');
    res.clearCookie('playora_oauth_google', { path: '/api/customer/google/callback' });
    const state = String(req.query.state || '');
    if (!stateCookie || stateCookie.length !== state.length || !crypto.timingSafeEqual(Buffer.from(stateCookie), Buffer.from(state))) {
        return redirectAuthError(res, 'oauth_state_invalid');
    }
    if (req.query.error || !req.query.code) return redirectAuthError(res, 'oauth_cancelled');

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    try {
        const tokenUrl = 'https://oauth2.googleapis.com/token';
        const tokenParams = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code: String(req.query.code),
            redirect_uri: oauthRedirectUri(req),
            grant_type: 'authorization_code'
        });
        const tokenResponse = await fetch(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: tokenParams
        });
        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok || !tokenData.access_token) {
            console.error('Google OAuth token exchange rejected:', {
                status: tokenResponse.status,
                error: tokenData.error || 'missing_access_token',
                description: tokenData.error_description || ''
            });
            throw new Error(`OAuth token exchange failed (${tokenData.error || tokenResponse.status})`);
        }

        const profileUrl = 'https://openidconnect.googleapis.com/v1/userinfo';
        const profileResponse = await fetch(profileUrl, { headers: { Authorization: `Bearer ${tokenData.access_token}` } });
        const profile = await profileResponse.json();
        if (!profileResponse.ok || !profile.email || profile.email_verified !== true) {
            throw new Error('OAuth provider did not return a verified email');
        }

        const email = String(profile.email).trim().toLowerCase();
        const name = String(profile.name || email.split('@')[0]).trim().slice(0, 150);
        let result = await pool.query('SELECT id, name, email, phone FROM customers WHERE lower(email) = $1', [email]);
        let customer = result.rows[0];
        if (!customer) {
            const generatedPassword = await bcrypt.hash(crypto.randomBytes(48).toString('hex'), 10);
            result = await pool.query(
                'INSERT INTO customers (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, phone',
                [name, email, generatedPassword]
            );
            customer = result.rows[0];
        }
        const token = createToken(customer);
        res.redirect(`/auth.html#token=${encodeURIComponent(token)}`);
    } catch (error) {
        console.error('Google customer sign-in error:', error.message);
        redirectAuthError(res, 'oauth_failed');
    }
}

router.get('/google', startOAuth);
router.get('/google/callback', finishOAuth);

router.post('/register', async (req, res) => {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
        return res.status(400).json({ success: false, message: 'Enter a name, valid email, and password with at least 8 characters.' });
    }
    try {
        if (!process.env.JWT_SECRET) return res.status(500).json({ success: false, message: 'Account security is not configured.' });
        await ensureVerificationTable();
        const existing = await pool.query('SELECT 1 FROM customers WHERE lower(email) = $1', [email]);
        if (existing.rows.length) return res.status(409).json({ success: false, message: 'An account with this email already exists.' });

        const passwordHash = await bcrypt.hash(password, 10);
        const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
        await pool.query(
            `INSERT INTO customer_email_verifications (email, name, password_hash, code_hash, expires_at, attempts)
             VALUES ($1, $2, $3, $4, NOW() + INTERVAL '15 minutes', 0)
             ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash,
                 code_hash = EXCLUDED.code_hash, expires_at = EXCLUDED.expires_at, attempts = 0, created_at = NOW()`,
            [email, name, passwordHash, verificationCodeHash(email, code)]
        );
        await sendVerificationCode(email, code);
        res.status(200).json({ success: true, verificationRequired: true, email });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        console.error('Customer registration error:', err);
        const emailDeliveryError = /email/i.test(err.message);
        res.status(emailDeliveryError ? 503 : 500).json({ success: false, message: emailDeliveryError ? err.message : 'Could not create account.' });
    }
});

router.post('/verify-email', async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const code = String(req.body.code || '').trim();
    if (!/^\S+@\S+\.\S+$/.test(email) || !/^\d{6}$/.test(code)) {
        return res.status(400).json({ success: false, message: 'Enter the email address and 6-digit code.' });
    }
    try {
        await ensureVerificationTable();
        const result = await pool.query('SELECT * FROM customer_email_verifications WHERE email = $1', [email]);
        const pending = result.rows[0];
        if (!pending) return res.status(400).json({ success: false, message: 'No pending verification found. Please create your account again.' });
        if (new Date(pending.expires_at) <= new Date()) {
            await pool.query('DELETE FROM customer_email_verifications WHERE email = $1', [email]);
            return res.status(400).json({ success: false, message: 'The code expired. Please create your account again.' });
        }
        if (pending.attempts >= 5) return res.status(429).json({ success: false, message: 'Too many incorrect codes. Please create your account again.' });

        const expected = Buffer.from(pending.code_hash, 'hex');
        const supplied = Buffer.from(verificationCodeHash(email, code), 'hex');
        if (!crypto.timingSafeEqual(expected, supplied)) {
            await pool.query('UPDATE customer_email_verifications SET attempts = attempts + 1 WHERE email = $1', [email]);
            return res.status(400).json({ success: false, message: 'That verification code is incorrect.' });
        }

        const inserted = await pool.query(
            'INSERT INTO customers (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, phone',
            [pending.name, email, pending.password_hash]
        );
        await pool.query('DELETE FROM customer_email_verifications WHERE email = $1', [email]);
        const customer = inserted.rows[0];
        return res.status(201).json({ success: true, token: createToken(customer), customer });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        console.error('Customer email verification error:', err);
        return res.status(500).json({ success: false, message: 'Could not verify the email address.' });
    }
});

router.post('/resend-verification', async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
    try {
        await ensureVerificationTable();
        const result = await pool.query(
            `SELECT email FROM customer_email_verifications
             WHERE email = $1 AND created_at <= NOW() - INTERVAL '60 seconds'`,
            [email]
        );
        if (!result.rows[0]) return res.status(429).json({ success: false, message: 'Wait one minute before requesting another code.' });
        const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
        await pool.query(
            `UPDATE customer_email_verifications SET code_hash = $2, expires_at = NOW() + INTERVAL '15 minutes',
             attempts = 0, created_at = NOW() WHERE email = $1`,
            [email, verificationCodeHash(email, code)]
        );
        await sendVerificationCode(email, code);
        return res.json({ success: true, message: 'A new verification code was sent.' });
    } catch (err) {
        console.error('Resend customer verification code error:', err);
        return res.status(500).json({ success: false, message: 'Could not resend the verification code.' });
    }
});

router.post('/login', async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    try {
        const result = await pool.query('SELECT * FROM customers WHERE lower(email) = $1', [email]);
        const customer = result.rows[0];
        if (!customer || !(await bcrypt.compare(password, customer.password_hash))) {
            return res.status(401).json({ success: false, message: 'Email or password is incorrect.' });
        }
        const safeCustomer = { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone };
        res.json({ success: true, token: createToken(safeCustomer), customer: safeCustomer });
    } catch (err) {
        console.error('Customer login error:', err);
        res.status(500).json({ success: false, message: 'Could not sign in.' });
    }
});

router.get('/me', customerAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email, phone, created_at FROM customers WHERE id = $1', [req.customer.id]);
        if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Account not found.' });
        res.json({ success: true, customer: result.rows[0] });
    } catch (err) {
        console.error('Customer profile error:', err);
        res.status(500).json({ success: false, message: 'Could not load account.' });
    }
});

router.put('/me', customerAuth, async (req, res) => {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const phone = String(req.body.phone || '').trim();

    if (name.length < 2 || name.length > 150 || !/^\S+@\S+\.\S+$/.test(email) ||
        !/^[\d+()\-\s]{7,30}$/.test(phone) || phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15) {
        return res.status(400).json({ success: false, message: 'Enter a valid name, email, and international phone number.' });
    }

    try {
        const result = await pool.query(
            'UPDATE customers SET name = $1, email = $2, phone = $3 WHERE id = $4 RETURNING id, name, email, phone, created_at',
            [name, email, phone, req.customer.id]
        );
        if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Account not found.' });
        res.json({ success: true, customer: result.rows[0] });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        console.error('Customer profile update error:', err);
        res.status(500).json({ success: false, message: 'Could not save account changes.' });
    }
});

router.get('/orders', customerAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, order_number, total_amount, status, created_at FROM orders WHERE customer_id = $1 ORDER BY created_at DESC',
            [req.customer.id]
        );
        res.json({ success: true, orders: result.rows });
    } catch (err) {
        console.error('Customer orders error:', err);
        res.status(500).json({ success: false, message: 'Could not load orders.' });
    }
});

module.exports = router;
