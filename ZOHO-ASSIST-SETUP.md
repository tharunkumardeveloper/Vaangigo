# 🔗 Zoho Assist Webhook Integration Guide

## Overview
Connect your Vaangigo chatbot to Zoho Assist remote support sessions. When customers start support sessions, Venmathi will automatically greet them!

---

## 📋 Prerequisites
- **Zoho Assist Enterprise Edition** (Webhooks only available in Enterprise)
- Your chatbot deployed at: `https://chatbot-vaangigo.vercel.app`

---

## 🚀 Setup Steps

### Step 1: Log in to Zoho Assist
Go to: https://assist.zoho.com

### Step 2: Navigate to Webhooks
1. Click **Settings** (gear icon)
2. Go to **Integrations**
3. Select **Webhooks**

### Step 3: Create New Webhook
Click **Add Webhook** button

### Step 4: Configure Webhook Details

**Name:** `Vaangigo Chatbot`

**Description:** `Automated greeting and support for Vaangigo customers`

**Callback URL:** 
```
https://chatbot-vaangigo.vercel.app/api/zoho-assist-webhook
```

**Source ID:** (Optional - leave default or customize to prevent notification loops)

### Step 5: Test the URL
Click **Ping URL** to verify the connection
- You should see: `{"service":"Zoho Assist Webhook Handler","status":"running"}`

### Step 6: Select Events to Subscribe

**Recommended Events:**

| Event Name | Event ID | Why Subscribe? |
|------------|----------|----------------|
| **Session Start** | 16 | Greet customers when session begins |
| **Customer Join - Remote Support** | 4 | Welcome customers joining support |
| **Inbound Request Create** | 5 | Respond to new support requests |
| **Outbound Session Start** | 0 | Greet on outbound sessions |
| **Session Start - Screen Share** | 1 | Welcome screen share sessions |

**Optional Events (logged but no response):**
- Session End (2, 3, 17) - Logged for analytics
- Device events (12-15) - Logged for monitoring

### Step 7: Configure JSON Parameters (Optional)
Click **Manage Parameters** to customize the JSON payload sent to webhook.

**Recommended parameters to include:**
```json
{
  "event_id": "{{event_id}}",
  "session_id": "{{session_id}}",
  "customer_name": "{{customer_name}}",
  "customer_email": "{{customer_email}}",
  "technician_name": "{{technician_name}}",
  "technician_email": "{{technician_email}}",
  "department": "{{department}}",
  "timestamp": "{{timestamp}}"
}
```

### Step 8: Test the Event
Click **Ping Event** to trigger a test run
- Check the response to ensure chatbot responds correctly

### Step 9: Save Webhook
Click **Create Webhook**

---

## 🎯 How It Works

### When a Session Starts:
1. Customer initiates remote support session
2. Zoho Assist sends webhook to your endpoint
3. Venmathi (chatbot) generates personalized greeting
4. Response is logged and can be integrated with your chat system

### Example Response:
```json
{
  "success": true,
  "event": "Session Start",
  "event_id": 16,
  "customer": "John Doe",
  "response": "Hey there! 👋 I'm Venmathi from Vaangigo! I see you're connecting for support - how can I help you today? 😊",
  "timestamp": "2025-11-30T10:30:00.000Z"
}
```

---

## 🔍 Testing Your Webhook

### Test via Browser:
Visit: `https://chatbot-vaangigo.vercel.app/api/zoho-assist-webhook`

You'll see webhook info and setup instructions.

### Test via Zoho Assist:
1. Use the **Ping URL** button in webhook settings
2. Use the **Ping Event** button to simulate events
3. Start an actual remote support session

### Test via cURL:
```bash
curl -X POST https://chatbot-vaangigo.vercel.app/api/zoho-assist-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": 16,
    "session_id": "test123",
    "customer_name": "Test Customer",
    "customer_email": "test@example.com"
  }'
```

---

## 📊 Supported Events

| Event ID | Event Name | Chatbot Response |
|----------|------------|------------------|
| 0 | Outbound Session Start | ✅ Greets customer |
| 1 | Session Start - Screen Share | ✅ Welcomes to screen share |
| 2 | Session End - Remote Support | ⚪ Logged only |
| 3 | Session End - Screen Share | ⚪ Logged only |
| 4 | Customer Join - Remote Support | ✅ Welcomes customer |
| 5 | Inbound Request Create | ✅ Acknowledges request |
| 6 | Inbound Request Transfer | ⚪ Logged only |
| 7 | Inbound Request Delegate | ⚪ Logged only |
| 8 | Inbound Request Picked | ⚪ Logged only |
| 9 | Inbound Request Declined | ⚪ Logged only |
| 10 | Inbound Request Dropped | ⚪ Logged only |
| 11 | Inbound Request Expired | ⚪ Logged only |
| 12 | Device Add | ⚪ Logged only |
| 13 | Device Online | ⚪ Logged only |
| 14 | Device Offline | ⚪ Logged only |
| 15 | Device Delete | ⚪ Logged only |
| 16 | Session Start | ✅ Greets customer |
| 17 | Session End | ⚪ Logged only |

---

## 🔧 Advanced Configuration

### Multiple Webhooks
You can create up to **20 webhooks** total, with up to **10 webhooks per event**.

### Department Filtering
Select specific departments to trigger webhooks only for certain teams.

### Source ID
Use Source ID to prevent notification loops when integrating with multiple systems.

---

## 🐛 Troubleshooting

### Webhook Not Triggering?
- ✅ Verify you have **Zoho Assist Enterprise Edition**
- ✅ Check webhook is **enabled** (status = 1)
- ✅ Confirm events are selected
- ✅ Test with **Ping Event** button

### Connection Failed?
- ✅ Verify callback URL is correct
- ✅ Ensure URL uses **HTTPS** (required)
- ✅ Check your Vercel deployment is live

### No Response from Chatbot?
- ✅ Check `GROQ_API_KEY` is set in environment variables
- ✅ Verify event_id is in the supported list (0, 1, 4, 5, 16)
- ✅ Check Vercel logs for errors

---

## 📞 Support

**Webhook Endpoint:** `https://chatbot-vaangigo.vercel.app/api/zoho-assist-webhook`

**Regular Chatbot:** `https://chatbot-vaangigo.vercel.app/api/webhook`

**Contact:** hello@indicraft.com | 8610677504

---

## 🎉 Next Steps

After setup, you can:
1. **Monitor webhook activity** in Zoho Assist dashboard
2. **Customize responses** by editing `api/zoho-assist-webhook.js`
3. **Integrate with chat systems** to send responses to customers
4. **Add more events** as needed for your workflow

Happy automating! 🚀
