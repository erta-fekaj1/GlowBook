const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const env = require('./config/env');
const connectDb = require('./config/db');
const runSeed = require('./config/seed');
const { notFound, onError } = require('./middleware/errorMiddleware');
const { applySecurity, apiLimiter, authLimiter } = require('./middleware/securityMiddleware');
const { ensureUploadsDirectory } = require('./middleware/uploadMiddleware');
const asyncHandler = require('./utils/asyncHandler');
const { handleStripeWebhook } = require('./controllers/paymentWebhookController');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const settingRoutes = require('./routes/settingRoutes');
const dataRoutes = require('./routes/dataRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
app.set('trust proxy', 1);

app.use(cors({
    origin: env.corsOrigin === '*' ? true : env.corsOrigin,
    credentials: true,
}));
applySecurity(app);
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), asyncHandler(handleStripeWebhook));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use('/uploads', express.static(env.uploadsDir));

app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'glowbook-api', env: env.nodeEnv });
});

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use(express.static(env.frontendDir));
app.use(express.static(path.join(env.frontendDir, 'pages')));
app.get('/', (req, res) => {
    res.sendFile(path.join(env.frontendDir, 'pages', 'index.html'));
});
app.get('/appointments.html', (req, res) => res.redirect(302, '/booking.html'));
app.get('/services.html', (req, res) => res.redirect(302, '/booking.html'));
app.get('/payment.html', (req, res) => res.redirect(302, '/booking.html'));
app.get('/users.html', (req, res) => res.redirect(302, '/admin.html#users'));
app.get('/:page.html', (req, res, next) => {
    const safeName = String(req.params.page || '').replace(/[^a-zA-Z0-9_-]/g, '');
    if (!safeName) return next();
    const filePath = path.join(env.frontendDir, 'pages', `${safeName}.html`);
    if (!fs.existsSync(filePath)) return next();
    return res.sendFile(filePath);
});

app.use(notFound);
app.use(onError);

async function bootstrap() {
    ensureUploadsDirectory();
    await connectDb();
    await runSeed();
    app.listen(env.port, () => {
        // eslint-disable-next-line no-console
        console.log(`[api] running on http://localhost:${env.port}`);
    });
}

bootstrap().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[bootstrap:error]', err);
    process.exit(1);
});
