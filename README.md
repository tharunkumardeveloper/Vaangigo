# Vaangigo Chatbot API

AI-powered shopping assistant for Vaangigo (Indicraft) - an online marketplace for authentic Indian handmade crafts.

## Features

- 🤖 **Venmathi AI Assistant** - Cheerful, context-aware chatbot
- 🧠 **RAG (Retrieval Augmented Generation)** - Uses vector embeddings for accurate product information
- 💬 **Bilingual Support** - English and Tanglish (Tamil-English mix)
- 🎯 **Context Awareness** - Remembers user names and conversation history
- 🛍️ **E-commerce Actions** - Browse, cart, checkout, order tracking, returns
- ✨ **100+ Action-based Responses** - Complete shopping guidance

## Tech Stack

- **AI Model**: Groq (Llama 3.3 70B)
- **Embeddings**: Cohere
- **Runtime**: Node.js
- **Deployment**: Vercel Serverless Functions

## Quick Start

### Local Development

1. **Install dependencies**:
```bash
npm install
```

2. **Set up environment variables** (`.env`):
```env
GROQ_API_KEY=your_groq_api_key
COHERE_API_KEY=your_cohere_api_key
AI_MODEL=llama-3.3-70b-versatile
```

3. **Start the server**:
```bash
npm start
```

4. **Test locally**:
Open http://localhost:3001/test in your browser

### Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## API Usage

### Chat Endpoint

**POST** `/api/chat`

```json
{
  "message": "I need a gift for my dad",
  "sessionId": "user123",
  "useRAG": true
}
```

**Response**:
```json
{
  "success": true,
  "sessionId": "user123",
  "message": "For your dad, try the Brass Pooja Set ₹2,200 or personalized wooden items! 🎁",
  "relevantDocs": [...],
  "usage": {...}
}
```

### Health Check

**GET** `/api/health`

## Project Structure

```
vaangigo-chatbot/
├── api/
│   ├── chat.js          # Main chat endpoint
│   └── health.js        # Health check
├── lib/
│   ├── embeddings.js    # Cohere embeddings
│   ├── context.js       # Context management
│   └── rag.js           # RAG implementation
├── data/
│   ├── knowledge.json           # Product & company info
│   ├── ecommerce-knowledge.json # E-commerce actions
│   ├── task-prompts.json        # Task-based prompts
│   └── task-prompts-extended.json
├── server.js            # Local development server
└── package.json
```

## Features in Detail

### Venmathi - The AI Assistant

- **Personality**: Cheerful, warm, 24-year-old from Chennai
- **Context Aware**: Remembers names and conversation history
- **Bilingual**: Switches between English and Tanglish naturally
- **Humanized**: Uses emojis, casual language, friendly tone

### Knowledge Base

- 500+ artisan families
- 30+ handmade products
- Categories: Sarees, Terracotta, Wooden Toys, Brass Items, Jute Bags, etc.
- Price range: ₹350 - ₹6,800

### E-commerce Actions

- Product browsing & filtering
- Add to cart, checkout, payment
- Order tracking & cancellation
- Returns & refunds
- Account management
- Loyalty programs

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | Groq API key for LLM | Yes |
| `COHERE_API_KEY` | Cohere API key for embeddings | Yes |
| `AI_MODEL` | Model name (default: llama-3.3-70b-versatile) | No |

## API Keys

- **Groq**: Get free API key at https://console.groq.com
- **Cohere**: Get free API key at https://cohere.com

## Contact

- **Website**: indicraft.vercel.app
- **Email**: hello@indicraft.com
- **Phone**: 8610677504
- **Location**: Pattabiram, Chennai, Tamil Nadu

## License

MIT

---

Made with ❤️ by Tharun Kumar
