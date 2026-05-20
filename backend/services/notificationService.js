const { sendEmail } = require('./emailService');
const { sendSms } = require('./smsService');

function fmtAppointment(appointment) {
    return `${appointment.serviceName} on ${appointment.date} at ${appointment.time}`;
}

async function sendAppointmentCreated({ appointment, user }) {
    const subject = 'GlowBook: Appointment Confirmed';
    const text = `Hi ${user.name || 'Client'}, your appointment is booked: ${fmtAppointment(appointment)}.`;
    const tasks = [
        sendEmail({ to: user.email, subject, text }),
        sendSms({ to: user.phone, body: text }),
    ];
    return Promise.allSettled(tasks);
}

async function sendAppointmentUpdated({ appointment, user, previousStatus }) {
    const subject = 'GlowBook: Appointment Updated';
    const text = `Hi ${user.name || 'Client'}, your appointment was updated (${fmtAppointment(appointment)}). Status: ${previousStatus || 'N/A'} -> ${appointment.status}.`;
    const tasks = [
        sendEmail({ to: user.email, subject, text }),
        sendSms({ to: user.phone, body: text }),
    ];
    return Promise.allSettled(tasks);
}

async function sendPaymentReceipt({ payment, appointment, user }) {
    const amount = Number(payment.amount || 0).toFixed(2);
    const subject = 'GlowBook: Payment Receipt';
    const text = `Hi ${user.name || 'Client'}, your payment of ${amount} ${String(payment.currency || 'eur').toUpperCase()} was received for ${fmtAppointment(appointment)}.`;
    const tasks = [
        sendEmail({ to: user.email, subject, text }),
        sendSms({ to: user.phone, body: text }),
    ];
    return Promise.allSettled(tasks);
}

async function sendAppointmentReminder({ appointment, user }) {
    const subject = 'GlowBook: Appointment Reminder';
    const text = `Hi ${user.name || 'Client'}, reminder for your upcoming appointment: ${fmtAppointment(appointment)}.`;
    const tasks = [
        sendEmail({ to: user.email, subject, text }),
        sendSms({ to: user.phone, body: text }),
    ];
    return Promise.allSettled(tasks);
}

module.exports = {
    sendAppointmentCreated,
    sendAppointmentUpdated,
    sendPaymentReceipt,
    sendAppointmentReminder,
};
