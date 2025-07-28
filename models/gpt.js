// OpenAI GPT-4 Model Handler for The Steward
// Handles API calls to OpenAI with configurable base URL for testing


require('dotenv').config();
// Use built-in fetch from Node 18+
const fetch = globalThis.fetch;

// Configuration constants
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_BASE_URL = process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1';

/**
 * Calls OpenAI GPT-4 API with error handling and fallback support
 * @param {string} task - The user task/prompt
 * @param {object} options - Model options (model, temperature, etc.)
 * @returns {Promise<string>} - Model response or error message
 */
async function callModel(task, options = {}) {
  // Validate API key
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured - check OPENAI_API_KEY in .env');
  }

  // Model configuration
  const model = options.model || 'gpt-4';
  const temperature = options.temperature || 0.7;
  const maxTokens = options.maxTokens || 2000;

  // API request payload
  const payload = {
    model: model,
    messages: [
      {
        role: 'user',
        content: task
      }
    ],
    temperature: temperature,
    max_tokens: maxTokens
  };

  try {
    // Make API request with configurable base URL
    const response = await fetch(`${OPENAI_API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    // Handle HTTP errors
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    // Parse response
    const data = await response.json();

    // Validate response structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid OpenAI API response structure');
    }

    // Extract and return content
    const content = data.choices[0].message.content;

    // Log successful call (for debugging)
    console.log(`[GPT] Successfully called ${model} via ${OPENAI_API_BASE_URL}`);

    return content;

  } catch (error) {
    // Enhanced error logging
    console.error(`[GPT] Error calling ${model}:`, error.message);

    // Re-throw with context for upstream handling
    throw new Error(`GPT-4 API call failed: ${error.message}`);
  }
}

/**
 * Test function to verify OpenAI connectivity
 * @returns {Promise<boolean>} - True if connection works
 */
async function testConnection() {
  try {
    const response = await callModel('Say "Hello" if you can hear me.', {
      model: 'gpt-4',
      maxTokens: 50
    });
    return response.toLowerCase().includes('hello');
  } catch (error) {
    console.error('[GPT] Connection test failed:', error.message);
    return false;
  }
}

module.exports = {
  callModel,
  testConnection,
  // Export configuration for testing
  OPENAI_API_BASE_URL
};
