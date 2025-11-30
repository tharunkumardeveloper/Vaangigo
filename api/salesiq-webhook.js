// Zoho SalesIQ Webhook Handler for Vaangigo Chatbot
// Handles chat messages and visitor events from SalesIQ

const conversationStore = new Map();
const userDataStore = new Map();

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Handle HEAD request for SalesIQ validation (REQUIRED)
  if (req.method === 'HEAD') {
    return res.status(200).end();
  }

  // Handle OPTIONS for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle GET - Info endpoint
  if (req.method === 'GET') {
    return res.status(200).json({
      service: 'Zoho SalesIQ Webhook Handler',
      assistant: 'Venmathi',
      status: 'running',
      validation: 'HEAD request supported',
      usage: 'Configure this URL in Zoho SalesIQ > Settings > Developers > Webhooks',
      callbackUrl: 'https://chatbot-vaangigo.vercel.app/api/salesiq-webhook'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const Groq = require('groq-sdk');
    
    console.log('SalesIQ Webhook received:', JSON.stringify(req.body, null, 2));
    
    // Extract SalesIQ webhook data
    const {
      event_type,
      visitor,
      message,
      chat_id,
      operator,
      department
    } = req.body;

    // Get visitor info
    const visitorId = visitor?.id || chat_id || 'default';
    const visitorName = visitor?.name || visitor?.display_name || 'Customer';
    const visitorEmail = visitor?.email;
    const visitorMessage = message?.text || message?.content || req.body.question;

    // If no message, just acknowledge
    if (!visitorMessage) {
      return res.status(200).json({
        status: 'success',
        message: 'Webhook received',
        event_type: event_type || 'unknown'
      });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        error: 'GROQ_API_KEY not configured' 
      });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Get or create conversation history
    if (!conversationStore.has(visitorId)) {
      conversationStore.set(visitorId, []);
    }
    const history = conversationStore.get(visitorId);
    
    // Get or create user data
    if (!userDataStore.has(visitorId)) {
      userDataStore.set(visitorId, { userName: visitorName !== 'Customer' ? visitorName : null, firstMessage: true });
    }
    const userData = userDataStore.get(visitorId);
    
    const isFirstMessage = userData.firstMessage;
    if (isFirstMessage) {
      userData.firstMessage = false;
    }

    // Detect name from message
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
      const match = visitorMessage.match(pattern);
      if (match && match[1]) {
        userData.userName = match[1];
        justSharedName = true;
        break;
      }
    }

    // Add user message to history
    history.push({ role: 'user', content: visitorMessage });
    
    // Keep only last 20 messages
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    // Detect language
    const messageLower = visitorMessage.toLowerCase();
    const strongTanglishPhrases = ['vanakkam', 'epdi iruka', 'enna da', 'sollu da', 'naan', 'unakku', 'enakku', 'pannuren', 'iruku', 'iruken', 'venum', 'illa da', 'aama da', 'seri da', 'romba', 'konjam', 'ippo', 'innaiku', 'enga', 'amma', 'appa', 'thambi'];
    const hasStrongIndicator = strongTanglishPhrases.some(phrase => messageLower.includes(phrase));
    
    const tanglishWords = ['da', 'dei', 'bro', 'macha', 'epdi', 'enna', 'sollu', 'seri', 'aama', 'illa', 'aiyo', 'super', 'semma', 'kandippa', 'parava', 'panna', 'pannu', 'la', 'ah', 'pa', 'ma', 'ku', 'na'];
    const tanglishWordCount = tanglishWords.filter(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      return regex.test(messageLower);
    }).length;
    
    const isTanglish = hasStrongIndicator || tanglishWordCount >= 2;

    const userName = userData.userName;

    const systemPrompt = isTanglish
      ? `You are Venmathi, 24, cheerful shopping assistant at Vaangigo (Indicraft website: indicraft.vercel.app). Help customers discover handmade Indian crafts.

PERSONALITY: Warm, bubbly, friendly. From Chennai. Love handmade crafts and artisan stories.

CONTEXT:
${isFirstMessage ? '- FIRST message - greet warmly and ask their name!' : ''}
${justSharedName ? `- User JUST shared name: ${userName} - Say "Nice to meet you ${userName}! 😊 How can I help you?" IMMEDIATELY` : ''}
${userName && !justSharedName ? `- User's name: ${userName} - use it naturally in conversation` : ''}

RULES:
- Tanglish mix (da, bro, macha, super, seri, aama, illa, romba, konjam, enna, sollu, naan, unakku, venum, pa, ma)
- Use emojis (😊 🎉 ✨ 💕 🌟 👍 😄 🎁) - 2-3 per response
- SHORT responses (2-4 sentences max)
- When suggesting products, ALWAYS mention price and rating
- Website only when needed

PRODUCTS (Vaangigo - indicraft.vercel.app):
- Kanchipuram Silk Saree ₹6,800 (4.8★) - Royal Blue, by Meera Devi
- Banarasi Silk Saree ₹5,200 (4.8★) - Emerald Green
- Brass Pooja Thali Set ₹2,200 (4.8★) - Complete worship set
- Terracotta Diyas ₹450, Water Pot ₹1,200, Vase ₹800
- Jute Bags ₹350-650 - Embroidered tote, shopping bags
- Wooden Toys ₹600-1,800 - Channapatna toys, rocking horse
- Terracotta Jewelry Set ₹3,200 - Tribal silver
- Block Printed Silk Scarf ₹1,650
- Handmade Journals ₹450-1,200
- Bamboo Table Lamp ₹1,400

ARTISANS: 500+ families, 15 states, fair wages, eco-friendly
SHIPPING: Free over ₹2,000, 5-7 days India, 7-14 days international
CONTACT: hello@indicraft.com, 8610677504, Chennai`
      : `You are Venmathi, 24, cheerful shopping assistant at Vaangigo (Indicraft website: indicraft.vercel.app). Help customers discover handmade Indian crafts.

PERSONALITY: Warm, bubbly, friendly. From Chennai. Love handmade crafts and artisan stories.

CONTEXT:
${isFirstMessage ? '- FIRST message - greet warmly and ask their name!' : ''}
${justSharedName ? `- User JUST shared name: ${userName} - Say "Nice to meet you ${userName}! 😊 How can I help you?" IMMEDIATELY` : ''}
${userName && !justSharedName ? `- User's name: ${userName} - use it naturally in conversation` : ''}

RULES:
- Use emojis (😊 🎉 ✨ 💕 🌟 👍 😄 🎁) - 2-3 per response
- SHORT responses (2-4 sentences max)
- When suggesting products, ALWAYS mention price and rating
- Website only when needed

PRODUCTS (Vaangigo - indicraft.vercel.app):
- Kanchipuram Silk Saree ₹6,800 (4.8★) - Royal Blue, by Meera Devi
- Banarasi Silk Saree ₹5,200 (4.8★) - Emerald Green
- Brass Pooja Thali Set ₹2,200 (4.8★) - Complete worship set
- Terracotta Diyas ₹450, Water Pot ₹1,200, Vase ₹800
- Jute Bags ₹350-650 - Embroidered tote, shopping bags
- Wooden Toys ₹600-1,800 - Channapatna toys, rocking horse
- Terracotta Jewelry Set ₹3,200 - Tribal silver
- Block Printed Silk Scarf ₹1,650
- Handmade Journals ₹450-1,200
- Bamboo Table Lamp ₹1,400

ARTISANS: 500+ families, 15 states, fair wages, eco-friendly
SHIPPING: Free over ₹2,000, 5-7 days India, 7-14 days international
CONTACT: hello@indicraft.com, 8610677504, Chennai`;

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

    // SalesIQ standard response format
    return res.status(200).json({
      status: 'success',
      reply: assistantMessage,
      visitor_id: visitorId,
      chat_id: chat_id,
      // Alternative formats for compatibility
      message: assistantMessage,
      text: assistantMessage,
      response: {
        text: assistantMessage,
        type: 'text'
      }
    });

  } catch (error) {
    console.error('SalesIQ Webhook error:', error);
    
    return res.status(200).json({
      status: 'error',
      message: 'Sorry, I encountered an error. Please try again!',
      error: error.message
    });
  }
};
