const express = require('express');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const reviewController = require('../controllers/reviewController');

const router = express.Router();

router.get('/', asyncHandler(reviewController.listReviews));
router.post('/', requireAuth, asyncHandler(reviewController.createReview));
router.delete('/:id', requireAuth, requireRole('admin'), asyncHandler(reviewController.removeReview));

module.exports = router;
