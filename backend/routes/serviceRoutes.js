const express = require('express');
const { body } = require('express-validator');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const serviceController = require('../controllers/serviceController');

const router = express.Router();

router.get('/', asyncHandler(serviceController.listServices));
router.post(
    '/',
    requireAuth,
    requireRole('admin'),
    [
        body('name').isString().trim().isLength({ min: 2 }),
        body('price').isNumeric(),
        body('duration').optional().isNumeric(),
        body('desc').optional().isString(),
        validate,
    ],
    asyncHandler(serviceController.createService)
);
router.put('/:id', requireAuth, requireRole('admin'), asyncHandler(serviceController.updateService));
router.delete('/:id', requireAuth, requireRole('admin'), asyncHandler(serviceController.removeService));

module.exports = router;
