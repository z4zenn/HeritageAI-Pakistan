// utils/generateToken.js
// Standard utility to sign stateless JWT tokens for authentication

const jwt = require('jsonwebtoken');

module.exports = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'super_secret_for_local_testing',
    { expiresIn: '7d' }
  );
};
