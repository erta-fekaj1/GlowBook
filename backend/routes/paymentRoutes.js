const express = require('express');
const { body } = require('express-validator');
const { requireAuth } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

router.use(requireAuth);
router.get('/', asyncHandler(paymentController.listPayments));
router.post(
    '/',
    [
        body('appointmentId').isNumeric(),
        body('amount').isNumeric(),
        body('method').optional().isString(),
        body('status').optional().isString(),
        validate,
    ],
    asyncHandler(paymentController.createPayment)
);
router.post(
    '/checkout-session',
    [
        body('appointmentId').isNumeric(),
        body('amount').optional().isNumeric(),
        body('currency').optional().isString(),
        body('successUrl').optional().isString(),
        body('cancelUrl').optional().isString(),
        validate,
    ],
    asyncHandler(paymentController.createCheckoutSession)
);

module.exports = router;
