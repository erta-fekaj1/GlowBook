const path = require('path');

async function uploadReviewImage(req, res) {
    if (!req.file) {
        return res.status(400).json({ ok: false, error: 'No file uploaded.' });
    }

    const filename = path.basename(req.file.filename);
    return res.status(201).json({
        ok: true,
        file: {
            filename,
            url: `/uploads/${filename}`,
            size: req.file.size,
            mimeType: req.file.mimetype,
        },
    });
}

module.exports = { uploadReviewImage };
