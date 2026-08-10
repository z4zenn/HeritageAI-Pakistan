// middleware/authMiddleware.js
// Express middleware verifying JWT tokens for protected routes

const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization') || req.header('authorization');
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Access denied. No authorization header provided.' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return res.status(401).json({ success: false, message: 'Access denied. Invalid token format (must be Bearer <token>).' });
    }

    const token = parts[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_for_local_testing');
    req.user = decoded; // Attach payload containing userId, email, and role to request
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Access denied. Invalid or expired token.' });
  }
};
