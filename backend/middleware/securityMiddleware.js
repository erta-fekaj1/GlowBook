const helmet = require('helmet');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
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

function applySecurity(app) {
    app.use(helmet({
        crossOriginResourcePolicy: false,
    }));
    app.use(mongoSanitize());
    app.use(hpp());
}

module.exports = {
    applySecurity,
    apiLimiter,
    authLimiter,
};
