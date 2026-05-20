const stripeService = require('../services/stripeService');
const { markPaymentCompleted } = require('./paymentController');

async function handleStripeWebhook(req, res) {
    if (!stripeService.hasStripe()) {
        return res.status(503).json({ ok: false, error: 'Stripe is not configured.' });
    }

    const signature = req.headers['stripe-signature'];
    if (!signature) return res.status(400).json({ ok: false, error: 'Missing stripe-signature header.' });

    let event;
    try {
        event = stripeService.constructStripeEvent(req.body, signature);
    } catch (err) {
        return res.status(400).json({ ok: false, error: `Invalid Stripe signature: ${err.message}` });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        await markPaymentCompleted({
            paymentId: Number(session.metadata?.paymentId || 0),
            stripeSessionId: session.id,
            stripePaymentIntentId: session.payment_intent || null,
        });
    }

    if (event.type === 'payment_intent.succeeded') {
        const intent = event.data.object;
        await markPaymentCompleted({
            stripePaymentIntentId: intent.id,
        });
    }

    return res.json({ received: true });
}

module.exports = { handleStripeWebhook };
