// MCP bridge formatter for The Steward
// Formats output for n8n MCP ingestion (format-only, no automation logic)

/**
 * Formats a task, model, and response for MCP (n8n) ingestion.
 * @param {string} task - The original user task
 * @param {string} model - The model used (e.g., 'gpt-4')
 * @param {string} response - The full model response
 * @returns {object} - JSON object formatted for MCP
 */
function formatForMCP(task, model, response) {
  return {
    source: 'The Steward',
    task,
    model,
    result: response,
    mcp_version: 'v1',
    created_at: new Date().toISOString(),
  };
}

/**
 * Sends a payload to the MCP (n8n) endpoint via POST using built-in fetch.
 * @param {object} payload - The MCP-formatted payload
 * @returns {Promise<object>} - Resolves to response or error info
 */
async function sendToMCP(payload) {
  const url = process.env.N8N_API_URL || 'http://localhost:5678/webhook/mcp';
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data || `HTTP ${response.status}`,
        status: response.status
      };
    }

    return { 
      success: true, 
      status: response.status, 
      data: data 
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      status: null,
    };
  }
}

module.exports = { formatForMCP, sendToMCP };
