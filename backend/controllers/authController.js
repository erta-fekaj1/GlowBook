const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');
const { getNextId } = require('../utils/id');
const { serializeUser } = require('../utils/serializers');

function signToken(user) {
    return jwt.sign(
        { sub: String(user._id), role: user.role, userId: user.id, email: user.email },
        env.jwtSecret,
        { expiresIn: env.jwtExpiresIn }
    );
}

function setAuthCookie(res, token) {
    res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.nodeEnv === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7,
    });
}

async function register(req, res) {
    const { name, email, password, phone = '' } = req.body;
    const normalized = String(email).trim().toLowerCase();

    const exists = await User.findOne({ email: normalized }).lean();
    if (exists) return res.status(409).json({ ok: false, error: 'Email is already registered.' });

    const id = await getNextId(User);
    const hash = await bcrypt.hash(String(password), 10);
    const user = await User.create({
        id,
        name: String(name).trim(),
        email: normalized,
        password: hash,
        phone: String(phone || '').trim(),
        role: 'client',
    });

    const token = signToken(user);
    setAuthCookie(res, token);
    return res.status(201).json({ ok: true, token, user: serializeUser(user), role: user.role });
}

async function login(req, res) {
    const normalized = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await User.findOne({ email: normalized });
    if (!user) return res.status(401).json({ ok: false, error: 'Invalid email or password.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ ok: false, error: 'Invalid email or password.' });

    const token = signToken(user);
    setAuthCookie(res, token);
    return res.json({ ok: true, token, user: serializeUser(user), role: user.role });
}

async function me(req, res) {
    return res.json({ ok: true, user: serializeUser(req.user), role: req.user.role });
}

async function logout(req, res) {
    res.clearCookie('token');
    return res.json({ ok: true });
}

module.exports = { register, login, me, logout };
