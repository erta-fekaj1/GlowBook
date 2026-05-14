const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const appointmentController = require('../controllers/appointmentController');

const router = express.Router();

router.use(requireAuth);
router.get('/', asyncHandler(appointmentController.listAppointments));
router.get('/availability', asyncHandler(appointmentController.getAvailability));
router.post('/', asyncHandler(appointmentController.createAppointment));
router.put('/:id', asyncHandler(appointmentController.updateAppointment));
router.delete('/:id', asyncHandler(appointmentController.removeAppointment));

module.exports = router;
