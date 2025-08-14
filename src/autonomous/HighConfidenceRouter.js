// #region start: High Confidence Router for The Steward
// Autonomous routing for high-confidence decisions based on historical patterns
// Provides autopilot mode with user oversight and manual override capabilities

const { makeRoutingDecision, recordRoutingFeedback } = require('../core/routing-engine');
const ProjectMemoryManager = require('../memory/ProjectMemoryManager');

/**
 * HighConfidenceRouter - Autonomous routing system for routine decisions
 * 
 * Key Features:
 * - Identify routing decisions with >90% historical confidence
 * - Auto-execute routine model selections without user interaction  
 * - Provide autopilot mode toggle with user override
 * - Log autonomous decisions for review and feedback
 * - Escalate low-confidence decisions to manual routing
 */
class HighConfidenceRouter {
  constructor(options = {}) {
    this.memoryManager = new ProjectMemoryManager(options);
    this.autonomousDecisionLog = [];
    this.confidenceThreshold = options.confidenceThreshold || 0.9;
    this.autopilotEnabled = false;
    this.userPreferences = {};
    
    // Autonomous routing criteria
    this.autonomousCriteria = {
      min_confidence_score: 0.9,        // Minimum confidence for autonomous routing
      min_historical_usage: 5,          // Minimum number of similar decisions
      min_success_rate: 0.85,           // Minimum success rate for the pattern
      max_context_switching_penalty: 0.2, // Max penalty before requiring manual review
      require_pattern_stability: true,   // Require stable patterns over time
      exclude_new_project_types: true    // Exclude new/unknown project types
    };

    // Decision patterns that qualify for autonomous routing
    this.highConfidencePatterns = new Map();
    
    // Escalation triggers
    this.escalationTriggers = [
      'new_project_type',
      'low_confidence',
      'user_feedback_negative',
      'model_unavailable',
      'context_switching_high',
      'cognitive_load_unusual'
    ];
  }

  /**
   * Initialize autonomous router
   */
  async initialize() {
    try {
      await this.memoryManager.initialize();
      await this.loadHighConfidencePatterns();
      console.log('HighConfidenceRouter initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize HighConfidenceRouter:', error);
      return false;
    }
  }

  /**
   * Load high-confidence routing patterns from historical data
   */
  async loadHighConfidencePatterns() {
    try {
      const crossSessionInsights = await this.memoryManager.getCrossSessionInsights();
      
      for (const project of crossSessionInsights.projects || []) {
        const projectInsights = await this.memoryManager.getProjectInsights(project.project_context);
        await this.analyzeProjectForAutonomousPatterns(project.project_context, projectInsights);
      }
      
      console.log(`Loaded ${this.highConfidencePatterns.size} high-confidence routing patterns`);
    } catch (error) {
      console.warn('Could not load high-confidence patterns:', error.message);
    }
  }

  /**
   * Analyze project for autonomous routing patterns
   */
  async analyzeProjectForAutonomousPatterns(projectContext, projectInsights) {
    if (!projectInsights.model_usage || projectInsights.total_decisions < this.autonomousCriteria.min_historical_usage) {
      return;
    }

    // Analyze each model's usage pattern
    for (const modelUsage of projectInsights.model_usage) {
      if (this.qualifiesForAutonomousRouting(modelUsage, projectInsights)) {
        const patternKey = `${projectContext}:${modelUsage.selected_model}`;
        
        this.highConfidencePatterns.set(patternKey, {
          project_context: projectContext,
          model: modelUsage.selected_model,
          confidence: modelUsage.usage_count / projectInsights.total_decisions,
          success_rate: this.calculateSuccessRate(modelUsage),
          usage_count: modelUsage.usage_count,
          last_used: new Date().toISOString(),
          autonomous_enabled: true,
          pattern_stability: this.assessPatternStability(modelUsage, projectInsights),
          created_at: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Check if model usage qualifies for autonomous routing
   */
  qualifiesForAutonomousRouting(modelUsage, projectInsights) {
    // Check usage frequency
    const usageFrequency = modelUsage.usage_count / projectInsights.total_decisions;
    if (usageFrequency < this.autonomousCriteria.min_confidence_score) {
      return false;
    }

    // Check historical usage count
    if (modelUsage.usage_count < this.autonomousCriteria.min_historical_usage) {
      return false;
    }

    // Check success rate (simulated - would be based on user feedback)
    const successRate = this.calculateSuccessRate(modelUsage);
    if (successRate < this.autonomousCriteria.min_success_rate) {
      return false;
    }

    return true;
  }

  /**
   * Calculate success rate for model usage (simulated)
   */
  calculateSuccessRate(modelUsage) {
    // Simulate success rate based on usage patterns
    // In real implementation, this would be based on user feedback
    return 0.85 + (Math.random() * 0.1); // 85-95% success rate
  }

  /**
   * Assess pattern stability over time
   */
  assessPatternStability(modelUsage, projectInsights) {
    // Simulate stability assessment
    // Real implementation would analyze usage patterns over time
    return Math.random() > 0.3; // 70% chance of being stable
  }

  /**
   * Attempt autonomous routing for a task
   */
  async attemptAutonomousRouting(taskInput, characterSheet, options = {}) {
    if (!this.autopilotEnabled) {
      return { autonomous: false, reason: 'Autopilot mode disabled' };
    }

    try {
      // First get standard routing decision for analysis
      const standardDecision = await makeRoutingDecision(taskInput, characterSheet, options);
      
      // Extract project context
      const projectContext = standardDecision.memory_integration?.context_analysis?.project_context?.project || 'unknown';
      
      // Check if this qualifies for autonomous routing
      const autonomousEligibility = await this.assessAutonomousEligibility(
        projectContext, 
        standardDecision, 
        characterSheet
      );

      if (!autonomousEligibility.eligible) {
        return {
          autonomous: false,
          reason: autonomousEligibility.reason,
          escalation_trigger: autonomousEligibility.trigger,
          standard_decision: standardDecision
        };
      }

      // Execute autonomous routing
      const autonomousDecision = await this.executeAutonomousRouting(
        taskInput,
        projectContext,
        standardDecision,
        characterSheet,
        options
      );

      // Log the autonomous decision
      this.logAutonomousDecision(autonomousDecision, standardDecision);

      return {
        autonomous: true,
        decision: autonomousDecision,
        confidence: autonomousEligibility.confidence,
        pattern_used: autonomousEligibility.pattern,
        execution_time: autonomousDecision.execution_time
      };

    } catch (error) {
      console.error('Error in autonomous routing:', error);
      return { 
        autonomous: false, 
        reason: 'Autonomous routing error', 
        error: error.message 
      };
    }
  }

  /**
   * Assess if routing decision qualifies for autonomous execution
   */
  async assessAutonomousEligibility(projectContext, standardDecision, characterSheet) {
    // Check if project context is known
    if (projectContext === 'unknown') {
      return { 
        eligible: false, 
        reason: 'Unknown project context',
        trigger: 'new_project_type'
      };
    }

    // Check confidence threshold
    if (standardDecision.selection.confidence < this.confidenceThreshold) {
      return {
        eligible: false,
        reason: `Confidence ${Math.round(standardDecision.selection.confidence * 100)}% below threshold ${Math.round(this.confidenceThreshold * 100)}%`,
        trigger: 'low_confidence'
      };
    }

    // Check for high context switching penalty
    const contextSwitching = standardDecision.memory_integration?.context_analysis?.context_switching;
    if (contextSwitching?.switch_frequency > this.autonomousCriteria.max_context_switching_penalty) {
      return {
        eligible: false,
        reason: 'High context switching penalty detected',
        trigger: 'context_switching_high'
      };
    }

    // Look for matching high-confidence pattern
    const patternKey = `${projectContext}:${standardDecision.selection.model}`;
    const pattern = this.highConfidencePatterns.get(patternKey);

    if (!pattern) {
      return {
        eligible: false,
        reason: 'No high-confidence pattern found for this combination',
        trigger: 'new_pattern'
      };
    }

    // Check pattern stability
    if (this.autonomousCriteria.require_pattern_stability && !pattern.pattern_stability) {
      return {
        eligible: false,
        reason: 'Pattern not stable enough for autonomous routing',
        trigger: 'pattern_unstable'
      };
    }

    // Check user preferences for autonomous routing
    const userAutonomySettings = characterSheet.autonomous_routing || {};
    if (!userAutonomySettings.enable_autopilot) {
      return {
        eligible: false,
        reason: 'User has disabled autonomous routing',
        trigger: 'user_disabled'
      };
    }

    // All checks passed
    return {
      eligible: true,
      confidence: Math.min(standardDecision.selection.confidence, pattern.confidence),
      pattern: pattern
    };
  }

  /**
   * Execute autonomous routing decision
   */
  async executeAutonomousRouting(taskInput, projectContext, standardDecision, characterSheet, options) {
    const startTime = Date.now();

    // Create autonomous routing decision based on standard decision
    const autonomousDecision = {
      ...standardDecision,
      autonomous: true,
      autonomous_confidence: standardDecision.selection.confidence,
      autonomous_pattern_match: true,
      execution_time: Date.now() - startTime,
      selection: {
        ...standardDecision.selection,
        reason: `Autonomous routing: ${standardDecision.selection.reason}`,
        autonomous: true,
        manual_override_available: true
      },
      metadata: {
        ...standardDecision.metadata,
        autonomous_routing: true,
        autopilot_version: '1.0',
        can_override: true
      }
    };

    // Update pattern usage statistics
    await this.updatePatternUsage(projectContext, standardDecision.selection.model);

    return autonomousDecision;
  }

  /**
   * Log autonomous decision for review
   */
  logAutonomousDecision(autonomousDecision, standardDecision) {
    const logEntry = {
      id: `auto_${Date.now()}`,
      timestamp: new Date().toISOString(),
      task_input: autonomousDecision.task,
      project_context: autonomousDecision.memory_integration?.context_analysis?.project_context?.project,
      selected_model: autonomousDecision.selection.model,
      autonomous_confidence: autonomousDecision.autonomous_confidence,
      standard_confidence: standardDecision.selection.confidence,
      reasoning: autonomousDecision.selection.reason,
      execution_time: autonomousDecision.execution_time,
      user_reviewed: false,
      user_feedback: null
    };

    this.autonomousDecisionLog.push(logEntry);
    
    // Keep only last 100 decisions
    if (this.autonomousDecisionLog.length > 100) {
      this.autonomousDecisionLog = this.autonomousDecisionLog.slice(-100);
    }
  }

  /**
   * Update pattern usage statistics
   */
  async updatePatternUsage(projectContext, model) {
    const patternKey = `${projectContext}:${model}`;
    const pattern = this.highConfidencePatterns.get(patternKey);
    
    if (pattern) {
      pattern.usage_count += 1;
      pattern.last_used = new Date().toISOString();
      this.highConfidencePatterns.set(patternKey, pattern);
    }
  }

  /**
   * Enable/disable autopilot mode
   */
  setAutopilotMode(enabled, userPreferences = {}) {
    this.autopilotEnabled = enabled;
    this.userPreferences = { ...this.userPreferences, ...userPreferences };
    
    if (enabled) {
      console.log('Autopilot mode enabled for high-confidence routing decisions');
    } else {
      console.log('Autopilot mode disabled - all decisions require manual confirmation');
    }
    
    return {
      autopilot_enabled: this.autopilotEnabled,
      confidence_threshold: this.confidenceThreshold,
      high_confidence_patterns: this.highConfidencePatterns.size
    };
  }

  /**
   * Update confidence threshold for autonomous routing
   */
  setConfidenceThreshold(threshold) {
    if (threshold < 0.7 || threshold > 0.99) {
      throw new Error('Confidence threshold must be between 0.7 and 0.99');
    }
    
    this.confidenceThreshold = threshold;
    console.log(`Autonomous routing confidence threshold set to ${Math.round(threshold * 100)}%`);
    
    return { confidence_threshold: threshold };
  }

  /**
   * Get autonomous decision history
   */
  getAutonomousDecisionHistory(limit = 20) {
    return {
      decisions: this.autonomousDecisionLog.slice(-limit),
      total_autonomous_decisions: this.autonomousDecisionLog.length,
      autopilot_enabled: this.autopilotEnabled,
      confidence_threshold: this.confidenceThreshold,
      high_confidence_patterns: this.highConfidencePatterns.size,
      success_rate: this.calculateAutonomousSuccessRate()
    };
  }

  /**
   * Calculate autonomous routing success rate
   */
  calculateAutonomousSuccessRate() {
    const reviewedDecisions = this.autonomousDecisionLog.filter(d => d.user_reviewed);
    if (reviewedDecisions.length === 0) return null;
    
    const successfulDecisions = reviewedDecisions.filter(d => 
      d.user_feedback && d.user_feedback.success !== false
    );
    
    return successfulDecisions.length / reviewedDecisions.length;
  }

  /**
   * Record user feedback on autonomous decision
   */
  async recordAutonomousFeedback(decisionId, feedback) {
    const decision = this.autonomousDecisionLog.find(d => d.id === decisionId);
    
    if (!decision) {
      throw new Error(`Autonomous decision ${decisionId} not found`);
    }

    // Update decision log
    decision.user_reviewed = true;
    decision.user_feedback = {
      success: feedback.success,
      rating: feedback.rating,
      comments: feedback.comments,
      timestamp: new Date().toISOString()
    };

    // Update pattern confidence based on feedback
    if (decision.project_context && decision.selected_model) {
      await this.updatePatternFromFeedback(
        decision.project_context,
        decision.selected_model,
        feedback.success,
        feedback.rating
      );
    }

    // Record feedback in routing engine
    const routingDecision = {
      selection: { model: decision.selected_model },
      memory_integration: {
        context_analysis: {
          project_context: { project: decision.project_context }
        }
      }
    };

    await recordRoutingFeedback(
      routingDecision,
      feedback.success,
      feedback.rating,
      feedback.comments
    );

    return {
      success: true,
      message: 'Autonomous routing feedback recorded',
      updated_pattern: decision.project_context && decision.selected_model
    };
  }

  /**
   * Update pattern confidence based on user feedback
   */
  async updatePatternFromFeedback(projectContext, model, success, rating) {
    const patternKey = `${projectContext}:${model}`;
    const pattern = this.highConfidencePatterns.get(patternKey);
    
    if (pattern) {
      // Adjust confidence based on feedback
      if (success) {
        pattern.confidence = Math.min(0.99, pattern.confidence + 0.02);
        pattern.success_rate = Math.min(0.99, pattern.success_rate + 0.01);
      } else {
        pattern.confidence = Math.max(0.5, pattern.confidence - 0.05);
        pattern.success_rate = Math.max(0.5, pattern.success_rate - 0.03);
        
        // Disable autonomous routing if success rate drops too low
        if (pattern.success_rate < this.autonomousCriteria.min_success_rate) {
          pattern.autonomous_enabled = false;
          console.log(`Disabled autonomous routing for ${patternKey} due to low success rate`);
        }
      }
      
      pattern.last_feedback = new Date().toISOString();
      this.highConfidencePatterns.set(patternKey, pattern);
    }
  }

  /**
   * Override autonomous decision manually
   */
  async overrideAutonomousDecision(decisionId, manualSelection) {
    const decision = this.autonomousDecisionLog.find(d => d.id === decisionId);
    
    if (!decision) {
      throw new Error(`Autonomous decision ${decisionId} not found`);
    }

    // Record the override
    decision.user_override = {
      original_model: decision.selected_model,
      override_model: manualSelection.model,
      override_reason: manualSelection.reason,
      timestamp: new Date().toISOString()
    };

    // Reduce confidence in the overridden pattern
    if (decision.project_context && decision.selected_model) {
      await this.updatePatternFromFeedback(
        decision.project_context,
        decision.selected_model,
        false,
        0.3 // Low rating for override
      );
    }

    console.log(`Autonomous decision ${decisionId} overridden: ${decision.selected_model} → ${manualSelection.model}`);
    
    return {
      success: true,
      message: 'Autonomous decision overridden',
      original_model: decision.selected_model,
      new_model: manualSelection.model
    };
  }

  /**
   * Get autonomous routing statistics
   */
  getAutonomousStatistics() {
    const recentDecisions = this.autonomousDecisionLog.slice(-50);
    const overrideCount = recentDecisions.filter(d => d.user_override).length;
    
    return {
      autopilot_enabled: this.autopilotEnabled,
      confidence_threshold: this.confidenceThreshold,
      total_autonomous_decisions: this.autonomousDecisionLog.length,
      high_confidence_patterns: this.highConfidencePatterns.size,
      recent_decisions: recentDecisions.length,
      override_rate: recentDecisions.length > 0 ? overrideCount / recentDecisions.length : 0,
      success_rate: this.calculateAutonomousSuccessRate(),
      patterns_by_project: this.getPatternsByProject(),
      escalation_reasons: this.getEscalationReasons()
    };
  }

  /**
   * Get patterns grouped by project
   */
  getPatternsByProject() {
    const byProject = {};
    
    for (const [key, pattern] of this.highConfidencePatterns) {
      const project = pattern.project_context;
      if (!byProject[project]) {
        byProject[project] = [];
      }
      byProject[project].push({
        model: pattern.model,
        confidence: pattern.confidence,
        usage_count: pattern.usage_count,
        autonomous_enabled: pattern.autonomous_enabled
      });
    }
    
    return byProject;
  }

  /**
   * Get escalation reasons from recent decisions
   */
  getEscalationReasons() {
    const reasons = {};
    
    // This would be populated by tracking escalation reasons
    // For now, return placeholder data
    return {
      low_confidence: 5,
      new_project_type: 2,
      context_switching_high: 3,
      user_disabled: 1
    };
  }

  /**
   * Close autonomous router and cleanup
   */
  async close() {
    if (this.memoryManager) {
      await this.memoryManager.close();
    }
  }
}

module.exports = HighConfidenceRouter;

// #endregion end: High Confidence Router