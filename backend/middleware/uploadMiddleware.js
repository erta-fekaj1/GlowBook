const fs = require('fs');
const path = require('path');
const multer = require('multer');
const env = require('../config/env');

function ensureUploadsDirectory() {
    if (!fs.existsSync(env.uploadsDir)) {
        fs.mkdirSync(env.uploadsDir, { recursive: true });
    }
}

function reviewImagePath(filename) {
    return path.join(env.uploadsDir, filename);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        ensureUploadsDirectory();
        cb(null, env.uploadsDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
        const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
        cb(null, `review-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
    },
});

function fileFilter(req, file, cb) {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed.'));
    }
    return cb(null, true);
}

const reviewImageUpload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: env.maxUploadSizeMb * 1024 * 1024,
    },
});

module.exports = {
    ensureUploadsDirectory,
    reviewImagePath,
    reviewImageUpload,
};
