import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client with the API key
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// Default model to use - Gemini 1.5 Pro is limited to 2 requests per minute on free tier
// Consider using a less restricted model for development
const DEFAULT_MODEL = 'gemini-1.5-flash'; // More generous quota than gemini-1.5-pro

// Track requests to implement throttling
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 3000; // 30 seconds between requests

/**
 * Helper function to throttle requests
 * @returns {Promise<void>} Promise that resolves when it's safe to proceed
 */
async function throttleRequest() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    // Wait if it's been less than the minimum interval
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`Throttling API request for ${waitTime}ms to avoid rate limits`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
}

/**
 * Get chat conversation from Gemini
 * @param {string} [model=DEFAULT_MODEL] - Model ID to use
 * @returns {object} Chat session object
 */
export async function createChatSession(model = DEFAULT_MODEL) {
  try {
    await throttleRequest();
    
    const geminiModel = genAI.getGenerativeModel({ model });
    return geminiModel.startChat({
      history: [],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
      ],
    });
  } catch (error) {
    console.error('Error creating chat session:', error);
    throw error;
  }
}

/**
 * Generate a response from Gemini
 * @param {string} prompt - User's prompt
 * @param {object} [chatSession=null] - Existing chat session 
 * @returns {string} AI response
 */
export async function generateResponse(prompt, chatSession = null) {
  try {
    await throttleRequest();
    
    let response;
    
    if (chatSession) {
      // Continue conversation in an existing chat session
      response = await chatSession.sendMessage(prompt);
    } else {
      // Start a new conversation
      const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });
      response = await model.generateContent(prompt);
    }
    
    const text = response.response.text();
    return text;
  } catch (error) {
    console.error('Error generating response:', error);
    // Check if it's a rate limit error (429)
    if (error.message && error.message.includes('429')) {
      return "I'm receiving too many requests right now. Please try again in a minute.";
    }
    // Provide a fallback response in case of API errors
    return "I'm sorry, I couldn't generate a response at this time. The AI service might be temporarily unavailable.";
  }
}

/**
 * Generate a chat title based on the conversation
 * @param {string} prompt - The initial prompt
 * @returns {string} Generated title
 */
export async function generateChatTitle(prompt) {
  try {
    await throttleRequest();
    
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });
    const titlePrompt = `Generate a very short title (maximum 6 words) for a chat that starts with this prompt: "${prompt}"`;
    const response = await model.generateContent(titlePrompt);
    const text = response.response.text();
    return text.replace(/^"|"$/g, '').trim(); // Remove quotes if present
  } catch (error) {
    console.error('Error generating chat title:', error);
    // Fallback to a default title
    return prompt.substring(0, 30) + '...';
  }
} 