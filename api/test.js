module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  return res.status(200).json({
    status: 'working',
    message: 'API is running!',
    method: req.method,
    hasGroqKey: !!process.env.GROQ_API_KEY,
    hasCohereKey: !!process.env.COHERE_API_KEY,
    hasModel: !!process.env.AI_MODEL,
    timestamp: new Date().toISOString()
  });
};
