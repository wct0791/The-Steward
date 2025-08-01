#!/usr/bin/env node

// #region start: Migration Helper for Enhanced Steward
// Helps transition from legacy steward.js to enhanced CLI system
// Provides compatibility layer and migration guidance

const fs = require('fs');
const path = require('path');

console.log(`
🚀 The Steward Migration Helper
==============================

This script helps you transition from the legacy steward.js to the enhanced CLI system.

📋 Current System Status:
`);

// Check for existing files
const checks = [
  { file: 'steward.js', name: 'Legacy CLI', status: 'legacy' },
  { file: 'steward-enhanced.js', name: 'Enhanced CLI', status: 'new' },
  { file: 'src/core/routing-engine.js', name: 'Enhanced Routing Engine', status: 'new' },
  { file: 'src/core/cli-handler.js', name: 'Enhanced CLI Handler', status: 'new' },
  { file: 'models/enhanced-logger.js', name: 'Enhanced Logger', status: 'new' },
  { file: 'character-sheet.yaml', name: 'Character Sheet', status: 'shared' },
  { file: 'models/model-metadata.js', name: 'Model Metadata', status: 'shared' }
];

checks.forEach(check => {
  const exists = fs.existsSync(check.file);
  const emoji = exists ? '✅' : '❌';
  const statusEmoji = check.status === 'new' ? '🆕' : check.status === 'legacy' ? '🔄' : '🔗';
  console.log(`${emoji} ${statusEmoji} ${check.name}: ${exists ? 'Found' : 'Missing'}`);
});

console.log(`
🎯 Migration Guide:

1. ENHANCED CLI USAGE:
   Replace: node steward.js "your task"
   With:    node steward-enhanced.js "your task"

2. NEW FEATURES AVAILABLE:
   • Improved task classification with confidence scoring
   • Comprehensive fallback chains (cloud → local → Docker)
   • Enhanced logging with performance metrics
   • Dry-run mode: --dry-run
   • Verbose output: --verbose
   • Memory control: --memory on/off
   • Tier preferences: --prefer-tier high-quality
   • Use case optimization: --use-case debug

3. EXAMPLE COMMANDS:
   
   Basic usage:
   node steward-enhanced.js "Debug this JavaScript error"
   
   With loadout:
   node steward-enhanced.js "Write a summary" --loadout sqa_mode
   
   Development mode (dry run):
   node steward-enhanced.js "Test task" --dry-run --verbose
   
   Prefer high-quality models:
   node steward-enhanced.js "Important analysis" --prefer-tier high-quality
   
   Memory-enabled research:
   node steward-enhanced.js "Continue our discussion" --memory on

4. COMPATIBILITY:
   • Character sheet configuration remains the same
   • Loadouts work identically
   • All existing model handlers are supported
   • Environment variables (.env) are unchanged

5. PERFORMANCE IMPROVEMENTS:
   • Better error handling and recovery
   • Intelligent fallback to local models
   • Enhanced routing with confidence metrics
   • Comprehensive audit logging

6. TESTING THE ENHANCED SYSTEM:
   
   # Test basic functionality
   npm run enhanced -- "Hello world" --dry-run --verbose
   
   # Test with your preferred loadout
   npm run enhanced -- "Test task" --loadout creative --dry-run
   
   # Run the test suite
   npm test

7. MIGRATION CHECKLIST:
   □ Test enhanced CLI with --dry-run flag
   □ Verify character sheet loads correctly
   □ Test preferred loadout configurations
   □ Confirm API keys work with new system
   □ Check Docker model fallbacks (if used)
   □ Review logs in logs/ directory
   □ Update any automation scripts to use new CLI

8. GETTING HELP:
   node steward-enhanced.js --help
   
   For detailed documentation: docs/ENHANCED-CLI.md

⚠️  BACKWARD COMPATIBILITY:
The legacy steward.js will continue to work, but the enhanced version provides
significantly better error handling, performance, and debugging capabilities.

🎉 READY TO START:
Try: npm run enhanced -- "What's the weather today?" --dry-run --verbose
`);

// Offer to run a test
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('\n🧪 Would you like to run a test of the enhanced system? (y/n): ', (answer) => {
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    console.log('\n🚀 Running enhanced system test...\n');
    
    const { spawn } = require('child_process');
    const testProcess = spawn('node', [
      'steward-enhanced.js', 
      'Hello, this is a test of the enhanced Steward system',
      '--dry-run',
      '--verbose'
    ], { stdio: 'inherit' });
    
    testProcess.on('close', (code) => {
      console.log('\n✅ Test complete! Check the output above for routing details.');
      console.log('\n📚 Next steps:');
      console.log('   • Try without --dry-run to execute actual model calls');
      console.log('   • Experiment with different --loadout options');
      console.log('   • Check logs/ directory for detailed audit trails');
      rl.close();
    });
  } else {
    console.log('\n👍 No problem! You can test anytime with:');
    console.log('npm run enhanced -- "your test task" --dry-run --verbose');
    rl.close();
  }
});

// #endregion end: Migration Helper