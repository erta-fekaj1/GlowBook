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
    corsOrigin: process.env.CORS_ORIGIN || '*',
    uploadsDir: path.join(backendRoot, 'uploads'),
    maxUploadSizeMb: Number(process.env.MAX_UPLOAD_MB || 5),
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX || 500),
    authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX || 25),
};

module.exports = env;
