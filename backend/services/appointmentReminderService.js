const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { sendAppointmentReminder } = require('./notificationService');

let reminderIntervalRef = null;
let isSweepInProgress = false;

function normalizeHours(rawHours) {
    const parsed = Number(rawHours);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 24;
}

async function runReminderSweep({ lookaheadHours = 24 } = {}) {
    if (isSweepInProgress) {
        return { skipped: true, reason: 'sweep_in_progress', scanned: 0, sent: 0 };
    }

    isSweepInProgress = true;
    try {
        const now = new Date();
        const hours = normalizeHours(lookaheadHours);
        const deadline = new Date(now.getTime() + hours * 60 * 60 * 1000);

        const upcomingAppointments = await Appointment.find({
            status: { $in: ['Pending', 'Confirmed'] },
            startAt: { $gte: now, $lte: deadline },
            reminderSentAt: null,
        })
            .sort({ startAt: 1 })
            .limit(200);

        let sent = 0;
        for (const appointment of upcomingAppointments) {
            const user = await User.findOne({ id: appointment.userId }).lean();
            if (!user) continue;

            await sendAppointmentReminder({ appointment, user });
            appointment.reminderSentAt = new Date();
            await appointment.save();
            sent += 1;
        }

        return { skipped: false, scanned: upcomingAppointments.length, sent };
    } finally {
        isSweepInProgress = false;
    }
}

function startReminderScheduler({ enabled, intervalMinutes = 30, lookaheadHours = 24 } = {}) {
    if (!enabled || reminderIntervalRef) return false;

    const everyMs = Math.max(1, Number(intervalMinutes) || 30) * 60 * 1000;
    const run = async () => {
        try {
            await runReminderSweep({ lookaheadHours });
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('[reminder:sweep:error]', err.message);
        }
    };

    reminderIntervalRef = setInterval(run, everyMs);
    run();
    return true;
}

function stopReminderScheduler() {
    if (!reminderIntervalRef) return false;
    clearInterval(reminderIntervalRef);
    reminderIntervalRef = null;
    return true;
}

module.exports = {
    runReminderSweep,
    startReminderScheduler,
    stopReminderScheduler,
};
