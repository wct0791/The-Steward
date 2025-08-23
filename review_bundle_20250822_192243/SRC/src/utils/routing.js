// #region Routing Logic for Docker Models
// routing.js
//
// Implements tryLocalTiers(prompt) to query Docker-based models in order.
// #endregion

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { queryDockerModel } = require('./dockerRunner');

// #region Load Docker model definitions from YAML
const dockerConfigPath = path.join(__dirname, '../../models/docker_runner.yaml');
let dockerModels = [];
try {
  const file = fs.readFileSync(dockerConfigPath, 'utf8');
  const config = yaml.load(file);
  dockerModels = (config.models || []).filter(m => m.enabled);
} catch (err) {
  // Log error and fallback to empty model list
  console.error('Failed to load docker_runner.yaml:', err);
  dockerModels = [];
}
// #endregion

/**
 * Try each enabled local Docker model with the given prompt, returning the first successful result.
 *
 * @param {string} prompt - The prompt to send to each model
 * @returns {Promise<{model: string, text: string}|null>} - The first model's id and text response, or null if all fail
 */
async function tryLocalTiers(prompt) {
  for (const model of dockerModels) {
    try {
      // #region Model query attempt
      const response = await queryDockerModel(model.endpoint, prompt);
      if (typeof response === 'string' && response.trim()) {
        return { model: model.id, text: response };
      }
      // #endregion
    } catch (err) {
      // Log and continue to next model
      console.warn(`Model ${model.id} failed:`, err.message);
    }
  }
  // All models failed
  return null;
}

module.exports = { tryLocalTiers };
// #endregion
