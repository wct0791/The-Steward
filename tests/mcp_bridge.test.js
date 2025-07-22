// Unit tests for mcp_bridge.js
const fs = require('fs');
const path = require('path');
const { exportToMCP } = require('../models/mcp_bridge');

describe('exportToMCP', () => {
  let mcpFile;
  const dummy = {
    task: 'test task',
    model: 'gpt-4',
    taskType: 'write',
    metadata: { foo: 'bar' }
  };
  afterEach(() => {
    if (mcpFile && fs.existsSync(mcpFile)) fs.unlinkSync(mcpFile);
  });
  it('should export MCP JSON and match fields', () => {
    mcpFile = exportToMCP(dummy.task, dummy.model, dummy.taskType, dummy.metadata);
    expect(fs.existsSync(mcpFile)).toBe(true);
    const data = JSON.parse(fs.readFileSync(mcpFile, 'utf8'));
    expect(data.task).toBe(dummy.task);
    expect(data.model).toBe(dummy.model);
    expect(data.task_type).toBe(dummy.taskType);
    expect(data.metadata.foo).toBe('bar');
  });
});
