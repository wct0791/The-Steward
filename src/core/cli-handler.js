// #region start: Enhanced CLI Handler for The Steward
// Implements the complete CLI interface with improved routing, error handling, and logging
// Follows the architecture specified in The Steward Master Document

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const yargs = require('yargs');
const crypto = require('crypto');
const readline = require('readline');

// Import core modules
const { makeRoutingDecision, validateRoutingDecision } = require('./routing-engine');
const { callModel } = require('../../models/model-handler');
const { logTask, logFeedback } = require('../../models/logger');
const { tryLocalTiers } = require('../utils/routing');
const { formatForMCP, sendToMCP } = require('../../models/mcp-bridge');
const config = require('../../models/env');

/**
 * Enhanced CLI argument parser with comprehensive options
 */
function parseArguments() {
  return yargs(process.argv.slice(2))
    .usage('Usage: $0 <task> [options]')
    .demandCommand(1, 'Please provide a task description.')
    .option('loadout', {
      alias: 'l',
      describe: 'Loadout name (e.g., creative, sqa_mode, frugal_mode)',
      type: 'string',
    })
    .option('prefer-tier', {
      describe: 'Prefer models of specific tier (fast, high-quality, balanced, backup)',
      type: 'string',
      choices: ['fast', 'high-quality', 'balanced', 'backup']
    })
    .option('use-case', {
      describe: 'Prefer models for specific use case (write, debug, research, etc.)',
      type: 'string',
      choices: ['write', 'debug', 'research', 'code', 'summarize', 'analyze', 'fallback']
    })
    .option('memory', {
      describe: 'Override memory setting (on/off)',
      type: 'string',
      choices: ['on', 'off']
    })
    .option('mcp', {
      describe: 'Output MCP-formatted JSON to mcp_output.json',
      type: 'boolean',
      default: false
    })
    .option('send-mcp', {
      describe: 'Send result to MCP endpoint',
      type: 'boolean',
      default: false
    })
    .option('dry-run', {
      describe: 'Show routing decision without executing',
      type: 'boolean',
      default: false
    })
    .option('verbose', {
      alias: 'v',
      describe: 'Verbose output with detailed routing info',
      type: 'boolean',
      default: false
    })
    .option('no-fallback', {
      describe: 'Disable fallback to local models on cloud failure',
      type: 'boolean',
      default: false
    })
    .help()
    .argv;
}

/**
 * Load and merge character sheet with loadout configuration
 * @param {string} loadoutName - Optional loadout name
 * @returns {object} - Merged configuration
 */
function loadConfiguration(loadoutName) {
  // Step 1: Load base character sheet
  const charSheetPath = path.join(__dirname, '../../character-sheet.yaml');
  let characterSheet = {};
  
  try {
    const fileContents = fs.readFileSync(charSheetPath, 'utf8');
    characterSheet = yaml.load(fileContents);
  } catch (err) {
    console.error('❌ Error loading character sheet:', err.message);
    process.exit(1);
  }
  
  // Step 2: Apply loadout overrides if specified
  if (loadoutName) {
    const loadoutPath = path.join(__dirname, '../../loadouts', `${loadoutName}.yaml`);
    try {
      const loadoutContents = fs.readFileSync(loadoutPath, 'utf8');
      const loadoutConfig = yaml.load(loadoutContents);
      
      // Deep merge loadout into character sheet
      characterSheet = {
        ...characterSheet,
        ...loadoutConfig,
        loadout: loadoutName
      };
      
      console.log(`✅ Loaded loadout: ${loadoutName}`);
    } catch (err) {
      console.warn(`⚠️ Warning: Failed to load loadout '${loadoutName}': ${err.message}`);
    }
  }
  
  return characterSheet;
}

/**
 * Display routing decision information
 * @param {object} decision - Routing decision object
 * @param {boolean} verbose - Whether to show detailed information
 */
function displayRoutingInfo(decision, verbose = false) {
  console.log(`\n📥 Task: ${decision.task}`);
  console.log(`🎯 Classification: ${decision.classification.type} (confidence: ${decision.classification.confidence.toFixed(2)})`);
  
  if (decision.classification.keywords.length > 0) {
    console.log(`🔍 Keywords: ${decision.classification.keywords.join(', ')}`);
  }
  
  console.log(`🚀 Selected Model: ${decision.selection.model}`);
  console.log(`💭 Reason: ${decision.selection.reason}`);
  
  if (verbose) {
    console.log(`🎛 Loadout: ${decision.loadout}`);
    console.log(`⏰ Timestamp: ${decision.timestamp}`);
    
    if (decision.selection.fallbacks?.length > 0) {
      console.log(`🔄 Fallbacks: ${decision.selection.fallbacks.join(' → ')}`);
    }
    
    if (Object.keys(decision.options).length > 0) {
      console.log(`⚙️ Options: ${JSON.stringify(decision.options)}`);
    }
  }
}

/**
 * Execute model call with comprehensive error handling and fallback logic
 * @param {string} prompt - The complete prompt to send
 * @param {object} decision - Routing decision
 * @param {object} options - CLI options
 * @returns {object} - Execution result with model used and response
 */
async function executeModelCall(prompt, decision, options) {
  const { selection } = decision;
  let attempts = [];
  
  // Prepare the fallback chain: primary model + fallbacks
  const modelChain = [selection.model, ...(selection.fallbacks || [])];
  
  for (let i = 0; i < modelChain.length; i++) {
    const currentModel = modelChain[i];
    const isPrimary = i === 0;
    const attempt = {
      model: currentModel,
      isPrimary,
      success: false,
      error: null,
      response: null
    };
    
    try {
      console.log(isPrimary ? 
        `🤖 Calling ${currentModel}...` : 
        `🔄 Fallback to ${currentModel}...`
      );
      
      const response = await callModel(prompt, { model: currentModel });
      
      // Validate response
      if (!response || typeof response !== 'string' || !response.trim()) {
        throw new Error('Empty or invalid model response');
      }
      
      attempt.success = true;
      attempt.response = response;
      attempts.push(attempt);
      
      return {
        success: true,
        model: currentModel,
        response,
        isPrimary,
        attempts
      };
      
    } catch (err) {
      attempt.error = err.message;
      attempts.push(attempt);
      
      console.warn(`⚠️ ${currentModel} failed: ${err.message}`);
      
      // If fallback is disabled and this was the primary model, stop here
      if (options.noFallback && isPrimary) {
        break;
      }
    }
  }
  
  // If all models in the chain failed, try Docker local tiers as last resort
  if (!options.noFallback) {
    try {
      console.log('🐳 Attempting Docker local fallback...');
      const dockerResult = await tryLocalTiers(prompt);
      
      if (dockerResult?.text) {
        const dockerAttempt = {
          model: dockerResult.model || 'docker-local',
          isPrimary: false,
          success: true,
          response: dockerResult.text,
          isDockerFallback: true
        };
        attempts.push(dockerAttempt);
        
        return {
          success: true,
          model: dockerAttempt.model,
          response: dockerResult.text,
          isPrimary: false,
          isDockerFallback: true,
          attempts
        };
      }
    } catch (dockerErr) {
      attempts.push({
        model: 'docker-local',
        isPrimary: false,
        success: false,
        error: dockerErr.message,
        isDockerFallback: true
      });
    }
  }
  
  // Complete failure
  return {
    success: false,
    model: null,
    response: '[All models failed to provide a valid response]',
    attempts
  };
}

/**
 * Handle memory integration based on user settings
 * @param {string} taskInput - Original task input
 * @param {object} characterSheet - User configuration
 * @param {object} options - CLI options
 * @returns {string} - Complete prompt with memory context if enabled
 */
function handleMemoryIntegration(taskInput, characterSheet, options) {
  // Determine if memory should be used
  const memoryOverride = options.memory;
  const memoryEnabled = memoryOverride === 'on' || 
    (memoryOverride !== 'off' && (characterSheet.memory_use?.toggle === true || process.env.MEMORY === 'on'));
  
  if (!memoryEnabled) {
    return taskInput;
  }
  
  try {
    // Import memory functions dynamically to avoid errors if not available
    const { loadMemory } = require('../../models/memory');
    const projectName = characterSheet.projectName || 'default';
    const memoryContext = loadMemory(projectName);
    
    if (memoryContext) {
      console.log('🧠 Memory context loaded');
      return `${memoryContext}\n\n${taskInput}`;
    }
  } catch (err) {
    console.warn(`⚠️ Memory loading failed: ${err.message}`);
  }
  
  return taskInput;
}

/**
 * Collect user feedback on the result
 * @param {string} taskId - Unique task identifier
 * @returns {Promise<string>} - User feedback
 */
function collectFeedback(taskId) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ 
      input: process.stdin, 
      output: process.stdout 
    });
    
    rl.question('\n💬 Was this result helpful? (y/n/skip): ', (answer) => {
      let feedback = 'unsure';
      const trimmed = answer.trim().toLowerCase();
      
      if (trimmed === 'y' || trimmed === 'yes') {
        feedback = 'thumbs-up';
      } else if (trimmed === 'n' || trimmed === 'no') {
        feedback = 'thumbs-down';
      } else if (trimmed === 'skip' || trimmed === 's') {
        feedback = 'skipped';
      }
      
      logFeedback(taskId, feedback);
      rl.close();
      resolve(feedback);
    });
  });
}

/**
 * Handle MCP integration (export and/or send)
 * @param {string} taskInput - Original task
 * @param {string} model - Model used
 * @param {string} response - Model response
 * @param {object} options - CLI options
 */
async function handleMCPIntegration(taskInput, model, response, options) {
  if (!options.mcp && !options.sendMcp) {
    return;
  }
  
  const mcpPayload = formatForMCP(taskInput, model, response);
  
  if (options.mcp) {
    try {
      fs.writeFileSync('mcp_output.json', JSON.stringify(mcpPayload, null, 2));
      console.log('📝 Output saved to mcp_output.json');
    } catch (err) {
      console.warn(`⚠️ Failed to write MCP output: ${err.message}`);
    }
  }
  
  if (options.sendMcp) {
    try {
      const sendResult = await sendToMCP(mcpPayload);
      if (sendResult.success) {
        console.log(`📤 Sent to MCP: status ${sendResult.status}`);
      } else {
        console.warn(`⚠️ MCP send failed: ${sendResult.error}`);
      }
    } catch (err) {
      console.warn(`⚠️ MCP send error: ${err.message}`);
    }
  }
}

/**
 * Main CLI execution function
 */
async function main() {
  try {
    // Step 1: Parse CLI arguments
    const argv = parseArguments();
    const taskInput = argv._.join(' ');
    const loadoutName = argv.loadout || config.DEFAULT_LOADOUT;
    
    // Step 2: Load configuration
    const characterSheet = loadConfiguration(loadoutName);
    
    // Step 3: Make routing decision
    const routingOptions = {
      preferTier: argv.preferTier,
      useCase: argv.useCase
    };
    
    const decision = makeRoutingDecision(taskInput, characterSheet, routingOptions);
    const validation = validateRoutingDecision(decision);
    
    // Step 4: Display routing information
    displayRoutingInfo(decision, argv.verbose);
    
    // Show validation warnings
    if (validation.warnings.length > 0) {
      console.warn(`⚠️ Routing warnings: ${validation.warnings.join(', ')}`);
    }
    
    // Step 5: Handle dry-run mode
    if (argv.dryRun) {
      console.log('\n🏃‍♂️ Dry run mode - routing decision complete, no model execution');
      return;
    }
    
    // Step 6: Prepare prompt with memory context
    const fullPrompt = handleMemoryIntegration(taskInput, characterSheet, argv);
    
    // Step 7: Execute model call
    const result = await executeModelCall(fullPrompt, decision, argv);
    
    // Step 8: Display results
    if (result.success) {
      console.log(`\n🤖 ${result.isPrimary ? 'Primary' : 'Fallback'} Model Response (${result.model}):`);
      console.log(result.response);
      
      if (result.isDockerFallback) {
        console.log('\n🐳 Used Docker local fallback');
      }
    } else {
      console.error(`\n❌ All models failed to provide a response`);
      if (argv.verbose && result.attempts.length > 0) {
        console.log('\n📊 Attempt Details:');
        result.attempts.forEach((attempt, i) => {
          console.log(`  ${i + 1}. ${attempt.model}: ${attempt.success ? '✅' : '❌'} ${attempt.error || ''}`);
        });
      }
    }
    
    // Step 9: Log the task and result
    const taskId = crypto.createHash('sha1').update(taskInput).digest('hex').slice(0, 10);
    logTask(taskInput, decision.selection, result.response);
    
    // Step 10: Handle MCP integration
    await handleMCPIntegration(taskInput, result.model, result.response, argv);
    
    // Step 11: Collect user feedback (unless it's a dry run or complete failure)
    if (result.success && !argv.dryRun) {
      await collectFeedback(taskId);
    }
    
  } catch (err) {
    console.error('❌ CLI Error:', err.message);
    if (config.LOG_LEVEL === 'debug') {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

// Export for testing and module usage
module.exports = {
  parseArguments,
  loadConfiguration,
  displayRoutingInfo,
  executeModelCall,
  handleMemoryIntegration,
  collectFeedback,
  handleMCPIntegration,
  main
};

// Run main function if this file is executed directly
if (require.main === module) {
  main();
}

// #endregion end: Enhanced CLI Handler