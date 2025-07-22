// #region start: SmolLM3 local model handler for The Steward
// Calls a local LLM via shell (llama.cpp or Ollama)

const { exec } = require('child_process');
const path = require('path');
const { SMOLLM3_PATH } = require('./env');

/**
 * Calls the local SmolLM3 model using llama.cpp or Ollama via shell.
 * @param {string} task - The user task string.
 * @param {object} [options] - Optional config, e.g., { model, runner }
 * @returns {Promise<string>} - Resolves to the model's response string.
 */
function callModel(task, options = {}) {
  return new Promise((resolve) => {
    const runner = options.runner || 'llama.cpp';
    let cmd;
    if (runner === 'ollama') {
      cmd = `ollama run smol "${task.replace(/"/g, '\"')}"`;
    } else {
      // Default to llama.cpp
      const modelPath = options.modelPath || SMOLLM3_PATH || 'models/SmolLM3-3B-Q5_K_M.gguf';
      const mainPath = options.mainPath || './main';
      cmd = `${mainPath} -m ${modelPath} -p "${task.replace(/"/g, '\"')}"`;
    }
    exec(cmd, { timeout: 60_000 }, (error, stdout, stderr) => {
      if (error) {
        resolve(`[smollm3 error] ${error.message}`);
        return;
      }
      if (stderr && stderr.trim()) {
        resolve(`[smollm3 stderr] ${stderr.trim()}`);
        return;
      }
      resolve(stdout ? stdout.trim() : '[smollm3] No output');
    });
  });
}

// #endregion end: SmolLM3 local model handler

module.exports = { callModel };
