// controllers/webhookController.js
// Handles verified Stripe webhook events (e.g. payment_intent success/failure logging)

const stripe = require('../config/stripe');

/**
 * POST /api/stripe/webhook
 * Processes raw payload from Stripe webhook calls
 */
exports.handleStripeWebhook = (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Note: req.rawBody must be set as a Buffer before reaching this handler
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook Signature Verification Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the Stripe event type
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntentSucceeded = event.data.object;
      console.log(`[Stripe Webhook] payment_intent.succeeded logged for ID: ${paymentIntentSucceeded.id}`);
      // Success processing can be extended here if needed
      break;
    case 'payment_intent.payment_failed':
      const paymentIntentFailed = event.data.object;
      console.error(`[Stripe Webhook] payment_intent.payment_failed logged for ID: ${paymentIntentFailed.id}. Reason: ${paymentIntentFailed.last_payment_error?.message || 'Unknown error'}`);
      break;
    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
  }

  res.status(200).json({ received: true });
};
