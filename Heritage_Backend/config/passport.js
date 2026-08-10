// config/passport.js
// Configures Passport strategies, serialization, and deserialization routines

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_client_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

      // 1. Check if user already exists with this Google ID
      let user = await User.findOne({ googleId: profile.id });
      if (user) {
        return done(null, user);
      }

      // 2. If not, check if user exists with the same email
      if (email) {
        user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
          // Link Google ID and update avatar
          user.googleId = profile.id;
          if (!user.avatar) {
            user.avatar = avatar;
          }
          await user.save();
          return done(null, user);
        }
      }

      // 3. Create a new user if no match found
      user = await User.create({
        name: profile.displayName || 'Google User',
        email: email ? email.toLowerCase() : `${profile.id}@google-auth.local`,
        googleId: profile.id,
        avatar: avatar,
        role: 'user'
      });

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// Serialize user into the session (saves ID only)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session using the ID
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
