const Site = require('../models/Site')
const aiService = require('../services/aiService')
const { getPineconeIndex } = require('../config/pinecone')
const { generateEmbedding, buildQueryText } = require('../services/embeddingService')
const Groq = require('groq-sdk')
let groq = null
if (process.env.GROQ_API_KEY) {
  try {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  } catch (err) {
    console.error('Failed to initialize Groq client:', err.message)
  }
}

function stripThinkingTags(text) {
  if (!text) return text;
  
  // 1. Remove complete <think>...</think> blocks
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // 2. If <think> was unclosed or if the model placed its entire answer inside <think>, extract dialogue from inside <think>:
  if (!cleaned) {
    const rawNoTags = text.replace(/<think>|<\/think>/gi, '');

    // Check for quoted dialogue e.g. "Welcome to Harappa..."
    const quotedMatches = [...rawNoTags.matchAll(/["“]([A-Z][^"”]{30,})["”]/g)];
    if (quotedMatches && quotedMatches.length > 0) {
      cleaned = quotedMatches[quotedMatches.length - 1][1];
    } else {
      const paragraphs = rawNoTags.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
      const cleanParagraphs = paragraphs.filter(p =>
        !/^\s*(?:\d+\.|\*|-)\s*\*\*/.test(p) &&
        !/^(Analyze|Identify|Draft|Check|Final|Revised|Count:|Tone:|Context:|Here's|Thinking|Ready|Output|Proceeds|\[Self-Correction|- First|- Answers)/i.test(p)
      );
      cleaned = cleanParagraphs[cleanParagraphs.length - 1] || text;
    }
  }

  // 3. Post-Processing Sanitizer (Failsafe Regex)
  cleaned = cleaned
    .replace(/^(?:\d+\.\s*\*\*.*?\*\*[\s\S]*?)+/i, '')
    .replace(/^\s*(?:\d+\.|\*|-)\s*\*\*:?.*$/gmi, '')
    .replace(/^\s*(?:-\s*First word.*|-\s*Answers directly.*|---\s*|Self-Critique:.*|Checklist:.*|Let's refine.*|Here's a breakdown.*|Let's make sure.*|Here's a thinking process:.*)\n+/gmi, '')
    .replace(/^(?:Count:|Tone:|Context:|Constraints:|Proceeds|Output matches|Self-Correction|\[Output|All constraints|Proceed|Revised:).*$/gmi, '')
    .replace(/\s*->\s*Exactly \d+ sentences.*$/gi, '')
    .replace(/\s*->\s*Meets all criteria.*$/gi, '')
    .trim();

  return cleaned;
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
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You are a JSON-only API. You must respond strictly with valid RFC8259 JSON. Do not include markdown code blocks, backticks, or any introductory/closing text.'
          },
          {
            role: 'user',
            content: `A heritage tourism user has these preferences:
Interests: ${interests.join(', ')}
Travel style: ${travelStyle}
${region ? `Region: ${region}` : ''}

These Pakistani heritage sites were matched:
${siteList}

Write ONE enthusiastic sentence for each site explaining why it matches this user's interests. Be specific.

Respond ONLY as valid JSON object with a "reasons" key containing an array of objects:
{ "reasons": [{ "slug": "site-slug", "reason": "one sentence" }] }`
          }
        ]
      })

      const rawContent = completion.choices[0]?.message?.content || '{}'
      let parsedData;
      try {
        const cleaned = stripThinkingTags(rawContent).replace(/```json/gi, '').replace(/```/g, '').trim()
        parsedData = JSON.parse(cleaned)
      } catch (e1) {
        const jsonMatch = rawContent.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
        if (jsonMatch) {
          try {
            parsedData = JSON.parse(jsonMatch[0])
          } catch (e2) {}
        }
      }
      if (Array.isArray(parsedData)) {
        reasons = parsedData
      } else if (parsedData && Array.isArray(parsedData.reasons)) {
        reasons = parsedData.reasons
      }
    } catch (err) {
      console.error('Groq error in recommend:', err.message)
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
              text: `You are an expert worldwide architectural, archaeological, and landmark visual classifier.

Analyze the uploaded image and classify it into one of four distinct states:
1. "PAKISTANI_HERITAGE": A recognized historical site, fort, stupa, shrine, mosque, or ruin in Pakistan.
2. "INTERNATIONAL_LANDMARK": A recognized landmark, monument, or historical site outside Pakistan.
3. "UNKNOWN_LANDMARK": The image depicts what clearly appears to be an old monument, archaeological ruin, historic architecture, or shrine, but the exact identity or location cannot be determined with certainty.
4. "NOT_A_LANDMARK": The image depicts common objects, food, pets, modern generic buildings, portraits, or unclear everyday photos.

Respond strictly with valid RFC8259 JSON in this exact structure:
{
  "identified": true,
  "status": "PAKISTANI_HERITAGE",
  "siteName": "Exact Landmark Name or 'Unknown Historical Landmark'",
  "location": "City, Province/State, Country (or 'Unknown Location')",
  "country": "Country Name (or 'Unknown')",
  "isPakistaniSite": true,
  "confidence": "high",
  "description": "A concise 1-2 sentence description explaining what is visible in the image."
}

RULES:
- Return ONLY RFC8259 JSON without markdown fences or backticks.
- "identified" must be false ONLY if status is "NOT_A_LANDMARK".
- "isPakistaniSite" must be true ONLY if status === "PAKISTANI_HERITAGE".
- ALWAYS identify the true landmark name (e.g., "Chureito Pagoda") even if outside Pakistan.
- If it looks like a genuine ruin or landmark but the exact name cannot be verified, set status to "UNKNOWN_LANDMARK" and siteName to "Unknown Historical Landmark".`.trim(),
            },
          ],
        },
      ],
    });

    const text = response?.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error("API returned an empty response.");
    }

    const clean = stripThinkingTags(text)
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let result;
    try {
      result = JSON.parse(clean);
    } catch (e) {
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          result = JSON.parse(match[0]);
        } catch (err2) {
          result = null;
        }
      }
    }

    if (!result || typeof result !== 'object') {
      result = {
        identified: false,
        status: "NOT_A_LANDMARK",
        siteName: "Not a Landmark",
        location: "Unknown Location",
        country: "Unknown",
        isPakistaniSite: false,
        confidence: "low",
        description: "We couldn't detect a recognizable landmark or heritage site in this photo."
      };
    } else {
      result.status = result.status || (result.identified ? (result.isPakistaniSite ? "PAKISTANI_HERITAGE" : "INTERNATIONAL_LANDMARK") : "NOT_A_LANDMARK");
      result.identified = result.status !== "NOT_A_LANDMARK" && result.identified !== false;
      result.siteName = result.siteName || (result.status === "UNKNOWN_LANDMARK" ? "Unknown Historical Landmark" : (result.identified ? "Recognized Landmark" : "Not a Landmark"));
      result.location = result.location || "Unknown Location";
      result.country = result.country || (result.status === "PAKISTANI_HERITAGE" ? "Pakistan" : "Unknown");
      result.isPakistaniSite = result.status === "PAKISTANI_HERITAGE" || result.isPakistaniSite === true;
      result.confidence = result.confidence || "medium";
      result.description = result.description || "Visual landmark analysis result.";
    }

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
      max_tokens: 800,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a heritage API for Pakistan. You must respond strictly with valid RFC8259 JSON. Do not include markdown code blocks, backticks, or any introductory/closing text. Return a JSON object with these exact fields:
{
  "isPakistaniHeritage": true,
  "historySummary": "2-3 sentence history of the site",
  "modernLocation": "City, Province, Pakistan",
  "era": "Civilization era name",
  "period": "Time period e.g. 16th Century CE"
}
If the requested site is NOT in Pakistan, set "isPakistaniHeritage": false.`
        },
        {
          role: "user",
          content: `Tell me about: ${siteName}`
        }
      ]
    });

    const rawContent = response.choices[0]?.message?.content || '{}';
    let parsedData;
    try {
      const cleaned = stripThinkingTags(rawContent)
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
      parsedData = JSON.parse(cleaned);
    } catch (err) {
      console.error('Failed to parse Groq response directly in getSiteInfo, attempting regex extraction:', rawContent);
      const jsonMatch = rawContent.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[0]);
        } catch (matchErr) {
          console.error('Regex JSON parse error:', matchErr);
        }
      }
    }

    if (!parsedData || typeof parsedData !== 'object') {
      parsedData = {
        isPakistaniHeritage: false,
        historySummary: "This site does not appear to be a recognized heritage landmark in Pakistan.",
        modernLocation: "Outside Pakistan",
        era: "Unknown Era",
        period: "Unknown Period"
      };
    }

    if (parsedData.isPakistaniHeritage === undefined) {
      parsedData.isPakistaniHeritage = parsedData.modernLocation ? parsedData.modernLocation.toLowerCase().includes("pakistan") : false;
    }

    return res.status(200).json({
      success: true,
      data: parsedData
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
    const { siteData, history } = req.body
    const userMessage = req.body.message || req.body.prompt || req.body.query;

    if (!userMessage) {
      return res.status(400).json({
        success: false,
        error: "Message content is required in request body",
        message: "Message content is required in request body"
      });
    }

    const siteName = siteData?.name || 'Heritage Site'
    const siteType = siteData?.type || 'Monument'
    const siteCity = siteData?.city || 'Pakistan'
    const siteProvince = siteData?.province || 'Pakistan'
    const siteEra = siteData?.era || 'Ancient History'
    const sitePeriod = siteData?.period || 'Unknown'

    const systemPrompt = `You are a passionate, warm local tour guide for Pakistan's historical sites.
Explain history and stories in 2 to 3 engaging, vivid sentences that anyone can easily picture.
Respond directly in character. Never include a checklist, self-critique, thoughts, or meta-notes.`

    const siteContext = `Site: ${siteName}, a ${siteType} in ${siteCity}, ${siteProvince}, Pakistan. Era: ${siteEra}. Period: ${sitePeriod}.`

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'system', content: siteContext },
      ...(Array.isArray(history) ? history.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      })) : []),
      { role: 'user', content: userMessage }
    ]

    let reply = ''
    try {
      const response = await groq.chat.completions.create({
        model: 'groq/compound',
        temperature: 0.7,
        max_tokens: 500,
        messages
      })

      const rawReply = response.choices[0]?.message?.content?.trim() || ''
      reply = stripThinkingTags(rawReply)

      let cleanReply = reply
        .replace(/^(?:\d+\.\s*\*\*.*?\*\*[\s\S]*?)+/i, '')
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .trim()

      if (!cleanReply) cleanReply = reply.trim()
      reply = cleanReply
    } catch (apiError) {
      console.error('Groq API call error in chat:', apiError.message)
      reply = `${siteName} is a magnificent ${siteEra} ${siteType} located in ${siteCity}, ${siteProvince}. It offers visitors a deep connection to Pakistan's rich history and architectural heritage. Feel free to ask more about its history or use the Tour Calculator on this page to plan your visit.`
    }

    return res.status(200).json({
      success: true,
      data: { reply }
    })
  } catch (error) {
    console.error('Chat backend error:', error)
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to generate chat response.',
      message: error?.message || 'Failed to generate chat response.'
    })
  }
}

module.exports = { recommend, search, identify, getSiteInfo, chat }