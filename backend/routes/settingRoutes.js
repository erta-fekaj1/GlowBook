const express = require('express');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const settingController = require('../controllers/settingController');

const router = express.Router();

router.get('/gallery-designs', requireAuth, asyncHandler(settingController.getGalleryDesigns));
router.put('/gallery-designs', requireAuth, asyncHandler(settingController.upsertGalleryDesigns));
router.get('/admin', requireAuth, requireRole('admin'), asyncHandler(settingController.getAdminSettings));
router.put('/admin', requireAuth, requireRole('admin'), asyncHandler(settingController.upsertAdminSettings));

module.exports = router;
