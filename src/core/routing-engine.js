// #region start: Enhanced Routing Engine for The Steward
// Core routing engine with improved task classification and model selection
// Implements the architecture specified in The Steward Master Document

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { getModelsByTier, getModelsByUseCase, getModelInfo } = require('../../models/model-metadata');

// Load tier configuration and cost tracking metadata
let tierConfig = {};
let costTracking = {};
try {
  const modelsPath = path.join(__dirname, '../../models/models.yaml');
  const modelsData = yaml.load(fs.readFileSync(modelsPath, 'utf8'));
  tierConfig = modelsData.tier_config || {};
  costTracking = modelsData.cost_tracking || {};
} catch (err) {
  console.warn('Warning: Could not load tier configuration');
}

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
 * Three-tier intelligent model selection with cost, privacy, and performance optimization
 * @param {string} taskType - Detected task type
 * @param {object} characterSheet - User preferences and configuration
 * @param {object} options - Additional routing options (tier preference, use case, etc.)
 * @returns {object} - Selected model with reasoning
 */
function selectModel(taskType, characterSheet, options = {}) {
  // Step 0: Check for privacy-sensitive content
  const privacyCheck = checkPrivacyRequirements(taskType, options);
  if (privacyCheck.requiresLocal) {
    return selectLocalModel(taskType, characterSheet, privacyCheck.reason);
  }
  // Step 1: Check for explicit three-tier overrides
  if (options.preferTier) {
    const tierSelection = selectByTier(options.preferTier, taskType, characterSheet, options);
    if (tierSelection) {
      return tierSelection;
    }
  }
  
  // Step 1.5: Cost-aware routing check
  if (options.costAware || characterSheet.cost_settings?.cost_awareness) {
    const costOptimizedSelection = selectCostOptimizedModel(taskType, characterSheet, options);
    if (costOptimizedSelection) {
      return costOptimizedSelection;
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
  
  // Step 2: Three-tier intelligent selection based on task complexity and requirements
  const intelligentSelection = selectIntelligentTier(taskType, characterSheet, options);
  if (intelligentSelection) {
    return intelligentSelection;
  }
  
  // Step 2.5: Use character sheet task type preferences with three-tier validation
  const taskPreferences = characterSheet.task_type_preferences || {};
  const preferredModel = taskPreferences[taskType];
  
  if (preferredModel) {
    const modelInfo = getModelInfo(preferredModel);
    const tierValidation = validateTierSelection(preferredModel, taskType, characterSheet, options);
    
    if (tierValidation.valid) {
      return {
        model: preferredModel,
        reason: `Character sheet preference for ${taskType} (${tierValidation.tier})`,
        confidence: 0.8,
        tier: tierValidation.tier,
        cost_estimate: tierValidation.cost_estimate,
        fallbacks: generateThreeTierFallbackChain(preferredModel, taskType, characterSheet)
      };
    }
  }
  
  // Step 3: Three-tier use case matching with performance optimization
  const useCaseSelection = selectByUseCaseWithTiers(taskType, characterSheet, options);
  if (useCaseSelection) {
    return useCaseSelection;
  }
  
  // Step 4: Three-tier fallback with intelligent tier selection
  return selectThreeTierFallback(characterSheet, options);
}

/**
 * Check privacy requirements and determine if local-only routing is needed
 * @param {string} taskType - The task type
 * @param {object} options - Routing options
 * @returns {object} - Privacy check result
 */
function checkPrivacyRequirements(taskType, options) {
  const sensitiveTaskTypes = ['sensitive', 'private', 'confidential', 'personal'];
  const requiresLocal = options.privacyMode || 
                       sensitiveTaskTypes.includes(taskType) ||
                       (options.task && /\b(private|confidential|personal|secret)\b/i.test(options.task));
  
  return {
    requiresLocal,
    reason: requiresLocal ? 'Privacy-sensitive content detected' : null
  };
}

/**
 * Select local-only model for privacy-sensitive content
 * @param {string} taskType - The task type
 * @param {object} characterSheet - User configuration
 * @param {string} reason - Privacy reason
 * @returns {object} - Local model selection
 */
function selectLocalModel(taskType, characterSheet, reason) {
  const localModels = getModelsByTier('tier1-fast');
  const bestLocalModel = localModels.find(model => {
    const info = getModelInfo(model);
    return info?.use_cases?.includes(taskType) || info?.use_cases?.includes('sensitive');
  }) || localModels[0] || 'smollm3-1.7b';
  
  return {
    model: bestLocalModel,
    reason: `${reason} - Local processing only`,
    confidence: 0.9,
    tier: 'tier1-fast',
    privacy_protection: true,
    cost_estimate: 0,
    fallbacks: localModels.filter(m => m !== bestLocalModel)
  };
}

/**
 * Select model by explicit tier preference
 * @param {string} tierPreference - Preferred tier
 * @param {string} taskType - The task type
 * @param {object} characterSheet - User configuration
 * @param {object} options - Routing options
 * @returns {object|null} - Tier-based selection or null
 */
function selectByTier(tierPreference, taskType, characterSheet, options) {
  const tierMapping = {
    'fast': 'tier1-fast',
    'local-heavy': 'tier2-heavy', 
    'heavy': 'tier2-heavy',
    'cloud': 'tier3-cloud',
    'tier1-fast': 'tier1-fast',
    'tier2-heavy': 'tier2-heavy',
    'tier3-cloud': 'tier3-cloud'
  };
  
  const mappedTier = tierMapping[tierPreference] || tierPreference;
  const tierModels = getModelsByTier(mappedTier);
  
  if (tierModels.length > 0) {
    const bestModel = selectBestModelFromTier(tierModels, taskType);
    const modelInfo = getModelInfo(bestModel);
    
    return {
      model: bestModel,
      reason: `Tier override: ${tierPreference} (${mappedTier})`,
      confidence: 1.0,
      tier: mappedTier,
      cost_estimate: calculateCostEstimate(bestModel, options.estimated_tokens || 1000),
      fallbacks: generateThreeTierFallbackChain(bestModel, taskType, characterSheet)
    };
  }
  
  return null;
}

/**
 * Select cost-optimized model based on budget constraints
 * @param {string} taskType - The task type
 * @param {object} characterSheet - User configuration
 * @param {object} options - Routing options
 * @returns {object|null} - Cost-optimized selection or null
 */
function selectCostOptimizedModel(taskType, characterSheet, options) {
  const monthlyBudget = characterSheet.cost_settings?.monthly_budget || costTracking.monthly_budget || 10;
  const currentSpend = getCurrentMonthlySpend(); // This would track actual usage
  const remainingBudget = monthlyBudget - currentSpend;
  
  // If budget is low, prefer local tiers
  if (remainingBudget < 2) {
    const localModels = [...getModelsByTier('tier1-fast'), ...getModelsByTier('tier2-heavy')];
    const bestLocalModel = selectBestModelFromTier(localModels, taskType);
    
    return {
      model: bestLocalModel,
      reason: `Cost optimization - Low budget remaining ($${remainingBudget.toFixed(2)})`,
      confidence: 0.8,
      tier: getModelInfo(bestLocalModel)?.tier || 'tier1-fast',
      cost_estimate: 0,
      budget_protection: true,
      fallbacks: localModels.filter(m => m !== bestLocalModel)
    };
  }
  
  return null;
}

/**
 * Intelligent tier selection based on task complexity and requirements
 * @param {string} taskType - The task type
 * @param {object} characterSheet - User configuration
 * @param {object} options - Routing options
 * @returns {object|null} - Intelligent selection or null
 */
function selectIntelligentTier(taskType, characterSheet, options) {
  const taskComplexity = analyzeTaskComplexity(taskType, options.task);
  const userPreferences = characterSheet.tier_preferences || {};
  
  let selectedTier;
  
  // Complex reasoning tasks -> Tier 3 (Cloud)
  if (taskComplexity.level === 'high' && taskComplexity.requiresAdvancedReasoning) {
    selectedTier = 'tier3-cloud';
  }
  // Specialized processing -> Tier 2 (Local Heavy)
  else if (taskComplexity.requiresSpecialization || taskComplexity.isBatchProcessing) {
    selectedTier = 'tier2-heavy';
  }
  // Quick queries or routine tasks -> Tier 1 (Local Fast)
  else if (taskComplexity.level === 'low' || taskComplexity.isRoutine) {
    selectedTier = 'tier1-fast';
  }
  // Default to user preference or balanced approach
  else {
    selectedTier = userPreferences.default_tier || 'tier1-fast';
  }
  
  const tierModels = getModelsByTier(selectedTier);
  if (tierModels.length > 0) {
    const bestModel = selectBestModelFromTier(tierModels, taskType);
    
    return {
      model: bestModel,
      reason: `Intelligent tier selection: ${taskComplexity.level} complexity -> ${selectedTier}`,
      confidence: 0.7 + (taskComplexity.confidence * 0.2),
      tier: selectedTier,
      complexity_analysis: taskComplexity,
      cost_estimate: calculateCostEstimate(bestModel, options.estimated_tokens || 1000),
      fallbacks: generateThreeTierFallbackChain(bestModel, taskType, characterSheet)
    };
  }
  
  return null;
}

/**
 * Analyze task complexity for intelligent tier routing
 * @param {string} taskType - The task type
 * @param {string} task - The actual task description
 * @returns {object} - Complexity analysis
 */
function analyzeTaskComplexity(taskType, task = '') {
  const complexTaskTypes = ['complex_reasoning', 'advanced_analysis', 'expert_level', 'multi_domain'];
  const specializedTaskTypes = ['image_processing', 'audio_transcription', 'batch', 'specialized'];
  const routineTaskTypes = ['route', 'quick_query', 'fallback', 'sensitive'];
  
  const taskLower = task.toLowerCase();
  const complexKeywords = ['complex', 'advanced', 'detailed', 'comprehensive', 'expert', 'analysis'];
  const specializedKeywords = ['image', 'audio', 'batch', 'process', 'convert', 'transcribe'];
  const quickKeywords = ['quick', 'simple', 'brief', 'fast', 'route'];
  
  let level = 'medium';
  let confidence = 0.5;
  let requiresAdvancedReasoning = false;
  let requiresSpecialization = false;
  let isBatchProcessing = false;
  let isRoutine = false;
  
  // Check task type
  if (complexTaskTypes.includes(taskType)) {
    level = 'high';
    requiresAdvancedReasoning = true;
    confidence = 0.8;
  } else if (specializedTaskTypes.includes(taskType)) {
    level = 'medium';
    requiresSpecialization = true;
    isBatchProcessing = taskType === 'batch';
    confidence = 0.8;
  } else if (routineTaskTypes.includes(taskType)) {
    level = 'low';
    isRoutine = true;
    confidence = 0.8;
  }
  
  // Check task content
  const hasComplexKeywords = complexKeywords.some(keyword => taskLower.includes(keyword));
  const hasSpecializedKeywords = specializedKeywords.some(keyword => taskLower.includes(keyword));
  const hasQuickKeywords = quickKeywords.some(keyword => taskLower.includes(keyword));
  
  if (hasComplexKeywords && level !== 'high') {
    level = 'high';
    requiresAdvancedReasoning = true;
    confidence = Math.min(confidence + 0.2, 0.9);
  } else if (hasSpecializedKeywords && level === 'medium') {
    requiresSpecialization = true;
    confidence = Math.min(confidence + 0.1, 0.8);
  } else if (hasQuickKeywords && level === 'low') {
    isRoutine = true;
    confidence = Math.min(confidence + 0.1, 0.8);
  }
  
  return {
    level,
    confidence,
    requiresAdvancedReasoning,
    requiresSpecialization,
    isBatchProcessing,
    isRoutine
  };
}

/**
 * Select best model from a tier based on task requirements
 * @param {string[]} tierModels - Models in the tier
 * @param {string} taskType - The task type
 * @returns {string} - Best model for the task
 */
function selectBestModelFromTier(tierModels, taskType) {
  // Find model with matching use case
  const matchingModel = tierModels.find(model => {
    const info = getModelInfo(model);
    return info?.use_cases?.includes(taskType);
  });
  
  if (matchingModel) return matchingModel;
  
  // Find model with highest performance rating
  const rankedModels = tierModels
    .map(model => ({ model, info: getModelInfo(model) }))
    .filter(item => item.info)
    .sort((a, b) => (b.info.performance_rating || 0) - (a.info.performance_rating || 0));
  
  return rankedModels[0]?.model || tierModels[0];
}

/**
 * Calculate cost estimate for a model and token count
 * @param {string} modelName - The model name
 * @param {number} estimatedTokens - Estimated token usage
 * @returns {number} - Cost estimate in dollars
 */
function calculateCostEstimate(modelName, estimatedTokens) {
  const modelInfo = getModelInfo(modelName);
  if (!modelInfo || !modelInfo.cost_per_token) return 0;
  
  return modelInfo.cost_per_token * estimatedTokens;
}

/**
 * Get current monthly spend (placeholder - would integrate with actual tracking)
 * @returns {number} - Current month spending
 */
function getCurrentMonthlySpend() {
  // Placeholder - would integrate with actual cost tracking system
  return 0;
}

/**
 * Validate tier selection against constraints and preferences
 * @param {string} model - The model to validate
 * @param {string} taskType - The task type
 * @param {object} characterSheet - User configuration
 * @param {object} options - Routing options
 * @returns {object} - Validation result
 */
function validateTierSelection(model, taskType, characterSheet, options) {
  const modelInfo = getModelInfo(model);
  if (!modelInfo) {
    return { valid: false, reason: 'Model not found' };
  }
  
  const tier = modelInfo.tier;
  const costEstimate = calculateCostEstimate(model, options.estimated_tokens || 1000);
  
  // Check privacy constraints
  if (options.privacyMode && modelInfo.privacy_tier !== 'local') {
    return { valid: false, reason: 'Privacy mode requires local processing' };
  }
  
  // Check cost constraints
  const monthlyBudget = characterSheet.cost_settings?.monthly_budget || 10;
  const currentSpend = getCurrentMonthlySpend();
  if (costEstimate > (monthlyBudget - currentSpend)) {
    return { valid: false, reason: 'Exceeds remaining budget' };
  }
  
  return {
    valid: true,
    tier,
    cost_estimate: costEstimate
  };
}

/**
 * Select model by use case with three-tier optimization
 * @param {string} taskType - The task type
 * @param {object} characterSheet - User configuration
 * @param {object} options - Routing options
 * @returns {object|null} - Use case selection or null
 */
function selectByUseCaseWithTiers(taskType, characterSheet, options) {
  const useCaseModels = getModelsByUseCase(taskType);
  if (useCaseModels.length === 0) return null;
  
  // Sort models by tier preference and performance
  const tierPriority = characterSheet.tier_preferences?.tier_priorities?.performance_first || 
                      ['tier3-cloud', 'tier2-heavy', 'tier1-fast'];
  
  const sortedModels = useCaseModels
    .map(model => ({ model, info: getModelInfo(model) }))
    .filter(item => item.info)
    .sort((a, b) => {
      const aTierIndex = tierPriority.indexOf(a.info.tier) === -1 ? 999 : tierPriority.indexOf(a.info.tier);
      const bTierIndex = tierPriority.indexOf(b.info.tier) === -1 ? 999 : tierPriority.indexOf(b.info.tier);
      
      if (aTierIndex !== bTierIndex) return aTierIndex - bTierIndex;
      return (b.info.performance_rating || 0) - (a.info.performance_rating || 0);
    });
  
  const bestModel = sortedModels[0]?.model;
  if (!bestModel) return null;
  
  const modelInfo = getModelInfo(bestModel);
  
  return {
    model: bestModel,
    reason: `Use case match for ${taskType} (${modelInfo.tier})`,
    confidence: 0.6,
    tier: modelInfo.tier,
    cost_estimate: calculateCostEstimate(bestModel, options.estimated_tokens || 1000),
    fallbacks: sortedModels.slice(1).map(item => item.model)
  };
}

/**
 * Three-tier fallback selection
 * @param {object} characterSheet - User configuration
 * @param {object} options - Routing options
 * @returns {object} - Fallback selection
 */
function selectThreeTierFallback(characterSheet, options) {
  const fallbackModel = characterSheet.fallback_behavior?.fallback || 'smollm3-1.7b';
  const modelInfo = getModelInfo(fallbackModel);
  
  return {
    model: fallbackModel,
    reason: `Three-tier fallback model selection`,
    confidence: 0.3,
    tier: modelInfo?.tier || 'tier1-fast',
    cost_estimate: calculateCostEstimate(fallbackModel, options.estimated_tokens || 1000),
    fallbacks: generateThreeTierFallbackChain(fallbackModel, 'fallback', characterSheet)
  };
}

/**
 * Generate three-tier aware fallback chain
 * @param {string} primaryModel - The primary selected model
 * @param {string} taskType - The task type
 * @param {object} characterSheet - User configuration
 * @returns {string[]} - Array of fallback models in priority order
 */
function generateThreeTierFallbackChain(primaryModel, taskType, characterSheet) {
  const modelInfo = getModelInfo(primaryModel);
  const fallbacks = [];
  const primaryTier = modelInfo?.tier;
  
  // Three-tier fallback strategy: Same tier -> Lower tier -> Local fallback
  
  // 1. Add same-tier alternatives
  if (primaryTier) {
    const sameTierModels = getModelsByTier(primaryTier)
      .filter(m => m !== primaryModel)
      .sort((a, b) => {
        const aInfo = getModelInfo(a);
        const bInfo = getModelInfo(b);
        return (bInfo?.performance_rating || 0) - (aInfo?.performance_rating || 0);
      });
    fallbacks.push(...sameTierModels);
  }
  
  // 2. Add lower-tier alternatives (higher to lower cost)
  const tierFallbackOrder = {
    'tier3-cloud': ['tier2-heavy', 'tier1-fast'],
    'tier2-heavy': ['tier1-fast'],
    'tier1-fast': [] // Already local, no lower tier
  };
  
  const lowerTiers = tierFallbackOrder[primaryTier] || ['tier1-fast'];
  for (const tier of lowerTiers) {
    const tierModels = getModelsByUseCase(taskType)
      .filter(model => {
        const info = getModelInfo(model);
        return info?.tier === tier;
      })
      .sort((a, b) => {
        const aInfo = getModelInfo(a);
        const bInfo = getModelInfo(b);
        return (bInfo?.performance_rating || 0) - (aInfo?.performance_rating || 0);
      });
    
    fallbacks.push(...tierModels.filter(m => !fallbacks.includes(m)));
  }
  
  // 3. Add character sheet fallback
  const userFallback = characterSheet.fallback_behavior?.fallback || 'smollm3-1.7b';
  if (!fallbacks.includes(userFallback)) {
    fallbacks.push(userFallback);
  }
  
  // 4. Ensure local fallback is always available
  const localFallbacks = ['smollm3-1.7b', 'smollm3-8b', 'smollm3'];
  for (const localModel of localFallbacks) {
    if (!fallbacks.includes(localModel)) {
      fallbacks.push(localModel);
      break;
    }
  }
  
  return fallbacks;
}

/**
 * Complete three-tier routing decision with full context and logging
 * @param {string} taskInput - User task input
 * @param {object} characterSheet - User configuration
 * @param {object} options - Routing options
 * @returns {object} - Complete routing decision
 */
function makeRoutingDecision(taskInput, characterSheet, options = {}) {
  const timestamp = new Date().toISOString();
  
  // Step 1: Classify the task with three-tier awareness
  const classification = detectTaskType(taskInput);
  
  // Step 1.5: Enhance options with task input for complexity analysis
  const enhancedOptions = {
    ...options,
    task: taskInput,
    estimated_tokens: estimateTokenCount(taskInput)
  };
  
  // Step 2: Three-tier model selection based on classification
  const selection = selectModel(classification.type, characterSheet, enhancedOptions);
  
  // Step 3: Apply loadout overrides with three-tier validation
  const loadout = characterSheet.loadout || {};
  if (loadout.model && !enhancedOptions.preferTier && !enhancedOptions.useCase) {
    const loadoutValidation = validateTierSelection(loadout.model, classification.type, characterSheet, enhancedOptions);
    if (loadoutValidation.valid) {
      selection.model = loadout.model;
      selection.reason = `Loadout override: ${loadout.model} (${loadoutValidation.tier})`;
      selection.confidence = 0.9;
      selection.tier = loadoutValidation.tier;
      selection.cost_estimate = loadoutValidation.cost_estimate;
    } else {
      console.warn(`Loadout model ${loadout.model} validation failed: ${loadoutValidation.reason}`);
    }
  }
  
  // Step 4: Cost and budget validation
  const costValidation = validateCostConstraints(selection, characterSheet);
  if (!costValidation.valid) {
    const costOptimizedSelection = selectCostOptimizedModel(classification.type, characterSheet, enhancedOptions);
    if (costOptimizedSelection) {
      Object.assign(selection, costOptimizedSelection);
      selection.reason += ` (Cost optimized: ${costValidation.reason})`;
    }
  }
  
  // Step 5: Build complete three-tier routing decision
  const decision = {
    timestamp,
    task: taskInput,
    classification,
    selection,
    loadout: characterSheet.loadout || 'default',
    options: enhancedOptions,
    tier_info: {
      selected_tier: selection.tier,
      cost_estimate: selection.cost_estimate,
      privacy_protection: selection.privacy_protection || false,
      budget_protection: selection.budget_protection || false
    },
    metadata: {
      version: '3.0',
      engine: 'three-tier-routing-engine',
      tier_architecture: true
    }
  };
  
  return decision;
}

/**
 * Estimate token count for a given input
 * @param {string} input - Input text
 * @returns {number} - Estimated token count
 */
function estimateTokenCount(input) {
  if (!input || typeof input !== 'string') return 100;
  
  // Rough approximation: 1 token per 4 characters for English text
  const baseTokens = Math.ceil(input.length / 4);
  
  // Add tokens for response (assume 2-3x input length for response)
  const responseMultiplier = 2.5;
  
  return Math.max(baseTokens * responseMultiplier, 100);
}

/**
 * Validate cost constraints for a selection
 * @param {object} selection - Model selection object
 * @param {object} characterSheet - User configuration
 * @returns {object} - Cost validation result
 */
function validateCostConstraints(selection, characterSheet) {
  const monthlyBudget = characterSheet.cost_settings?.monthly_budget || costTracking.monthly_budget || 10;
  const currentSpend = getCurrentMonthlySpend();
  const remainingBudget = monthlyBudget - currentSpend;
  const estimatedCost = selection.cost_estimate || 0;
  
  if (estimatedCost === 0) {
    return { valid: true, reason: 'No cost for local processing' };
  }
  
  if (estimatedCost > remainingBudget) {
    return { 
      valid: false, 
      reason: `Estimated cost $${estimatedCost.toFixed(4)} exceeds remaining budget $${remainingBudget.toFixed(2)}` 
    };
  }
  
  // Warn if using >50% of remaining budget in one request
  if (estimatedCost > (remainingBudget * 0.5)) {
    return {
      valid: true,
      warning: `High cost usage: $${estimatedCost.toFixed(4)} is ${((estimatedCost/remainingBudget)*100).toFixed(1)}% of remaining budget`
    };
  }
  
  return { valid: true, reason: 'Within budget constraints' };
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
  
  // Three-tier specific validations
  if (decision.metadata?.tier_architecture) {
    // Check tier assignment
    if (!decision.tier_info?.selected_tier) {
      validation.warnings.push('No tier information available');
    }
    
    // Check cost estimate for cloud models
    if (modelInfo?.tier === 'tier3-cloud' && !decision.tier_info?.cost_estimate) {
      validation.warnings.push('No cost estimate for cloud tier model');
    }
    
    // Check privacy protection for sensitive tasks
    if (decision.classification.keywords?.includes('sensitive') && 
        modelInfo?.privacy_tier !== 'local') {
      validation.warnings.push('Sensitive task routed to non-local tier');
    }
    
    // Validate tier configuration
    const tierValid = validateTierConfiguration(decision.tier_info.selected_tier);
    if (!tierValid.valid) {
      validation.warnings.push(`Tier configuration issue: ${tierValid.reason}`);
    }
  }
  
  return validation;
}

/**
 * Validate tier configuration exists and is properly set up
 * @param {string} tier - Tier name to validate
 * @returns {object} - Validation result
 */
function validateTierConfiguration(tier) {
  if (!tier) {
    return { valid: false, reason: 'No tier specified' };
  }
  
  const config = tierConfig[tier];
  if (!config) {
    return { valid: false, reason: `Tier ${tier} not found in configuration` };
  }
  
  // Check required configuration fields
  const requiredFields = ['description', 'cost_category', 'privacy_level'];
  for (const field of requiredFields) {
    if (!config[field]) {
      return { valid: false, reason: `Missing ${field} in tier ${tier} configuration` };
    }
  }
  
  return { valid: true };
}

module.exports = {
  detectTaskType,
  selectModel,
  generateThreeTierFallbackChain,
  makeRoutingDecision,
  validateRoutingDecision,
  // Three-tier specific functions
  checkPrivacyRequirements,
  selectLocalModel,
  selectByTier,
  selectCostOptimizedModel,
  selectIntelligentTier,
  analyzeTaskComplexity,
  calculateCostEstimate,
  validateTierSelection,
  validateCostConstraints,
  estimateTokenCount,
  validateTierConfiguration,
  // Legacy compatibility
  generateFallbackChain: generateThreeTierFallbackChain
};

// #endregion end: Enhanced Routing Engine