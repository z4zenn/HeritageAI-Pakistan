// models/Site.js
// Database schema representing the 74 archaeological sites in Pakistan

const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Site name is required'],
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  region: {
    type: String,
    required: [true, 'Region is required'],
    enum: ['Punjab', 'Sindh', 'KPK', 'Balochistan', 'Gilgit-Baltistan', 'AJK']
  },
  era: {
    type: String,
    required: [true, 'Historical era is required']
  },
  type: {
    type: String,
    required: [true, 'Site type is required']
  },
  shortDescription: {
    type: String,
    required: [true, 'Short description is required'],
    trim: true
  },
  fullDescription: {
    type: String,
    required: [true, 'Full description is required'],
    trim: true
  },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  images: {
    type: [String],
    default: []
  },
  city: {
    type: String
  },
  nearbyCity: {
    type: String,
    required: true
  },
  visitingHours: {
    type: String,
    default: '09:00 AM - 05:00 PM'
  },
  entryFee: {
    type: String,
    default: 'Free'
  },
  tags: {
    type: [String],
    default: []
  },
  isHidden: {
    type: Boolean,
    default: false
  }
});

// Auto-generate slug before saving
siteSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_]+/g, '-')  // Replace spaces/underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }
  next();
});

module.exports = mongoose.model('Site', siteSchema);
