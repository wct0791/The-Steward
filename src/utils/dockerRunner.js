// #region start: Docker Runner Utility
// Utility for querying Docker-based LLM endpoints using built-in fetch
// Handles HTTP communication with containerized AI models

/**
 * Query a Docker-based LLM endpoint with a prompt and return the text response.
 * @param {string} endpoint - The HTTP endpoint of the Docker LLM (e.g., http://localhost:8080/v1/completions)
 * @param {string} prompt - The prompt to send to the model
 * @returns {Promise<string>} - The model's text response
 * @throws {Error} - If the request fails or response is invalid
 */
async function queryDockerModel(endpoint, prompt) {
  // Input validation
  if (typeof endpoint !== 'string' || !endpoint.startsWith('http')) {
    throw new Error('Invalid endpoint URL');
  }
  if (typeof prompt !== 'string' || !prompt.trim()) {
    throw new Error('Prompt must be a non-empty string');
  }

  // Request payload - standardized format
  const body = JSON.stringify({ prompt });

  try {
    // HTTP POST to model endpoint using built-in fetch
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body,
      timeout: 30000 // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`Model endpoint error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Handle multiple response formats from different Docker models
    let responseText;
    
    if (data.text) {
      // Simple { text: "..." } format
      responseText = data.text;
    } else if (data.choices && Array.isArray(data.choices) && data.choices[0]?.text) {
      // OpenAI-compatible format { choices: [{ text: "..." }] }
      responseText = data.choices[0].text;
    } else if (data.response) {
      // Alternative format { response: "..." }
      responseText = data.response;
    } else if (typeof data === 'string') {
      // Plain text response
      responseText = data;
    } else {
      throw new Error('Unexpected model response format: ' + JSON.stringify(data));
    }

    // Validate response
    if (!responseText || typeof responseText !== 'string') {
      throw new Error('Empty or invalid response from Docker model');
    }

    return responseText.trim();
    
  } catch (error) {
    // Enhanced error handling with context
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(`Network error connecting to Docker model at ${endpoint}: ${error.message}`);
    }
    
    throw new Error(`Docker model query failed: ${error.message}`);
  }
}

/**
 * Test connectivity to a Docker model endpoint
 * @param {string} endpoint - The endpoint to test
 * @returns {Promise<boolean>} - True if endpoint is accessible
 */
async function testDockerEndpoint(endpoint) {
  try {
    const testPrompt = "Hello";
    await queryDockerModel(endpoint, testPrompt);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Query multiple Docker endpoints and return the first successful response
 * @param {string[]} endpoints - Array of endpoint URLs to try
 * @param {string} prompt - The prompt to send
 * @returns {Promise<{endpoint: string, response: string}>} - First successful response
 */
async function queryMultipleDockerModels(endpoints, prompt) {
  const errors = [];
  
  for (const endpoint of endpoints) {
    try {
      const response = await queryDockerModel(endpoint, prompt);
      return { endpoint, response };
    } catch (error) {
      errors.push({ endpoint, error: error.message });
    }
  }
  
  throw new Error(`All Docker endpoints failed: ${JSON.stringify(errors)}`);
}

module.exports = { 
  queryDockerModel, 
  testDockerEndpoint, 
  queryMultipleDockerModels 
};

// #endregion end: Docker Runner Utility