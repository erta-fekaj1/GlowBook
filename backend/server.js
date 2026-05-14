const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const env = require('./config/env');
const connectDb = require('./config/db');
const runSeed = require('./config/seed');
const { notFound, onError } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const settingRoutes = require('./routes/settingRoutes');
const dataRoutes = require('./routes/dataRoutes');

const app = express();

app.use(cors({
    origin: env.corsOrigin === '*' ? true : env.corsOrigin,
    credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'glowbook-api', env: env.nodeEnv });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/data', dataRoutes);

app.use(express.static(env.frontendDir));
app.use(express.static(path.join(env.frontendDir, 'pages')));
app.get('/', (req, res) => {
    res.sendFile(path.join(env.frontendDir, 'pages', 'index.html'));
});

app.use(notFound);
app.use(onError);

async function bootstrap() {
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
