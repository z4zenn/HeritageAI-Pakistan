// makeAdmin.js
// One-time administrative command line script to promote users to 'admin' role
// Usage: node makeAdmin.js user@example.com

const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const email = process.argv[2];

if (!email) {
  console.error('Error: Please provide a user email address.');
  console.error('Usage: node makeAdmin.js <email>');
  process.exit(1);
}

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/heritage_db';

console.log('Connecting to MongoDB...');
mongoose.connect(mongoUri)
  .then(async () => {
    console.log('Successfully connected to database.');

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.error(`User with email "${normalizedEmail}" not found.`);
      await mongoose.disconnect();
      process.exit(1);
    }

    user.role = 'admin';
    await user.save();
    console.log(`Success: User "${normalizedEmail}" (ID: ${user._id}) role updated to "admin".`);

    await mongoose.disconnect();
    console.log('Disconnected from database.');
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Database connection or execution failure:', error);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
  });
