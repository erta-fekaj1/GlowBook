const Review = require('../models/Review');
const Appointment = require('../models/Appointment');
const { getNextId } = require('../utils/id');
const { serializeReview } = require('../utils/serializers');

async function listReviews(req, res) {
    const rows = await Review.find({}).sort({ createdAt: -1 });
    return res.json({ ok: true, reviews: rows.map(serializeReview) });
}

async function createReview(req, res) {
    const appointmentId = Number(req.body.appointmentId || 0);
    const rating = Number(req.body.rating || 0);
    if (!appointmentId || !rating) {
        return res.status(400).json({ ok: false, error: 'appointmentId and rating are required.' });
    }
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ ok: false, error: 'Rating must be between 1 and 5.' });
    }

    const appointment = await Appointment.findOne({ id: appointmentId });
    if (!appointment) return res.status(404).json({ ok: false, error: 'Appointment not found.' });
    if (appointment.userId !== req.user.id) {
        return res.status(403).json({ ok: false, error: 'You cannot review this appointment.' });
    }
    const status = String(appointment.status || '').toLowerCase();
    if (!['done', 'confirmed'].includes(status)) {
        return res.status(400).json({ ok: false, error: 'Only completed/confirmed appointments can be reviewed.' });
    }

    const existing = await Review.findOne({ appointmentId });
    if (existing) return res.status(409).json({ ok: false, error: 'This appointment is already reviewed.' });

    const id = await getNextId(Review);
    const review = await Review.create({
        id,
        user: req.user._id,
        userId: req.user.id,
        userEmail: req.user.email,
        userName: req.user.name,
        appointment: appointment._id,
        appointmentId,
        rating,
        comment: String(req.body.comment || '').trim(),
        image: String(req.body.image || ''),
        serviceName: String(req.body.serviceName || appointment.serviceName || ''),
        dateOfAppointment: String(req.body.dateOfAppointment || appointment.date || ''),
        designName: String(req.body.designName || appointment.selectedDesignName || ''),
        isAnonymous: !!req.body.isAnonymous,
    });

    return res.status(201).json({ ok: true, review: serializeReview(review) });
}

async function removeReview(req, res) {
    const id = Number(req.params.id);
    const review = await Review.findOne({ id });
    if (!review) return res.status(404).json({ ok: false, error: 'Review not found.' });
    await review.deleteOne();
    return res.json({ ok: true });
}

module.exports = { listReviews, createReview, removeReview };
