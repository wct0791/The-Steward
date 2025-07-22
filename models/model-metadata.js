// #region start: Model metadata loader for The Steward
// Loads and queries model metadata from models.yaml

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const modelsPath = path.join(__dirname, 'models.yaml');
let modelsData = {};
try {
  const fileContents = fs.readFileSync(modelsPath, 'utf8');
  modelsData = yaml.load(fileContents);
} catch (err) {
  modelsData = {};
}

/**
 * Returns the full metadata object for a model name.
 * @param {string} name - Model name
 * @returns {object|null}
 */
function getModelInfo(name) {
  return modelsData[name] || null;
}

/**
 * Returns a list of model names by tier.
 * @param {string} tier - e.g., 'high-quality', 'fast', 'balanced', 'backup'
 * @returns {string[]}
 */
function getModelsByTier(tier) {
  return Object.entries(modelsData)
    .filter(([_, meta]) => meta.tier === tier)
    .map(([name]) => name);
}

/**
 * Returns a list of model names by use case.
 * @param {string} useCase - e.g., 'write', 'debug', 'fallback'
 * @returns {string[]}
 */
function getModelsByUseCase(useCase) {
  return Object.entries(modelsData)
    .filter(([_, meta]) => Array.isArray(meta.use_cases) && meta.use_cases.includes(useCase))
    .map(([name]) => name);
}

// #endregion end: Model metadata loader

module.exports = { getModelInfo, getModelsByTier, getModelsByUseCase };
