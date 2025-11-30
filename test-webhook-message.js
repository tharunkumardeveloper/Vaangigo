// Test webhook with actual message
require('dotenv').config();
const handler = require('./api/webhook');

const mockReq = {
  method: 'POST',
  body: {
    message: 'Tharun',
    sessionId: 'test123'
  }
};

const mockRes = {
  statusCode: 200,
  headers: {},
  setHeader(key, value) { this.headers[key] = value; },
  status(code) { this.statusCode = code; return this; },
  json(data) {
    console.log('\n✅ Response Status:', this.statusCode);
    console.log('📦 Response:', JSON.stringify(data, null, 2));
    return this;
  },
  end() { return this; }
};

console.log('🧪 Testing webhook with message...\n');
console.log('📨 Request:', JSON.stringify(mockReq.body, null, 2));

handler(mockReq, mockRes).catch(err => {
  console.error('❌ Error:', err);
});
