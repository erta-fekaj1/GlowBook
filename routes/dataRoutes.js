const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const { syncPayload } = require('../controllers/dataController');

const router = express.Router();

router.get('/sync', requireAuth, asyncHandler(syncPayload));

module.exports = router;
