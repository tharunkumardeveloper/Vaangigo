// In-memory context store (for production, use Redis or similar)
const contextStore = new Map();

class ContextManager {
  constructor(maxHistory = 10) {
    this.maxHistory = maxHistory;
  }

  getContext(sessionId) {
    if (!contextStore.has(sessionId)) {
      contextStore.set(sessionId, {
        messages: [],
        metadata: {},
        createdAt: Date.now()
      });
    }
    return contextStore.get(sessionId);
  }

  addMessage(sessionId, role, content) {
    const context = this.getContext(sessionId);
    context.messages.push({
      role,
      content,
      timestamp: Date.now()
    });

    // Keep only recent messages
    if (context.messages.length > this.maxHistory) {
      context.messages = context.messages.slice(-this.maxHistory);
    }

    contextStore.set(sessionId, context);
  }

  getMessages(sessionId) {
    const context = this.getContext(sessionId);
    return context.messages;
  }

  setMetadata(sessionId, key, value) {
    const context = this.getContext(sessionId);
    context.metadata[key] = value;
    contextStore.set(sessionId, context);
  }

  getMetadata(sessionId, key) {
    const context = this.getContext(sessionId);
    return context.metadata[key];
  }

  clearContext(sessionId) {
    contextStore.delete(sessionId);
  }

  // Clean up old sessions (call periodically)
  cleanupOldSessions(maxAge = 24 * 60 * 60 * 1000) {
    const now = Date.now();
    for (const [sessionId, context] of contextStore.entries()) {
      if (now - context.createdAt > maxAge) {
        contextStore.delete(sessionId);
      }
    }
  }
}

module.exports = ContextManager;
