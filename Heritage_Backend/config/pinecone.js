const { Pinecone } = require('@pinecone-database/pinecone')

const INDEX_NAME = 'heritage-sites'
let pineconeInstance = null

async function getPineconeIndex() {
  if (!pineconeInstance) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      throw new Error('Pinecone API Key is missing. Please set PINECONE_API_KEY in your .env file.');
    }
    pineconeInstance = new Pinecone({
      apiKey: apiKey
    })
  }
  return pineconeInstance.index(INDEX_NAME)
}

module.exports = { getPineconeIndex }
