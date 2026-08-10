const mongoose = require('mongoose');
require('dotenv').config();
const Site = require('./models/Site');

const inspect = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/heritage_db';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    const sites = await Site.find({ slug: { $in: ['chanhu-daro', 'nimogram-stupa', 'attock-fort'] } });
    console.log('Results:');
    sites.forEach(s => {
      console.log(`Name: ${s.name}, Slug: ${s.slug}, Images:`, s.images);
    });

    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
};
inspect();
