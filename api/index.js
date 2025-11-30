module.exports = async (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  return res.end(JSON.stringify({
    name: 'Vaangigo Chatbot API',
    version: '1.0.0',
    status: 'running',
    assistant: 'Venmathi',
    endpoints: {
      chat: {
        method: 'POST',
        url: '/api/chat',
        description: 'Chat with Venmathi AI assistant',
        example: {
          message: 'hi there',
          sessionId: 'user123',
          useRAG: true
        }
      },
      health: {
        method: 'GET',
        url: '/api/health',
        description: 'Health check endpoint'
      }
    },
    documentation: 'https://github.com/tharunkumardeveloper/Vaangigo',
    contact: {
      email: 'hello@indicraft.com',
      phone: '8610677504',
      website: 'indicraft.vercel.app'
    }
  }));
};
