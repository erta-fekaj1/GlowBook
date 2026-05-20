const User = require('../models/User');
const Service = require('../models/Service');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const Payment = require('../models/Payment');
const Setting = require('../models/Setting');
const {
    serializeUser,
    serializeService,
    serializeAppointment,
    serializeReview,
    serializePayment,
} = require('../utils/serializers');

async function syncPayload(req, res) {
    const isAdmin = req.user.role === 'admin';
    const userQuery = isAdmin ? {} : { id: req.user.id };
    const appointmentQuery = isAdmin ? {} : { userId: req.user.id };
    const paymentQuery = isAdmin ? {} : { userId: req.user.id };

    const [users, services, appointments, reviews, payments, settings, galleryDesigns] = await Promise.all([
        User.find(userQuery).sort({ createdAt: -1 }),
        Service.find(isAdmin ? {} : { isActive: true }).sort({ name: 1 }),
        Appointment.find(appointmentQuery).sort({ startAt: -1 }),
        Review.find({}).sort({ createdAt: -1 }),
        Payment.find(paymentQuery).sort({ createdAt: -1 }),
        isAdmin ? Setting.findOne({ key: 'admin_settings' }).lean() : null,
        Setting.findOne({ key: 'gallery_designs' }).lean(),
    ]);

    return res.json({
        ok: true,
        payload: {
            me: serializeUser(req.user),
            users: users.map(serializeUser),
            services: services.map(serializeService),
            appointments: appointments.map(serializeAppointment),
            reviews: reviews.map(serializeReview),
            payments: payments.map(serializePayment),
            settings: settings?.value || {},
            designs: Array.isArray(galleryDesigns?.value) ? galleryDesigns.value : [],
        },
    });
}

module.exports = { syncPayload };
