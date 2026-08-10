// seed.js
// Seeding script to populate MongoDB with initial site database

const mongoose = require('mongoose');
require('dotenv').config();

const Site = require('./models/Site');
const sitesData = require('./data/sites');

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/heritage_db';
    console.log(`Connecting to database...`);
    await mongoose.connect(mongoUri);

    console.log(`Attempting to seed ${sitesData.length} sites...`);

    try {
      const result = await Site.insertMany(sitesData, { ordered: false });
      // If all inserts succeeded without duplicate keys
      result.forEach(site => {
        console.log(`✅ Inserted: ${site.name}`);
      });
      console.log(`🎉 Database seeding completed successfully. Created ${result.length} new site entries.`);
    } catch (error) {
      // Handle bulk write error (when some are duplicates and skipped)
      if (error.name === 'MongoBulkWriteError' || error.code === 11000 || error.writeErrors) {
        const insertedDocs = error.insertedDocs || [];
        insertedDocs.forEach(site => {
          console.log(`✅ Inserted: ${site.name}`);
        });
        const skippedCount = error.writeErrors ? error.writeErrors.length : 0;
        console.log(`ℹ️ Seeding complete. Inserted ${insertedDocs.length} new records. Skipped ${skippedCount} duplicate entries.`);
      } else {
        // Reraise other errors (connection, schema validation etc.)
        throw error;
      }
    }

    await mongoose.connection.close();
    console.log("Disconnected from database.");
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
