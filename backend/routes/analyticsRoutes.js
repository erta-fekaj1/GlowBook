const express = require('express');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const { getOverview } = require('../controllers/analyticsController');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));
router.get('/overview', asyncHandler(getOverview));

module.exports = router;
