// index.js
// Entry point for HeritageAI Pakistan — Single-URL Monorepo Deployment
// Express serves API routes under /api/* and the React production build for all other routes

const express = require('express');
const cors = require('cors');
const path = require('path');
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

// 1. Enable Reverse Proxy Trust right after app creation
app.set('trust proxy', 1);

// Health check ping for uptime monitors
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// ──────────────────────────────────────────────
// 1. CORS — same-origin in production, allow localhost for dev
// ──────────────────────────────────────────────
const allowedOrigins = [
  'https://monorepo-heritageai-pakistan.onrender.com',
  'https://heritageai-pakistan-1.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, same-origin)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || /\.onrender\.com$/.test(origin) || /\.vercel\.app$/.test(origin) || origin.includes('localhost')) {
      return callback(null, true);
    }

    // Return false instead of throwing a hard error to prevent server crash
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
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
// 5. Session & Passport
//    In monorepo mode cookies are same-origin, so sameSite:'lax' works fine.
//    We keep 'none' + secure for production as a safe default.
// ──────────────────────────────────────────────
const isProduction = process.env.NODE_ENV === 'production';

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'HeritageAI API service is healthy' });
});

// ──────────────────────────────────────────────
// 7. Centralized Error Handling Middleware
// ──────────────────────────────────────────────
app.use(errorMiddleware);

// ──────────────────────────────────────────────
// 8. Serve React Production Build (Monorepo Static Assets)
//    This MUST come after all API routes and error middleware
// ──────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../Heritage_Frontend/dist')));

// Client-side routing catch-all — serves index.html for all non-API routes
// so React Router can handle /explore, /site/:id, /login, etc.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../Heritage_Frontend/dist', 'index.html'));
});

// ──────────────────────────────────────────────
// 9. Server Listening — bind to 0.0.0.0 for Render
// ──────────────────────────────────────────────
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`HeritageAI Pakistan Server is running on port ${PORT}`);
});