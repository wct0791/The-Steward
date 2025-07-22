// #region start: Logging utility for The Steward
// Logs task, routing, and model response to a dated log file in /logs/

const fs = require('fs');
const path = require('path');
const { LOG_LEVEL } = require('./env');

const LOG_LEVELS = ['error', 'warn', 'info', 'debug'];

/**
 * Logs a task, routing info, and model response to a dated log file.
 * @param {string} task - The user task string.
 * @param {object} route - Routing info (e.g., { model, reason })
 * @param {string} response - Model response string
 * @param {string} [level='info'] - Log level (optional)
 */
function logTask(task, route, response, level = 'info') {
  // #region start: Log level filter
  const configLevelIdx = LOG_LEVELS.indexOf((LOG_LEVEL || 'info').toLowerCase());
  const entryLevelIdx = LOG_LEVELS.indexOf(level);
  if (entryLevelIdx > configLevelIdx) return; // Skip if below threshold
  // #endregion end: Log level filter

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const timeStr = now.toISOString().slice(11, 19); // HH:MM:SS
  const logDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  const logFile = path.join(logDir, `${dateStr}.log`);
  const snippet = task.length > 60 ? task.slice(0, 57) + '...' : task;
  const logLine = `[${dateStr} ${timeStr}] [${route.model}] [${level}] Task: "${snippet}" | Reason: ${route.reason} | Response: ${response ? response.slice(0, 80).replace(/\n/g, ' ') + (response.length > 80 ? '...' : '') : ''}\n`;
  fs.appendFileSync(logFile, logLine, 'utf8');
}

/**
 * Logs user feedback for a given task.
 * @param {string} taskId - Unique task identifier
 * @param {string} feedback - 'thumbs-up' | 'thumbs-down' | 'unsure'
 */
function logFeedback(taskId, feedback) {
  const fs = require('fs');
  const path = require('path');
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const logDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  const logFile = path.join(logDir, `task-${taskId}.log`);
  const entry = {
    timestamp: now.toISOString(),
    taskId,
    feedback,
  };
  fs.appendFileSync(logFile, JSON.stringify(entry) + '\n', 'utf8');
}

// #endregion end: Logging utility

module.exports = { logTask, logFeedback };
