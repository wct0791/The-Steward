#!/usr/bin/env node

// Test script for Dolphin Mistral uncensored routing integration
// Tests trigger detection, routing decisions, and fallback behavior

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const { detectTaskType, makeRoutingDecision, detectUncensoredContent } = require('./src/core/routing-engine');

// Load character sheet
const characterSheetPath = path.join(__dirname, 'character-sheet.yaml');
const characterSheet = yaml.load(fs.readFileSync(characterSheetPath, 'utf8'));

console.log('🧪 Testing Dolphin Mistral Uncensored Routing Integration\n');
console.log('=' .repeat(60));

// Test cases for uncensored content detection
const testCases = [
  {
    name: 'Explicit Uncensored Request',
    input: 'I need an uncensored response about this topic',
    expectedTriggered: true,
    expectedTriggerType: 'explicit_request'
  },
  {
    name: 'Creative Writing Fiction',
    input: 'Help me write a creative story about dragons',
    expectedTriggered: true,
    expectedTriggerType: 'creative_writing'
  },
  {
    name: 'Roleplay Request',
    input: 'Can you roleplay as a character for this scenario?',
    expectedTriggered: true,
    expectedTriggerType: 'creative_writing'
  },
  {
    name: 'No Limits Request',
    input: 'Give me a response with no limits on content',
    expectedTriggered: true,
    expectedTriggerType: 'explicit_request'
  },
  {
    name: 'Normal Debug Task',
    input: 'Debug this JavaScript function for me',
    expectedTriggered: false,
    expectedTriggerType: null
  },
  {
    name: 'Normal Research Task',
    input: 'Research the best practices for Node.js',
    expectedTriggered: false,
    expectedTriggerType: null
  },
  {
    name: 'Creative Uncensored Loadout',
    input: 'Help me with this task',
    expectedTriggered: true,
    expectedTriggerType: 'loadout_override',
    options: { loadout: 'creative_uncensored' }
  }
];

// Test uncensored content detection
console.log('🔍 Testing Uncensored Content Detection\n');

let testsPassed = 0;
let testsTotal = 0;

for (const testCase of testCases) {
  testsTotal++;
  console.log(`Test: ${testCase.name}`);
  console.log(`Input: "${testCase.input}"`);
  
  const classification = detectTaskType(testCase.input);
  const uncensoredCheck = detectUncensoredContent(
    testCase.input, 
    classification.type, 
    characterSheet, 
    testCase.options || {}
  );
  
  console.log(`  Task Type: ${classification.type} (confidence: ${classification.confidence})`);
  console.log(`  Uncensored Required: ${uncensoredCheck.requiresUncensored}`);
  console.log(`  Trigger Type: ${uncensoredCheck.triggerType}`);
  console.log(`  Reason: ${uncensoredCheck.reason || 'None'}`);
  
  const passed = uncensoredCheck.requiresUncensored === testCase.expectedTriggered &&
                 uncensoredCheck.triggerType === testCase.expectedTriggerType;
  
  if (passed) {
    console.log('  ✅ PASSED');
    testsPassed++;
  } else {
    console.log('  ❌ FAILED');
    console.log(`     Expected triggered: ${testCase.expectedTriggered}, got: ${uncensoredCheck.requiresUncensored}`);
    console.log(`     Expected trigger type: ${testCase.expectedTriggerType}, got: ${uncensoredCheck.triggerType}`);
  }
  console.log();
}

console.log('=' .repeat(60));
console.log('🎯 Testing Complete Routing Decisions\n');

// Test complete routing decisions
const routingTestCases = [
  {
    name: 'Uncensored Request Routes to Dolphin Mistral',
    input: 'Give me an uncensored analysis of this topic',
    expectedModel: 'dolphin-mistral'
  },
  {
    name: 'Fiction Writing Routes to Dolphin Mistral',
    input: 'Help me write a fiction story with adult themes',
    expectedModel: 'dolphin-mistral'
  },
  {
    name: 'Debug Task Routes to Standard Model',
    input: 'Debug this code for me',
    expectedModel: 'gpt-4' // Based on character sheet task_type_preferences
  },
  {
    name: 'Research Task Routes to Perplexity',
    input: 'Research the latest AI developments',
    expectedModel: 'perplexity' // Based on character sheet
  }
];

for (const testCase of routingTestCases) {
  testsTotal++;
  console.log(`Test: ${testCase.name}`);
  console.log(`Input: "${testCase.input}"`);
  
  const decision = makeRoutingDecision(testCase.input, characterSheet);
  
  console.log(`  Selected Model: ${decision.selection.model}`);
  console.log(`  Reason: ${decision.selection.reason}`);
  console.log(`  Confidence: ${decision.selection.confidence}`);
  console.log(`  Tier: ${decision.selection.tier || 'N/A'}`);
  console.log(`  Uncensored: ${decision.selection.uncensored_content || false}`);
  console.log(`  Fallbacks: [${decision.selection.fallbacks?.join(', ') || 'None'}]`);
  
  const passed = decision.selection.model === testCase.expectedModel;
  
  if (passed) {
    console.log('  ✅ PASSED');
    testsPassed++;
  } else {
    console.log('  ❌ FAILED');
    console.log(`     Expected model: ${testCase.expectedModel}, got: ${decision.selection.model}`);
  }
  console.log();
}

console.log('=' .repeat(60));
console.log('📊 Test Summary\n');
console.log(`Tests Passed: ${testsPassed}/${testsTotal}`);
console.log(`Success Rate: ${((testsPassed / testsTotal) * 100).toFixed(1)}%`);

if (testsPassed === testsTotal) {
  console.log('🎉 All tests passed! Dolphin Mistral integration is working correctly.');
} else {
  console.log('⚠️  Some tests failed. Review the implementation.');
  process.exit(1);
}

console.log('\n🔧 Testing Model Interface Availability');

// Test model interface configuration
const ModelInterface = require('./models/ModelInterface');
const modelInterface = new ModelInterface();

const availableModels = modelInterface.getAvailableModels();
console.log(`Local models: ${availableModels.local.join(', ')}`);
console.log(`Cloud models: ${availableModels.cloud.join(', ')}`);

const dolphinAvailable = modelInterface.isModelAvailable('dolphin-mistral');
console.log(`Dolphin Mistral available: ${dolphinAvailable ? '✅' : '❌'}`);

if (!dolphinAvailable) {
  console.log('⚠️  Dolphin Mistral not found in model interface routing table');
  process.exit(1);
}

console.log('\n✅ Integration test completed successfully!');
console.log('\nNext steps:');
console.log('1. Ensure Dolphin Mistral model is available in your Docker/Ollama setup');
console.log('2. Test with real requests through the web interface');
console.log('3. Monitor analytics at /api/analytics/uncensored-routing');