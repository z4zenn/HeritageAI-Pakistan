require('dotenv').config()
const mongoose = require('mongoose')
const Site = require('../models/Site')
const { Pinecone } = require('@pinecone-database/pinecone')
const { generateEmbedding, buildSiteText } = require('../services/embeddingService')

async function indexAllSites() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('✅ Connected to MongoDB')

  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
  const index = pinecone.index('heritage-sites')

  const sites = await Site.find({}).lean()
  console.log(`📍 Found ${sites.length} sites\n`)

  let success = 0
  let failed = 0

  for (const site of sites) {
    try {
      if (!site.slug) {
        console.log(`⚠️  No slug: ${site.name}`)
        failed++
        continue
      }

      const text = buildSiteText(site)
      const embedding = await generateEmbedding(text)

      if (!embedding || embedding.length === 0) {
        console.log(`❌ No embedding: ${site.name}`)
        failed++
        continue
      }

      console.log(`📐 ${site.name} — ${embedding.length} dims`)

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
      }])

      console.log(`✅ Indexed: ${site.name}\n`)
      success++
      await new Promise(r => setTimeout(r, 200))

    } catch (err) {
      console.log(`❌ Failed: ${site.name} — ${err.message}`)
      console.log('Full error:', err)
      failed++
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`✅ Success: ${success}`)
  console.log(`❌ Failed:  ${failed}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  await mongoose.disconnect()
  process.exit()
}

indexAllSites().catch(console.error)