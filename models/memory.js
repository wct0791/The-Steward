// #region start: Memory loader for The Steward
// Loads and (optionally) writes project memory from ./memory/

const fs = require('fs');
const path = require('path');

/**
 * Loads memory for a given project from ./memory/{projectName}.txt
 * @param {string} projectName - The project name (no extension)
 * @returns {string|null} - File content as string, or null if not found
 */
function loadMemory(projectName) {
  const memPath = path.join(__dirname, '../memory', `${projectName}.txt`);
  if (fs.existsSync(memPath)) {
    return fs.readFileSync(memPath, 'utf8');
  }
  return null;
}

/**
 * Writes memory for a given project to ./memory/{projectName}.txt
 * @param {string} projectName - The project name (no extension)
 * @param {string} content - Content to write
 */
function writeMemory(projectName, content) {
  const memPath = path.join(__dirname, '../memory', `${projectName}.txt`);
  fs.writeFileSync(memPath, content, 'utf8');
}

// #endregion end: Memory loader

module.exports = { loadMemory, writeMemory };
