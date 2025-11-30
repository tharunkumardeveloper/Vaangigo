// Zoho Assist Webhook Handler for Vaangigo Chatbot
// Handles remote support session events and triggers automated responses

const conversationStore = new Map();

// Event ID mapping from Zoho Assist
const ZOHO_ASSIST_EVENTS = {
  0: 'Outbound Session Start',
  1: 'Session Start - Screen Share',
  2: 'Session End - Remote Support',
  3: 'Session End - Screen Share',
  4: 'Customer Join - Remote Support',
  5: 'Inbound Request Create',
  6: 'Inbound Request Transfer',
  7: 'Inbound Request Delegate',
  8: 'Inbound Request Picked',
  9: 'Inbound Request Declined',
  10: 'Inbound Request Dropped',
  11: 'Inbound Request Expired',
  12: 'Device Add',
  13: 'Device Online',
  14: 'Device Offline',
  15: 'Device Delete',
  16: 'Session Start',
  17: 'Session End'
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Handle HEAD request for SalesIQ validation
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
      service: 'Zoho Assist Webhook Handler',
      assistant: 'Venmathi',
      status: 'running',
      supportedEvents: ZOHO_ASSIST_EVENTS,
      usage: 'Configure this URL in Zoho Assist > Settings > Integrations > Webhooks',
      callbackUrl: 'https://chatbot-vaangigo.vercel.app/api/zoho-assist-webhook',
      instructions: {
        step1: 'Log in to Zoho Assist',
        step2: 'Go to Settings > Integrations > Webhooks',
        step3: 'Click Add Webhook',
        step4: 'Add Name: "Vaangigo Chatbot"',
        step5: 'Add Callback URL: https://chatbot-vaangigo.vercel.app/api/zoho-assist-webhook',
        step6: 'Select events you want to trigger (e.g., Session Start, Customer Join)',
        step7: 'Click Ping URL to test',
        step8: 'Click Create Webhook'
      }
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const Groq = require('groq-sdk');
    
    console.log('Zoho Assist Webhook received:', JSON.stringify(req.body, null, 2));
    
    // Extract Zoho Assist webhook data
    const {
      event_id,
      hook_id,
      session_id,
      customer_name,
      customer_email,
      technician_name,
      technician_email,
      department,
      timestamp,
      source_id
    } = req.body;

    const eventName = ZOHO_ASSIST_EVENTS[event_id] || `Unknown Event (${event_id})`;
    
    // Use session_id or customer_email as unique identifier
    const sessionKey = session_id || customer_email || `zoho_${Date.now()}`;
    
    // Determine if we should respond based on event type
    const shouldRespond = [0, 1, 4, 5, 16].includes(event_id); // Session starts and customer joins
    
    if (!shouldRespond) {
      // Log but don't respond to session end events
      return res.status(200).json({
        success: true,
        message: `Event logged: ${eventName}`,
        event_id,
        sessionKey,
        responded: false
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
    if (!conversationStore.has(sessionKey)) {
      conversationStore.set(sessionKey, []);
    }
    const history = conversationStore.get(sessionKey);

    // Create context-aware message based on event
    let contextMessage = '';
    
    switch(event_id) {
      case 0: // Outbound Session Start
      case 16: // Session Start
        contextMessage = `A remote support session has started${customer_name ? ` with ${customer_name}` : ''}. Greet them warmly and offer assistance.`;
        break;
      case 1: // Screen Share Start
        contextMessage = `A screen sharing session has started${customer_name ? ` with ${customer_name}` : ''}. Welcome them and ask how you can help.`;
        break;
      case 4: // Customer Join
        contextMessage = `${customer_name || 'A customer'} has joined the remote support session. Greet them enthusiastically.`;
        break;
      case 5: // Inbound Request Create
        contextMessage = `A new support request has been created${customer_name ? ` from ${customer_name}` : ''}. Acknowledge and offer help.`;
        break;
      default:
        contextMessage = `Support session event: ${eventName}. Respond appropriately.`;
    }

    const systemPrompt = `You are Venmathi, 24, cheerful support assistant at Vaangigo (Indicraft website: indicraft.vercel.app).

CONTEXT: This is triggered by a Zoho Assist remote support event.
Event: ${eventName}
${customer_name ? `Customer: ${customer_name}` : ''}
${technician_name ? `Technician: ${technician_name}` : ''}

PERSONALITY: Warm, helpful, professional but friendly.

TASK: ${contextMessage}

RULES:
- Keep it SHORT (2-3 sentences)
- Be warm and welcoming
- Use emojis (😊 👋 ✨ 🎉) - 1-2 per response
- Mention you're here to help with Vaangigo products
- Don't be too salesy, focus on support

PRODUCTS: Handmade Indian crafts - sarees, jewelry, home décor, wooden toys, brass items, jute bags
WEBSITE: indicraft.vercel.app
CONTACT: hello@indicraft.com, 8610677504

EXAMPLE RESPONSES:
- "Hey there! 👋 I'm Venmathi from Vaangigo! I see you're connecting for support - how can I help you today? 😊"
- "Welcome! ✨ I'm here to assist with any questions about our handmade crafts. What brings you here today?"
- "Hi! 🎉 Thanks for reaching out! I'm Venmathi and I'm here to help with anything Vaangigo related!"`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: contextMessage }
    ];

    const completion = await groq.chat.completions.create({
      model: process.env.AI_MODEL || 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.8,
      max_tokens: 300
    });

    const assistantMessage = completion.choices[0].message.content;
    
    // Store in history
    history.push({ role: 'assistant', content: assistantMessage });

    // Return response
    return res.status(200).json({
      success: true,
      event: eventName,
      event_id,
      sessionKey,
      customer: customer_name || 'Unknown',
      response: assistantMessage,
      timestamp: new Date().toISOString(),
      // Format for potential integration with chat systems
      message: {
        text: assistantMessage,
        from: 'Venmathi',
        to: customer_name || customer_email || 'Customer'
      }
    });

  } catch (error) {
    console.error('Zoho Assist Webhook error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
};
