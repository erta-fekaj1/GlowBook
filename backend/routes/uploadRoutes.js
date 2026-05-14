const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/authMiddleware');
const { reviewImageUpload } = require('../middleware/uploadMiddleware');
const { uploadReviewImage } = require('../controllers/uploadController');

const router = express.Router();

router.post(
    '/review-image',
    requireAuth,
    reviewImageUpload.single('image'),
    asyncHandler(uploadReviewImage)
);

module.exports = router;
