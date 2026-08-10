// services/aiService.js
// Integrates with Anthropic Claude SDK for recommender and search endpoints

const { Anthropic } = require('@anthropic-ai/sdk');
const Site = require('../models/Site');

// Initialize Anthropic client
const apiKey = process.env.ANTHROPIC_API_KEY || 'mock_key_or_replace_me';
let anthropic = null;

if (apiKey && apiKey !== 'mock_key_or_replace_me') {
  anthropic = new Anthropic({ apiKey });
}

// Helper to clean markdown JSON wrapper blocks if Claude returns them
const parseCleanJSON = (text) => {
  let cleaned = text.trim();
  // Strip starting ```json or ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(json)?/, '').replace(/```$/, '').trim();
  }
  return JSON.parse(cleaned);
};

// Fallback search mechanism if Claude API key is not configured
const fallbackSearch = async (query) => {
  console.warn('AI API key is missing/mock. Running database fallback search.');
  const lowercaseQuery = query.toLowerCase();
  
  // Basic search matching query string inside tags, region, name or descriptions
  return await Site.find({
    $or: [
      { name: { $regex: lowercaseQuery, $options: 'i' } },
      { tags: { $in: [new RegExp(lowercaseQuery, 'i')] } },
      { region: { $regex: lowercaseQuery, $options: 'i' } },
      { era: { $regex: lowercaseQuery, $options: 'i' } }
    ]
  }).limit(5);
};

// Fallback recommendation mechanism
const fallbackRecommend = async (interests, region, travelStyle) => {
  console.warn('AI API key is missing/mock. Running database fallback recommendations.');
  
  const filter = {};
  if (region && region.toLowerCase() !== 'any') {
    filter.region = { $regex: new RegExp(`^${region}$`, 'i') };
  }

  const sites = await Site.find(filter);
  
  // Rank sites by matching tags and return top 5
  const scored = sites.map(site => {
    let score = 0;
    // Boost score for matching interests
    if (interests && Array.isArray(interests)) {
      interests.forEach(interest => {
        if (site.tags.includes(interest.toLowerCase())) score += 2;
        if (site.shortDescription.toLowerCase().includes(interest.toLowerCase())) score += 1;
      });
    }
    // Boost for travel style matching tags
    if (travelStyle) {
      if (site.tags.includes(travelStyle.toLowerCase())) score += 2;
    }
    return { site, score };
  });

  // Sort descending and slice top 5
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 5).map(item => {
    const siteObj = item.site.toObject();
    siteObj.recommendationReason = `Matching interest tags including ${interests.slice(0, 3).join(', ')}.`;
    return siteObj;
  });
};

// 1. Get Recommendations
exports.getRecommendations = async (interests, region, travelStyle) => {
  if (!anthropic) {
    return await fallbackRecommend(interests, region, travelStyle);
  }

  try {
    const sites = await Site.find({});
    // Construct simple context of sites to feed to Claude to stay within token limits
    const sitesContext = sites.map(s => ({
      name: s.name,
      slug: s.slug,
      region: s.region,
      era: s.era,
      type: s.type,
      tags: s.tags
    }));

    const prompt = `You are a heritage travel expert for Pakistan.
Given the traveler preferences:
- Interests: ${JSON.stringify(interests)}
- Region: ${region || 'Any'}
- Travel Style: ${travelStyle || 'Any'}

And the list of available historical sites:
${JSON.stringify(sitesContext, null, 2)}

Recommend the top 5 sites that best match these preferences.
Respond ONLY with a raw JSON array of objects, with no markdown code blocks (do NOT use \`\`\`json or \`\`\` backticks), and no explanation text.
The JSON structure must be exactly:
[
  { "slug": "site-slug-name", "reason": "A brief one-line reason why this site matches." }
]`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = response.content[0].text;
    const recommendations = parseCleanJSON(responseText);

    const enrichedSites = [];
    for (const rec of recommendations) {
      const site = await Site.findOne({ slug: rec.slug });
      if (site) {
        const siteObj = site.toObject();
        siteObj.recommendationReason = rec.reason;
        enrichedSites.push(siteObj);
      }
    }

    return enrichedSites;
  } catch (error) {
    console.error('Claude API call failed in getRecommendations:', error);
    return await fallbackRecommend(interests, region, travelStyle);
  }
};

// 2. Search Sites
exports.searchSites = async (query) => {
  if (!anthropic) {
    return await fallbackSearch(query);
  }

  try {
    const sites = await Site.find({});
    // Construct search context
    const sitesContext = sites.map(s => ({
      name: s.name,
      slug: s.slug,
      shortDescription: s.shortDescription,
      tags: s.tags
    }));

    const prompt = `You are an archival historical search engine for Pakistan.
Given the search query: "${query}"

And the list of available historical sites:
${JSON.stringify(sitesContext, null, 2)}

Find and rank the most relevant sites matching the search query by order of relevance.
Respond ONLY with a raw JSON array of strings containing the matching site slugs, with no markdown code blocks (do NOT use \`\`\`json or \`\`\` backticks), and no explanation.
The JSON structure must be exactly:
[
  "site-slug-1",
  "site-slug-2"
]`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = response.content[0].text;
    const matchedSlugs = parseCleanJSON(responseText);

    const matchedSites = [];
    for (const slug of matchedSlugs) {
      const site = await Site.findOne({ slug });
      if (site) {
        matchedSites.push(site);
      }
    }

    return matchedSites;
  } catch (error) {
    console.error('Claude API call failed in searchSites:', error);
    return await fallbackSearch(query);
  }
};
