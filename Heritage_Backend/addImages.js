// addImages.js
// Migration script to populate site images in MongoDB using Wikimedia Commons URLs
// Run with: node addImages.js

const mongoose = require('mongoose');
require('dotenv').config();

const Site = require('./models/Site');
const siteImages = require('./data/siteImages');

// Mapping user-provided slugs to their actual database counterparts
const slugMapping = {
  'hinglaj-mata-temple': 'hinglaj-mata-template',
  'lahore-fort': 'lahore-fort-shahi-qila',
  'multan-fort': 'multan-fort-qila-kohna',
  'quaid-e-azam-house-karachi': 'quaid-e-azam-house-flag-staff-house',
  'lahore-railway-station': 'lahore-railway-station-nlc-building',
  'government-college-lahore': 'government-college-lahore-gcu',
  'shahbazgarhi-rock-edicts': 'shahbazgarhi-rock-edicts-ashoka',
  'mansehra-rock-edicts': 'mansehra-rock-edicts-ashoka',
  'ali-masjid-khyber': 'ali-masjid-khyber-pass',
  'tomb-of-shah-shuja': 'tomb-of-shah-shuja-kabuli-gate'
};

const runMigration = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/heritage_db';
    console.log('Connecting to database...');
    await mongoose.connect(mongoUri);
    console.log('Successfully connected to MongoDB.');

    let successCount = 0;
    let failCount = 0;

    for (const originalSlug of Object.keys(siteImages)) {
      const urls = siteImages[originalSlug];
      // Resolve correct database slug
      const dbSlug = slugMapping[originalSlug] || originalSlug;

      const updatedSite = await Site.findOneAndUpdate(
        { slug: dbSlug },
        { $set: { images: urls } },
        { new: true }
      );

      if (updatedSite) {
        console.log(`✅ Images added: [${updatedSite.name}] (slug: ${dbSlug})`);
        successCount++;
      } else {
        console.warn(`⚠️ Not found: [${originalSlug}] (mapped to: ${dbSlug})`);
        failCount++;
      }
    }

    console.log(`\nMigration Summary:`);
    console.log(`- Successfully updated: ${successCount} sites`);
    console.log(`- Failed to find: ${failCount} sites`);

    await mongoose.connection.close();
    console.log('Disconnected from database.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    try {
      await mongoose.connection.close();
    } catch (_) {}
    process.exit(1);
  }
};

runMigration();
