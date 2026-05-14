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
    frontendDir: path.join(workspaceRoot, 'Frontend'),
    corsOrigin: process.env.CORS_ORIGIN || '*',
};

module.exports = env;
