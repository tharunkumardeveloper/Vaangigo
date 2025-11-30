const EmbeddingService = require('./embeddings');
const fs = require('fs');
const path = require('path');

class RAGSystem {
  constructor(cohereApiKey) {
    this.embeddingService = new EmbeddingService(cohereApiKey);
    this.documents = [];
    this.documentEmbeddings = [];
  }

  async loadKnowledgeBase(knowledgePath) {
    try {
      const dataPath = path.join(process.cwd(), knowledgePath);
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      this.documents = data.documents;

      // Load e-commerce actions knowledge
      try {
        const ecommercePath = path.join(process.cwd(), 'data/ecommerce-knowledge.json');
        const ecommerceData = JSON.parse(fs.readFileSync(ecommercePath, 'utf8'));
        this.documents = [...this.documents, ...ecommerceData.documents];
      } catch (e) {
        console.log('E-commerce knowledge file not found');
      }

      // Load task-based prompts
      try {
        const taskPromptsPath = path.join(process.cwd(), 'data/task-prompts.json');
        const taskData = JSON.parse(fs.readFileSync(taskPromptsPath, 'utf8'));
        
        // Convert task prompts to documents
        const taskDocs = [];
        for (const category in taskData.buyer_tasks) {
          taskData.buyer_tasks[category].forEach(task => {
            taskDocs.push({
              id: `task_${task.task}`,
              content: `Task: ${task.task.replace(/_/g, ' ')}. English: ${task.prompt} Tanglish: ${task.tanglish}`,
              metadata: { category: 'task', topic: task.task }
            });
          });
        }
        this.documents = [...this.documents, ...taskDocs];
      } catch (e) {
        console.log('Task prompts file not found');
      }

      // Load extended task prompts
      try {
        const extendedPath = path.join(process.cwd(), 'data/task-prompts-extended.json');
        const extendedData = JSON.parse(fs.readFileSync(extendedPath, 'utf8'));
        
        const extendedDocs = [];
        for (const category in extendedData) {
          extendedData[category].forEach(task => {
            extendedDocs.push({
              id: `extended_${task.task}`,
              content: `Task: ${task.task.replace(/_/g, ' ')}. English: ${task.prompt} Tanglish: ${task.tanglish}`,
              metadata: { category: 'task', topic: task.task }
            });
          });
        }
        this.documents = [...this.documents, ...extendedDocs];
      } catch (e) {
        console.log('Extended task prompts file not found');
      }

      // Generate embeddings for all documents
      const texts = this.documents.map(doc => doc.content);
      this.documentEmbeddings = await this.embeddingService.generateEmbeddings(texts);
      
      console.log(`Loaded ${this.documents.length} documents into knowledge base`);
    } catch (error) {
      console.error('Error loading knowledge base:', error);
      throw error;
    }
  }

  async retrieveRelevantDocs(query, topK = 3) {
    if (this.documents.length === 0) {
      return [];
    }

    try {
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);
      
      const similarities = this.documentEmbeddings.map((docEmb, idx) => ({
        document: this.documents[idx],
        similarity: this.embeddingService.cosineSimilarity(queryEmbedding, docEmb)
      }));

      similarities.sort((a, b) => b.similarity - a.similarity);
      
      return similarities.slice(0, topK).map(item => ({
        content: item.document.content,
        metadata: item.document.metadata,
        similarity: item.similarity
      }));
    } catch (error) {
      console.error('Error retrieving documents:', error);
      return [];
    }
  }

  buildContextPrompt(relevantDocs) {
    if (relevantDocs.length === 0) {
      return '';
    }

    const context = relevantDocs
      .map((doc, idx) => `[${idx + 1}] ${doc.content}`)
      .join('\n\n');

    return `Use the following context to answer the user's question:\n\n${context}\n\n`;
  }
}

module.exports = RAGSystem;
