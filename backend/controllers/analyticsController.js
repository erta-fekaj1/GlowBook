const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const Review = require('../models/Review');

function isPaid(payment) {
    return ['paid', 'succeeded', 'completed'].includes(String(payment.status || '').toLowerCase());
}

function withinMonth(date, year, month) {
    if (!date) return false;
    const d = new Date(date);
    return d.getFullYear() === year && d.getMonth() === month;
}

async function getOverview(req, res) {
    const [appointments, payments, reviews] = await Promise.all([
        Appointment.find({}).lean(),
        Payment.find({}).lean(),
        Review.find({}).lean(),
    ]);

    const totalAppointments = appointments.length;
    const doneCount = appointments.filter((a) => String(a.status || '').toLowerCase() === 'done').length;
    const cancelledCount = appointments.filter((a) => String(a.status || '').toLowerCase() === 'cancelled').length;
    const completionRate = totalAppointments ? (doneCount / totalAppointments) * 100 : 0;
    const cancellationRate = totalAppointments ? (cancelledCount / totalAppointments) * 100 : 0;

    const paidPayments = payments.filter(isPaid);
    const totalRevenue = paidPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const now = new Date();
    const monthlyRevenue = paidPayments
        .filter((p) => withinMonth(p.createdAt, now.getFullYear(), now.getMonth()))
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const avgRating = reviews.length
        ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length
        : 0;

    const serviceMap = new Map();
    for (const appt of appointments) {
        const key = String(appt.serviceName || 'Unknown');
        if (!serviceMap.has(key)) {
            serviceMap.set(key, { serviceName: key, bookings: 0, revenue: 0 });
        }
        const row = serviceMap.get(key);
        row.bookings += 1;
    }
    for (const payment of paidPayments) {
        const key = String(payment.serviceName || 'Unknown');
        if (!serviceMap.has(key)) {
            serviceMap.set(key, { serviceName: key, bookings: 0, revenue: 0 });
        }
        const row = serviceMap.get(key);
        row.revenue += Number(payment.amount || 0);
    }
    const topServices = [...serviceMap.values()]
        .sort((a, b) => b.bookings - a.bookings || b.revenue - a.revenue)
        .slice(0, 5);

    const trend = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const day = d.toISOString().slice(0, 10);
        const bookings = appointments.filter((a) => String(a.date || '').slice(0, 10) === day).length;
        trend.push({ day, bookings });
    }

    return res.json({
        ok: true,
        analytics: {
            totalRevenue,
            monthlyRevenue,
            completionRate,
            cancellationRate,
            avgRating,
            totalReviews: reviews.length,
            topServices,
            bookingTrend7d: trend,
        },
    });
}

module.exports = { getOverview };
