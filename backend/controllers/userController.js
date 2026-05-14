const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { serializeUser } = require('../utils/serializers');

async function listUsers(req, res) {
    const users = await User.find({}).sort({ createdAt: -1 });
    return res.json({ ok: true, users: users.map(serializeUser) });
}

async function updateUser(req, res) {
    const targetId = Number(req.params.id);
    const target = await User.findOne({ id: targetId });
    if (!target) return res.status(404).json({ ok: false, error: 'User not found.' });

    const isSelf = req.user.id === target.id;
    const isAdmin = req.user.role === 'admin';
    if (!isSelf && !isAdmin) return res.status(403).json({ ok: false, error: 'Not allowed.' });

    const payload = {};
    if (typeof req.body.name === 'string') payload.name = req.body.name.trim();
    if (typeof req.body.phone === 'string') payload.phone = req.body.phone.trim();
    if (typeof req.body.email === 'string' && isAdmin) payload.email = req.body.email.trim().toLowerCase();
    if (typeof req.body.role === 'string' && isAdmin) payload.role = req.body.role.toLowerCase() === 'admin' ? 'admin' : 'client';
    if (typeof req.body.loyaltyPoints !== 'undefined' && isAdmin) payload.loyaltyPoints = Number(req.body.loyaltyPoints || 0);
    if (Array.isArray(req.body.badges) && isAdmin) payload.badges = req.body.badges.map((x) => String(x));
    if (typeof req.body.password === 'string' && req.body.password.trim()) {
        payload.password = await bcrypt.hash(req.body.password.trim(), 10);
    }

    Object.assign(target, payload);
    await target.save();
    return res.json({ ok: true, user: serializeUser(target) });
}

async function removeUser(req, res) {
    const targetId = Number(req.params.id);
    if (req.user.id === targetId) return res.status(400).json({ ok: false, error: 'You cannot delete your own account.' });
    const deleted = await User.findOneAndDelete({ id: targetId });
    if (!deleted) return res.status(404).json({ ok: false, error: 'User not found.' });
    return res.json({ ok: true });
}

module.exports = { listUsers, updateUser, removeUser };
