const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const { getNextId } = require('../utils/id');
const { serializePayment } = require('../utils/serializers');

async function listPayments(req, res) {
    const query = req.user.role === 'admin' ? {} : { userId: req.user.id };
    const rows = await Payment.find(query).sort({ createdAt: -1 });
    return res.json({ ok: true, payments: rows.map(serializePayment) });
}

async function createPayment(req, res) {
    const appointmentId = Number(req.body.appointmentId || 0);
    const appointment = await Appointment.findOne({ id: appointmentId });
    if (!appointment) return res.status(404).json({ ok: false, error: 'Appointment not found.' });
    if (req.user.role !== 'admin' && appointment.userId !== req.user.id) {
        return res.status(403).json({ ok: false, error: 'Not allowed to create payment for this appointment.' });
    }

    const id = await getNextId(Payment);
    const payment = await Payment.create({
        id,
        txId: String(req.body.txId || `#GB-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`),
        user: req.user._id,
        userId: req.user.id,
        userEmail: req.user.email,
        userName: req.user.name,
        appointment: appointment._id,
        appointmentId: appointment.id,
        serviceId: appointment.serviceId,
        serviceName: appointment.serviceName,
        selectedDesignName: req.body.selectedDesignName ?? appointment.selectedDesignName ?? null,
        amount: Number(req.body.amount || 0),
        method: String(req.body.method || 'Card'),
        status: String(req.body.status || 'Paid'),
    });
    return res.status(201).json({ ok: true, payment: serializePayment(payment) });
}

module.exports = { listPayments, createPayment };
