// config/stripe.js
// Initialize Stripe with secret key from environment variables

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = stripe;
