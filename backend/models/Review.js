const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        id: { type: Number, unique: true, index: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        userId: { type: Number, required: true },
        userEmail: { type: String, required: true, lowercase: true },
        userName: { type: String, default: '' },

        appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true },
        appointmentId: { type: Number, required: true },

        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, default: '', trim: true },
        image: { type: String, default: '' },
        serviceName: { type: String, default: '' },
        dateOfAppointment: { type: String, default: '' },
        designName: { type: String, default: '' },
        isAnonymous: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
