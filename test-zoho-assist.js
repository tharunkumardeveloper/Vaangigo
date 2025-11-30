// Test script for Zoho Assist webhook
require('dotenv').config();
const handler = require('./api/zoho-assist-webhook');

// Mock request and response objects
const mockReq = {
  method: 'POST',
  body: {
    event_id: 16, // Session Start
    session_id: 'test_session_123',
    customer_name: 'Rajesh Kumar',
    customer_email: 'rajesh@example.com',
    technician_name: 'Support Agent',
    timestamp: new Date().toISOString()
  }
};

const mockRes = {
  statusCode: 200,
  headers: {},
  body: null,
  
  setHeader(key, value) {
    this.headers[key] = value;
  },
  
  status(code) {
    this.statusCode = code;
    return this;
  },
  
  json(data) {
    this.body = data;
    console.log('\n✅ Response Status:', this.statusCode);
    console.log('📦 Response Body:', JSON.stringify(data, null, 2));
    return this;
  },
  
  end() {
    console.log('✅ Request ended');
    return this;
  }
};

console.log('🧪 Testing Zoho Assist Webhook Handler...\n');
console.log('📨 Mock Request:', JSON.stringify(mockReq.body, null, 2));

handler(mockReq, mockRes).catch(err => {
  console.error('❌ Error:', err);
});
