// Simple CLI test script
require('dotenv').config();
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const sessionId = 'cli-test-' + Date.now();
console.log('\n🤖 Chatbot CLI Test');
console.log('Session ID:', sessionId);
console.log('Type your messages (or "exit" to quit)\n');

async function chat(message) {
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId, useRAG: true })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('\n🤖 Assistant:', data.message);
      if (data.relevantDocs && data.relevantDocs.length > 0) {
        console.log('📚 Used', data.relevantDocs.length, 'relevant documents');
      }
    } else {
      console.log('\n❌ Error:', data.error);
    }
  } catch (error) {
    console.log('\n❌ Connection error:', error.message);
    console.log('Make sure the server is running with: npm start');
  }
}

function prompt() {
  rl.question('\n💬 You: ', async (message) => {
    if (message.toLowerCase() === 'exit') {
      console.log('\nGoodbye! 👋\n');
      rl.close();
      process.exit(0);
    }

    if (message.trim()) {
      await chat(message);
    }
    
    prompt();
  });
}

prompt();
