const express = require('express');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const settingController = require('../controllers/settingController');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));
router.get('/admin', asyncHandler(settingController.getAdminSettings));
router.put('/admin', asyncHandler(settingController.upsertAdminSettings));

module.exports = router;
