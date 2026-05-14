const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validateMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');

const router = express.Router();

router.post(
    '/register',
    [
        body('name').isString().trim().isLength({ min: 2 }),
        body('email').isEmail(),
        body('password').isString().isLength({ min: 4 }),
        body('phone').optional().isString(),
        validate,
    ],
    asyncHandler(authController.register)
);

router.post(
    '/login',
    [
        body('email').isEmail(),
        body('password').isString().isLength({ min: 1 }),
        validate,
    ],
    asyncHandler(authController.login)
);

router.get('/me', requireAuth, asyncHandler(authController.me));
router.post('/logout', requireAuth, asyncHandler(authController.logout));

module.exports = router;
