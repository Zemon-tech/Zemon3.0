import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client with the API key
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// Default model to use
const DEFAULT_MODEL = 'gemini-pro';

/**
 * Get chat conversation from Gemini
 * @param {string} [model=DEFAULT_MODEL] - Model ID to use
 * @returns {object} Chat session object
 */
export async function createChatSession(model = DEFAULT_MODEL) {
  try {
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
    throw error;
  }
}

/**
 * Generate a chat title based on the conversation
 * @param {string} prompt - The initial prompt
 * @returns {string} Generated title
 */
export async function generateChatTitle(prompt) {
  try {
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