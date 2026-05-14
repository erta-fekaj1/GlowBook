const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const { awardPointsToUser } = require('../utils/loyalty');
const { getNextId } = require('../utils/id');
const { serializeAppointment } = require('../utils/serializers');

const WORKDAY_SLOTS = Array.from({ length: 9 }, (_, i) => `${String(i + 9).padStart(2, '0')}:00`);

function normalizeDateTime({ date, time }) {
    if (date && time) {
        return { day: String(date).slice(0, 10), slot: String(time).slice(0, 5) };
    }

    const raw = String(date || '');
    const match = raw.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
    if (match) return { day: match[1], slot: match[2] };
    return { day: '', slot: '' };
}

async function slotTaken(day, slot, excludeId = null) {
    if (!day || !slot) return false;
    const query = {
        date: day,
        time: slot,
        status: { $ne: 'Cancelled' },
    };
    if (excludeId != null) query.id = { $ne: Number(excludeId) };
    const existing = await Appointment.findOne(query).lean();
    return !!existing;
}

async function maybeAwardLoyalty(appointment, previousStatus = '') {
    const becameDone = String(previousStatus) !== 'Done' && appointment.status === 'Done';
    if (!becameDone || appointment.loyaltyAwarded) return;
    await awardPointsToUser(appointment.user, 20);
    appointment.loyaltyAwarded = true;
    await appointment.save();
}

async function listAppointments(req, res) {
    const query = req.user.role === 'admin' ? {} : { userId: req.user.id };
    const rows = await Appointment.find(query).sort({ startAt: -1 });
    return res.json({ ok: true, appointments: rows.map(serializeAppointment) });
}

async function getAvailability(req, res) {
    const day = String(req.query.date || '').slice(0, 10);
    if (!day) return res.status(400).json({ ok: false, error: 'date query is required (YYYY-MM-DD).' });
    const rows = await Appointment.find({ date: day, status: { $ne: 'Cancelled' } }).lean();
    const bookedSlots = rows.map((r) => r.time).filter(Boolean);
    const freeCount = Math.max(0, WORKDAY_SLOTS.length - bookedSlots.length);
    return res.json({
        ok: true,
        slots: WORKDAY_SLOTS,
        bookedSlots,
        bookedCount: bookedSlots.length,
        freeCount,
        isFull: freeCount === 0,
    });
}

async function createAppointment(req, res) {
    const { day, slot } = normalizeDateTime({ date: req.body.date, time: req.body.time });
    if (!day || !slot) return res.status(400).json({ ok: false, error: 'Date and time are required.' });
    if (await slotTaken(day, slot)) {
        return res.status(409).json({ ok: false, error: 'This time slot is already booked.' });
    }

    const serviceId = Number(req.body.serviceId || 0);
    const service = await Service.findOne({ id: serviceId, isActive: true });
    if (!service) return res.status(404).json({ ok: false, error: 'Service not found.' });

    const id = await getNextId(Appointment);
    const requestedStatus = String(req.body.status || 'Pending');
    const allowedStatus = ['Pending', 'Confirmed', 'Done', 'Cancelled'].includes(requestedStatus)
        ? requestedStatus
        : 'Pending';

    const appointment = await Appointment.create({
        id,
        user: req.user._id,
        userId: req.user.id,
        userEmail: req.user.email,
        userName: req.user.name,
        service: service._id,
        serviceId: service.id,
        serviceName: service.name,
        date: day,
        time: slot,
        startAt: new Date(`${day}T${slot}:00`),
        notes: String(req.body.notes || '').trim(),
        status: req.user.role === 'admin' ? allowedStatus : allowedStatus,
        selectedDesignId: req.body.selectedDesignId ?? null,
        selectedDesignName: req.body.selectedDesignName ?? null,
        selectedDesignImage: req.body.selectedDesignImage ?? null,
        selectedDesignCategory: req.body.selectedDesignCategory ?? null,
    });

    await maybeAwardLoyalty(appointment, '');
    return res.status(201).json({ ok: true, appointment: serializeAppointment(appointment) });
}

async function updateAppointment(req, res) {
    const appointment = await Appointment.findOne({ id: Number(req.params.id) });
    if (!appointment) return res.status(404).json({ ok: false, error: 'Appointment not found.' });

    const isOwner = req.user.id === appointment.userId;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ ok: false, error: 'Not allowed.' });

    const previousStatus = appointment.status;
    const { day, slot } = normalizeDateTime({
        date: req.body.date ?? appointment.date,
        time: req.body.time ?? appointment.time,
    });
    if (!day || !slot) return res.status(400).json({ ok: false, error: 'Date and time are required.' });

    if ((day !== appointment.date || slot !== appointment.time) && await slotTaken(day, slot, appointment.id)) {
        return res.status(409).json({ ok: false, error: 'This time slot is already booked.' });
    }

    if (isAdmin) {
        if (typeof req.body.status === 'string' && ['Pending', 'Confirmed', 'Done', 'Cancelled'].includes(req.body.status)) {
            appointment.status = req.body.status;
        }
    } else if (typeof req.body.status === 'string' && req.body.status === 'Cancelled') {
        appointment.status = 'Cancelled';
    }

    if (typeof req.body.notes === 'string') appointment.notes = req.body.notes.trim();
    appointment.date = day;
    appointment.time = slot;
    appointment.startAt = new Date(`${day}T${slot}:00`);

    await appointment.save();
    await maybeAwardLoyalty(appointment, previousStatus);
    return res.json({ ok: true, appointment: serializeAppointment(appointment) });
}

async function removeAppointment(req, res) {
    const appointment = await Appointment.findOne({ id: Number(req.params.id) });
    if (!appointment) return res.status(404).json({ ok: false, error: 'Appointment not found.' });
    const isOwner = req.user.id === appointment.userId;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ ok: false, error: 'Not allowed.' });
    await appointment.deleteOne();
    return res.json({ ok: true });
}

module.exports = {
    listAppointments,
    getAvailability,
    createAppointment,
    updateAppointment,
    removeAppointment,
};
