const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(process.cwd(), '.env') });

const env = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 3000),
    mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/glowbook',
    jwtSecret: process.env.JWT_SECRET || 'dev-glowbook-secret-change-me',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    frontendDir: path.join(process.cwd(), 'Frontend'),
    corsOrigin: process.env.CORS_ORIGIN || '*',
};

module.exports = env;
