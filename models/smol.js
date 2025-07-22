// #region start: SmolLM3 local model handler for The Steward
// Calls a local LLM via shell (llama.cpp or Ollama)

const { exec } = require('child_process');
const path = require('path');
const { SMOLLM3_PATH } = require('./env');

/**
 * Calls a local model using llama.cpp or Ollama via shell.
 * @param {string} task - The user task string.
 * @param {object} [options] - Optional config, e.g., { model, runner }
 * @returns {Promise<string>} - Resolves to the model's response string.
 */
function callModel(task, options = {}) {
  return new Promise((resolve) => {
    const runner = options.runner || 'llama.cpp';
    const modelName = options.model || 'smollm3';
    let cmd;
    if (runner === 'ollama') {
      cmd = `ollama run ${modelName} "${task.replace(/"/g, '\"')}"`;
    } else {
      // Default to llama.cpp
      const modelPath = options.modelPath || SMOLLM3_PATH || `models/${modelName}.gguf`;
      const mainPath = options.mainPath || './main';
      cmd = `${mainPath} -m ${modelPath} -p "${task.replace(/"/g, '\"')}"`;
    }
    exec(cmd, { timeout: 60_000 }, (error, stdout, stderr) => {
      if (error) {
        resolve(`[${modelName} error] ${error.message}`);
        return;
      }
      if (stderr && stderr.trim()) {
        resolve(`[${modelName} stderr] ${stderr.trim()}`);
        return;
      }
      resolve(stdout ? stdout.trim() : `[${modelName}] No output`);
    });
  });
}

// #endregion end: SmolLM3 local model handler

module.exports = { callModel };
