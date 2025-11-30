// Full-featured webhook endpoint for Vaangigo chatbot
const conversationStore = new Map();
const userDataStore = new Map();

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle HEAD request for Zobot validation
  if (req.method === 'HEAD') {
    return res.status(200).end();
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      service: 'Vaangigo Chatbot Webhook',
      assistant: 'Venmathi',
      status: 'running',
      features: ['Context Awareness', 'Name Memory', 'Bilingual (English/Tanglish)', 'Product Knowledge', 'E-commerce Actions'],
      usage: 'Send POST with: {"message": "hi", "sessionId": "user123"}',
      example: {
        url: 'https://chatbot-vaangigo.vercel.app/api/webhook',
        method: 'POST',
        body: { message: 'hi there', sessionId: 'user123' }
      }
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const Groq = require('groq-sdk');
    const { message, sessionId = 'default', init = false } = req.body || {};

    // If init=true or no message, send first greeting
    if (init || !message) {
      const userData = userDataStore.get(sessionId) || { userName: null, firstMessage: true };
      
      const greetingMessage = "Hey there! 👋 I'm Venmathi from Vaangigo! So happy to meet you 😊\n\nWe sell authentic handmade Indian crafts - sarees, jewelry, home décor, wooden toys, brass items, jute bags, and more! We work directly with 500+ artisans across India. ✨\n\nWhat's your name? 🌟";
      
      // Initialize conversation
      if (!conversationStore.has(sessionId)) {
        conversationStore.set(sessionId, []);
      }
      if (!userDataStore.has(sessionId)) {
        userDataStore.set(sessionId, { userName: null, firstMessage: true });
      }
      
      const history = conversationStore.get(sessionId);
      history.push({ role: 'assistant', content: greetingMessage });
      
      // Zobot-compatible response format
      return res.status(200).json({
        replies: [
          {
            text: greetingMessage
          }
        ],
        suggestions: ['Share my name', 'Browse products', 'Gift ideas', 'Contact info'],
        success: true,
        sessionId,
        assistant: 'Venmathi'
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
    if (!conversationStore.has(sessionId)) {
      conversationStore.set(sessionId, []);
    }
    const history = conversationStore.get(sessionId);
    
    // Get or create user data
    if (!userDataStore.has(sessionId)) {
      userDataStore.set(sessionId, { userName: null, firstMessage: true });
    }
    const userData = userDataStore.get(sessionId);
    
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
      const match = message.match(pattern);
      if (match && match[1]) {
        userData.userName = match[1];
        justSharedName = true;
        break;
      }
    }
    
    // If previous message asked for name and this is just a name
    if (!userData.userName && history.length >= 2) {
      const lastMsg = history[history.length - 1];
      if (lastMsg && lastMsg.content && 
          (lastMsg.content.includes('name') || lastMsg.content.includes('peru')) &&
          message.trim().split(' ').length === 1 && /^[a-zA-Z]+$/.test(message.trim())) {
        userData.userName = message.trim();
        justSharedName = true;
      }
    }

    // Add user message to history
    history.push({ role: 'user', content: message });
    
    // Keep only last 10 messages
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    // Detect language
    const messageLower = message.toLowerCase();
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
- "rate sollu" = tell PRICE, not how to rate
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
CONTACT: hello@indicraft.com, 8610677504, Chennai

EXAMPLES:
${isFirstMessage ? '- "Heyy! 👋 Naan Venmathi! Un name enna?"' : ''}
${justSharedName ? `- "Nice to meet you ${userName}! 😊 Enna help venum?"` : ''}
- "Kanchipuram Silk Saree ₹6,800, 4.8 rating! 🎉 Super quality!"
- "Un appa ku brass pooja set ₹2,200 try pannu! ✨"`
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
CONTACT: hello@indicraft.com, 8610677504, Chennai

EXAMPLES:
${isFirstMessage ? '- "Hey there! 👋 I\'m Venmathi! What\'s your name?"' : ''}
${justSharedName ? `- "Nice to meet you ${userName}! 😊 How can I help you?"` : ''}
- "Kanchipuram Silk Saree ₹6,800, 4.8 rating! 🎉 Super quality!"
- "For your dad, try Brass Pooja Set ₹2,200! ✨"`;

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

    // Generate dynamic suggestions based on context
    let suggestions = [];
    if (!userData.userName) {
      suggestions = ['Share my name', 'Browse products', 'Gift ideas'];
    } else if (messageLower.includes('gift') || messageLower.includes('buy')) {
      suggestions = ['Show sarees', 'Show jewelry', 'Show home décor', 'Check prices'];
    } else if (messageLower.includes('price') || messageLower.includes('rate')) {
      suggestions = ['Add to cart', 'Shipping info', 'More products'];
    } else {
      suggestions = ['Browse products', 'Gift ideas', 'Shipping info', 'Contact us'];
    }

    // Zobot-compatible response format
    return res.status(200).json({
      replies: [
        {
          text: assistantMessage
        }
      ],
      suggestions: suggestions,
      success: true,
      sessionId,
      context: {
        userName: userData.userName,
        conversationLength: history.length / 2
      }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};
