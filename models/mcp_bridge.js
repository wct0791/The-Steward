// #region start: MCP bridge export
// Exports a routed task as an MCP-style JSON spec for n8n or other automations.
const fs = require('fs');
const path = require('path');

/**
 * Exports a routed task to MCP JSON format and saves to logs.
 * @param {string} task - The user task text.
 * @param {string} model - The selected model name.
 * @param {string} taskType - The inferred task type.
 * @param {object} [metadata={}] - Optional metadata for traceability.
 * @returns {string} The file path of the exported MCP JSON file.
 */
function exportToMCP(task, model, taskType, metadata = {}) {
  const mcpPayload = {
    task,
    model,
    task_type: taskType,
    metadata,
    timestamp: new Date().toISOString(),
  };
  // Save to file (simulate MCP handoff)
  const fileName = `mcp_task_${Date.now()}.json`;
  const filePath = path.join(__dirname, '../logs/', fileName);
  fs.writeFileSync(filePath, JSON.stringify(mcpPayload, null, 2));
  return filePath;
}
// #endregion

module.exports = { exportToMCP };
