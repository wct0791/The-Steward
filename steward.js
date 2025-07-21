// 1. Import required modules
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const yargs = require('yargs');

// 2. Parse CLI arguments using yargs
const argv = yargs
  .usage('Usage: $0 <task> [--loadout <name>]')
  .demandCommand(1, 'Please provide a task description.')
  .option('loadout', {
    alias: 'l',
    describe: 'Optional loadout name (e.g., creative, sqa_mode)',
    type: 'string',
  })
  .help()
  .argv;

const taskInput = argv._.join(' ');
const loadoutName = argv.loadout;

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
