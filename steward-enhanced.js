#!/usr/bin/env node

// #region start: The Steward - Enhanced Main Entry Point
// Main CLI entry point for The Steward AI coordination system
// Implements the enhanced routing engine and CLI handler architecture

const { main } = require('./src/core/cli-handler');

// Execute the main CLI handler
main().catch((error) => {
  console.error('💥 Fatal error:', error.message);
  process.exit(1);
});

// #endregion end: Enhanced Main Entry Point