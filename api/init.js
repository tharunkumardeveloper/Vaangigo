// Initialize conversation - bot sends first message
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      service: 'Vaangigo Chatbot Initialization',
      usage: 'Send POST with: {"sessionId": "user123"}',
      description: 'Bot will send first greeting message'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId = 'default', language = 'auto' } = req.body || {};

    // Detect if user prefers Tanglish
    const isTanglish = language === 'tanglish' || language === 'tamil';

    const greetingMessage = isTanglish
      ? "Heyy! 👋 Naan Venmathi, Vaangigo la work pannuren! Romba happy-ah iruku unna meet panna 😊\n\nNaanga authentic handmade Indian crafts sell pannuvom - sarees, jewelry, home décor, wooden toys, brass items, jute bags ellam iruku! 500+ artisans kooda directly work pannuvom. ✨\n\nUn name enna? 🌟"
      : "Hey there! 👋 I'm Venmathi from Vaangigo! So happy to meet you 😊\n\nWe sell authentic handmade Indian crafts - sarees, jewelry, home décor, wooden toys, brass items, jute bags, and more! We work directly with 500+ artisans across India. ✨\n\nWhat's your name? 🌟";

    return res.status(200).json({
      success: true,
      sessionId,
      message: greetingMessage,
      assistant: 'Venmathi',
      service: 'Vaangigo',
      nextAction: 'Send user response to /api/webhook'
    });

  } catch (error) {
    console.error('Init error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};
