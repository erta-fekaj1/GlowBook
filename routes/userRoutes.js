const express = require('express');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const userController = require('../controllers/userController');

const router = express.Router();

router.use(requireAuth);
router.get('/', requireRole('admin'), asyncHandler(userController.listUsers));
router.patch('/:id', asyncHandler(userController.updateUser));
router.delete('/:id', requireRole('admin'), asyncHandler(userController.removeUser));

module.exports = router;
