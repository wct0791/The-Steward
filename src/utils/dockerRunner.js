// #region queryDockerModel function start
/**
 * Send a prompt to a Docker model endpoint via HTTP POST.
 *
 * @param {string} endpoint - The full URL of the Docker model endpoint.
 * @param {string} prompt - The prompt string to send to the model.
 * @returns {Promise<string>} Resolves to the response text from the model.
 * @throws {Error} If the network request fails or the response is invalid.
 */
async function queryDockerModel(endpoint, prompt) {
  // Validate input types
  if (typeof endpoint !== 'string' || typeof prompt !== 'string') {
    throw new TypeError('Both endpoint and prompt must be strings.');
  }

  // Prepare request payload
  const payload = { prompt };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Check for HTTP errors
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    // Attempt to parse JSON response
    const data = await response.json();

    // Validate response structure
    if (!data || typeof data.text !== 'string') {
      throw new Error('Invalid response format: missing "text" property.');
    }

    return data.text;
  } catch (error) {
    // Log and rethrow for upstream handling
    console.error('queryDockerModel error:', error);
    throw new Error(`Failed to query Docker model: ${error.message}`);
  }
}
// #endregion queryDockerModel function end

// #region Exports start
module.exports = { queryDockerModel };
// #endregion Exports end
// Docker Runner Utility
// Utility for querying Docker-based LLM endpoints using built-in fetch

/**
 * Query a Docker-based LLM endpoint with a prompt and return the text response.
 *
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

  // Request payload
  const body = JSON.stringify({ prompt });

  try {
    // HTTP POST to model endpoint using built-in fetch
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (!response.ok) {
      throw new Error(`Model endpoint error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Response parsing - assumes model returns { choices: [{ text: ... }] }
    if (!data.choices || !Array.isArray(data.choices) || !data.choices[0]?.text) {
      throw new Error('Unexpected model response format');
    }

    return data.choices[0].text;
  } catch (error) {
    throw new Error(`Docker model query failed: ${error.message}`);
  }
}

module.exports = { queryDockerModel };
