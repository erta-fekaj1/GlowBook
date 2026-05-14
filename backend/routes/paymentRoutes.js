const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

router.use(requireAuth);
router.get('/', asyncHandler(paymentController.listPayments));
router.post('/', asyncHandler(paymentController.createPayment));

module.exports = router;
