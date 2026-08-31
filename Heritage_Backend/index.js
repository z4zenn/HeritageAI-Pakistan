// index.js
// Entry point and Express server configurations for the HeritageAI Pakistan API

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const siteRoutes = require('./routes/siteRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const aiRoutes = require('./routes/aiRoutes');
const adminRoutes = require('./routes/adminRoutes');

const session = require('express-session');
const passport = require('passport');
require('./config/passport');

// Initialize Cloudinary SDK at startup
require('./config/cloudinary');

const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();

// ──────────────────────────────────────────────
// 1. CORS — single consolidated middleware
//    Supports: production Vercel domain, preview deploys, localhost dev
// ──────────────────────────────────────────────
app.use(cors({
  origin: function (origin, callback) {
    const allowed = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:3000'
    ].filter(Boolean);

    // Allow requests with no origin (server-to-server, curl, mobile apps)
    // Allow any *.vercel.app preview deployment
    // Allow explicitly whitelisted origins
    if (!origin || allowed.includes(origin) || /\.vercel\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// ──────────────────────────────────────────────
// 2. Stripe Webhook — MUST come before express.json()
//    Stripe requires the raw unparsed body for signature verification
// ──────────────────────────────────────────────
app.use('/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    req.rawBody = req.body;
    next();
  }
);
app.use('/api/stripe', webhookRoutes);

// ──────────────────────────────────────────────
// 3. Body Parsers — after webhook raw handler
// ──────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ──────────────────────────────────────────────
// 4. Database Connection
// ──────────────────────────────────────────────
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/heritage_db';
mongoose.connect(mongoUri)
  .then(() => console.log('Successfully connected to MongoDB database.'))
  .catch(err => console.error('MongoDB database connection failure:', err));

// ──────────────────────────────────────────────
// 5. Session & Passport — cross-domain cookie config for Vercel↔Render
// ──────────────────────────────────────────────
const isProduction = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1); // Trust first proxy (Render's reverse proxy)

app.use(session({
  secret: process.env.SESSION_SECRET || 'heritage_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// ──────────────────────────────────────────────
// 6. API Route Bindings
// ──────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

// Base route for server health check
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'HeritageAI API service is healthy' });
});

// ──────────────────────────────────────────────
// 7. Centralized Error Handling Middleware (must be registered last)
// ──────────────────────────────────────────────
app.use(errorMiddleware);

// ──────────────────────────────────────────────
// 8. Server Listening — bind to 0.0.0.0 for Render
// ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`HeritageAI Pakistan API Server is running on port ${PORT}`);
});