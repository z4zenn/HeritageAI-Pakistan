// controllers/siteController.js
// Handles retrieval and database queries for historical/archaeological sites

const Site = require('../models/Site');

// GET /api/sites
// Supports query params: ?region=Punjab&era=Mughal&type=Fort
exports.getAllSites = async (req, res, next) => {
  try {
    const { region, era, type, includeHidden } = req.query;
    const filter = includeHidden === 'true' ? {} : { isHidden: { $ne: true } };

    // Build filter query object dynamically if filters are passed
    if (region) {
      // Case-insensitive query match
      filter.region = { $regex: new RegExp(`^${region}$`, 'i') };
    }
    if (era) {
      filter.era = { $regex: new RegExp(`^${era}$`, 'i') };
    }
    if (type) {
      filter.type = { $regex: new RegExp(`^${type}$`, 'i') };
    }

    const sites = await Site.find(filter);

    return res.status(200).json({
      success: true,
      data: sites
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/sites/:id
// Retrieves single site by MongoDB ObjectId or slug name
exports.getSiteById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let site;

    // Check if parameter is a valid 24-character hex MongoDB ObjectId
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      site = await Site.findById(id);
    } else {
      // Fallback query to match unique URL slug
      site = await Site.findOne({ slug: id });
    }

    if (!site) {
      return res.status(404).json({
        success: false,
        message: `Archaeological site not found with identifier: ${id}`
      });
    }

    return res.status(200).json({
      success: true,
      data: site
    });
  } catch (error) {
    next(error);
  }
};
