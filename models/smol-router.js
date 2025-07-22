// #region start: SmolLM3 meta-router for The Steward
// Uses SmolLM3 to suggest which model should handle a task

const smol = require('./smol');

/**
 * Asks SmolLM3 to recommend a model for the given task.
 * @param {string} task - The user task string.
 * @returns {Promise<{model: string, reason: string}>}
 */
async function askSmolRouter(task) {
  const prompt = `Given this task, which model should handle it and why?\n\nTask: ${task}\n\nRespond with only the model name (e.g., gpt-4, claude, smollm3, codellama, devstral, perplexity, mistral, llama) and a short reason.`;
  const response = await smol.callModel(prompt, { model: 'smollm3' });
  // Try to extract model name and reason from response
  // Example response: "claude: Best for summarization."
  let model = 'smollm3';
  let reason = 'Chosen by Smol router';
  if (typeof response === 'string') {
    const match = response.match(/^(gpt-4|claude|smollm3|codellama|devstral|perplexity|mistral|llama)\s*[:\-]?\s*(.*)$/i);
    if (match) {
      model = match[1].toLowerCase();
      reason = match[2] ? match[2].trim() : reason;
    } else {
      // fallback: look for model name anywhere in response
      const found = (response.match(/gpt-4|claude|smollm3|codellama|devstral|perplexity|mistral|llama/i) || [])[0];
      if (found) model = found.toLowerCase();
      reason = response.trim();
    }
  }
  return { model, reason };
}

// #endregion end: SmolLM3 meta-router

module.exports = { askSmolRouter };
