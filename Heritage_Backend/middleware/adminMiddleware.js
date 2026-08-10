// middleware/adminMiddleware.js
// Express middleware verifying that the authenticated user is an administrator

module.exports = (req, res, next) => {
  // authMiddleware must be executed before this middleware to populate req.user
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. User authentication required.'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access only'
    });
  }

  next();
};
