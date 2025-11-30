const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const conversations = new Map();

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      service: 'Vaangigo Chatbot API (Simple)',
      assistant: 'Venmathi',
      status: 'running',
      message: 'Send POST request with: {"message": "hi", "sessionId": "user123"}'
    }));
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  try {
    const { message, sessionId = 'default' } = req.body || {};

    if (!message) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ 
        success: false,
        error: 'Message is required'
      }));
    }

    // Get or create conversation history
    if (!conversations.has(sessionId)) {
      conversations.set(sessionId, []);
    }
    const history = conversations.get(sessionId);
    
    // Add user message
    history.push({ role: 'user', content: message });
    
    // Keep only last 10 messages
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }

    // Detect language
    const messageLower = message.toLowerCase();
    const tanglishWords = ['da', 'dei', 'bro', 'macha', 'naan', 'enna', 'sollu', 'seri', 'aama', 'illa', 'romba', 'konjam', 'venum', 'pa', 'ma', 'ku', 'na', 'appa', 'amma', 'thambi'];
    const tanglishCount = tanglishWords.filter(word => messageLower.includes(word)).length;
    const isTanglish = tanglishCount >= 2;

    const systemPrompt = isTanglish
      ? `You are Venmathi, cheerful shopping assistant at Vaangigo (Indicraft). 24, Chennai. Help with handmade crafts.

RULES:
- Tanglish mix (da, bro, macha, super, seri, aama, illa, romba, konjam, enna, sollu, naan, unakku, venum, pa, ma)
- Emojis (😊 🎉 ✨ 💕 🌟 👍 😄 🎁) - 2-3 per response
- SHORT (2-4 sentences)
- First message: Ask their name
- Remember and use their name
- "rate sollu" = tell PRICE
- When suggesting products, mention price and rating

Products: Kanchipuram Silk Saree ₹6,800 (4.8★), Brass Pooja Set ₹2,200, Terracotta items ₹450-1,200, Jute bags ₹350-650, Wooden toys ₹600-1,800`
      : `You are Venmathi, cheerful shopping assistant at Vaangigo (Indicraft). 24, Chennai. Help with handmade crafts.

RULES:
- Emojis (😊 🎉 ✨ 💕 🌟 👍 😄 🎁) - 2-3 per response
- SHORT (2-4 sentences)
- First message: Ask their name
- Remember and use their name
- When suggesting products, mention price and rating

Products: Kanchipuram Silk Saree ₹6,800 (4.8★), Brass Pooja Set ₹2,200, Terracotta items ₹450-1,200, Jute bags ₹350-650, Wooden toys ₹600-1,800`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history
    ];

    const completion = await groq.chat.completions.create({
      model: process.env.AI_MODEL || 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.8,
      max_tokens: 500
    });

    const assistantMessage = completion.choices[0].message.content;
    history.push({ role: 'assistant', content: assistantMessage });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      sessionId,
      message: assistantMessage,
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
