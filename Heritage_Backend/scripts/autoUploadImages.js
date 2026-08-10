require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');
const cloudinary = require('cloudinary').v2;
const Site = require('../models/Site');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Wikipedia search for a site name, returns the main page image URL
async function getWikipediaImage(siteName) {
  try {
    // Use Wikipedia API to search for the page
    const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(siteName)}`;
    const res = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 8000
    });
    
    // Extract thumbnail or original image
    if (res.data.originalimage) {
      return res.data.originalimage.source;
    }
    if (res.data.thumbnail) {
      return res.data.thumbnail.source;
    }
    return null;
  } catch (err) {
    // If direct lookup fails, try search API
    try {
      const searchRes = await axios.get(
        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(siteName)}&format=json`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          timeout: 8000
        }
      );
      const results = searchRes.data.query.search;
      if (!results.length) return null;
      
      const pageTitle = results[0].title;
      const summaryRes = await axios.get(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          timeout: 8000
        }
      );
      return summaryRes.data.originalimage?.source || 
             summaryRes.data.thumbnail?.source || null;
    } catch {
      return null;
    }
  }
}

// Upload image URL directly to Cloudinary
async function uploadToCloudinary(imageUrl, slug) {
  const response = await axios.get(imageUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://commons.wikimedia.org/'
    },
    responseType: 'arraybuffer',
    timeout: 15000
  });

  const base64Data = Buffer.from(response.data).toString('base64');
  const mimeType = response.headers['content-type'] || 'image/jpeg';
  const dataUri = `data:${mimeType};base64,${base64Data}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'heritage-sites',
    public_id: slug,
    overwrite: true,
    resource_type: 'image'
  });
  return result.secure_url;
}

// Main script
async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB\n');

  const sites = await Site.find({}, 'name slug images');
  console.log(`📍 Found ${sites.length} sites to process\n`);

  let success = 0;
  let failed = 0;
  const failedSites = [];

  for (const site of sites) {
    try {
      console.log(`🔍 Processing: ${site.name}`);

      // Skip if already has a Cloudinary image
      if (site.images?.some(img => img.includes('cloudinary'))) {
        console.log(`   ⏭️  Already has Cloudinary image, skipping\n`);
        success++;
        continue;
      }

      // Get Wikipedia image
      const wikiImageUrl = await getWikipediaImage(site.name);
      if (!wikiImageUrl) {
        console.log(`   ⚠️  No Wikipedia image found for ${site.name}\n`);
        failedSites.push(site.name);
        failed++;
        continue;
      }

      console.log(`   📸 Found image, uploading to Cloudinary...`);

      // Upload to Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(wikiImageUrl, site.slug);

      // Update MongoDB
      await Site.findByIdAndUpdate(site._id, {
        $set: { images: [cloudinaryUrl] }
      });

      console.log(`   ✅ Done: ${cloudinaryUrl}\n`);
      success++;

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 500));

    } catch (err) {
      console.log(`   ❌ Failed: ${site.name} — ${err.message}\n`);
      failedSites.push(site.name);
      failed++;
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Success: ${success} sites`);
  console.log(`❌ Failed:  ${failed} sites`);
  if (failedSites.length) {
    console.log('\nFailed sites (upload manually):');
    failedSites.forEach(n => console.log(`  - ${n}`));
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await mongoose.disconnect();
  process.exit();
}

run().catch(console.error);
