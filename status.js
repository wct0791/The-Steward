#!/usr/bin/env node

// #region start: System Status Checker for The Steward
// Checks system health, configuration, and provides diagnostic information

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { analyzeRoutingPerformance } = require('./models/enhanced-logger');

async function checkSystemStatus() {
  console.log(`
🔍 The Steward System Status Check
==================================
`);

  const status = {
    configuration: { score: 0, max: 4 },
    models: { score: 0, max: 3 },
    infrastructure: { score: 0, max: 3 },
    performance: { score: 0, max: 2 }
  };

  // Configuration checks
  console.log('📋 Configuration Status:');
  
  try {
    const charSheet = yaml.load(fs.readFileSync('character-sheet.yaml', 'utf8'));
    console.log('✅ Character sheet loaded successfully');
    status.configuration.score++;
    
    if (charSheet.task_type_preferences) {
      console.log('✅ Task type preferences configured');
      status.configuration.score++;
    } else {
      console.log('⚠️  Task type preferences missing');
    }
    
    if (charSheet.fallback_behavior) {
      console.log('✅ Fallback behavior configured');
      status.configuration.score++;
    } else {
      console.log('⚠️  Fallback behavior not configured');
    }
    
  } catch (err) {
    console.log('❌ Character sheet error:', err.message);
  }

  // Check loadouts
  try {
    const loadoutsDir = 'loadouts';
    if (fs.existsSync(loadoutsDir)) {
      const loadouts = fs.readdirSync(loadoutsDir).filter(f => f.endsWith('.yaml'));
      console.log(`✅ ${loadouts.length} loadouts available: ${loadouts.map(l => l.replace('.yaml', '')).join(', ')}`);
      status.configuration.score++;
    } else {
      console.log('⚠️  Loadouts directory not found');
    }
  } catch (err) {
    console.log('❌ Loadouts check failed:', err.message);
  }

  // Model configuration checks
  console.log('\n🤖 Model Configuration:');
  
  try {
    const modelsYaml = yaml.load(fs.readFileSync('models/models.yaml', 'utf8'));
    const modelCount = Object.keys(modelsYaml).length;
    console.log(`✅ ${modelCount} models configured`);
    status.models.score++;
    
    // Check for different model types
    const cloudModels = Object.entries(modelsYaml).filter(([_, meta]) => meta.type === 'cloud');
    const localModels = Object.entries(modelsYaml).filter(([_, meta]) => meta.type === 'local');
    
    console.log(`✅ ${cloudModels.length} cloud models, ${localModels.length} local models`);
    status.models.score++;
    
  } catch (err) {
    console.log('❌ Models configuration error:', err.message);
  }

  // Check environment variables
  require('dotenv').config();
  const requiredEnvVars = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY'];
  const configuredKeys = requiredEnvVars.filter(key => process.env[key]);
  
  if (configuredKeys.length > 0) {
    console.log(`✅ ${configuredKeys.length}/${requiredEnvVars.length} API keys configured`);
    status.models.score++;
  } else {
    console.log('⚠️  No API keys found in environment');
  }

  // Infrastructure checks
  console.log('\n🏗️  Infrastructure Status:');
  
  // Check core files
  const coreFiles = [
    'src/core/routing-engine.js',
    'src/core/cli-handler.js',
    'models/enhanced-logger.js'
  ];
  
  const missingFiles = coreFiles.filter(file => !fs.existsSync(file));
  if (missingFiles.length === 0) {
    console.log('✅ All core files present');
    status.infrastructure.score++;
  } else {
    console.log(`❌ Missing files: ${missingFiles.join(', ')}`);
  }

  // Check logs directory
  if (fs.existsSync('logs')) {
    console.log('✅ Logs directory exists');
    status.infrastructure.score++;
  } else {
    console.log('⚠️  Logs directory missing (will be created on first run)');
  }

  // Check Docker integration
  try {
    const dockerConfig = yaml.load(fs.readFileSync('models/docker_runner.yaml', 'utf8'));
    const enabledModels = dockerConfig.models?.filter(m => m.enabled) || [];
    console.log(`✅ Docker configuration found with ${enabledModels.length} enabled models`);
    status.infrastructure.score++;
  } catch (err) {
    console.log('⚠️  Docker configuration not found or invalid');
  }

  // Performance analysis
  console.log('\n📊 Performance Analysis:');
  
  try {
    const perfAnalysis = analyzeRoutingPerformance(7);
    if (perfAnalysis.totalTasks > 0) {
      console.log(`✅ ${perfAnalysis.totalTasks} tasks processed in last 7 days`);
      console.log(`   Success rate: ${perfAnalysis.successRate.toFixed(1)}%`);
      console.log(`   Average confidence: ${perfAnalysis.averageConfidence.toFixed(2)}`);
      console.log(`   Fallback rate: ${perfAnalysis.fallbackRate.toFixed(1)}%`);
      status.performance.score += 2;
    } else {
      console.log('ℹ️  No recent task history found');
      status.performance.score += 1;
    }
  } catch (err) {
    console.log('⚠️  Performance analysis unavailable:', err.message);
  }

  // Overall health score
  const totalScore = Object.values(status).reduce((sum, cat) => sum + cat.score, 0);
  const maxScore = Object.values(status).reduce((sum, cat) => sum + cat.max, 0);
  const healthPercentage = Math.round((totalScore / maxScore) * 100);

  console.log(`\n🎯 Overall System Health: ${healthPercentage}% (${totalScore}/${maxScore})`);
  
  let healthEmoji = '🟢';
  let healthStatus = 'Excellent';
  
  if (healthPercentage < 50) {
    healthEmoji = '🔴';
    healthStatus = 'Needs Attention';
  } else if (healthPercentage < 75) {
    healthEmoji = '🟡';
    healthStatus = 'Good';
  }
  
  console.log(`${healthEmoji} Status: ${healthStatus}`);

  // Recommendations
  console.log('\n💡 Recommendations:');
  
  if (status.configuration.score < status.configuration.max) {
    console.log('   • Complete character sheet configuration');
    console.log('   • Set up loadouts for different use cases');
  }
  
  if (status.models.score < status.models.max) {
    console.log('   • Configure API keys in .env file');
    console.log('   • Review models.yaml for your use cases');
  }
  
  if (status.infrastructure.score < status.infrastructure.max) {
    console.log('   • Ensure all core files are present');
    console.log('   • Set up Docker for local model fallbacks');
  }
  
  if (healthPercentage === 100) {
    console.log('   🎉 System is fully configured and ready!');
    console.log('   • Try: npm run enhanced -- "Hello world" --verbose');
  }

  console.log('\n📚 Next Steps:');
  console.log('   • Run: npm run migrate for migration guidance');
  console.log('   • Test: npm run enhanced -- "test task" --dry-run');
  console.log('   • Docs: Check docs/ENHANCED-CLI.md for full documentation');
}

// Run the status check
if (require.main === module) {
  checkSystemStatus().catch(console.error);
}

module.exports = { checkSystemStatus };

// #endregion end: System Status Checker