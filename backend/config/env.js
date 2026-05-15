const path = require('path');
const dotenv = require('dotenv');

const backendRoot = path.resolve(__dirname, '..');
const workspaceRoot = path.resolve(backendRoot, '..');

dotenv.config({ path: path.join(backendRoot, '.env') });

const env = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 3000),
    mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/glowbook',
    jwtSecret: process.env.JWT_SECRET || 'dev-glowbook-secret-change-me',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    backendDir: backendRoot,
    frontendDir: path.join(workspaceRoot, 'Frontend'),
    frontendBaseUrl: process.env.FRONTEND_BASE_URL || 'http://localhost:3000',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    uploadsDir: path.join(backendRoot, 'uploads'),
    maxUploadSizeMb: Number(process.env.MAX_UPLOAD_MB || 5),
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX || 500),
    authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX || 25),
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    stripeSuccessUrl: process.env.STRIPE_SUCCESS_URL || '',
    stripeCancelUrl: process.env.STRIPE_CANCEL_URL || '',
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: Number(process.env.SMTP_PORT || 587),
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    smtpFrom: process.env.SMTP_FROM || '',
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
};

module.exports = env;
