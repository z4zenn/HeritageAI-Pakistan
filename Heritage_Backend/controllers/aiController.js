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
      max_tokens: 800,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a JSON-only API. You must respond strictly with valid RFC8259 JSON. Do not include markdown code blocks, backticks, or any introductory/closing text. Return a JSON object with these exact fields:
{
  "historySummary": "2-3 sentence history of the site",
  "modernLocation": "modern day city, province, Pakistan",
  "era": "civilization era name",
  "period": "time period e.g. 16th Century CE"
}`
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
        historySummary: "A landmark site of profound archaeological and cultural heritage.",
        modernLocation: "Pakistan",
        era: "Historical Era",
        period: "Ancient"
      };
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