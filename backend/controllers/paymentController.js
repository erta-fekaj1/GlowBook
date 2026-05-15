const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const User = require('../models/User');
const { getNextId } = require('../utils/id');
const { serializePayment } = require('../utils/serializers');
const env = require('../config/env');
const stripeService = require('../services/stripeService');
const notificationService = require('../services/notificationService');

function buildTxId() {
    return `#GB-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

async function getAppointmentForActor({ actor, appointmentId }) {
    const appointment = await Appointment.findOne({ id: appointmentId });
    if (!appointment) return { ok: false, code: 404, error: 'Appointment not found.' };
    if (actor.role !== 'admin' && appointment.userId !== actor.id) {
        return { ok: false, code: 403, error: 'Not allowed to access payment for this appointment.' };
    }
    return { ok: true, appointment };
}

async function listPayments(req, res) {
    const query = req.user.role === 'admin' ? {} : { userId: req.user.id };
    const rows = await Payment.find(query).sort({ createdAt: -1 });
    return res.json({ ok: true, payments: rows.map(serializePayment) });
}

async function createPayment(req, res) {
    const appointmentId = Number(req.body.appointmentId || 0);
    const appt = await getAppointmentForActor({ actor: req.user, appointmentId });
    if (!appt.ok) {
        return res.status(appt.code).json({ ok: false, error: appt.error });
    }
    const appointment = appt.appointment;

    const id = await getNextId(Payment);
    const payment = await Payment.create({
        id,
        txId: String(req.body.txId || buildTxId()),
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
        currency: String(req.body.currency || 'eur').toLowerCase(),
        method: String(req.body.method || 'Card'),
        status: String(req.body.status || 'Paid'),
        provider: String(req.body.provider || 'manual'),
    });
    if (payment.status.toLowerCase() === 'paid') {
        if (appointment.status === 'Pending') {
            appointment.status = 'Confirmed';
            await appointment.save();
        }
        const user = await User.findOne({ id: appointment.userId }).lean();
        notificationService.sendPaymentReceipt({
            payment,
            appointment,
            user: {
                name: user?.name || appointment.userName,
                email: user?.email || appointment.userEmail,
                phone: user?.phone || '',
            },
        }).catch((err) => {
            // eslint-disable-next-line no-console
            console.warn('[payment:notify:warn]', err?.message || err);
        });
    }
    return res.status(201).json({ ok: true, payment: serializePayment(payment) });
}

async function createCheckoutSession(req, res) {
    if (!stripeService.hasStripe()) {
        return res.status(503).json({ ok: false, error: 'Stripe is not configured on this environment.' });
    }

    const appointmentId = Number(req.body.appointmentId || 0);
    const appt = await getAppointmentForActor({ actor: req.user, appointmentId });
    if (!appt.ok) {
        return res.status(appt.code).json({ ok: false, error: appt.error });
    }
    const appointment = appt.appointment;
    const service = await Service.findOne({ id: appointment.serviceId }).lean();
    const amount = Number(req.body.amount || service?.price || 0);
    if (!(amount > 0)) return res.status(400).json({ ok: false, error: 'Amount must be greater than zero.' });

    const id = await getNextId(Payment);
    const payment = await Payment.create({
        id,
        txId: buildTxId(),
        user: req.user._id,
        userId: req.user.id,
        userEmail: req.user.email,
        userName: req.user.name,
        appointment: appointment._id,
        appointmentId: appointment.id,
        serviceId: appointment.serviceId,
        serviceName: appointment.serviceName,
        selectedDesignName: appointment.selectedDesignName ?? null,
        amount,
        currency: String(req.body.currency || 'eur').toLowerCase(),
        method: 'Card',
        status: 'Pending',
        provider: 'stripe',
    });

    let session;
    try {
        session = await stripeService.createCheckoutSession({
            payment,
            appointment,
            user: req.user,
            successUrl: req.body.successUrl || env.stripeSuccessUrl || '',
            cancelUrl: req.body.cancelUrl || env.stripeCancelUrl || '',
        });
    } catch (err) {
        await payment.deleteOne();
        return res.status(502).json({ ok: false, error: err.message || 'Stripe checkout failed.' });
    }

    payment.stripeSessionId = session.id;
    await payment.save();

    return res.status(201).json({
        ok: true,
        checkoutUrl: session.url,
        sessionId: session.id,
        payment: serializePayment(payment),
    });
}

async function markPaymentCompleted({ paymentId, stripeSessionId = null, stripePaymentIntentId = null }) {
    let payment = null;
    if (paymentId) payment = await Payment.findOne({ id: Number(paymentId) });
    if (!payment && stripeSessionId) payment = await Payment.findOne({ stripeSessionId });
    if (!payment) return null;

    payment.status = 'Paid';
    if (stripeSessionId) payment.stripeSessionId = stripeSessionId;
    if (stripePaymentIntentId) payment.stripePaymentIntentId = stripePaymentIntentId;
    if (!payment.txId || payment.txId.startsWith('#GB-')) {
        payment.txId = stripePaymentIntentId || payment.txId || buildTxId();
    }
    await payment.save();

    const appointment = await Appointment.findOne({ id: payment.appointmentId });
    if (appointment && appointment.status === 'Pending') {
        appointment.status = 'Confirmed';
        await appointment.save();
    }

    const user = await User.findOne({ id: payment.userId }).lean();
    if (appointment && user) {
        notificationService.sendPaymentReceipt({
            payment,
            appointment,
            user: {
                name: user.name,
                email: user.email,
                phone: user.phone || '',
            },
        }).catch((err) => {
            // eslint-disable-next-line no-console
            console.warn('[payment:notify:warn]', err?.message || err);
        });
    }

    return payment;
}

module.exports = {
    listPayments,
    createPayment,
    createCheckoutSession,
    markPaymentCompleted,
};
