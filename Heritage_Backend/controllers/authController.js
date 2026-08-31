// controllers/authController.js
// Handles user registration, login authentication, and profile retrieval

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// POST /register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already registered with this email.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user. Note: We read the optional role from body to make testing 'admin' roles easy.
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'user'
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role || 'user'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    // Check if this is a Google-only account
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'This email is registered with Google. Please use "Continue with Google" to sign in.'
      });
    }

    // Compare password hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role || 'user'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        avatar: user.avatar,
        googleId: user.googleId,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /google/callback controller
exports.googleCallback = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(400).json({ success: false, message: 'OAuth user authentication failed.' });
    }
    const token = generateToken(req.user);
    const redirectUrl = '/auth/callback?token=' + token;
    return res.redirect(redirectUrl);
  } catch (error) {
    next(error);
  }
};

// POST /logout
exports.logout = async (req, res, next) => {
  try {
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};
