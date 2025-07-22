// #region start: Load environment variables using dotenv
// This module loads environment variables from a .env file (if present)
// and exports them as constants with defaults where appropriate.

const dotenv = require('dotenv');
dotenv.config();

/**
 * Environment variable constants
 * Add new variables here as needed, with fallbacks for accessibility and reliability.
 */
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || '';
const SMOLLM3_PATH = process.env.SMOLLM3_PATH || '';

// #endregion end: Load environment variables

module.exports = {
  LOG_LEVEL,
  OPENAI_API_KEY,
  CLAUDE_API_KEY,
  GEMINI_API_KEY,
  PERPLEXITY_API_KEY,
  SMOLLM3_PATH,
};
