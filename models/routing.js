// #region start: Task routing logic for The Steward
// This module provides functions to detect task type and select the appropriate model.
// It is modular and testable, following project and accessibility standards.
// #region Imports and setup
// Import required modules for file system, path, and YAML parsing
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
// #endregion

// #region Load character sheet and loadout YAML files
/**
 * Loads a YAML character sheet from the given file path.
 * @param {string} filePath - Path to the YAML file.
 * @returns {object} Parsed YAML as JS object.
 * @throws Will throw if file cannot be read or parsed.
 */
function loadCharacterSheet(filePath) {
  // Read YAML file as UTF-8 text
  const yamlText = fs.readFileSync(filePath, 'utf8');
  // Parse YAML to JS object
  return yaml.load(yamlText);
}
// #endregion

// #region Task extraction from CLI or stdin
/**
 * Extracts the task string from CLI arguments or piped stdin.
 * @returns {string} The task text.
 * @throws If no task is provided.
 */
function getTaskFromCLI() {
  // Check for --task argument
  const arg = process.argv.find(arg => arg.startsWith('--task='));
  if (arg) return arg.split('=')[1];
  // If input is piped, read from stdin (fd 0)
  if (!process.stdin.isTTY) {
    return fs.readFileSync(0, 'utf8').trim();
  }
  // No task found
  throw new Error('No task provided. Use --task="your task here" or pipe input.');
}
// #endregion

// #region Task type inference
/**
 * Infers the type of task from the input text.
 * @param {string} text - The task text.
 * @returns {string} The inferred task type.
 */
function inferTaskType(text) {
  const lowered = text.toLowerCase();
  if (lowered.includes('summarize')) return 'summarize';
  if (lowered.includes('debug')) return 'debug';
  if (lowered.includes('research')) return 'research';
  if (lowered.includes('sensitive')) return 'sensitive';
  if (lowered.includes('write')) return 'write';
  return 'unknown_task';
}
// #endregion

// #region Model selection logic
/**
 * Selects a model based on task type and character preferences.
 * @param {string} taskText - The task text.
 * @param {object} prefs - Character sheet preferences.
 * @returns {string} The selected model name.
 */
function selectModel(taskText, prefs) {
  const typeMatch = inferTaskType(taskText);
  // Use character sheet preferences for routing
  return prefs.task_type_preferences[typeMatch] || prefs.fallback;
}
// #endregion

// #region Routing log
/**
 * Logs the routing decision to the /logs folder as JSONL.
 * @param {string} task - The task text.
 * @param {string} model - The selected model.
 * @param {string} taskType - The inferred task type.
 */
function logRouting(task, model, taskType) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    task,
    taskType,
    model,
  };
  // Ensure logs directory exists
  const logsDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
  // Append log entry as JSONL
  const filePath = path.join(logsDir, 'routing_log.jsonl');
  fs.appendFileSync(filePath, JSON.stringify(logEntry) + '\n');
}
// #endregion


// #region MCP bridge integration
// Import MCP export function
const { exportToMCP } = require('./mcp_bridge');
// #endregion

// #region Memory integration
// Import memory writer utility
const { writeMemory } = require('./memory');
// #endregion

// #region Main execution flow
/**
 * Main CLI entry point for routing tasks.
 */
function main() {
  // Step: If --recall is passed, show past memory entries and exit
  if (process.argv.includes('--recall')) {
    const { readMemory } = require('./memory');
    const past = readMemory('chip_talbert', 5);
    console.log('📜 Recent memory entries:\n', past.map(p => `- ${p.task} → ${p.model}`).join('\n'));
    return;
  }

  // Load character sheet config
  const character = loadCharacterSheet(
    path.join(__dirname, '../loadouts/AI Character Sheet – Chip Talbert.yaml')
  );
  // Extract task from CLI or stdin
  const task = getTaskFromCLI();
  // Select model based on routing logic
  const model = selectModel(task, character);
  // Infer task type for logging
  const taskType = inferTaskType(task);
  // Log routing decision
  logRouting(task, model, taskType);
  // Output routing result (CLI only)
  console.log(`🧠 Routed to: ${model} (for task type: ${taskType})`);

  // #region Export to MCP JSON
  const mcpFile = exportToMCP(task, model, taskType, { routed_by: 'routing.js' });
  console.log(`📝 Task exported to MCP format at: ${mcpFile}`);
  // #endregion

  // #region Write memory entry if enabled
  if (character.memory_use?.toggle === true) {
    const memoryEntry = {
      timestamp: new Date().toISOString(),
      task,
      taskType,
      model,
      routed_by: 'routing.js'
    };
    writeMemory('chip_talbert', memoryEntry); // match the loadout or persona name
    console.log('🧠 Memory written to /memory/chip_talbert.jsonl');
  }
  // #endregion
}
// #endregion

// #region CLI entry
if (require.main === module) {
  try {
    main();
  } catch (err) {
    // Log error to stderr and exit nonzero
    console.error('Error:', err.message);
    process.exit(1);
  }
}
// #endregion

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


// #region start: Simulated model API handlers

/**
 * Simulates GPT-4 API handler.
 * @param {string} taskText - The user task text.
 * @returns {string} Simulated GPT-4 response.
 */
function handleGPT4(taskText) {
  return `[GPT-4] 🤖 Pretending to handle: "${taskText}"`;
}

/**
 * Simulates Claude API handler.
 * @param {string} taskText - The user task text.
 * @returns {string} Simulated Claude response.
 */
function handleClaude(taskText) {
  return `[Claude] 💬 Mock response for: "${taskText}"`;
}

/**
 * Simulates Perplexity API handler.
 * @param {string} taskText - The user task text.
 * @returns {string} Simulated Perplexity response.
 */
function handlePerplexity(taskText) {
  return `[Perplexity] 🔍 Imaginary research result for: "${taskText}"`;
}

/**
 * Simulates SmolLM3 local handler.
 * @param {string} taskText - The user task text.
 * @returns {string} Simulated SmolLM3 response.
 */
function handleSmolLM3(taskText) {
  return `[SmolLM3] 🧠 Local-only mode reply: "${taskText}"`;
}

// #endregion

// #region start: Unified router function
/**
 * Routes the task to the appropriate simulated model handler.
 * @param {string} model - The model name (e.g., 'gpt-4', 'claude').
 * @param {string} taskText - The user task text.
 * @returns {string} Simulated model response.
 */
function routeToHandler(model, taskText) {
  switch (model.toLowerCase()) {
    case 'gpt-4':
    case 'gpt4':
      return handleGPT4(taskText);
    case 'claude':
      return handleClaude(taskText);
    case 'perplexity':
      return handlePerplexity(taskText);
    case 'smollm3':
      return handleSmolLM3(taskText);
    default:
      return `[Fallback] ❓ No matching model found for "${model}". Task was: "${taskText}"`;
  }
}
// #endregion

// #region Exports
module.exports = {
  detectTaskType,
  selectModel,
  handleGPT4,
  handleClaude,
  handlePerplexity,
  handleSmolLM3,
  routeToHandler
};
// #endregion
