const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let connectDb;
let runSeed;
let createApp;
let mongoose;
let Appointment;
let runReminderSweep;
let app;

function authHeader(token) {
    return { Authorization: `Bearer ${token}` };
}

test.before(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_EXPIRES_IN = '2h';
    process.env.REMINDER_ENABLED = 'false';

    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongoServer.getUri();

    connectDb = require('../config/db');
    runSeed = require('../config/seed');
    createApp = require('../app');
    mongoose = require('mongoose');
    Appointment = require('../models/Appointment');
    ({ runReminderSweep } = require('../services/appointmentReminderService'));

    await connectDb();
    await runSeed();
    app = createApp();
});

test.after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

test('auth: register and read own profile', async () => {
    const unique = Date.now();
    const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
            name: 'Test Client',
            email: `client-${unique}@example.com`,
            password: 'pass1234',
            phone: '044111222',
        });

    assert.equal(registerRes.status, 201);
    assert.equal(registerRes.body.ok, true);
    assert.ok(registerRes.body.token);
    assert.equal(registerRes.body.user.role, 'Customer');

    const meRes = await request(app)
        .get('/api/auth/me')
        .set(authHeader(registerRes.body.token));

    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.ok, true);
    assert.equal(meRes.body.user.email, `client-${unique}@example.com`);
});

test('appointments: prevent double booking in same slot', async () => {
    const unique = Date.now();
    const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
            name: 'Slot Client',
            email: `slot-${unique}@example.com`,
            password: 'pass1234',
        });
    const token = registerRes.body.token;

    const servicesRes = await request(app).get('/api/services');
    assert.equal(servicesRes.status, 200);
    const serviceId = servicesRes.body.services[0].id;
    assert.ok(serviceId);

    const date = '2030-01-10';
    const time = '10:00';

    const first = await request(app)
        .post('/api/appointments')
        .set(authHeader(token))
        .send({ serviceId, date, time, notes: 'First booking' });
    assert.equal(first.status, 201);
    assert.equal(first.body.ok, true);

    const second = await request(app)
        .post('/api/appointments')
        .set(authHeader(token))
        .send({ serviceId, date, time, notes: 'Duplicate booking' });
    assert.equal(second.status, 409);
    assert.equal(second.body.ok, false);
});

test('reviews: allow review after confirmed appointment and block duplicate review', async () => {
    const unique = Date.now();
    const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
            name: 'Review Client',
            email: `review-${unique}@example.com`,
            password: 'pass1234',
        });
    const clientToken = registerRes.body.token;

    const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@glowbook.com', password: 'admin123' });
    const adminToken = adminLogin.body.token;

    const servicesRes = await request(app).get('/api/services');
    const serviceId = servicesRes.body.services[0].id;

    const appointmentRes = await request(app)
        .post('/api/appointments')
        .set(authHeader(clientToken))
        .send({ serviceId, date: '2030-01-11', time: '11:00', notes: 'Review target' });
    assert.equal(appointmentRes.status, 201);
    const appointmentId = appointmentRes.body.appointment.id;

    const confirmRes = await request(app)
        .put(`/api/appointments/${appointmentId}`)
        .set(authHeader(adminToken))
        .send({ status: 'Confirmed' });
    assert.equal(confirmRes.status, 200);

    const reviewPayload = {
        appointmentId,
        rating: 5,
        comment: 'Excellent service and clean studio.',
    };

    const firstReview = await request(app)
        .post('/api/reviews')
        .set(authHeader(clientToken))
        .send(reviewPayload);
    assert.equal(firstReview.status, 201);
    assert.equal(firstReview.body.ok, true);

    const duplicateReview = await request(app)
        .post('/api/reviews')
        .set(authHeader(clientToken))
        .send(reviewPayload);
    assert.equal(duplicateReview.status, 409);
    assert.equal(duplicateReview.body.ok, false);
});

test('reminders: send once for upcoming appointment and dedupe', async () => {
    const unique = Date.now();
    const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
            name: 'Reminder Client',
            email: `reminder-${unique}@example.com`,
            password: 'pass1234',
            phone: '044999888',
        });
    const clientToken = registerRes.body.token;

    const servicesRes = await request(app).get('/api/services');
    const serviceId = servicesRes.body.services[0].id;

    const appointmentRes = await request(app)
        .post('/api/appointments')
        .set(authHeader(clientToken))
        .send({
            serviceId,
            date: '2030-01-12',
            time: '12:00',
            status: 'Confirmed',
            notes: 'Reminder target',
        });
    assert.equal(appointmentRes.status, 201);
    const appointmentId = appointmentRes.body.appointment.id;

    const startAt = new Date(Date.now() + 30 * 60 * 1000);
    await Appointment.updateOne(
        { id: appointmentId },
        {
            $set: {
                startAt,
                date: startAt.toISOString().slice(0, 10),
                time: startAt.toISOString().slice(11, 16),
                status: 'Confirmed',
                reminderSentAt: null,
            },
        }
    );

    const firstSweep = await runReminderSweep({ lookaheadHours: 2 });
    assert.equal(firstSweep.sent, 1);

    const secondSweep = await runReminderSweep({ lookaheadHours: 2 });
    assert.equal(secondSweep.sent, 0);

    const updated = await Appointment.findOne({ id: appointmentId }).lean();
    assert.ok(updated.reminderSentAt);
});
