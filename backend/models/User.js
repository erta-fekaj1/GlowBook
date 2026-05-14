const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        id: { type: Number, unique: true, index: true },
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true },
        role: { type: String, enum: ['admin', 'client'], default: 'client' },
        phone: { type: String, default: '' },
        loyaltyPoints: { type: Number, default: 0 },
        badges: { type: [String], default: [] },
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
