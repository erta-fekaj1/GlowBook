const express = require('express');
const { body } = require('express-validator');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const reviewController = require('../controllers/reviewController');

const router = express.Router();

router.get('/', asyncHandler(reviewController.listReviews));
router.post(
    '/',
    requireAuth,
    [
        body('appointmentId').isNumeric(),
        body('rating').isInt({ min: 1, max: 5 }),
        body('comment').optional().isString(),
        body('image').optional().isString(),
        body('isAnonymous').optional().isBoolean(),
        validate,
    ],
    asyncHandler(reviewController.createReview)
);
router.delete('/:id', requireAuth, requireRole('admin'), asyncHandler(reviewController.removeReview));

module.exports = router;
