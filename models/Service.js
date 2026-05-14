const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
    {
        id: { type: Number, unique: true, index: true },
        name: { type: String, required: true, trim: true },
        desc: { type: String, default: '', trim: true },
        price: { type: Number, required: true, min: 0 },
        duration: { type: Number, default: 60, min: 5 },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);
