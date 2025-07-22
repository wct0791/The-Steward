// Unit tests for memory.js
const fs = require('fs');
const path = require('path');
const { writeMemory, readMemory } = require('../models/memory');

describe('Memory module', () => {
  const testUser = 'test_user';
  const memFile = path.join(__dirname, `../memory/${testUser}.jsonl`);

  afterEach(() => {
    if (fs.existsSync(memFile)) fs.unlinkSync(memFile);
  });

  it('should write and read memory entries', () => {
    const entry = { foo: 'bar', n: 1 };
    writeMemory(testUser, entry);
    const entries = readMemory(testUser, 1);
    expect(entries.length).toBe(1);
    expect(entries[0].foo).toBe('bar');
  });

  it('should return empty array if file does not exist', () => {
    if (fs.existsSync(memFile)) fs.unlinkSync(memFile);
    expect(readMemory(testUser, 5)).toEqual([]);
  });
});
