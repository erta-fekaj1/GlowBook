const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
    {
        id: { type: Number, unique: true, index: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        userId: { type: Number, required: true },
        userEmail: { type: String, required: true, lowercase: true },
        userName: { type: String, default: '' },

        service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
        serviceId: { type: Number, required: true },
        serviceName: { type: String, required: true },

        date: { type: String, required: true }, // YYYY-MM-DD
        time: { type: String, required: true }, // HH:mm
        startAt: { type: Date, required: true, index: true },

        notes: { type: String, default: '', trim: true },
        status: {
            type: String,
            enum: ['Pending', 'Confirmed', 'Done', 'Cancelled'],
            default: 'Pending',
        },

        selectedDesignId: { type: Number, default: null },
        selectedDesignName: { type: String, default: null },
        selectedDesignImage: { type: String, default: null },
        selectedDesignCategory: { type: String, default: null },

        loyaltyAwarded: { type: Boolean, default: false },
    },
    { timestamps: true }
);

appointmentSchema.index({ date: 1, time: 1, status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
