const { Groq } = require('groq-sdk');

// Central configuration for Groq AI Model
const DEFAULT_MODEL = 'openai/gpt-oss-20b';

// System prompt guiding the educational assistant
const SYSTEM_PROMPT = `You are an AI Learning Assistant for the Smart Classroom Management Software (SCMS). 
Your objective is to:
1. Explain academic concepts in simple, accessible language.
2. Provide intuitive, real-world examples.
3. Identify potential student learning gaps and misconceptions.
4. Suggest specific follow-up topics to revise.
Keep your answers structured, clear, and encouraging.`;

let memoryApiKey = null;

function getApiKey() {
  return memoryApiKey || process.env.GROQ_API_KEY || '';
}

function setApiKey(key) {
  memoryApiKey = (key || '').trim();
}

function getModelName() {
  return DEFAULT_MODEL;
}

function hasValidApiKey() {
  const key = getApiKey();
  return Boolean(key && key !== 'gsk_REPLACE_WITH_YOUR_GROQ_API_KEY' && key.startsWith('gsk_'));
}

async function handleChatMessage(messages) {
  try {
    const apiKey = getApiKey();

    if (!apiKey || apiKey === 'gsk_REPLACE_WITH_YOUR_GROQ_API_KEY') {
      return {
        success: false,
        error: 'Groq API Key is not configured. Please add your GROQ_API_KEY to the .env file or configure it in the Assistant settings.'
      };
    }

    if (!apiKey.startsWith('gsk_')) {
      return {
        success: false,
        error: 'Invalid Groq API key format. Groq API keys usually start with "gsk_". Please check your configuration.'
      };
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return {
        success: false,
        error: 'No messages provided.'
      };
    }

    // Format messages payload ensuring system prompt is at the beginning
    const formattedMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: String(m.content || '').trim()
      }))
    ];

    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: formattedMessages,
      temperature: 0.6,
      max_completion_tokens: 1024
    });

    const reply = completion.choices[0]?.message?.content;
    if (!reply) {
      return {
        success: false,
        error: 'Received an empty response from the Groq AI service.'
      };
    }

    return {
      success: true,
      content: reply,
      model: DEFAULT_MODEL
    };
  } catch (error) {
    console.error('Groq API Error:', error);
    let userMessage = error.message || 'An unknown error occurred while contacting Groq AI.';

    if (error.status === 401 || (error.message && error.message.includes('401'))) {
      userMessage = 'Authentication failed (401): The provided Groq API key is invalid or expired. Please verify your key at console.groq.com.';
    } else if (error.status === 429 || (error.message && error.message.includes('429'))) {
      userMessage = 'Rate limit exceeded (429): Too many requests to Groq API. Please wait a moment before trying again.';
    } else if (error.code === 'ENOTFOUND' || (error.message && error.message.includes('fetch failed'))) {
      userMessage = 'Network connection failed: Please check your internet connection.';
    }

    return {
      success: false,
      error: userMessage
    };
  }
}

module.exports = {
  getApiKey,
  setApiKey,
  hasValidApiKey,
  getModelName,
  handleChatMessage
};
