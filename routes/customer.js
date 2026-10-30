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

async function ensureCheckoutVerificationTable() {
    await pool.query(`CREATE TABLE IF NOT EXISTS customer_checkout_verifications (
        id UUID PRIMARY KEY,
        customer_id INTEGER NOT NULL UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(16) NOT NULL,
        email_code_hash CHAR(64) NOT NULL,
        whatsapp_code_hash CHAR(64) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        verified_at TIMESTAMPTZ,
        consumed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
}

function verificationCodeHash(email, code) {
    return crypto.createHash('sha256').update(`${email}:${code}:${process.env.JWT_SECRET}`).digest('hex');
}

function checkoutCodeHash(customerId, channel, code, verificationId) {
    return crypto.createHash('sha256')
        .update(`${customerId}:${channel}:${code}:${verificationId}:${process.env.JWT_SECRET}`)
        .digest('hex');
}

function hashesMatch(expectedHex, suppliedHex) {
    const expected = Buffer.from(expectedHex || '', 'hex');
    const supplied = Buffer.from(suppliedHex || '', 'hex');
    return expected.length === supplied.length && expected.length > 0 && crypto.timingSafeEqual(expected, supplied);
}

async function sendCheckoutWhatsAppCode(phone, code) {
    const { WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN, WHATSAPP_TEMPLATE_NAME, WHATSAPP_API_VERSION } = process.env;
    const languageCode = process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en_US';
    if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN || !WHATSAPP_TEMPLATE_NAME || !WHATSAPP_API_VERSION) {
        throw new Error('WhatsApp verification is not configured.');
    }
    if (!/^v\d+\.\d+$/.test(WHATSAPP_API_VERSION)) throw new Error('WhatsApp API version is invalid.');

    const response = await fetch(`https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phone.slice(1),
            type: 'template',
            template: {
                name: WHATSAPP_TEMPLATE_NAME,
                language: { code: languageCode },
                components: [
                    { type: 'body', parameters: [{ type: 'text', text: code }] },
                    // Meta represents the OTP copy-code button as a URL subtype in send payloads.
                    { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: code }] }
                ]
            }
        })
    });
    if (!response.ok) {
        const providerError = await response.json().catch(() => ({}));
        console.error('WhatsApp verification delivery failed:', response.status, providerError.error?.code || 'provider_error');
        throw new Error('Could not send the WhatsApp verification code. Check the WhatsApp template and service settings.');
    }
}

async function sendVerificationCode(email, code) {
    const apiKey = process.env.MAILJET_API_KEY;
    const secretKey = process.env.MAILJET_SECRET_KEY;
    const from = process.env.EMAIL_FROM;
    if (!apiKey || !secretKey || !from) throw new Error('Mailjet email verification is not configured.');

    const senderMatch = String(from).trim().match(/^(.*?)\s*<([^<>]+)>$/);
    const senderName = senderMatch ? senderMatch[1].trim().replace(/^['"]|['"]$/g, '') : 'GloboTV';
    const senderEmail = senderMatch ? senderMatch[2].trim() : String(from).trim();
    if (!/^\S+@\S+\.\S+$/.test(senderEmail)) throw new Error('The Mailjet sender address is invalid.');

    const response = await fetch('https://api.mailjet.com/v3.1/send', {
        method: 'POST',
        headers: {
            Authorization: `Basic ${Buffer.from(`${apiKey}:${secretKey}`).toString('base64')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            Messages: [{
                From: { Email: senderEmail, Name: senderName || 'GloboTV' },
                To: [{ Email: email }],
                Subject: 'Your GloboTV verification code',
                TextPart: `Your GloboTV verification code is ${code}. It expires in 15 minutes.`,
                HTMLPart: `<p>Your GloboTV verification code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>This code expires in 15 minutes.</p>`
            }]
        })
    });
    const result = await response.json().catch(() => ({}));
    const messageStatus = result.Messages?.[0]?.Status;
    if (!response.ok || messageStatus !== 'success') {
        const errorCode = result.Messages?.[0]?.Errors?.[0]?.ErrorCode || result.ErrorIdentifier || 'provider_error';
        console.error('Mailjet verification delivery failed:', response.status, errorCode);
        throw new Error('Could not send the verification email. Check the Mailjet API keys and verified sender address.');
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

router.post('/checkout/send-codes', customerAuth, async (req, res) => {
    const phone = String(req.body.phone || '').trim();
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
        return res.status(400).json({ success: false, message: 'Enter a valid international phone number including its country code.' });
    }
    if (!process.env.JWT_SECRET) return res.status(503).json({ success: false, message: 'Account security is not configured.' });

    let client;
    let email;
    try {
        await ensureCheckoutVerificationTable();
        const customerResult = await pool.query('SELECT id, email FROM customers WHERE id = $1', [req.customer.id]);
        const customer = customerResult.rows[0];
        if (!customer) return res.status(404).json({ success: false, message: 'Account not found. Please sign in again.' });
        email = String(customer.email).trim().toLowerCase();
        if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ success: false, message: 'Add a valid email address to your account first.' });

        const id = crypto.randomUUID();
        const emailCode = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
        const whatsappCode = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
        client = await pool.connect();
        await client.query('BEGIN');
        await client.query('SELECT pg_advisory_xact_lock($1)', [Number(customer.id)]);
        const previous = await client.query(
            'SELECT last_sent_at FROM customer_checkout_verifications WHERE customer_id = $1 FOR UPDATE',
            [customer.id]
        );
        if (previous.rows[0] && new Date(previous.rows[0].last_sent_at).getTime() > Date.now() - 60_000) {
            await client.query('ROLLBACK');
            return res.status(429).json({ success: false, message: 'Wait one minute before requesting new codes.' });
        }
        await client.query(
            `INSERT INTO customer_checkout_verifications
                (id, customer_id, email, phone, email_code_hash, whatsapp_code_hash, expires_at, attempts, last_sent_at, verified_at, consumed_at, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '15 minutes', 0, NOW(), NULL, NULL, NOW())
             ON CONFLICT (customer_id) DO UPDATE SET id = EXCLUDED.id, email = EXCLUDED.email, phone = EXCLUDED.phone,
                email_code_hash = EXCLUDED.email_code_hash, whatsapp_code_hash = EXCLUDED.whatsapp_code_hash,
                expires_at = EXCLUDED.expires_at, attempts = 0, last_sent_at = NOW(), verified_at = NULL,
                consumed_at = NULL, created_at = NOW()`,
            [id, customer.id, email, phone, checkoutCodeHash(customer.id, 'email', emailCode, id), checkoutCodeHash(customer.id, 'whatsapp', whatsappCode, id)]
        );
        await client.query('COMMIT');
        client.release();
        client = null;

        const deliveries = await Promise.allSettled([
            sendVerificationCode(email, emailCode),
            sendCheckoutWhatsAppCode(phone, whatsappCode)
        ]);
        if (deliveries.some(result => result.status === 'rejected')) {
            await pool.query('DELETE FROM customer_checkout_verifications WHERE id = $1', [id]);
            const failed = deliveries.find(result => result.status === 'rejected');
            const error = failed.reason;
            const notConfigured = /not configured|version is invalid/i.test(error.message || '');
            return res.status(notConfigured ? 503 : 502).json({ success: false, message: error.message || 'Could not send both verification codes. Check the email and WhatsApp service settings.' });
        }
        return res.json({ success: true, message: 'Verification codes sent. They expire in 15 minutes.', expiresIn: 900 });
    } catch (err) {
        if (client) await client.query('ROLLBACK').catch(() => {});
        console.error('Checkout verification send error:', err.message);
        const serviceError = /email verification|WhatsApp verification|Could not send/i.test(err.message || '');
        return res.status(serviceError ? 503 : 500).json({ success: false, message: serviceError ? err.message : 'Could not send verification codes.' });
    } finally {
        client?.release();
    }
});

router.post('/checkout/verify-codes', customerAuth, async (req, res) => {
    const phone = String(req.body.phone || '').trim();
    const emailCode = String(req.body.emailCode || '').trim();
    const whatsappCode = String(req.body.whatsappCode || '').trim();
    if (!/^\+[1-9]\d{7,14}$/.test(phone) || !/^\d{6}$/.test(emailCode) || !/^\d{6}$/.test(whatsappCode)) {
        return res.status(400).json({ success: false, message: 'Enter the phone number and both 6-digit verification codes.' });
    }
    if (!process.env.JWT_SECRET) return res.status(503).json({ success: false, message: 'Account security is not configured.' });

    let client;
    try {
        await ensureCheckoutVerificationTable();
        client = await pool.connect();
        await client.query('BEGIN');
        const result = await client.query(
            `SELECT v.*, c.email AS current_email FROM customer_checkout_verifications v
             JOIN customers c ON c.id = v.customer_id WHERE v.customer_id = $1 FOR UPDATE OF v`,
            [req.customer.id]
        );
        const pending = result.rows[0];
        if (!pending || pending.phone !== phone || pending.email !== String(pending.current_email).toLowerCase()) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'No matching verification request. Request new codes and try again.' });
        }
        if (pending.consumed_at || pending.verified_at) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'These codes have already been used. Request new codes to continue.' });
        }
        if (new Date(pending.expires_at) <= new Date()) {
            await client.query('DELETE FROM customer_checkout_verifications WHERE customer_id = $1', [req.customer.id]);
            await client.query('COMMIT');
            return res.status(400).json({ success: false, message: 'The codes expired. Request new codes.' });
        }
        if (pending.attempts >= 5) {
            await client.query('ROLLBACK');
            return res.status(429).json({ success: false, message: 'Too many incorrect attempts. Request new codes after one minute.' });
        }
        const emailMatches = hashesMatch(pending.email_code_hash, checkoutCodeHash(req.customer.id, 'email', emailCode, pending.id));
        const whatsappMatches = hashesMatch(pending.whatsapp_code_hash, checkoutCodeHash(req.customer.id, 'whatsapp', whatsappCode, pending.id));
        if (!emailMatches || !whatsappMatches) {
            await client.query('UPDATE customer_checkout_verifications SET attempts = attempts + 1 WHERE customer_id = $1', [req.customer.id]);
            await client.query('COMMIT');
            return res.status(400).json({ success: false, message: 'One or both verification codes are incorrect.' });
        }

        await client.query('UPDATE customer_checkout_verifications SET verified_at = NOW() WHERE customer_id = $1', [req.customer.id]);
        await client.query('COMMIT');
        const token = jwt.sign({
            type: 'checkout_verification',
            id: req.customer.id,
            email: pending.email,
            phone,
            verificationId: pending.id
        }, process.env.JWT_SECRET, { expiresIn: '15m' });
        return res.json({ success: true, token, message: 'Email and WhatsApp verified.' });
    } catch (err) {
        if (client) await client.query('ROLLBACK').catch(() => {});
        console.error('Checkout code verification error:', err.message);
        return res.status(500).json({ success: false, message: 'Could not verify the codes.' });
    } finally {
        client?.release();
    }
});

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
