// routes/adminRoutes.js
// Admin-only API endpoint routing and middleware chaining

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Apply JWT authentication and admin status checks to all routes in this file
router.use(authMiddleware);
router.use(adminMiddleware);

// GET /api/admin/users
router.get('/users', adminController.getAllUsers);

// GET /api/admin/users/:userId
router.get('/users/:userId', adminController.getUserBookings);

// GET /api/admin/stats
router.get('/stats', adminController.getDashboardStats);

// PATCH /api/admin/bookings/:id
router.patch('/bookings/:id', adminController.updateBookingStatus);

// POST /api/admin/sites
router.post('/sites', adminController.createSite);

// PUT /api/admin/sites/:id
router.put('/sites/:id', adminController.updateSite);

// PATCH /api/admin/sites/:id/visibility
router.patch('/sites/:id/visibility', adminController.toggleSiteVisibility);

// DELETE /api/admin/sites/:id
router.delete('/sites/:id', adminController.deleteSite);

module.exports = router;
