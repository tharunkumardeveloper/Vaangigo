const http = require('http');
const chatHandler = require('./api/chat');
const healthHandler = require('./api/health');

const PORT = process.env.PORT || 3001;

const server = http.createServer(async (req, res) => {
  // Parse body for POST requests
  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      if (body) {
        req.body = JSON.parse(body);
      }
    } catch (e) {
      req.body = {};
    }

    // Route requests
    if (req.url === '/api/chat' || req.url === '/chat') {
      await chatHandler(req, res);
    } else if (req.url === '/api/health' || req.url === '/health') {
      await healthHandler(req, res);
    } else if (req.url === '/' || req.url === '/test') {
      // Serve test page
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
<!DOCTYPE html>
<html>
<head>
  <title>Chatbot Test</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
    #chat-container { border: 1px solid #ddd; height: 400px; overflow-y: auto; padding: 15px; margin-bottom: 15px; background: #f9f9f9; }
    .message { margin: 10px 0; padding: 10px; border-radius: 5px; }
    .user { background: #007bff; color: white; text-align: right; }
    .assistant { background: #e9ecef; }
    .system { background: #fff3cd; font-size: 0.9em; font-style: italic; }
    #input-container { display: flex; gap: 10px; }
    #message-input { flex: 1; padding: 10px; font-size: 16px; }
    #send-btn { padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer; }
    #send-btn:disabled { background: #ccc; cursor: not-allowed; }
    .info { background: #d1ecf1; padding: 10px; margin-bottom: 15px; border-radius: 5px; }
  </style>
</head>
<body>
  <h1>🤖 Chatbot Test Interface</h1>
  <div class="info">
    <strong>Session ID:</strong> <span id="session-id"></span><br>
    <strong>Status:</strong> <span id="status">Ready</span>
  </div>
  <div id="chat-container"></div>
  <div id="input-container">
    <input type="text" id="message-input" placeholder="Type your message..." />
    <button id="send-btn">Send</button>
  </div>

  <script>
    const sessionId = 'test-' + Math.random().toString(36).substr(2, 9);
    document.getElementById('session-id').textContent = sessionId;
    
    const chatContainer = document.getElementById('chat-container');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const statusEl = document.getElementById('status');

    function addMessage(role, content) {
      const div = document.createElement('div');
      div.className = 'message ' + role;
      div.textContent = content;
      chatContainer.appendChild(div);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async function sendMessage() {
      const message = messageInput.value.trim();
      if (!message) return;

      addMessage('user', message);
      messageInput.value = '';
      sendBtn.disabled = true;
      statusEl.textContent = 'Thinking...';

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, sessionId, useRAG: true })
        });

        const data = await response.json();
        
        if (data.success) {
          addMessage('assistant', data.message);
          if (data.relevantDocs && data.relevantDocs.length > 0) {
            addMessage('system', '📚 Used ' + data.relevantDocs.length + ' relevant documents');
          }
        } else {
          addMessage('system', '❌ Error: ' + data.error);
        }
      } catch (error) {
        addMessage('system', '❌ Connection error: ' + error.message);
      }

      sendBtn.disabled = false;
      statusEl.textContent = 'Ready';
      messageInput.focus();
    }

    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

    addMessage('system', '👋 Welcome to Indicraft! Ask me about handmade products, gift ideas, or browse our collection!');
  </script>
</body>
</html>
      `);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`📝 Test interface: http://localhost:${PORT}/test`);
  console.log(`💬 API endpoint: http://localhost:${PORT}/api/chat\n`);
});
