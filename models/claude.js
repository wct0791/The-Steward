// #region start: Claude model handler for The Steward
// Handles calls to Anthropic Claude models via API.

const axios = require('axios');
const { CLAUDE_API_KEY } = require('./env');

/**
 * Calls the Claude model using Anthropic API.
 * @param {string} task - The user task string.
 * @param {object} [options] - Optional config, e.g., { model: 'claude-3-opus-20240229', ... }
 * @returns {Promise<string>} - Resolves to the Claude model's response string.
 */
async function callModel(task, options = {}) {
  const apiKey = options.apiKey || CLAUDE_API_KEY;
  if (!apiKey) throw new Error('CLAUDE_API_KEY is not set in environment.');
  const model = options.model || 'claude-3-opus-20240229';
  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model,
        max_tokens: 1024,
        messages: [
          { role: 'user', content: task },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
      }
    );
    // Defensive: check structure
    const content = response.data?.content?.[0]?.text || response.data?.content;
    if (content) return content.trim();
    throw new Error('No content in Claude response.');
  } catch (err) {
    throw new Error(`Claude API error: ${err.response?.data?.error?.message || err.message}`);
  }
}

// #endregion end: Claude model handler

module.exports = { callModel };
