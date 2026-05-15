const helmet = require('helmet');
const hpp = require('hpp');
const { rateLimit } = require('express-rate-limit');
const env = require('../config/env');

const apiLimiter = rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.authRateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: 'Too many auth attempts. Please try again later.' },
});

function sanitizeObjectInPlace(value) {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
        value.forEach((item) => sanitizeObjectInPlace(item));
        return;
    }
    for (const key of Object.keys(value)) {
        const unsafeKey = key.includes('$') || key.includes('.');
        if (unsafeKey) {
            delete value[key];
            continue;
        }
        sanitizeObjectInPlace(value[key]);
    }
}

function noSqlSanitizeMiddleware(req, res, next) { // eslint-disable-line no-unused-vars
    sanitizeObjectInPlace(req.body);
    sanitizeObjectInPlace(req.params);
    sanitizeObjectInPlace(req.query);
    next();
}

function applySecurity(app) {
    app.use(helmet({
        crossOriginResourcePolicy: false,
    }));
    app.use(noSqlSanitizeMiddleware);
    app.use(hpp());
}

module.exports = {
    applySecurity,
    apiLimiter,
    authLimiter,
};
