// #region start: Model handler logic for The Steward
// This module provides a real GPT-4 handler and a mock fallback for other models.


/**
 * Calls the selected model handler based on options.model.
 * Falls back to a mock response if no handler is found.
 * @param {string} task - The user task string.
 * @param {object} [options] - Optional config, e.g., { model: 'gpt-4', ... }
 * @returns {Promise<string>} - Resolves to the model's response string.
 */
async function callModel(task, options = {}) {
  const model = (options.model || 'gpt-4').toLowerCase();
  try {
    switch (model) {
      case 'gpt-4':
      case 'gpt-4-turbo':
        return require('./gpt').callModel(task, options);
      case 'claude':
        return require('./claude').callModel(task, options);
      case 'smollm3':
      case 'codellama':
      case 'devstral':
      case 'mistral':
      case 'llama':
        // Route all local models to smol.js with correct model name
        return require('./smol').callModel(task, { ...options, model });
      case 'perplexity':
        return require('./perplexity').callModel(task, options);
      default:
        // #region start: Mock model response fallback
        return Promise.resolve(
          `This is a mock response from ${model}. Task: \"${task}\"`
        );
        // #endregion end: Mock model response fallback
    }
  } catch (err) {
    // Defensive: fallback to mock if handler fails to load
    return Promise.resolve(
      `This is a mock response from ${model} (handler error). Task: "${task}"`
    );
  }
}

// #endregion end: Model handler logic

module.exports = { callModel };
