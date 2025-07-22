// Unit tests for routing.js
const { detectTaskType, selectModel } = require('../models/routing');

describe('detectTaskType', () => {
  it('should detect summarize', () => {
    expect(detectTaskType('summarize this')).toBe('summarize');
  });
  it('should detect debug', () => {
    expect(detectTaskType('debug this function')).toBe('debug');
  });
  it('should detect write', () => {
    expect(detectTaskType('write me a story')).toBe('write');
  });
  it('should detect explain', () => {
    expect(detectTaskType('explain this topic')).toBe('explain');
  });
  it('should return general or unknown for default', () => {
    const result = detectTaskType('do something else');
    expect(['general', 'unknown', 'unknown_task']).toContain(result);
  });
});

describe('selectModel', () => {
  const config = {
    routing: {
      summarize: 'claude',
      write: 'gpt-4',
      debug: 'gpt-4',
      research: 'perplexity',
      explain: 'gemini',
      analyze: 'claude',
      general: 'gpt-4',
    }
  };
  it('should select correct model for write', () => {
    expect(selectModel('write', config).model || selectModel('write', config)).toBe('gpt-4');
  });
  it('should select correct model for summarize', () => {
    expect(selectModel('summarize', config).model || selectModel('summarize', config)).toBe('claude');
  });
  it('should fallback to general for unknown', () => {
    expect(selectModel('foo', config).model || selectModel('foo', config)).toBe('gpt-4');
  });
});
