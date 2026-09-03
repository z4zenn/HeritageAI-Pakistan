const Site = require('../models/Site')
const aiService = require('../services/aiService')
const { getPineconeIndex } = require('../config/pinecone')
const { generateEmbedding, buildQueryText } = require('../services/embeddingService')
const Groq = require('groq-sdk')
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// Qwen models wrap chain-of-thought reasoning in <think>...</think> tags.
// Strip these so users only see the clean final response.
function stripThinkingTags(text) {
  if (!text) return text
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
}

async function recommend(req, res, next) {
  try {
    const { interests, region, travelStyle } = req.body

    if (!interests?.length || !travelStyle) {
      return res.status(400).json({
        success: false,
        message: 'Please provide interests and travel style'
      })
    }

    const queryText = buildQueryText(interests, region, travelStyle)
    const queryEmbedding = await generateEmbedding(queryText)

    if (!queryEmbedding) {
      return res.status(500).json({
        success: false,
        message: 'Failed to process your preferences'
      })
    }

    console.log('🔎 Searching Pinecone...')
    const index = await getPineconeIndex()

    const pineconeResults = await index.query({
      vector: queryEmbedding,
      topK: 8,
      includeMetadata: true,
      filter: region && region.toLowerCase() !== 'any' && region.toLowerCase() !== 'all' && region.toLowerCase() !== 'all of pakistan'
        ? { region: { '$eq': region } }
        : undefined
    })

    if (!pineconeResults.matches?.length) {
      return res.status(404).json({
        success: false,
        message: 'No matching sites found'
      })
    }

    const mongoIds = pineconeResults.matches.map(m => m.metadata.mongoId)
    const sites = await Site.find({ _id: { $in: mongoIds } })

    console.log('🤖 Generating personalized reasons...')
    const siteList = sites.map(s =>
      `- ${s.name} (${s.era}, ${s.region}, ${s.type})`
    ).join('\n')

    let reasons = []
    try {
      const completion = await groq.chat.completions.create({
        model: 'qwen/qwen3.6-27b',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: `A heritage tourism user has these preferences:
Interests: ${interests.join(', ')}
Travel style: ${travelStyle}
${region ? `Region: ${region}` : ''}

These Pakistani heritage sites were matched:
${siteList}

Write ONE enthusiastic sentence for each site explaining
why it matches this user's interests. Be specific.

Respond ONLY as valid JSON array, no markdown:
[{ "slug": "site-slug", "reason": "one sentence" }]`
        }]
      })

      const raw = completion.choices[0].message.content
      const cleaned = stripThinkingTags(raw).replace(/```json|```/g, '').trim()
      reasons = JSON.parse(cleaned)
    } catch (err) {
      console.error('Groq error:', err.message)
    }

    const enrichedSites = sites.map(site => {
      const match = pineconeResults.matches.find(
        m => m.metadata.mongoId === site._id.toString()
      )
      const reasonObj = reasons.find(r => r.slug === site.slug)
      return {
        ...site.toObject(),
        similarityScore: match?.score || 0,
        reason: reasonObj?.reason ||
          `${site.name} is a ${site.era} ${site.type} in ${site.region} matching your interests.`
      }
    })
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 5)

    res.json({
      success: true,
      data: enrichedSites,
      query: { interests, travelStyle, region: region || 'All Pakistan' }
    })

  } catch (err) {
    next(err)
  }
}

async function search(req, res, next) {
  try {
    const { query } = req.body
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a search query.'
      })
    }
    const results = await aiService.searchSites(query)
    return res.status(200).json({ success: true, data: results })
  } catch (error) {
    next(error)
  }
}

async function identify(req, res, next) {
  try {
    const { image } = req.body
    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'No image data provided'
      })
    }

    let client;
    let modelName;
    const hasGeminiKey = !!process.env.GEMINI_API_KEY;

    if (hasGeminiKey) {
      const { OpenAI } = require('openai');
      client = new OpenAI({
        apiKey: process.env.GEMINI_API_KEY,
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      });
      modelName = "gemini-2.5-flash";
    } else {
      client = groq;
      modelName = "qwen/qwen3.6-27b";
    }

    const response = await client.chat.completions.create({
      model: modelName,
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: image,
              },
            },
            {
              type: "text",
              text: `
You are an expert in worldwide heritage, landmarks, monuments, archaeology, architecture, and historical sites.

Analyze the provided image carefully and determine whether it depicts a recognizable heritage site, natural landmark, monument, or archaeological site anywhere in the world.

Only identify the site if there is reasonable visual evidence.

If you can identify it with reasonable confidence, respond with ONLY this JSON object:

{
  "identified": true,
  "siteName": "exact site name",
  "confidence": "high",
  "description": "one concise sentence describing the site"
}

The confidence value MUST be exactly one of:
"high"
"medium"
"low"

If you cannot reliably identify the site, respond with ONLY:

{
  "identified": false
}

IMPORTANT RULES:
- Return valid JSON only.
- Do NOT use Markdown.
- Do NOT use code fences.
- Do NOT add explanations before or after the JSON.
- Do NOT invent a site name.
- If the image is unclear, generic, or insufficient to identify a specific site, return {"identified": false}.
              `.trim(),
            },
          ],
        },
      ],
    });

    const text = response?.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error("API returned an empty response.");
    }

    const clean = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const result = JSON.parse(clean);

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Image identification backend error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to identify heritage site.'
    });
  }
}

async function getSiteInfo(req, res, next) {
  try {
    const { siteName } = req.body
    if (!siteName) {
      return res.status(400).json({
        success: false,
        message: 'siteName is required'
      })
    }

    const response = await groq.chat.completions.create({
      model: "qwen/qwen3.6-27b",
      max_tokens: 200,
      messages: [
        {
          role: "system",
          content: `You are an expert on Pakistani heritage sites.
            Given a site name, return ONLY a JSON object with
            these exact fields, no extra text:
            {
              "historySummary": "2-3 sentence history of the site",
              "modernLocation": "modern day city, province, Pakistan",
              "era": "civilization era name",
              "period": "time period e.g. 16th Century CE"
            }
            If the site is not in Pakistan, still return the
            JSON but with a note in historySummary.
            Return JSON only — no markdown, no backticks.`
        },
        {
          role: "user",
          content: `Tell me about: ${siteName}`
        }
      ]
    });

    const text = response.choices[0].message.content;
    const clean = stripThinkingTags(text).replace(/\`\`\`json|\`\`\`/g, "").trim();
    const result = JSON.parse(clean);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('getSiteInfo backend error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to get site info.'
    });
  }
}
async function chat(req, res, next) {
  try {
    const { message, siteData, history } = req.body

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a message.'
      })
    }

    const siteName = siteData?.name || 'Heritage Site'
    const siteType = siteData?.type || 'Monument'
    const siteCity = siteData?.city || 'Pakistan'
    const siteProvince = siteData?.province || 'Pakistan'
    const siteEra = siteData?.era || 'Ancient History'
    const sitePeriod = siteData?.period || 'Unknown'
    const siteDescription = siteData?.description || ''

    const systemPrompt = `You are an expert AI heritage guide for ${siteName}, a ${siteType} located in ${siteCity}, ${siteProvince}, Pakistan. Civilization era: ${siteEra}. Period: ${sitePeriod}. ${siteDescription} You speak in a warm storytelling tone like a passionate local historian, not a textbook. Keep every answer to 3-5 sentences maximum. If asked about booking or visiting, mention they can use the Tour Calculator on this page. Never make up facts — if unsure, say so honestly.`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(Array.isArray(history) ? history.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      })) : []),
      { role: 'user', content: message }
    ]

    const response = await groq.chat.completions.create({
      model: 'qwen/qwen3.6-27b',
      max_tokens: 300,
      messages
    })

    const reply = stripThinkingTags(response.choices[0].message.content)

    return res.status(200).json({
      success: true,
      data: { reply }
    })
  } catch (error) {
    console.error('Chat backend error:', error)
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to generate chat response.'
    })
  }
}

module.exports = { recommend, search, identify, getSiteInfo, chat }