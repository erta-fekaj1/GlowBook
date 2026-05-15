const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

function hasEmailProvider() {
    return !!(env.smtpHost && env.smtpPort && env.smtpFrom);
}

function getTransporter() {
    if (!hasEmailProvider()) return null;
    if (transporter) return transporter;
    transporter = nodemailer.createTransport({
        host: env.smtpHost,
        port: env.smtpPort,
        secure: Number(env.smtpPort) === 465,
        auth: env.smtpUser && env.smtpPass
            ? {
                user: env.smtpUser,
                pass: env.smtpPass,
            }
            : undefined,
    });
    return transporter;
}

async function sendEmail({ to, subject, text, html = '' }) {
    const tx = getTransporter();
    if (!tx) {
        return { ok: false, skipped: true, reason: 'Email provider is not configured.' };
    }
    await tx.sendMail({
        from: env.smtpFrom,
        to,
        subject,
        text,
        html: html || undefined,
    });
    return { ok: true };
}

module.exports = { sendEmail, hasEmailProvider };
