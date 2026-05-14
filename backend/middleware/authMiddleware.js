const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');

function extractToken(req) {
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) return authHeader.slice(7);
    if (req.cookies?.token) return req.cookies.token;
    return null;
}

async function requireAuth(req, res, next) {
    const token = extractToken(req);
    if (!token) {
        return res.status(401).json({ ok: false, error: 'Authentication required.' });
    }

    try {
        const payload = jwt.verify(token, env.jwtSecret);
        const user = await User.findById(payload.sub).lean();
        if (!user) return res.status(401).json({ ok: false, error: 'Invalid session.' });
        req.user = user;
        req.token = token;
        return next();
    } catch (err) {
        return res.status(401).json({ ok: false, error: 'Session expired or invalid.' });
    }
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ ok: false, error: 'Authentication required.' });
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ ok: false, error: 'You do not have permission for this action.' });
        }
        return next();
    };
}

module.exports = { requireAuth, requireRole };
