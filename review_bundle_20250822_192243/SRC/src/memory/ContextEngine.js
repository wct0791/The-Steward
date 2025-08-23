// #region start: Context Engine for The Steward
// Detects current project/task context and provides context-aware routing recommendations
// Enables intelligent model selection based on historical patterns and project requirements

const ProjectMemoryManager = require('./ProjectMemoryManager');

/**
 * ContextEngine - Intelligent context detection and routing recommendation engine
 * 
 * Key Features:
 * - Real-time project context detection from task input
 * - Historical pattern correlation for routing decisions
 * - Context switching awareness for ADHD accommodation
 * - Cross-session learning integration
 */
class ContextEngine {
  constructor(options = {}) {
    this.memoryManager = new ProjectMemoryManager(options);
    this.contextCache = new Map();
    this.sessionHistory = [];
    
    // Context switching detection for ADHD awareness
    this.contextSwitchingPatterns = {
      rapid_switching: {
        threshold: 3, // 3 different contexts within 10 minutes
        timeWindow: 600000, // 10 minutes in ms
        accommodation: 'simplified_routing'
      },
      hyperfocus: {
        threshold: 5, // 5+ same context decisions in a row
        accommodation: 'enhanced_context_memory'
      },
      capacity_variance: {
        low_capacity_indicators: ['quick', 'simple', 'help', 'brief'],
        high_capacity_indicators: ['complex', 'detailed', 'comprehensive', 'analyze']
      }
    };
  }

  /**
   * Initialize the context engine
   */
  async initialize() {
    const success = await this.memoryManager.initialize();
    if (success) {
      console.log('ContextEngine initialized successfully');
    }
    return success;
  }

  /**
   * Analyze incoming task and provide context-aware routing recommendation
   */
  async analyzeTask(taskInput, characterSheet, options = {}) {
    try {
      // Step 1: Detect project context
      const projectContext = await this.detectProjectContext(taskInput);
      
      // Step 2: Analyze context switching patterns
      const contextSwitching = this.analyzeContextSwitching(projectContext);
      
      // Step 3: Detect cognitive capacity indicators
      const capacityAnalysis = this.analyzeCognitiveCapacity(taskInput, contextSwitching);
      
      // Step 4: Get routing recommendations from historical patterns
      const routingRecommendations = await this.getContextAwareRoutingRecommendations(
        projectContext, 
        taskInput, 
        capacityAnalysis
      );
      
      // Step 5: Build complete context analysis
      const contextAnalysis = {
        project_context: projectContext,
        context_switching: contextSwitching,
        cognitive_capacity: capacityAnalysis,
        routing_recommendations: routingRecommendations,
        confidence: this.calculateOverallConfidence(projectContext, routingRecommendations),
        timestamp: new Date().toISOString()
      };
      
      // Step 6: Update session history for learning
      this.updateSessionHistory(taskInput, contextAnalysis);
      
      return contextAnalysis;
      
    } catch (error) {
      console.error('Error in ContextEngine.analyzeTask:', error);
      return this.getFallbackAnalysis(taskInput);
    }
  }

  /**
   * Detect project context from task input
   */
  async detectProjectContext(taskInput) {
    // Check cache first
    const cacheKey = this.generateContextCacheKey(taskInput);
    if (this.contextCache.has(cacheKey)) {
      return this.contextCache.get(cacheKey);
    }
    
    // Use memory manager for detection
    const detection = await this.memoryManager.detectCurrentProjectContext(taskInput);
    
    // Enhanced context detection with additional patterns
    const enhancedDetection = this.enhanceContextDetection(taskInput, detection);
    
    // Cache result
    this.contextCache.set(cacheKey, enhancedDetection);
    
    return enhancedDetection;
  }

  /**
   * Enhance context detection with additional analysis
   */
  enhanceContextDetection(taskInput, baseDetection) {
    const loweredInput = taskInput.toLowerCase();
    
    // Additional context patterns
    const additionalPatterns = {
      'debugging': {
        keywords: ['error', 'bug', 'fix', 'debug', 'broken', 'issue'],
        context_type: 'technical-problem-solving'
      },
      'learning': {
        keywords: ['learn', 'understand', 'explain', 'how to', 'tutorial'],
        context_type: 'knowledge-acquisition'
      },
      'planning': {
        keywords: ['plan', 'strategy', 'organize', 'structure', 'roadmap'],
        context_type: 'strategic-planning'
      },
      'creation': {
        keywords: ['create', 'build', 'make', 'design', 'implement'],
        context_type: 'creative-development'
      }
    };

    let enhancedContext = baseDetection.project;
    let contextType = 'general';
    let additionalConfidence = 0;

    for (const [pattern, config] of Object.entries(additionalPatterns)) {
      const matchCount = config.keywords.filter(keyword => loweredInput.includes(keyword)).length;
      if (matchCount > 0) {
        contextType = config.context_type;
        additionalConfidence = matchCount * 0.2;
        
        // If we don't have a strong project match, use pattern-based context
        if (baseDetection.confidence < 0.7) {
          enhancedContext = pattern;
        }
        break;
      }
    }

    return {
      project: enhancedContext,
      context_type: contextType,
      confidence: Math.min(baseDetection.confidence + additionalConfidence, 1.0),
      keywords_matched: baseDetection.keywords_matched,
      original_detection: baseDetection
    };
  }

  /**
   * Analyze context switching patterns for ADHD awareness
   */
  analyzeContextSwitching(currentContext) {
    const now = Date.now();
    const recentHistory = this.sessionHistory.filter(entry => 
      now - new Date(entry.timestamp).getTime() < this.contextSwitchingPatterns.rapid_switching.timeWindow
    );

    // Count context switches in recent history
    const recentContexts = recentHistory.map(entry => entry.context.project);
    const uniqueContexts = [...new Set(recentContexts)];
    const isRapidSwitching = uniqueContexts.length >= this.contextSwitchingPatterns.rapid_switching.threshold;

    // Check for hyperfocus pattern
    const lastFiveContexts = this.sessionHistory.slice(-5).map(entry => entry.context.project);
    const isHyperfocus = lastFiveContexts.length === 5 && 
                        new Set(lastFiveContexts).size === 1 && 
                        lastFiveContexts[0] === currentContext.project;

    // Context switch frequency analysis
    const contextSwitchFrequency = recentHistory.length > 1 ? 
      (uniqueContexts.length - 1) / (recentHistory.length - 1) : 0;

    return {
      is_rapid_switching: isRapidSwitching,
      is_hyperfocus: isHyperfocus,
      recent_contexts: uniqueContexts,
      switch_frequency: contextSwitchFrequency,
      recommended_accommodation: isRapidSwitching ? 
        this.contextSwitchingPatterns.rapid_switching.accommodation :
        (isHyperfocus ? this.contextSwitchingPatterns.hyperfocus.accommodation : 'standard'),
      pattern_confidence: Math.max(recentHistory.length / 10, 0.1)
    };
  }

  /**
   * Analyze cognitive capacity indicators
   */
  analyzeCognitiveCapacity(taskInput, contextSwitching) {
    const loweredInput = taskInput.toLowerCase();
    const patterns = this.contextSwitchingPatterns.capacity_variance;
    
    // Check for capacity indicators
    const lowCapacityScore = patterns.low_capacity_indicators
      .filter(indicator => loweredInput.includes(indicator)).length;
    
    const highCapacityScore = patterns.high_capacity_indicators
      .filter(indicator => loweredInput.includes(indicator)).length;

    // Task complexity analysis
    const wordCount = taskInput.split(/\s+/).length;
    const complexityScore = Math.min(wordCount / 20, 1.0); // Normalize to 0-1

    // Context switching impact on capacity
    const switchingPenalty = contextSwitching.is_rapid_switching ? 0.3 : 0;

    let capacityLevel = 'medium';
    let confidence = 0.5;

    if (lowCapacityScore > highCapacityScore && lowCapacityScore > 0) {
      capacityLevel = 'low';
      confidence = 0.7 + switchingPenalty;
    } else if (highCapacityScore > lowCapacityScore && highCapacityScore > 0) {
      capacityLevel = 'high';
      confidence = Math.max(0.7 - switchingPenalty, 0.3);
    } else if (complexityScore > 0.7) {
      capacityLevel = 'high';
      confidence = 0.6 - switchingPenalty;
    } else if (complexityScore < 0.3) {
      capacityLevel = 'low';
      confidence = 0.6;
    }

    return {
      level: capacityLevel,
      confidence: confidence,
      complexity_score: complexityScore,
      low_capacity_indicators: lowCapacityScore,
      high_capacity_indicators: highCapacityScore,
      context_switching_impact: switchingPenalty
    };
  }

  /**
   * Get context-aware routing recommendations
   */
  async getContextAwareRoutingRecommendations(projectContext, taskInput, capacityAnalysis) {
    try {
      // Get historical recommendations from memory manager
      const historicalRecommendations = await this.memoryManager.getRoutingRecommendations(
        projectContext.project, 
        'general'
      );

      // Apply capacity-aware filtering and weighting
      const capacityAwareRecommendations = this.applyCapacityFiltering(
        historicalRecommendations, 
        capacityAnalysis
      );

      // Add context-specific recommendations
      const contextSpecificRecommendations = this.getContextSpecificRecommendations(
        projectContext, 
        capacityAnalysis
      );

      // Merge and rank recommendations
      const mergedRecommendations = this.mergeRecommendations(
        capacityAwareRecommendations, 
        contextSpecificRecommendations
      );

      return {
        primary_recommendations: mergedRecommendations.slice(0, 3),
        all_recommendations: mergedRecommendations,
        historical_count: historicalRecommendations.length,
        context_specific_count: contextSpecificRecommendations.length,
        reasoning: this.generateRecommendationReasoning(projectContext, capacityAnalysis)
      };

    } catch (error) {
      console.error('Error getting routing recommendations:', error);
      return this.getFallbackRecommendations(capacityAnalysis);
    }
  }

  /**
   * Apply capacity-aware filtering to recommendations
   */
  applyCapacityFiltering(recommendations, capacityAnalysis) {
    const capacityModelMap = {
      'low': ['smollm3', 'phi4', 'gemma3'],
      'medium': ['claude', 'gpt-4', 'qwen3'],
      'high': ['gpt-4', 'claude', 'deepseek-r1']
    };

    const preferredModels = capacityModelMap[capacityAnalysis.level] || capacityModelMap.medium;

    return recommendations.map(rec => {
      const capacityBonus = preferredModels.includes(rec.model) ? 0.2 : 0;
      return {
        ...rec,
        capacity_adjusted_confidence: Math.min(rec.confidence + capacityBonus, 1.0),
        capacity_match: preferredModels.includes(rec.model)
      };
    }).sort((a, b) => b.capacity_adjusted_confidence - a.capacity_adjusted_confidence);
  }

  /**
   * Get context-specific model recommendations
   */
  getContextSpecificRecommendations(projectContext, capacityAnalysis) {
    const contextRecommendations = {
      'steward-development': {
        'low': [{ model: 'smollm3', confidence: 0.8, reason: 'Fast local processing for Steward tasks' }],
        'medium': [{ model: 'claude', confidence: 0.9, reason: 'Balanced performance for Steward development' }],
        'high': [{ model: 'claude', confidence: 0.95, reason: 'Advanced reasoning for complex Steward features' }]
      },
      'creative-writing': {
        'low': [{ model: 'phi4', confidence: 0.7, reason: 'Quick creative assistance' }],
        'medium': [{ model: 'dolphin-mistral', confidence: 0.8, reason: 'Creative writing specialization' }],
        'high': [{ model: 'gpt-4', confidence: 0.9, reason: 'Advanced creative capabilities' }]
      },
      'technical-development': {
        'low': [{ model: 'smollm3', confidence: 0.7, reason: 'Basic coding assistance' }],
        'medium': [{ model: 'qwen3-coder', confidence: 0.9, reason: 'Coding specialization' }],
        'high': [{ model: 'claude', confidence: 0.9, reason: 'Complex technical analysis' }]
      },
      'debugging': {
        'low': [{ model: 'smollm3', confidence: 0.6, reason: 'Quick debugging help' }],
        'medium': [{ model: 'claude', confidence: 0.8, reason: 'Systematic debugging approach' }],
        'high': [{ model: 'gpt-4', confidence: 0.9, reason: 'Advanced debugging analysis' }]
      }
    };

    const projectType = projectContext.project || projectContext.context_type || 'general';
    const capacityLevel = capacityAnalysis.level;
    
    return contextRecommendations[projectType]?.[capacityLevel] || [];
  }

  /**
   * Merge historical and context-specific recommendations
   */
  mergeRecommendations(historical, contextSpecific) {
    const merged = [...historical, ...contextSpecific];
    
    // Deduplicate by model name, keeping highest confidence
    const modelMap = new Map();
    
    for (const rec of merged) {
      const existing = modelMap.get(rec.model);
      if (!existing || rec.confidence > existing.confidence) {
        modelMap.set(rec.model, rec);
      }
    }
    
    return Array.from(modelMap.values())
      .sort((a, b) => (b.capacity_adjusted_confidence || b.confidence) - (a.capacity_adjusted_confidence || a.confidence));
  }

  /**
   * Generate reasoning for recommendations
   */
  generateRecommendationReasoning(projectContext, capacityAnalysis) {
    const reasons = [];
    
    reasons.push(`Project context: ${projectContext.project} (${Math.round(projectContext.confidence * 100)}% confidence)`);
    reasons.push(`Cognitive capacity: ${capacityAnalysis.level} (complexity: ${Math.round(capacityAnalysis.complexity_score * 100)}%)`);
    
    if (capacityAnalysis.context_switching_impact > 0) {
      reasons.push(`Context switching detected - prioritizing simpler models`);
    }
    
    return reasons.join('; ');
  }

  /**
   * Calculate overall confidence in context analysis
   */
  calculateOverallConfidence(projectContext, routingRecommendations) {
    const contextConfidence = projectContext.confidence || 0.5;
    const recommendationConfidence = routingRecommendations.primary_recommendations?.[0]?.confidence || 0.5;
    const historicalData = routingRecommendations.historical_count > 0 ? 0.2 : 0;
    
    return Math.min((contextConfidence + recommendationConfidence + historicalData) / 2, 1.0);
  }

  /**
   * Update session history for learning
   */
  updateSessionHistory(taskInput, contextAnalysis) {
    this.sessionHistory.push({
      task: taskInput,
      context: contextAnalysis.project_context,
      timestamp: contextAnalysis.timestamp
    });
    
    // Keep only last 20 entries to prevent memory bloat
    if (this.sessionHistory.length > 20) {
      this.sessionHistory = this.sessionHistory.slice(-20);
    }
  }

  /**
   * Record routing decision for learning
   */
  async recordRoutingDecision(contextAnalysis, selectedModel, confidence, userFeedback = null) {
    try {
      await this.memoryManager.recordRoutingDecision(
        contextAnalysis.project_context.project,
        'context_aware_routing',
        contextAnalysis.project_context.context_type || 'general',
        selectedModel,
        confidence,
        userFeedback
      );
    } catch (error) {
      console.error('Error recording routing decision:', error);
    }
  }

  /**
   * Update routing pattern based on feedback
   */
  async updateRoutingPattern(projectContext, model, success, performanceScore = null) {
    try {
      await this.memoryManager.updateRoutingPattern(projectContext, model, success, performanceScore);
    } catch (error) {
      console.error('Error updating routing pattern:', error);
    }
  }

  /**
   * Generate context cache key
   */
  generateContextCacheKey(taskInput) {
    // Simple hash of task input for caching
    return taskInput.toLowerCase().replace(/\s+/g, ' ').trim().substring(0, 100);
  }

  /**
   * Get fallback analysis when main analysis fails
   */
  getFallbackAnalysis(taskInput) {
    return {
      project_context: {
        project: 'unknown',
        context_type: 'general',
        confidence: 0.3
      },
      context_switching: {
        is_rapid_switching: false,
        is_hyperfocus: false,
        recommended_accommodation: 'standard'
      },
      cognitive_capacity: {
        level: 'medium',
        confidence: 0.5
      },
      routing_recommendations: this.getFallbackRecommendations({ level: 'medium' }),
      confidence: 0.3,
      timestamp: new Date().toISOString(),
      fallback: true
    };
  }

  /**
   * Get fallback recommendations
   */
  getFallbackRecommendations(capacityAnalysis) {
    const fallbackModels = {
      'low': [{ model: 'smollm3', confidence: 0.6, reason: 'Fallback - fast local model' }],
      'medium': [{ model: 'smollm3', confidence: 0.7, reason: 'Fallback - reliable local model' }],
      'high': [{ model: 'claude', confidence: 0.6, reason: 'Fallback - capable cloud model' }]
    };

    return {
      primary_recommendations: fallbackModels[capacityAnalysis.level] || fallbackModels.medium,
      all_recommendations: fallbackModels[capacityAnalysis.level] || fallbackModels.medium,
      historical_count: 0,
      context_specific_count: 1,
      reasoning: 'Fallback recommendations due to analysis error'
    };
  }

  /**
   * Get insights about context switching patterns
   */
  getContextSwitchingInsights() {
    const recentContexts = this.sessionHistory.slice(-10);
    const contextCounts = {};
    
    for (const entry of recentContexts) {
      const context = entry.context.project;
      contextCounts[context] = (contextCounts[context] || 0) + 1;
    }
    
    return {
      recent_session_contexts: contextCounts,
      total_recent_decisions: recentContexts.length,
      dominant_context: Object.keys(contextCounts).reduce((a, b) => 
        contextCounts[a] > contextCounts[b] ? a : b, 'none'
      ),
      switching_frequency: Object.keys(contextCounts).length / Math.max(recentContexts.length, 1)
    };
  }

  /**
   * Close the context engine and cleanup
   */
  async close() {
    await this.memoryManager.close();
    this.contextCache.clear();
    this.sessionHistory = [];
  }
}

module.exports = ContextEngine;

// #endregion end: Context Engine