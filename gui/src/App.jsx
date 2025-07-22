import React, { useState } from 'react';

// #region start: The Steward GUI Shell
export default function App() {
  // State variables
  const [task, setTask] = useState('');
  const [loadout, setLoadout] = useState('');
  const [result, setResult] = useState('');
  const [routeInfo, setRouteInfo] = useState({ model: '', reason: '' });
  const [loading, setLoading] = useState(false);

  // Stub: Simulate routing and response
  function handleRunTask() {
    setLoading(true);
    setResult('');
    setRouteInfo({ model: '', reason: '' });
    setTimeout(() => {
      // Mock routing logic
      const mockModel = 'gpt-4';
      const mockReason = 'matched summarize rule';
      const mockResponse = `This is a mock response from ${mockModel}. Task: "${task}"`;
      setRouteInfo({ model: mockModel, reason: mockReason });
      setResult(mockResponse);
      setLoading(false);
    }, 1000);
  }

  // Stub: Export as MCP
  function handleExportMCP() {
    const mcpPayload = {
      source: 'The Steward',
      task,
      model: routeInfo.model,
      result,
      mcp_version: 'v1',
      created_at: new Date().toISOString(),
    };
    // For now, just alert JSON
    alert(JSON.stringify(mcpPayload, null, 2));
  }

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'sans-serif', padding: 24, border: '1px solid #ccc', borderRadius: 8 }}>
      <h1 style={{ textAlign: 'center' }}>The Steward</h1>
      <div style={{ marginBottom: 16 }}>
        <label>
          Loadout (optional):
          <input
            type="text"
            value={loadout}
            onChange={e => setLoadout(e.target.value)}
            style={{ marginLeft: 8, width: 200 }}
            placeholder="e.g. creative, sqa_mode"
          />
        </label>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>
          Task:
          <textarea
            value={task}
            onChange={e => setTask(e.target.value)}
            rows={4}
            style={{ width: '100%', marginTop: 4 }}
            placeholder="Describe your task..."
          />
        </label>
      </div>
      <button onClick={handleRunTask} disabled={loading || !task.trim()} style={{ padding: '8px 24px', fontSize: 16 }}>
        {loading ? 'Running...' : 'Run Task'}
      </button>
      <button onClick={handleExportMCP} disabled={!result} style={{ marginLeft: 16, padding: '8px 16px' }}>
        Export as MCP
      </button>
      <div style={{ marginTop: 32, background: '#f9f9f9', padding: 16, borderRadius: 6, minHeight: 120 }}>
        <strong>Routed model:</strong> {routeInfo.model || '-'}<br />
        <strong>Routing reason:</strong> {routeInfo.reason || '-'}<br />
        <strong>Response:</strong>
        <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{result || '-'}</pre>
      </div>
    </div>
  );
}
// #endregion end: The Steward GUI Shell
