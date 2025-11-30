// Standalone webhook endpoint - no external dependencies except Groq
module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      service: 'Vaangigo Chatbot Webhook',
      assistant: 'Venmathi',
      status: 'running',
      usage: 'Send POST with: {"message": "hi", "sessionId": "user123"}',
      example: {
        url: 'https://vaangigo-chat.vercel.app/api/webhook',
        method: 'POST',
        body: { message: 'hi there', sessionId: 'user123' }
      }
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if Groq SDK is available
    let Groq;
    try {
      Groq = require('groq-sdk');
    } catch (e) {
      return res.status(500).json({ 
        success: false, 
        error: 'Groq SDK not installed. Run: npm install groq-sdk' 
      });
    }

    const { message, sessionId = 'default' } = req.body || {};

    if (!message) {
      return res.status(400).json({ 
        success: false,
        error: 'Message is required',
        example: { message: 'hi there', sessionId: 'user123' }
      });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        error: 'GROQ_API_KEY not configured in Vercel environment variables' 
      });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Simple conversation without persistent storage
    const messageLower = message.toLowerCase();
    const tanglishWords = ['da', 'dei', 'bro', 'macha', 'naan', 'enna', 'sollu', 'seri', 'aama', 'illa', 'romba', 'konjam', 'venum', 'pa', 'ma', 'ku', 'na', 'appa', 'amma', 'thambi', 'vanakkam'];
    const tanglishCount = tanglishWords.filter(word => messageLower.includes(word)).length;
    const isTanglish = tanglishCount >= 2;

    const systemPrompt = isTanglish
      ? `You are Venmathi, 24, cheerful shopping assistant at Vaangigo (Indicraft website: indicraft.vercel.app). Help customers discover handmade Indian crafts.

PERSONALITY: Warm, bubbly, friendly. From Chennai.

RULES:
- Tanglish mix (da, bro, macha, super, seri, aama, illa, romba, konjam, enna, sollu, naan, unakku, venum, pa, ma)
- Use emojis (😊 🎉 ✨ 💕 🌟 👍 😄 🎁) - 2-3 per response
- SHORT responses (2-4 sentences)
- First message: Ask their name
- "rate sollu" = tell PRICE
- When suggesting products, mention price and rating

PRODUCTS:
- Kanchipuram Silk Saree ₹6,800 (4.8★)
- Banarasi Silk Saree ₹5,200 (4.8★)
- Brass Pooja Set ₹2,200 (4.8★)
- Terracotta items ₹450-1,200
- Jute bags ₹350-650
- Wooden toys ₹600-1,800
- Terracotta jewelry ₹3,200

CONTACT: hello@indicraft.com, 8610677504, Chennai`
      : `You are Venmathi, 24, cheerful shopping assistant at Vaangigo (Indicraft website: indicraft.vercel.app). Help customers discover handmade Indian crafts.

PERSONALITY: Warm, bubbly, friendly. From Chennai.

RULES:
- Use emojis (😊 🎉 ✨ 💕 🌟 👍 😄 🎁) - 2-3 per response
- SHORT responses (2-4 sentences)
- First message: Ask their name
- When suggesting products, mention price and rating

PRODUCTS:
- Kanchipuram Silk Saree ₹6,800 (4.8★)
- Banarasi Silk Saree ₹5,200 (4.8★)
- Brass Pooja Set ₹2,200 (4.8★)
- Terracotta items ₹450-1,200
- Jute bags ₹350-650
- Wooden toys ₹600-1,800
- Terracotta jewelry ₹3,200

CONTACT: hello@indicraft.com, 8610677504, Chennai`;

    const completion = await groq.chat.completions.create({
      model: process.env.AI_MODEL || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.8,
      max_tokens: 500
    });

    const assistantMessage = completion.choices[0].message.content;

    return res.status(200).json({
      success: true,
      sessionId,
      message: assistantMessage,
      usage: {
        promptTokens: completion.usage.prompt_tokens,
        completionTokens: completion.usage.completion_tokens,
        totalTokens: completion.usage.total_tokens
      }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      details: error.toString()
    });
  }
};
