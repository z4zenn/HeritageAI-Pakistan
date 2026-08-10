// controllers/adminController.js
// Handles administrative actions, dashboard analytics, user list retrievals, and booking status updates

const User = require('../models/User');
const Booking = require('../models/Booking');
const Site = require('../models/Site');
const { getPineconeIndex } = require('../config/pinecone');
const { generateEmbedding, buildSiteText } = require('../services/embeddingService');

// GET /api/admin/users
// Retrieve all registered travelers and their bookings info
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    
    const data = await Promise.all(users.map(async (user) => {
      const bookings = await Booking.find({ userId: user._id })
        .populate('siteId', 'name')
        .select('siteId date status numberOfPeople totalPrice phone contactEmail contactName createdAt')
        .sort({ createdAt: -1 });

      return {
        user,
        bookings,
        bookingCount: bookings.length
      };
    }));

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/users/:userId
// Retrieve all bookings associated with a specific user
exports.getUserBookings = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Verify if user exists first
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const bookings = await Booking.find({ userId })
      .populate('siteId', 'name region type')
      .select('siteId date status numberOfPeople totalPrice phone contactEmail contactName createdAt')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/stats
// Aggregate dashboard analytics for the admin panel
exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalSites = await Site.countDocuments();

    // Group bookings status counts
    const pending = await Booking.countDocuments({ status: 'pending' });
    const confirmed = await Booking.countDocuments({ status: 'confirmed' });
    const cancelled = await Booking.countDocuments({ status: 'cancelled' });

    const bookingsByStatus = { pending, confirmed, cancelled };

    // Query top 5 booked sites via MongoDB aggregation
    const topBookedSites = await Booking.aggregate([
      {
        $group: {
          _id: '$siteId',
          bookingCount: { $sum: 1 }
        }
      },
      { $sort: { bookingCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'sites', // the MongoDB collection name for Site model is 'sites'
          localField: '_id',
          foreignField: '_id',
          as: 'siteInfo'
        }
      },
      { $unwind: '$siteInfo' },
      {
        $project: {
          _id: 0,
          siteName: '$siteInfo.name',
          bookingCount: 1
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalBookings,
        totalSites,
        bookingsByStatus,
        topBookedSites
      }
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/bookings/:id
// Update booking status (e.g. confirm, cancel)
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Status must be one of: pending, confirmed, cancelled.'
      });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate('siteId', 'name region type');

    if (!updatedBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedBooking
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/sites
exports.createSite = async (req, res, next) => {
  try {
    const { 
      name, region, era, type, shortDescription, fullDescription, 
      coordinates, images, nearbyCity, visitingHours, entryFee, tags, isHidden 
    } = req.body;

    const site = new Site({
      name,
      region,
      era,
      type,
      shortDescription,
      fullDescription,
      coordinates: {
        lat: Number(coordinates?.lat || 0),
        lng: Number(coordinates?.lng || coordinates?.lon || 0)
      },
      images: Array.isArray(images) ? images : (images ? [images] : []),
      nearbyCity: nearbyCity || 'Unknown',
      visitingHours: visitingHours || '09:00 AM - 05:00 PM',
      entryFee: entryFee || 'Free',
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
      isHidden: isHidden === true || isHidden === 'true'
    });

    await site.save();

    // If site is not hidden, index in Pinecone
    if (!site.isHidden) {
      const text = buildSiteText(site);
      const embedding = await generateEmbedding(text);
      if (embedding) {
        const index = await getPineconeIndex();
        await index.upsert([{
          id: site.slug,
          values: [...embedding],
          metadata: {
            mongoId: site._id.toString(),
            name: site.name,
            region: site.region || '',
            era: site.era || '',
            type: site.type || '',
            slug: site.slug
          }
        }]);
        console.log(`✅ Upserted vector to Pinecone for slug: ${site.slug}`);
      }
    }

    return res.status(201).json({
      success: true,
      data: site
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/sites/:id
exports.updateSite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const oldSite = await Site.findById(id);
    if (!oldSite) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    const oldSlug = oldSite.slug;

    // Structure coordinates properly if passed
    if (req.body.coordinates) {
      req.body.coordinates = {
        lat: Number(req.body.coordinates.lat || 0),
        lng: Number(req.body.coordinates.lng || req.body.coordinates.lon || 0)
      };
    }

    // Convert tags to array if passed as string
    if (req.body.tags && !Array.isArray(req.body.tags)) {
      req.body.tags = req.body.tags.split(',').map(t => t.trim());
    }

    // Perform update
    const site = await Site.findById(id);
    Object.assign(site, req.body);
    await site.save();

    // Pinecone Sync
    const index = await getPineconeIndex();
    
    // 1. If slug has changed, delete the old slug vector
    if (oldSlug && oldSlug !== site.slug) {
      await index.deleteOne(oldSlug);
      console.log(`🗑️ Deleted old Pinecone vector: ${oldSlug}`);
    }

    // 2. Upsert or Delete based on new isHidden status
    if (site.isHidden) {
      await index.deleteOne(site.slug);
      console.log(`🗑️ Hidden site: deleted Pinecone vector: ${site.slug}`);
    } else {
      const text = buildSiteText(site);
      const embedding = await generateEmbedding(text);
      if (embedding) {
        await index.upsert([{
          id: site.slug,
          values: [...embedding],
          metadata: {
            mongoId: site._id.toString(),
            name: site.name,
            region: site.region || '',
            era: site.era || '',
            type: site.type || '',
            slug: site.slug
          }
        }]);
        console.log(`✅ Upserted Pinecone vector: ${site.slug}`);
      }
    }

    return res.status(200).json({
      success: true,
      data: site
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/sites/:id/visibility
exports.toggleSiteVisibility = async (req, res, next) => {
  try {
    const { id } = req.params;
    const site = await Site.findById(id);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    site.isHidden = !site.isHidden;
    await site.save();

    const index = await getPineconeIndex();
    if (site.isHidden) {
      await index.deleteOne(site.slug);
      console.log(`🗑️ Hidden site: deleted Pinecone vector: ${site.slug}`);
    } else {
      const text = buildSiteText(site);
      const embedding = await generateEmbedding(text);
      if (embedding) {
        await index.upsert([{
          id: site.slug,
          values: [...embedding],
          metadata: {
            mongoId: site._id.toString(),
            name: site.name,
            region: site.region || '',
            era: site.era || '',
            type: site.type || '',
            slug: site.slug
          }
        }]);
        console.log(`✅ Restored site: upserted Pinecone vector: ${site.slug}`);
      }
    }

    return res.status(200).json({
      success: true,
      data: site
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/sites/:id
exports.deleteSite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const site = await Site.findByIdAndDelete(id);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    // Delete vector from Pinecone index
    try {
      const index = await getPineconeIndex();
      await index.deleteOne(site.slug);
      console.log(`🗑️ Deleted site: removed Pinecone vector: ${site.slug}`);
    } catch (pineconeErr) {
      console.error('Pinecone deletion error during site delete:', pineconeErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Site permanently deleted from system database and Pinecone search index.'
    });
  } catch (error) {
    next(error);
  }
};
