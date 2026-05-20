const twilio = require('twilio');
const env = require('../config/env');

let twilioClient = null;

function hasSmsProvider() {
    return !!(env.twilioAccountSid && env.twilioAuthToken && env.twilioPhoneNumber);
}

function getTwilioClient() {
    if (!hasSmsProvider()) return null;
    if (!twilioClient) {
        twilioClient = twilio(env.twilioAccountSid, env.twilioAuthToken);
    }
    return twilioClient;
}

async function sendSms({ to, body }) {
    const client = getTwilioClient();
    if (!client || !to) {
        return { ok: false, skipped: true, reason: 'SMS provider is not configured.' };
    }
    await client.messages.create({
        to,
        from: env.twilioPhoneNumber,
        body,
    });
    return { ok: true };
}

module.exports = { sendSms, hasSmsProvider };
