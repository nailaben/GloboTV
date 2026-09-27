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

function oauthRedirectUri(req, provider) {
    const baseUrl = (process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    return `${baseUrl}/api/customer/${provider}/callback`;
}

function cookieValue(req, key) {
    const entry = (req.headers.cookie || '').split(';').map(value => value.trim()).find(value => value.startsWith(`${key}=`));
    return entry ? decodeURIComponent(entry.slice(key.length + 1)) : '';
}

function redirectAuthError(res, reason) {
    return res.redirect(`/auth.html?error=${encodeURIComponent(reason)}`);
}

async function startOAuth(req, res, provider) {
    const google = provider === 'google';
    const clientId = google ? process.env.GOOGLE_CLIENT_ID : process.env.FACEBOOK_APP_ID;
    const clientSecret = google ? process.env.GOOGLE_CLIENT_SECRET : process.env.FACEBOOK_APP_SECRET;
    if (!clientId || !clientSecret) return redirectAuthError(res, `${provider}_unconfigured`);

    const state = crypto.randomBytes(32).toString('hex');
    res.cookie(`playora_oauth_${provider}`, state, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 10 * 60 * 1000,
        path: `/api/customer/${provider}/callback`
    });
    const redirectUri = oauthRedirectUri(req, provider);
    const graphVersion = process.env.FACEBOOK_GRAPH_VERSION || 'v22.0';
    const authorizeUrl = google
        ? new URL('https://accounts.google.com/o/oauth2/v2/auth')
        : new URL(`https://www.facebook.com/${graphVersion}/dialog/oauth`);
    authorizeUrl.search = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        state,
        scope: google ? 'openid email profile' : 'email,public_profile',
        ...(google ? { prompt: 'select_account' } : {})
    }).toString();
    res.redirect(authorizeUrl.toString());
}

async function finishOAuth(req, res, provider) {
    const stateCookie = cookieValue(req, `playora_oauth_${provider}`);
    res.clearCookie(`playora_oauth_${provider}`, { path: `/api/customer/${provider}/callback` });
    const state = String(req.query.state || '');
    if (!stateCookie || stateCookie.length !== state.length || !crypto.timingSafeEqual(Buffer.from(stateCookie), Buffer.from(state))) {
        return redirectAuthError(res, 'oauth_state_invalid');
    }
    if (req.query.error || !req.query.code) return redirectAuthError(res, 'oauth_cancelled');

    const google = provider === 'google';
    const clientId = google ? process.env.GOOGLE_CLIENT_ID : process.env.FACEBOOK_APP_ID;
    const clientSecret = google ? process.env.GOOGLE_CLIENT_SECRET : process.env.FACEBOOK_APP_SECRET;
    try {
        const graphVersion = process.env.FACEBOOK_GRAPH_VERSION || 'v22.0';
        const tokenUrl = google ? 'https://oauth2.googleapis.com/token' : `https://graph.facebook.com/${graphVersion}/oauth/access_token`;
        const tokenParams = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code: String(req.query.code),
            redirect_uri: oauthRedirectUri(req, provider),
            ...(google ? { grant_type: 'authorization_code' } : {})
        });
        const tokenResponse = google
            ? await fetch(tokenUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: tokenParams
            })
            : await fetch(`${tokenUrl}?${tokenParams.toString()}`);
        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok || !tokenData.access_token) throw new Error('OAuth token exchange failed');

        const profileUrl = google
            ? 'https://openidconnect.googleapis.com/v1/userinfo'
            : `https://graph.facebook.com/${graphVersion}/me?fields=id,name,email`;
        const profileResponse = await fetch(profileUrl, { headers: { Authorization: `Bearer ${tokenData.access_token}` } });
        const profile = await profileResponse.json();
        if (!profileResponse.ok || !profile.email || (google && profile.email_verified !== true)) {
            throw new Error('OAuth provider did not return a verified email');
        }

        const email = String(profile.email).trim().toLowerCase();
        const name = String(profile.name || email.split('@')[0]).trim().slice(0, 150);
        let result = await pool.query('SELECT id, name, email, phone, address FROM customers WHERE lower(email) = $1', [email]);
        let customer = result.rows[0];
        if (!customer) {
            const generatedPassword = await bcrypt.hash(crypto.randomBytes(48).toString('hex'), 10);
            result = await pool.query(
                'INSERT INTO customers (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, phone, address',
                [name, email, generatedPassword]
            );
            customer = result.rows[0];
        }
        const token = createToken(customer);
        res.redirect(`/auth.html#token=${encodeURIComponent(token)}`);
    } catch (error) {
        console.error(`${provider} customer sign-in error:`, error.message);
        redirectAuthError(res, 'oauth_failed');
    }
}

router.get('/google', (req, res) => startOAuth(req, res, 'google'));
router.get('/google/callback', (req, res) => finishOAuth(req, res, 'google'));
router.get('/facebook', (req, res) => startOAuth(req, res, 'facebook'));
router.get('/facebook/callback', (req, res) => finishOAuth(req, res, 'facebook'));

router.post('/register', async (req, res) => {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
        return res.status(400).json({ success: false, message: 'Enter a name, valid email, and password with at least 8 characters.' });
    }
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO customers (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, phone, address',
            [name, email, passwordHash]
        );
        const customer = result.rows[0];
        res.status(201).json({ success: true, token: createToken(customer), customer });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        console.error('Customer registration error:', err);
        res.status(500).json({ success: false, message: 'Could not create account.' });
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
        const safeCustomer = { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone, address: customer.address };
        res.json({ success: true, token: createToken(safeCustomer), customer: safeCustomer });
    } catch (err) {
        console.error('Customer login error:', err);
        res.status(500).json({ success: false, message: 'Could not sign in.' });
    }
});

router.get('/me', customerAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email, phone, address, created_at FROM customers WHERE id = $1', [req.customer.id]);
        if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Account not found.' });
        res.json({ success: true, customer: result.rows[0] });
    } catch (err) {
        console.error('Customer profile error:', err);
        res.status(500).json({ success: false, message: 'Could not load account.' });
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
