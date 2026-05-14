const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Service = require('../models/Service');
const Setting = require('../models/Setting');
const { getNextId } = require('../utils/id');

const DEFAULT_SERVICES = [
    { name: 'Classic Manicure', price: 15, duration: 45, desc: 'Classic nail treatment with polish.' },
    { name: 'Gel Polish', price: 20, duration: 60, desc: 'Long-lasting gel polish up to 3 weeks.' },
    { name: 'Acrylic Full Set', price: 35, duration: 90, desc: 'Full acrylic nail extension set.' },
    { name: 'Classic Pedicure', price: 18, duration: 45, desc: 'Relaxing pedicure treatment.' },
    { name: 'Nail Art', price: 25, duration: 60, desc: 'Custom hand-drawn design.' },
];

async function ensureAdminUser() {
    const adminEmail = 'admin@glowbook.com';
    const exists = await User.findOne({ email: adminEmail });
    if (exists) return;
    const id = await getNextId(User);
    const password = await bcrypt.hash('admin123', 10);
    await User.create({
        id,
        name: 'Admin GlowBook',
        email: adminEmail,
        phone: '044000000',
        password,
        role: 'admin',
        loyaltyPoints: 0,
        badges: [],
    });
}

async function ensureServices() {
    const count = await Service.countDocuments();
    if (count > 0) return;
    let next = await getNextId(Service);
    const payload = DEFAULT_SERVICES.map((s) => ({ ...s, id: next++ }));
    await Service.insertMany(payload);
}

async function ensureSettings() {
    const current = await Setting.findOne({ key: 'admin_settings' });
    if (current) return;
    await Setting.create({
        key: 'admin_settings',
        value: {
            businessName: 'GlowBook Studio',
            supportEmail: 'hello@glowbook.com',
            phone: '+383 44 123 456',
            address: 'Prishtinë, Kosovë',
            openHour: '09:00',
            closeHour: '18:00',
            notes: '',
        },
    });
}

async function runSeed() {
    await ensureAdminUser();
    await ensureServices();
    await ensureSettings();
}

module.exports = runSeed;
