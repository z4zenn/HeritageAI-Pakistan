// routes/webhookRoutes.js
// Route mapping for Stripe webhook endpoints (raw bodies required, no auth middleware)

const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

router.post('/webhook', webhookController.handleStripeWebhook);

module.exports = router;
