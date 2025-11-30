// Test multiple Zoho Assist events
require('dotenv').config();
const handler = require('./api/zoho-assist-webhook');

const testEvents = [
  {
    name: 'Session Start',
    body: {
      event_id: 16,
      session_id: 'session_001',
      customer_name: 'Priya Sharma',
      customer_email: 'priya@example.com'
    }
  },
  {
    name: 'Customer Join',
    body: {
      event_id: 4,
      session_id: 'session_002',
      customer_name: 'Amit Patel',
      customer_email: 'amit@example.com',
      technician_name: 'Tech Support'
    }
  },
  {
    name: 'Inbound Request Create',
    body: {
      event_id: 5,
      session_id: 'session_003',
      customer_name: 'Lakshmi Reddy',
      customer_email: 'lakshmi@example.com'
    }
  },
  {
    name: 'Session End (should not respond)',
    body: {
      event_id: 17,
      session_id: 'session_004',
      customer_name: 'Test User'
    }
  }
];

async function testEvent(testCase) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 Testing: ${testCase.name}`);
  console.log(`${'='.repeat(60)}`);
  
  const mockReq = {
    method: 'POST',
    body: testCase.body
  };
  
  const mockRes = {
    statusCode: 200,
    headers: {},
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(data) {
      console.log(`\n✅ Status: ${this.statusCode}`);
      if (data.success) {
        console.log(`📝 Event: ${data.event || 'N/A'}`);
        console.log(`👤 Customer: ${data.customer || 'N/A'}`);
        if (data.response) {
          console.log(`💬 Response: ${data.response}`);
        } else {
          console.log(`ℹ️  Message: ${data.message}`);
        }
      } else {
        console.log(`❌ Error: ${data.error}`);
      }
      return this;
    },
    end() { return this; }
  };
  
  await handler(mockReq, mockRes);
}

async function runTests() {
  console.log('🚀 Testing Zoho Assist Webhook with Multiple Events\n');
  
  for (const testCase of testEvents) {
    await testEvent(testCase);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between tests
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ All tests completed!');
  console.log(`${'='.repeat(60)}\n`);
}

runTests().catch(console.error);
