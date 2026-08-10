require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const Site = require('../models/Site');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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

// Each entry: { slug, searchTerm }
// searchTerm is what gets sent to Wikipedia API
const missingSites = [
  { slug: 'shalimar-gardens', 
    searchTerm: 'Shalimar Gardens Lahore' },
  { slug: 'kot-diji', 
    searchTerm: 'Kot Diji fort Sindh' },
  { slug: 'chanhu-daro', 
    searchTerm: 'Chanhu-daro archaeological site' },
  { slug: 'amri', 
    searchTerm: 'Amri archaeological site Sindh' },
  { slug: 'ganeriwala', 
    searchTerm: 'Ganweriwala Indus Valley site' },
  { slug: 'taxila-sirkap', 
    searchTerm: 'Sirkap Taxila ancient city' },
  { slug: 'dharmarajika-stupa-taxila', 
    searchTerm: 'Dharmarajika stupa Taxila' },
  { slug: 'nimogram-stupa', 
    searchTerm: 'Nimogram stupa Swat' },
  { slug: 'amluk-dara-stupa', 
    searchTerm: 'Amluk-dara stupa Pakistan' },
  { slug: 'katas-raj-temples', 
    searchTerm: 'Katas Raj temples Chakwal' },
  { slug: 'hinglaj-mata-temple', 
    searchTerm: 'Hinglaj Mata temple Balochistan' },
  { slug: 'sharda-temple', 
    searchTerm: 'Sharda temple Neelum Valley' },
  { slug: 'tilla-jogian', 
    searchTerm: 'Tilla Jogian monastery Jhelum' },
  { slug: 'kafir-kot', 
    searchTerm: 'Kafir Kot fort Pakistan' },
  { slug: 'ranikot-fort', 
    searchTerm: 'Ranikot Fort Sindh' },
  { slug: 'kartarpur-darbar-sahib', 
    searchTerm: 'Kartarpur Sahib Gurdwara' },
  { slug: 'gurdwara-panja-sahib', 
    searchTerm: 'Panja Sahib Gurdwara Hasan Abdal' },
  { slug: 'gurdwara-janam-asthan-nankana-sahib', 
    searchTerm: 'Nankana Sahib Gurdwara birthplace' },
  { slug: 'gurdwara-dera-sahib-lahore', 
    searchTerm: 'Dera Sahib Gurdwara Lahore' },
  { slug: 'wazir-khan-mosque', 
    searchTerm: 'Wazir Khan Mosque Lahore' },
  { slug: 'naulakha-pavilion', 
    searchTerm: 'Naulakha Pavilion Lahore Fort' },
  { slug: 'jahangirs-tomb', 
    searchTerm: 'Tomb of Jahangir Lahore' },
  { slug: 'nur-jahans-tomb', 
    searchTerm: 'Tomb of Nur Jahan Lahore' },
  { slug: 'hiran-minar', 
    searchTerm: 'Hiran Minar Sheikhupura' },
  { slug: 'akbari-sarai', 
    searchTerm: 'Akbari Sarai Lahore' },
  { slug: 'shish-mahal', 
    searchTerm: 'Shish Mahal Lahore Fort mirror palace' },
  { slug: 'shah-rukn-e-alam-tomb', 
    searchTerm: 'Shah Rukn-e-Alam tomb Multan' },
  { slug: 'bibi-jawindi-tomb', 
    searchTerm: 'Bibi Jawindi tomb Uch Sharif' },
  { slug: 'uch-sharif-ruins', 
    searchTerm: 'Uch Sharif ruins Bahawalpur' },
  { slug: 'multan-fort', 
    searchTerm: 'Multan Fort Qila Kohna' },
  { slug: 'karachi-cantonment-railway-station', 
    searchTerm: 'Karachi Cantonment railway station' },
  { slug: 'lahore-railway-station', 
    searchTerm: 'Lahore railway station historic' },
  { slug: 'government-college-lahore', 
    searchTerm: 'Government College University Lahore historic' },
  { slug: 'altit-fort', 
    searchTerm: 'Altit Fort Hunza' },
  { slug: 'baltit-fort', 
    searchTerm: 'Baltit Fort Karimabad Hunza' },
  { slug: 'attock-fort', 
    searchTerm: 'Attock Fort Punjab Pakistan' },
  { slug: 'bala-hissar-fort', 
    searchTerm: 'Bala Hissar Fort Peshawar' },
  { slug: 'miri-fort', 
    searchTerm: 'Miri Fort Quetta Balochistan' },
  { slug: 'ram-kot-fort', 
    searchTerm: 'Ram Kot Fort Mangla AJK' },
  { slug: 'sheikhupura-fort', 
    searchTerm: 'Sheikhupura Fort Mughal' },
  { slug: 'chilas-rock-carvings', 
    searchTerm: 'Chilas rock carvings Gilgit' },
  { slug: 'shatial-rock-carvings', 
    searchTerm: 'Shatial rock carvings Indus' },
  { slug: 'khunjerab-rock-carvings', 
    searchTerm: 'Khunjerab rock art Pakistan' },
  { slug: 'shahbazgarhi-rock-edicts', 
    searchTerm: 'Shahbazgarhi Ashoka rock edicts' },
  { slug: 'mansehra-rock-edicts', 
    searchTerm: 'Mansehra Ashoka rock edicts' },
  { slug: 'moola-chotok', 
    searchTerm: 'Moola Chotok Balochistan waterfall' },
  { slug: 'gorakh-hill', 
    searchTerm: 'Gorakh Hill Sindh Pakistan' },
  { slug: 'pir-ghaib', 
    searchTerm: 'Pir Ghaib Balochistan waterfall' },
  { slug: 'ali-masjid-khyber', 
    searchTerm: 'Ali Masjid Khyber Pass mosque' },
  { slug: 'larkana-archaeological-museum', 
    searchTerm: 'Larkana museum Sindh Pakistan' },
  { slug: 'peshawar-museum', 
    searchTerm: 'Peshawar Museum Gandhara' },
  { slug: 'taxila-museum', 
    searchTerm: 'Taxila Museum archaeology' },
  { slug: 'quaid-e-azam-residency-ziarat', 
    searchTerm: 'Quaid-e-Azam Residency Ziarat' },
  { slug: 'tomb-of-shah-shuja', 
    searchTerm: 'Kabuli Gate Lahore Mughal tomb' }
];

// Wikipedia API guidelines
const wikiHeaders = {
  'User-Agent': 'HeritageAIPakistanBot/1.0 (https://heritageai-pakistan.com; contact@heritageai-pakistan.com) Axios/1.7.0'
};

async function getWithRetry(url, options = {}, retries = 3, delayMs = 2000) {
  try {
    return await axios.get(url, options);
  } catch (err) {
    if (err.response && err.response.status === 429 && retries > 0) {
      console.log(`      ⚠️  429 Too Many Requests. Waiting ${delayMs}ms to retry...`);
      await new Promise(r => setTimeout(r, delayMs));
      return await getWithRetry(url, options, retries - 1, delayMs * 2);
    }
    throw err;
  }
}

async function getWikipediaImage(searchTerm) {
  try {
    // First try direct page summary
    const directUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`;
    const res = await getWithRetry(directUrl, { headers: wikiHeaders, timeout: 8000 });
    if (res.data.originalimage?.source) return res.data.originalimage.source;
    if (res.data.thumbnail?.source) return res.data.thumbnail.source;
  } catch {}

  try {
    // Fallback: search Wikipedia then get image
    const searchRes = await getWithRetry(
      `https://en.wikipedia.org/w/api.php`,
      {
        params: {
          action: 'query',
          list: 'search',
          srsearch: searchTerm,
          format: 'json',
          srlimit: 1
        },
        headers: wikiHeaders,
        timeout: 8000
      }
    );
    const results = searchRes.data.query?.search;
    if (!results?.length) return null;

    const pageTitle = results[0].title;
    const summaryRes = await getWithRetry(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`,
      { headers: wikiHeaders, timeout: 8000 }
    );
    return summaryRes.data.originalimage?.source ||
           summaryRes.data.thumbnail?.source || null;
  } catch {
    return null;
  }
}

// Download image locally to base64 buffer and upload to Cloudinary to avoid 429 rate limit issues
async function uploadToCloudinary(imageUrl, slug) {
  const response = await getWithRetry(imageUrl, {
    headers: {
      ...wikiHeaders,
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

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB\n');

  let success = 0;
  let failed = 0;
  const failedList = [];

  for (const { slug, searchTerm } of missingSites) {
    try {
      console.log(`🔍 ${slug}`);

      const wikiUrl = await getWikipediaImage(searchTerm);
      if (!wikiUrl) {
        console.log(`   ⚠️  No image found on Wikipedia\n`);
        failedList.push(slug);
        failed++;
        continue;
      }

      console.log(`   📸 Found image, uploading to Cloudinary...`);
      const cloudinaryUrl = await uploadToCloudinary(wikiUrl, slug);

      const dbSlug = slugMapping[slug] || slug;
      const updated = await Site.findOneAndUpdate(
        { slug: dbSlug },
        { $set: { images: [cloudinaryUrl] } },
        { new: true }
      );

      if (!updated) {
        console.log(`   ⚠️  Could not find site in DB with slug: ${dbSlug}\n`);
        failedList.push(slug);
        failed++;
        continue;
      }

      console.log(`   ✅ Done: ${cloudinaryUrl}\n`);
      success++;

      // Delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 600));

    } catch (err) {
      console.log(`   ❌ Error: ${err.message}\n`);
      failedList.push(slug);
      failed++;
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Success: ${success}`);
  console.log(`❌ Failed:  ${failed}`);
  if (failedList.length) {
    console.log('\nThese need manual upload:');
    failedList.forEach(s => console.log(`  - ${s}`));
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await mongoose.disconnect();
  process.exit();
}

run().catch(console.error);
