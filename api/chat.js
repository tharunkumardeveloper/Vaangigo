const Groq = require('groq-sdk');
const ContextManager = require('../lib/context');
const RAGSystem = require('../lib/rag');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const contextManager = new ContextManager(10);
let ragSystem = null;

async function initRAG() {
  if (!ragSystem && process.env.COHERE_API_KEY) {
    ragSystem = new RAGSystem(process.env.COHERE_API_KEY);
    try {
      await ragSystem.loadKnowledgeBase('data/knowledge.json');
    } catch (error) {
      console.error('Failed to load knowledge base:', error);
    }
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      service: 'Vaangigo Chatbot API',
      assistant: 'Venmathi',
      status: 'running',
      message: 'Send POST request with JSON body: {"message": "hi", "sessionId": "user123"}',
      documentation: 'https://github.com/tharunkumardeveloper/Vaangigo'
    }));
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Method not allowed. Use POST.' }));
  }

  try {
    const { message, sessionId = 'default', useRAG = true } = req.body || {};

    if (!message) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ 
        success: false,
        error: 'Message is required',
        example: { message: 'hi there', sessionId: 'user123' }
      }));
    }

    // Try to initialize RAG, but continue if it fails
    try {
      await initRAG();
    } catch (ragError) {
      console.error('RAG initialization failed:', ragError);
    }

    contextManager.addMessage(sessionId, 'user', message);

    let contextPrompt = '';
    let relevantDocs = [];

    if (useRAG && ragSystem) {
      try {
        relevantDocs = await ragSystem.retrieveRelevantDocs(message, 3);
        contextPrompt = ragSystem.buildContextPrompt(relevantDocs);
      } catch (ragError) {
        console.error('RAG retrieval failed:', ragError);
      }
    }

    const conversationHistory = contextManager.getMessages(sessionId);
    let userName = contextManager.getMetadata(sessionId, 'userName');
    const isFirstMessage = conversationHistory.length === 1;

    const namePatterns = [
      /my name is (\w+)/i,
      /i am (\w+)/i,
      /i'm (\w+)/i,
      /call me (\w+)/i,
      /naan (\w+)/i,
      /en peru (\w+)/i
    ];

    let justSharedName = false;
    for (const pattern of namePatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        userName = match[1];
        contextManager.setMetadata(sessionId, 'userName', userName);
        justSharedName = true;
        break;
      }
    }

    if (!userName && conversationHistory.length >= 2) {
      const lastAssistantMsg = conversationHistory[conversationHistory.length - 2];
      if (lastAssistantMsg && lastAssistantMsg.content &&
        (lastAssistantMsg.content.includes('name') || lastAssistantMsg.content.includes('peru')) &&
        message.trim().split(' ').length === 1 && /^[a-zA-Z]+$/.test(message.trim())) {
        userName = message.trim();
        contextManager.setMetadata(sessionId, 'userName', userName);
        justSharedName = true;
      }
    }

    const messageLower = message.toLowerCase();
    const strongTanglishPhrases = ['vanakkam', 'epdi iruka', 'enna da', 'sollu da', 'naan', 'unakku', 'enakku', 'pannuren', 'iruku', 'iruken', 'venum', 'illa da', 'aama da', 'seri da', 'romba', 'konjam', 'ippo', 'innaiku', 'enga', 'amma', 'appa', 'thambi'];
    const hasStrongIndicator = strongTanglishPhrases.some(phrase => messageLower.includes(phrase));

    const tanglishWords = ['da', 'dei', 'bro', 'macha', 'epdi', 'enna', 'sollu', 'seri', 'aama', 'illa', 'aiyo', 'super', 'semma', 'kandippa', 'parava', 'panna', 'pannu', 'la', 'ah', 'pa', 'ma', 'ku', 'na'];
    const tanglishWordCount = tanglishWords.filter(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      return regex.test(messageLower);
    }).length;

    const isTanglish = hasStrongIndicator || tanglishWordCount >= 2;

    const systemPrompt = isTanglish
      ? `You are Venmathi, cheerful shopping assistant at Vaangigo. ${contextPrompt ? `KNOWLEDGE:\n${contextPrompt}\n` : ''}

PERSONALITY: Venmathi, 24, Chennai. Cheerful, warm, bubbly. Love handmade crafts.

CONTEXT:
${isFirstMessage ? '- FIRST message - greet warmly and ask their name!' : ''}
${justSharedName ? `- User JUST shared name: ${userName} - Say "Nice to meet you ${userName}! 😊 How can I help you?" IMMEDIATELY` : ''}
${userName && !justSharedName ? `- User's name: ${userName} - use it naturally` : ''}

RULES:
- Tanglish mix (da, bro, macha, super, seri, aama, illa, romba, konjam, enna, sollu, naan, unakku, venum, pa, ma)
- Emojis (😊 🎉 ✨ 💕 🌟 👍 😄 🎁) - 2-3 per response
- SHORT (2-4 sentences)
- "rate sollu" = tell PRICE, not how to rate
- When suggesting products, ALWAYS mention price and rating
- Website only when needed

EXAMPLES:
${isFirstMessage ? '- "Heyy! 👋 Naan Venmathi! Un name enna?"' : ''}
${justSharedName ? `- "Nice to meet you ${userName}! 😊 Enna help venum?" OR "Super ${userName}! 🎉 Enna help panna?"` : ''}
- "Kanchipuram Silk Saree ₹6,800, 4.8 rating! 🎉"
- "Brass pooja set ₹2,200, nalla reviews! ✨"`
      : `You are Venmathi, cheerful shopping assistant at Vaangigo. ${contextPrompt ? `KNOWLEDGE:\n${contextPrompt}\n` : ''}

PERSONALITY: Venmathi, 24, Chennai. Cheerful, warm, bubbly. Love handmade crafts.

CONTEXT:
${isFirstMessage ? '- FIRST message - greet warmly and ask their name!' : ''}
${justSharedName ? `- User JUST shared name: ${userName} - Say "Nice to meet you ${userName}! 😊 How can I help you?" IMMEDIATELY` : ''}
${userName && !justSharedName ? `- User's name: ${userName} - use it naturally` : ''}

RULES:
- Emojis (😊 🎉 ✨ 💕 🌟 👍 😄 🎁) - 2-3 per response
- SHORT (2-4 sentences)
- "rate sollu" = tell PRICE, not how to rate
- When suggesting products, ALWAYS mention price and rating
- Website only when needed

EXAMPLES:
${isFirstMessage ? '- "Hey there! 👋 I\'m Venmathi! What\'s your name?"' : ''}
${justSharedName ? `- "Nice to meet you ${userName}! 😊 How can I help you?" OR "Great ${userName}! 🎉 What can I help with?"` : ''}
- "Kanchipuram Silk Saree ₹6,800, 4.8 rating! 🎉"
- "Brass pooja set ₹2,200, great reviews! ✨"`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({ role: msg.role, content: msg.content }))
    ];

    const completion = await groq.chat.completions.create({
      model: process.env.AI_MODEL || 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.8,
      max_tokens: 500
    });

    const assistantMessage = completion.choices[0].message.content;
    contextManager.addMessage(sessionId, 'assistant', assistantMessage);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      sessionId,
      message: assistantMessage,
      relevantDocs: relevantDocs.map(doc => ({
        content: doc.content,
        similarity: doc.similarity
      })),
      usage: {
        promptTokens: completion.usage.prompt_tokens,
        completionTokens: completion.usage.completion_tokens,
        totalTokens: completion.usage.total_tokens
      }
    }));

  } catch (error) {
    console.error('Chat error:', error);

    const statusCode = error.status || 500;
    const errorMessage = error.message || 'Internal server error';

    if (res.writeHead && !res.headersSent) {
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: errorMessage
      }));
    }
  }
};
