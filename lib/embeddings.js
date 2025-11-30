const { CohereClient } = require('cohere-ai');

class EmbeddingService {
  constructor(apiKey) {
    this.cohere = new CohereClient({ token: apiKey });
  }

  async generateEmbedding(text) {
    try {
      const response = await this.cohere.embed({
        texts: [text],
        model: 'embed-english-v3.0',
        inputType: 'search_query'
      });
      return response.embeddings[0];
    } catch (error) {
      console.error('Embedding generation error:', error);
      throw error;
    }
  }

  async generateEmbeddings(texts) {
    try {
      const response = await this.cohere.embed({
        texts,
        model: 'embed-english-v3.0',
        inputType: 'search_document'
      });
      return response.embeddings;
    } catch (error) {
      console.error('Batch embedding error:', error);
      throw error;
    }
  }

  cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
}

module.exports = EmbeddingService;
