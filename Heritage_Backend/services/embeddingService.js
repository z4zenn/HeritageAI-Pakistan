let extractor = null

async function generateEmbedding(text) {
  try {
    if (!extractor) {
      const { pipeline } = await import('@xenova/transformers')
      extractor = await pipeline(
        'feature-extraction', 
        'Xenova/all-MiniLM-L6-v2'
      )
      console.log('✅ Model loaded')
    }
    const output = await extractor(text, { 
      pooling: 'mean', 
      normalize: true 
    })
    return Array.from(output.data)
  } catch (err) {
    console.error('Embedding error:', err.message)
    return null
  }
}

function buildSiteText(site) {
  return [
    site.name,
    site.type,
    site.region,
    'Pakistan',
    site.era,
    site.shortDescription,
    site.fullDescription,
    site.tags?.join(' ')
  ].filter(Boolean).join('. ')
}

function buildQueryText(interests, region, travelStyle) {
  return [
    interests?.join(', '),
    travelStyle,
    region ? `region ${region}` : '',
    'heritage sites Pakistan'
  ].filter(Boolean).join('. ')
}

module.exports = { generateEmbedding, buildSiteText, buildQueryText }