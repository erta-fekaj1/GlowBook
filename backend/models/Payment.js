const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
    {
        id: { type: Number, unique: true, index: true },
        txId: { type: String, required: true, trim: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        userId: { type: Number, required: true },
        userEmail: { type: String, required: true, lowercase: true },
        userName: { type: String, default: '' },

        appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
        appointmentId: { type: Number, required: true },

        serviceId: { type: Number, required: true },
        serviceName: { type: String, required: true },
        selectedDesignName: { type: String, default: null },
        amount: { type: Number, required: true, min: 0 },
        currency: { type: String, default: 'eur' },
        method: { type: String, required: true },
        status: { type: String, default: 'Paid' },
        provider: { type: String, default: 'manual' },
        stripeSessionId: { type: String, default: null, index: true },
        stripePaymentIntentId: { type: String, default: null, index: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
