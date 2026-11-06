const isProduction = process.env.NODE_ENV === 'production';

function readCookie(req, name) {
    const pair = (req.headers.cookie || '').split(';').map(value => value.trim()).find(value => value.startsWith(`${name}=`));
    if (!pair) return '';
    try { return decodeURIComponent(pair.slice(name.length + 1)); }
    catch { return ''; }
}

function setSessionCookie(req, res, name, token, maxAge) {
    res.cookie(name, token, {
        httpOnly: true,
        secure: isProduction || Boolean(req.secure),
        sameSite: 'lax',
        path: '/',
        maxAge
    });
}

function clearSessionCookie(req, res, name) {
    res.clearCookie(name, {
        httpOnly: true,
        secure: isProduction || Boolean(req.secure),
        sameSite: 'lax',
        path: '/'
    });
}

module.exports = { readCookie, setSessionCookie, clearSessionCookie };
