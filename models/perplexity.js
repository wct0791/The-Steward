// #region start: Ollama local model handler for The Steward
// Calls a local model via Ollama CLI

const { exec } = require('child_process');

/**
 * Calls a local model using Ollama CLI.
 * @param {string} task - The user task string.
 * @param {object} [options] - Optional config, e.g., { model }
 * @returns {Promise<string>} - Resolves to the model's response string.
 */
function callModel(task, options = {}) {
  return new Promise((resolve) => {
    const model = options.model || 'mistral';
    const cmd = `ollama run ${model} "${task.replace(/"/g, '\"')}"`;
    exec(cmd, { timeout: 60_000 }, (error, stdout, stderr) => {
      if (error) {
        // Log error to stderr for debugging
        console.error(`[ollama error] ${error.message}`);
        resolve(`[ollama error] ${error.message}`);
        return;
      }
      if (stderr && stderr.trim()) {
        resolve(`[ollama stderr] ${stderr.trim()}`);
        return;
      }
      resolve(stdout ? stdout.trim() : '[ollama] No output');
    });
  });
}

// #endregion end: Ollama local model handler

module.exports = { callModel };
