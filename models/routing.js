// #region start: Task routing logic for The Steward
// This module provides functions to detect task type and select the appropriate model.
// It is modular and testable, following project and accessibility standards.

/**
 * Detects the type of task based on simple keyword matching.
 * @param {string} input - The user task string.
 * @returns {string} - Task type label (e.g., 'summarize', 'write', 'debug', 'research', etc.)
 */
function detectTaskType(input) {
  if (!input || typeof input !== 'string') return 'unknown';
  const lowered = input.toLowerCase();
  if (lowered.includes('summarize')) return 'summarize';
  if (lowered.includes('write') || lowered.includes('compose')) return 'write';
  if (lowered.includes('debug') || lowered.includes('fix')) return 'debug';
  if (lowered.includes('research') || lowered.includes('find out')) return 'research';
  if (lowered.includes('explain')) return 'explain';
  if (lowered.includes('analyze')) return 'analyze';
  // Add more rules as needed
  return 'general';
}

/**
 * Selects a model based on task type and routing preferences.
 * @param {string} taskType - The detected task type.
 * @param {object} config - The character sheet or routing config.
 * @returns {{ model: string, reason: string }}
 */
function selectModel(taskType, config) {
  // Example routing map; prefer config.characterSheet?.routing if available
  const routing = (config && config.routing) || {
    summarize: 'claude',
    write: 'gpt-4',
    debug: 'gpt-4',
    research: 'perplexity',
    explain: 'gemini',
    analyze: 'claude',
    general: 'gpt-4',
  };
  const model = routing[taskType] || routing.general || 'gpt-4';
  const reason = routing[taskType]
    ? `matched ${taskType} rule`
    : 'defaulted to general model';
  return { model, reason };
}

// #endregion end: Task routing logic

module.exports = { detectTaskType, selectModel };
