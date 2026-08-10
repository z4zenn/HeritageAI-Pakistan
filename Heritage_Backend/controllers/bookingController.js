// controllers/bookingController.js
// Handles tour booking registrations, pricing estimations, and list retrievals

const Booking = require('../models/Booking');
const Site = require('../models/Site');
const User = require('../models/User');
const stripe = require('../config/stripe');
const { 
  sendBookingConfirmation,
  sendAdminNotification,
  sendWhatsAppNotification 
} = require('../services/emailService');

// POST /api/bookings
// Protected route
exports.createBooking = async (req, res, next) => {
  try {
    const { siteId, date, numberOfPeople, phone, contactEmail, contactName } = req.body;
    const userId = req.user.id;

    if (!siteId || !date || !numberOfPeople) {
      return res.status(400).json({ success: false, message: 'Please provide siteId, date, and numberOfPeople.' });
    }

    const guestsNum = Number(numberOfPeople);
    if (isNaN(guestsNum) || guestsNum < 1 || guestsNum > 20) {
      return res.status(400).json({ success: false, message: 'Number of people must be between 1 and 20.' });
    }

    const bookingDate = new Date(date);
    if (isNaN(bookingDate.getTime()) || bookingDate <= new Date()) {
      return res.status(400).json({ success: false, message: 'Booking date must be a valid future date.' });
    }

    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({ success: false, message: 'Archaeological site not found.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Cost calculations
    const isUnesco = site.tags && site.tags.includes('unesco');
    const baseTicket = isUnesco ? 800 : 500;
    const guideFeePerPerson = 1200;
    const totalPrice = (baseTicket + guideFeePerPerson) * guestsNum;

    const booking = await Booking.create({
      userId,
      siteId,
      date: bookingDate,
      numberOfPeople: guestsNum,
      totalPrice,
      status: 'confirmed',
      phone,
      contactEmail,
      contactName,
      createdAt: new Date()
    });

    // Populate site details for email and response
    const populated = await Booking.findById(booking._id).populate('siteId');

    // Send confirmation email (fire and forget)
    sendBookingConfirmation(user, populated, populated.siteId)
      .catch(console.error);

    return res.status(201).json({
      success: true,
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/bookings/me
// Protected route
exports.getMyBookings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // Populate siteId: name, region, type, images, slug
    const bookings = await Booking.find({ userId })
      .populate('siteId', 'name region type images slug')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/bookings/:id
// Protected route
exports.getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate('siteId', 'name region coordinates visitingHours entryFee');

    if (!booking) {
      return res.status(404).json({ success: false, message: `Booking not found with ID: ${id}` });
    }

    // Security check: Only allow the owner of the booking or an Admin to view it
    if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this booking record.' });
    }

    return res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/bookings/create-payment-intent
// Protected route
exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { siteId, numberOfPeople } = req.body;

    if (!siteId || !numberOfPeople) {
      return res.status(400).json({ success: false, message: 'Please provide siteId and numberOfPeople.' });
    }

    const guestsNum = Number(numberOfPeople);
    if (isNaN(guestsNum) || guestsNum < 1 || guestsNum > 20) {
      return res.status(400).json({ success: false, message: 'Number of people must be between 1 and 20.' });
    }

    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({ success: false, message: 'Archaeological site not found.' });
    }

    const feeNum = parseInt(site.entryFee?.replace(/[^0-9]/g, '') || '500', 10);
    const totalAmount = feeNum * guestsNum;
    const amountInPaisa = totalAmount * 100;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPaisa,
      currency: 'pkr',
      metadata: {
        siteId: siteId.toString(),
        numberOfPeople: guestsNum.toString(),
        userId: req.user.id.toString(),
        siteName: site.name
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        totalAmount,
        paymentIntentId: paymentIntent.id
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/bookings/confirm
// Protected route
exports.createBookingAfterPayment = async (req, res, next) => {
  try {
    const { siteId, date, numberOfPeople, paymentIntentId, totalAmount, phone, contactEmail, contactName } = req.body;

    if (!siteId || !date || !numberOfPeople || !paymentIntentId || !totalAmount) {
      return res.status(400).json({ success: false, message: 'Please provide siteId, date, numberOfPeople, paymentIntentId, and totalAmount.' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }

    const guestsNum = Number(numberOfPeople);
    const bookingDate = new Date(date);

    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({ success: false, message: 'Archaeological site not found.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const booking = await Booking.create({
      userId: req.user.id,
      siteId,
      date: bookingDate,
      numberOfPeople: guestsNum,
      totalPrice: Number(totalAmount),
      status: 'confirmed',
      paymentIntentId,
      totalAmount: Number(totalAmount),
      paymentMethod: 'stripe',
      phone,
      contactEmail,
      contactName,
      createdAt: new Date()
    });

    // Populate site details for email and response
    const populated = await Booking.findById(booking._id).populate('siteId');

    // Send notifications (fire and forget)
    Promise.all([
      sendBookingConfirmation(user, populated, populated.siteId)
        .catch(console.error),
      sendAdminNotification(populated, populated.siteId, user)
        .catch(console.error),
      sendWhatsAppNotification(populated, populated.siteId, user)
        .catch(console.error)
    ]);

    return res.status(201).json({
      success: true,
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/bookings/:id/cancel
// Protected route
exports.cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ success: false, message: `Booking not found with ID: ${id}` });
    }

    // Security check: must own the booking
    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking.' });
    }

    // Check if booking date is in the future
    const now = new Date();
    if (new Date(booking.date) <= now) {
      return res.status(400).json({ success: false, message: 'Cannot cancel a past booking.' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled.' });
    }

    booking.status = 'cancelled';
    await booking.save();

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully.',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

