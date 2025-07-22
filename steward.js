// #region start: Import memory loader
const { loadMemory } = require('./models/memory');
// #endregion end: Import memory loader
// #region start: Import MCP bridge
const { formatForMCP } = require('./models/mcp-bridge');
// #endregion end: Import MCP bridge
// #region start: Import SmolLM3 meta-router
const { askSmolRouter } = require('./models/smol-router');
// #endregion end: Import SmolLM3 meta-router
// #region start: Import logger
const { logTask } = require('./models/logger');
// #endregion end: Import logger
// #region start: Import model handler
const { callModel } = require('./models/model-handler');
// #endregion end: Import model handler
// #region start: Import routing logic
const { detectTaskType, selectModel } = require('./models/routing');
// #endregion end: Import routing logic
// 1. Import required modules
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const yargs = require('yargs');

// #region start: Import environment config
const config = require('./models/env');
// #endregion end: Import environment config

// 2. Parse CLI arguments using yargs
const argv = yargs
  .usage('Usage: $0 <task> [--loadout <name>] [--mcp] [--send-mcp] [--prefer-tier <tier>] [--use-case <useCase>]')
  .demandCommand(1, 'Please provide a task description.')
  .option('loadout', {
    alias: 'l',
    describe: 'Optional loadout name (e.g., creative, sqa_mode)',
    type: 'string',
  })
  .option('mcp', {
    describe: 'Output MCP-formatted JSON to mcp_output.json',
    type: 'boolean',
    default: false,
  })
  .option('send-mcp', {
    describe: 'Send MCP-formatted JSON to MCP endpoint',
    type: 'boolean',
    default: false,
  })
  .option('prefer-tier', {
    describe: 'Prefer models of a given tier (e.g., fast, high-quality, balanced, backup)',
    type: 'string',
  })
  .option('use-case', {
    describe: 'Prefer models for a use case (e.g., code, debug, fallback, write)',
    type: 'string',
  })
  .help()
  .argv;

const taskInput = argv._.join(' ');
// Use config.DEFAULT_LOADOUT if present, else fallback to argv.loadout
const loadoutName = argv.loadout || config.DEFAULT_LOADOUT;

// 3. Load character-sheet.yaml
const charSheetPath = path.join(__dirname, 'character-sheet.yaml');
let characterSheet = {};

try {
  const fileContents = fs.readFileSync(charSheetPath, 'utf8');
  characterSheet = yaml.load(fileContents);
} catch (err) {
  console.error('Error loading character sheet:', err.message);
  process.exit(1);
}

// 4. Optionally load and merge loadout config
if (loadoutName) {
  const loadoutPath = path.join(__dirname, 'loadouts', `${loadoutName}.yaml`);
  try {
    const loadoutContents = fs.readFileSync(loadoutPath, 'utf8');
    const loadoutConfig = yaml.load(loadoutContents);
    characterSheet = {
      ...characterSheet,
      ...loadoutConfig, // Loadout overrides base config
    };
  } catch (err) {
    console.warn(`Warning: Failed to load loadout '${loadoutName}':`, err.message);
  }
}

// 5. Print summary for confirmation
console.log('\n📥 Input Task:\n', taskInput);
console.log('\n🎛 Active Loadout:', loadoutName || 'default');
console.log('\n🧾 Parsed Config:\n', characterSheet);

// #region start: Routing logic
const { getModelsByTier, getModelsByUseCase } = require('./models/model-metadata');
const taskType = detectTaskType(taskInput);
let route = selectModel(taskType, characterSheet);

// If selectModel fails or returns undefined/null/empty model, use SmolLM3 meta-router
async function resolveRoute() {
  if (!route || !route.model) {
    const smolRoute = await askSmolRouter(taskInput);
    route = smolRoute;
    console.log(`\n🔄 Meta-router chose: ${smolRoute.model} (${smolRoute.reason})`);
  }
  // If still no model, or if user requested a tier/use-case override, use metadata
  if (
    (!route || !route.model) ||
    argv['prefer-tier'] || argv['use-case']
  ) {
    let candidates = [];
    let reason = '';
    if (argv['prefer-tier']) {
      candidates = getModelsByTier(argv['prefer-tier']);
      reason = `Tier override: using ${candidates[0]}`;
    }
    if (argv['use-case']) {
      const useCaseModels = getModelsByUseCase(argv['use-case']);
      // If both tier and use-case, intersect; else just use-case
      candidates = candidates.length
        ? candidates.filter((m) => useCaseModels.includes(m))
        : useCaseModels;
      reason = `Use-case override: using ${candidates[0]}`;
    }
    if (candidates.length) {
      route = { model: candidates[0], reason };
      console.log(`\n⚡ ${reason}`);
    }
  }
  if (route && route.model) {
    console.log(`\n🔀 Routed to: ${route.model} (${route.reason})`);
  } else {
    // Fallback to smollm3 if all else fails
    route = { model: 'smollm3', reason: 'No routing match, fallback to smollm3' };
    console.log(`\n⚠️ No routing match, fallback to smollm3`);
  }
}
// #endregion end: Routing logic

// #region start: Model call and response
(async () => {
  await resolveRoute();
  // Determine if memory is ON (from loadout/config/env)
  const memoryOn = characterSheet.memory === true || process.env.MEMORY === 'on';
  let fullPrompt = taskInput;
  let memoryContext = '';
  let projectName = characterSheet.projectName || argv.project || 'default';
  if (memoryOn) {
    memoryContext = loadMemory(projectName);
    if (memoryContext) {
      fullPrompt = `${memoryContext}\n\n${taskInput}`;
    }
  }

  let response;
  let usedFallback = false;
  try {
    response = await callModel(fullPrompt, { model: route.model });
    // Defensive: treat empty/invalid as error
    if (!response || typeof response !== 'string' || !response.trim()) {
      throw new Error('Empty or invalid model response');
    }
  } catch (err) {
    console.warn(`Warning: Model '${route.model}' failed: ${err.message}`);
    // Optional: check config for fallback permission
    const allowFallback = characterSheet.allowFallback !== false; // default true
    if (allowFallback) {
      usedFallback = true;
      console.warn('Routing to fallback model: smollm3');
      response = await callModel(fullPrompt, { model: 'smollm3' });
      console.log(`\n🧠 Fallback Model Response:\n${response}`);
    } else {
      response = '[No valid model response and fallback is disabled]';
    }
  }
  if (!usedFallback) {
    console.log(`\n🧠 Model Response:\n${response}`);
  }
  // Log after output to user
  logTask(taskInput, route, response);

  // #region start: Feedback prompt and logging
  // Use a simple hash of taskInput as taskId (for demo purposes)
  const { logFeedback } = require('./models/logger');
  const crypto = require('crypto');
  const taskId = crypto.createHash('sha1').update(taskInput).digest('hex').slice(0, 10);
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('Did this result help? (y/n/?) ', (answer) => {
    let feedback = 'unsure';
    if (answer.trim().toLowerCase() === 'y') feedback = 'thumbs-up';
    else if (answer.trim().toLowerCase() === 'n') feedback = 'thumbs-down';
    logFeedback(taskId, feedback);
    rl.close();
  });
  // #endregion end: Feedback prompt and logging

  // #region start: MCP bridge output
  const fs = require('fs');
  const { sendToMCP } = require('./models/mcp-bridge');
  const mcpPayload = formatForMCP(taskInput, route.model, response);
  if (argv.mcp) {
    fs.writeFileSync('mcp_output.json', JSON.stringify(mcpPayload, null, 2));
    console.log('📝 Output saved to mcp_output.json');
  }
  if (argv['send-mcp']) {
    const sendResult = await sendToMCP(mcpPayload);
    if (sendResult.success) {
      console.log(`📤 Sent to MCP: status ${sendResult.status}`);
    } else {
      console.warn(`⚠️ MCP send failed: ${sendResult.error}`);
    }
  }
  // #endregion end: MCP bridge output
})();
// #endregion end: Model call and response

// #region start: Log config sanity check
console.log(`\n[config] LOG_LEVEL: ${config.LOG_LEVEL}`);
// #endregion end: Log config sanity check
