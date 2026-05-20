const Stripe = require('stripe');
const env = require('../config/env');

let stripeInstance = null;

function hasStripe() {
    return !!env.stripeSecretKey;
}

function getStripe() {
    if (!hasStripe()) return null;
    if (!stripeInstance) stripeInstance = new Stripe(env.stripeSecretKey);
    return stripeInstance;
}

async function createCheckoutSession({
    payment,
    appointment,
    user,
    successUrl,
    cancelUrl,
}) {
    const stripe = getStripe();
    if (!stripe) {
        throw new Error('Stripe is not configured on this environment.');
    }

    const amountCents = Math.round(Number(payment.amount || 0) * 100);
    if (amountCents <= 0) throw new Error('Payment amount must be greater than zero.');

    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: user.email,
        metadata: {
            paymentId: String(payment.id),
            appointmentId: String(appointment.id),
            userId: String(user.id),
            userEmail: user.email,
        },
        line_items: [
            {
                quantity: 1,
                price_data: {
                    currency: String(payment.currency || 'eur'),
                    unit_amount: amountCents,
                    product_data: {
                        name: payment.serviceName || 'Salon Booking',
                        description: `Appointment #${appointment.id} · ${appointment.date} ${appointment.time}`,
                    },
                },
            },
        ],
        success_url: successUrl || `${env.frontendBaseUrl}/booking.html?payment=success&appointmentId=${appointment.id}`,
        cancel_url: cancelUrl || `${env.frontendBaseUrl}/booking.html?payment=cancelled&appointmentId=${appointment.id}`,
    });

    return session;
}

function constructStripeEvent(rawBody, signature) {
    const stripe = getStripe();
    if (!stripe) throw new Error('Stripe is not configured on this environment.');
    if (!env.stripeWebhookSecret) throw new Error('Stripe webhook secret is missing.');
    return stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
}

module.exports = {
    hasStripe,
    getStripe,
    createCheckoutSession,
    constructStripeEvent,
};
