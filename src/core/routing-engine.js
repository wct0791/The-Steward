// #region start: Enhanced Routing Engine for The Steward
// Core routing engine with improved task classification and model selection
// Implements the architecture specified in The Steward Master Document

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { getModelsByTier, getModelsByUseCase, getModelInfo } = require('../../models/model-metadata');

/**
 * Enhanced task type detection using multiple classification methods
 * @param {string} input - User task input
 * @returns {object} - Classification result with type, confidence, and keywords
 */
function detectTaskType(input) {
  if (!input || typeof input !== 'string') {
    return { type: 'unknown', confidence: 0, keywords: [] };
  }

  const lowered = input.toLowerCase();
  const tokens = lowered.split(/\s+/);
  
  // Classification patterns with priority and confidence scoring
  const patterns = [
    // High-confidence patterns (direct action words)
    { type: 'debug', keywords: ['debug', 'fix', 'error', 'bug', 'broken'], confidence: 0.9 },
    { type: 'summarize', keywords: ['summarize', 'summary', 'tldr', 'brief'], confidence: 0.9 },
    { type: 'research', keywords: ['research', 'find out', 'investigate', 'lookup'], confidence: 0.9 },
    { type: 'write', keywords: ['write', 'compose', 'create', 'draft'], confidence: 0.8 },
    { type: 'analyze', keywords: ['analyze', 'examine', 'evaluate', 'assess'], confidence: 0.8 },
    { type: 'explain', keywords: ['explain', 'describe', 'how does', 'what is'], confidence: 0.7 },
    { type: 'code', keywords: ['code', 'function', 'script', 'program', 'implement'], confidence: 0.8 },
    { type: 'sensitive', keywords: ['private', 'confidential', 'personal', 'secret'], confidence: 0.9 },
    
    // Medium-confidence patterns (contextual clues)
    { type: 'route', keywords: ['route', 'direct', 'forward', 'which model'], confidence: 0.6 },
    { type: 'general', keywords: ['help', 'assist', 'question', 'advice'], confidence: 0.3 }
  ];

  let bestMatch = { type: 'general', confidence: 0, keywords: [] };
  
  // Score each pattern against the input
  for (const pattern of patterns) {
    let score = 0;
    const matchedKeywords = [];
    
    for (const keyword of pattern.keywords) {
      if (lowered.includes(keyword)) {
        score += pattern.confidence;
        matchedKeywords.push(keyword);
      }
    }
    
    // Bonus for multiple keyword matches
    if (matchedKeywords.length > 1) {
      score *= 1.2;
    }
    
    if (score > bestMatch.confidence) {
      bestMatch = {
        type: pattern.type,
        confidence: Math.min(score, 1.0), // Cap at 1.0
        keywords: matchedKeywords
      };
    }
  }
  
  return bestMatch;
}

/**
 * Intelligent model selection based on task type, character preferences, and context
 * @param {string} taskType - Detected task type
 * @param {object} characterSheet - User preferences and configuration
 * @param {object} options - Additional routing options (tier preference, use case, etc.)
 * @returns {object} - Selected model with reasoning
 */
function selectModel(taskType, characterSheet, options = {}) {
  // Step 1: Check for explicit overrides
  if (options.preferTier) {
    const tierModels = getModelsByTier(options.preferTier);
    if (tierModels.length > 0) {
      return {
        model: tierModels[0],
        reason: `Tier override: ${options.preferTier}`,
        confidence: 1.0,
        fallbacks: tierModels.slice(1)
      };
    }
  }
  
  if (options.useCase) {
    const useCaseModels = getModelsByUseCase(options.useCase);
    if (useCaseModels.length > 0) {
      return {
        model: useCaseModels[0],
        reason: `Use case override: ${options.useCase}`,
        confidence: 1.0,
        fallbacks: useCaseModels.slice(1)
      };
    }
  }
  
  // Step 2: Use character sheet task type preferences
  const taskPreferences = characterSheet.task_type_preferences || {};
  const preferredModel = taskPreferences[taskType];
  
  if (preferredModel) {
    const modelInfo = getModelInfo(preferredModel);
    return {
      model: preferredModel,
      reason: `Character sheet preference for ${taskType}`,
      confidence: 0.8,
      fallbacks: generateFallbackChain(preferredModel, taskType, characterSheet)
    };
  }
  
  // Step 3: Fallback to use case matching
  const useCaseModels = getModelsByUseCase(taskType);
  if (useCaseModels.length > 0) {
    return {
      model: useCaseModels[0],
      reason: `Use case match for ${taskType}`,
      confidence: 0.6,
      fallbacks: useCaseModels.slice(1)
    };
  }
  
  // Step 4: Character sheet fallback or system default
  const fallbackModel = characterSheet.fallback_behavior?.fallback || 
                       taskPreferences.fallback || 
                       'smollm3';
  
  return {
    model: fallbackModel,
    reason: `Fallback model selection`,
    confidence: 0.3,
    fallbacks: ['smollm3']
  };
}

/**
 * Generate intelligent fallback chain based on the primary model selection
 * @param {string} primaryModel - The primary selected model
 * @param {string} taskType - The task type
 * @param {object} characterSheet - User configuration
 * @returns {string[]} - Array of fallback models in priority order
 */
function generateFallbackChain(primaryModel, taskType, characterSheet) {
  const modelInfo = getModelInfo(primaryModel);
  const fallbacks = [];
  
  // If primary is cloud model, add local alternatives
  if (modelInfo?.type === 'cloud') {
    const localAlternatives = getModelsByUseCase(taskType).filter(model => {
      const info = getModelInfo(model);
      return info?.type === 'local';
    });
    fallbacks.push(...localAlternatives);
  }
  
  // Add tier-based fallbacks
  if (modelInfo?.tier) {
    const tierAlternatives = getModelsByTier(modelInfo.tier).filter(m => m !== primaryModel);
    fallbacks.push(...tierAlternatives);
  }
  
  // Add character sheet fallback
  const userFallback = characterSheet.fallback_behavior?.fallback || 'smollm3';
  if (!fallbacks.includes(userFallback)) {
    fallbacks.push(userFallback);
  }
  
  // Ensure smollm3 is always last resort
  if (!fallbacks.includes('smollm3')) {
    fallbacks.push('smollm3');
  }
  
  return fallbacks;
}

/**
 * Complete routing decision with full context and logging
 * @param {string} taskInput - User task input
 * @param {object} characterSheet - User configuration
 * @param {object} options - Routing options
 * @returns {object} - Complete routing decision
 */
function makeRoutingDecision(taskInput, characterSheet, options = {}) {
  const timestamp = new Date().toISOString();
  
  // Step 1: Classify the task
  const classification = detectTaskType(taskInput);
  
  // Step 2: Select model based on classification
  const selection = selectModel(classification.type, characterSheet, options);
  
  // Step 3: Apply loadout overrides if present
  const loadout = characterSheet.loadout || {};
  if (loadout.model && !options.preferTier && !options.useCase) {
    selection.model = loadout.model;
    selection.reason = `Loadout override: ${loadout.model}`;
    selection.confidence = 0.9;
  }
  
  // Step 4: Build complete routing decision
  const decision = {
    timestamp,
    task: taskInput,
    classification,
    selection,
    loadout: characterSheet.loadout || 'default',
    options,
    metadata: {
      version: '2.0',
      engine: 'enhanced-routing-engine'
    }
  };
  
  return decision;
}

/**
 * Validate routing decision and check for potential issues
 * @param {object} decision - Routing decision object
 * @returns {object} - Validation result with warnings/errors
 */
function validateRoutingDecision(decision) {
  const validation = {
    valid: true,
    warnings: [],
    errors: []
  };
  
  // Check if selected model exists in metadata
  const modelInfo = getModelInfo(decision.selection.model);
  if (!modelInfo) {
    validation.warnings.push(`Model ${decision.selection.model} not found in metadata`);
  }
  
  // Check if confidence is suspiciously low
  if (decision.classification.confidence < 0.3) {
    validation.warnings.push(`Low confidence task classification: ${decision.classification.confidence}`);
  }
  
  // Check if fallback chain is empty
  if (!decision.selection.fallbacks || decision.selection.fallbacks.length === 0) {
    validation.warnings.push('No fallback models available');
  }
  
  return validation;
}

module.exports = {
  detectTaskType,
  selectModel,
  generateFallbackChain,
  makeRoutingDecision,
  validateRoutingDecision
};

// #endregion end: Enhanced Routing Engine