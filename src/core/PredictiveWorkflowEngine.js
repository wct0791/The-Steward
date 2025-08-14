// #region start: Predictive Workflow Engine for The Steward
// Main integration layer for predictive workflows and autonomous routing
// Orchestrates workflow prediction, cognitive optimization, and autonomous execution

const TaskSequencePredictor = require('../workflows/TaskSequencePredictor');
const CognitiveLoadPredictor = require('../workflows/CognitiveLoadPredictor');
const WorkflowOrchestrator = require('../autonomous/WorkflowOrchestrator');
const HighConfidenceRouter = require('../autonomous/HighConfidenceRouter');
const WorkflowMemoryManager = require('../memory/WorkflowMemoryManager');
const { makeRoutingDecision } = require('./routing-engine');

/**
 * PredictiveWorkflowEngine - Main integration and orchestration engine
 * 
 * Key Features:
 * - Integrate all workflow prediction components
 * - Provide unified API for predictive workflow operations
 * - Handle autonomous routing for workflow steps
 * - Learn from workflow outcomes and user feedback
 * - Manage cognitive optimization and ADHD accommodations
 */
class PredictiveWorkflowEngine {
  constructor(options = {}) {
    // Initialize core components
    this.taskPredictor = new TaskSequencePredictor(options);
    this.cognitivePredictor = new CognitiveLoadPredictor(options);
    this.workflowOrchestrator = new WorkflowOrchestrator(options);
    this.autonomousRouter = new HighConfidenceRouter(options);
    this.workflowMemory = new WorkflowMemoryManager(options);
    
    // Engine configuration
    this.config = {
      predictive_workflows_enabled: options.predictiveWorkflowsEnabled !== false,
      autonomous_routing_enabled: options.autonomousRoutingEnabled !== false,
      cognitive_optimization_enabled: options.cognitiveOptimizationEnabled !== false,
      workflow_learning_enabled: options.workflowLearningEnabled !== false,
      
      // Thresholds and limits
      min_confidence_for_suggestions: options.minConfidenceForSuggestions || 0.7,
      max_workflow_suggestions: options.maxWorkflowSuggestions || 3,
      autonomous_confidence_threshold: options.autonomousConfidenceThreshold || 0.9,
      cognitive_capacity_threshold: options.cognitiveCapacityThreshold || 0.4,
      
      // Learning parameters
      feedback_integration_weight: options.feedbackIntegrationWeight || 0.3,
      pattern_stability_requirement: options.patternStabilityRequirement || 0.7,
      min_completions_for_learning: options.minCompletionsForLearning || 3
    };
    
    // State tracking
    this.activeWorkflows = new Map();
    this.cognitiveMonitoring = new Map();
    this.autonomousDecisionLog = [];
    
    // Integration status
    this.initialized = false;
    this.components_ready = {
      task_predictor: false,
      cognitive_predictor: false,
      workflow_orchestrator: false,
      autonomous_router: false,
      workflow_memory: false
    };
  }

  /**
   * Initialize the predictive workflow engine
   */
  async initialize() {
    try {
      console.log('Initializing PredictiveWorkflowEngine...');

      // Initialize all components in parallel
      const initPromises = [
        this.taskPredictor.initialize().then(success => {
          this.components_ready.task_predictor = success;
          return success;
        }),
        this.cognitivePredictor.initialize().then(success => {
          this.components_ready.cognitive_predictor = success;
          return success;
        }),
        this.workflowOrchestrator.initialize().then(success => {
          this.components_ready.workflow_orchestrator = success;
          return success;
        }),
        this.autonomousRouter.initialize().then(success => {
          this.components_ready.autonomous_router = success;
          return success;
        }),
        this.workflowMemory.initialize().then(success => {
          this.components_ready.workflow_memory = success;
          return success;
        })
      ];

      const results = await Promise.all(initPromises);
      const allReady = results.every(result => result);

      if (allReady) {
        this.initialized = true;
        console.log('PredictiveWorkflowEngine initialized successfully');
        return true;
      } else {
        console.warn('Some components failed to initialize:', this.components_ready);
        return false;
      }

    } catch (error) {
      console.error('Failed to initialize PredictiveWorkflowEngine:', error);
      return false;
    }
  }

  /**
   * Generate comprehensive workflow suggestions for a task
   */
  async generateWorkflowSuggestions(taskInput, projectContext, characterSheet, options = {}) {
    if (!this.initialized || !this.config.predictive_workflows_enabled) {
      return this.getFallbackSuggestions(taskInput, projectContext);
    }

    try {
      const startTime = Date.now();

      // Generate parallel predictions
      const [taskSequenceSuggestion, memoryBasedSuggestions, cognitiveAnalysis] = await Promise.all([
        this.taskPredictor.generateWorkflowSuggestion(projectContext, options.currentProgress || []),
        this.workflowMemory.getWorkflowSuggestions(projectContext, taskInput, options),
        this.getCognitiveContext(characterSheet)
      ]);

      // Combine and enhance suggestions
      const enhancedSuggestions = await this.enhanceWorkflowSuggestions(
        taskSequenceSuggestion,
        memoryBasedSuggestions,
        cognitiveAnalysis,
        characterSheet
      );

      // Filter and rank suggestions
      const rankedSuggestions = this.rankWorkflowSuggestions(enhancedSuggestions, cognitiveAnalysis);

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        task_input: taskInput,
        project_context: projectContext,
        suggestions: rankedSuggestions.slice(0, this.config.max_workflow_suggestions),
        cognitive_analysis: cognitiveAnalysis,
        generation_time: executionTime,
        components_used: {
          task_predictor: this.components_ready.task_predictor,
          workflow_memory: this.components_ready.workflow_memory,
          cognitive_predictor: this.components_ready.cognitive_predictor
        },
        learning_available: memoryBasedSuggestions.based_on_completions > 0
      };

    } catch (error) {
      console.error('Error generating workflow suggestions:', error);
      return this.getFallbackSuggestions(taskInput, projectContext);
    }
  }

  /**
   * Create and orchestrate a workflow
   */
  async createWorkflow(taskInput, projectContext, characterSheet, workflowSuggestion, options = {}) {
    if (!this.initialized) {
      throw new Error('PredictiveWorkflowEngine not initialized');
    }

    try {
      // Create workflow using orchestrator
      const workflowResult = await this.workflowOrchestrator.createWorkflow(
        taskInput, 
        projectContext, 
        characterSheet, 
        {
          ...options,
          workflowSuggestion: workflowSuggestion
        }
      );

      if (!workflowResult.success) {
        return workflowResult;
      }

      // Initialize cognitive monitoring for the workflow
      if (this.config.cognitive_optimization_enabled) {
        await this.initializeCognitiveMonitoring(workflowResult.workflow_id, characterSheet);
      }

      // Track active workflow
      this.activeWorkflows.set(workflowResult.workflow_id, {
        ...workflowResult.workflow,
        created_by_engine: true,
        cognitive_monitoring_enabled: this.config.cognitive_optimization_enabled,
        autonomous_routing_enabled: this.config.autonomous_routing_enabled && 
                                   characterSheet.predictive_workflows?.autonomous_routing?.enable_autopilot
      });

      return {
        ...workflowResult,
        engine_integration: {
          cognitive_monitoring: this.config.cognitive_optimization_enabled,
          autonomous_routing: this.config.autonomous_routing_enabled,
          learning_enabled: this.config.workflow_learning_enabled
        }
      };

    } catch (error) {
      console.error('Error creating workflow:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Execute workflow with integrated autonomous routing and cognitive optimization
   */
  async executeWorkflow(workflowId, characterSheet, options = {}) {
    if (!this.initialized) {
      throw new Error('PredictiveWorkflowEngine not initialized');
    }

    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    try {
      // Start cognitive monitoring if enabled
      if (workflow.cognitive_monitoring_enabled) {
        await this.startCognitiveMonitoring(workflowId, characterSheet);
      }

      // Configure autonomous routing if enabled
      let enhancedOptions = { ...options };
      if (workflow.autonomous_routing_enabled) {
        enhancedOptions = await this.configureAutonomousRouting(workflowId, characterSheet, options);
      }

      // Execute workflow through orchestrator
      const executionResult = await this.workflowOrchestrator.executeWorkflow(workflowId, enhancedOptions);

      // Post-execution processing
      if (executionResult.success) {
        await this.processWorkflowCompletion(workflowId, executionResult, characterSheet);
      }

      return {
        ...executionResult,
        engine_integration: {
          cognitive_monitoring_active: workflow.cognitive_monitoring_enabled,
          autonomous_decisions_made: this.getAutonomousDecisionCount(workflowId),
          cognitive_optimizations_applied: this.getCognitiveOptimizationCount(workflowId)
        }
      };

    } catch (error) {
      console.error('Error executing workflow:', error);
      await this.handleWorkflowError(workflowId, error);
      throw error;
    }
  }

  /**
   * Get current cognitive context for a user
   */
  async getCognitiveContext(characterSheet) {
    if (!this.components_ready.cognitive_predictor) {
      return this.getDefaultCognitiveContext();
    }

    try {
      const currentTime = new Date();
      const taskComplexity = 'moderate'; // Could be inferred from task

      const capacityPrediction = this.cognitivePredictor.predictCognitiveCapacity(
        currentTime,
        taskComplexity,
        {
          // Context from character sheet ADHD settings
          adhd_accommodations: characterSheet.predictive_workflows?.cognitive_optimization?.adhd_accommodations,
          recent_context_switches: 2, // Could be tracked
          hyperfocus_detected: false, // Could be inferred
          switching_frequency: 0.3
        }
      );

      const hyperfocusPrediction = this.cognitivePredictor.predictHyperfocusCycle(currentTime);

      return {
        current_capacity: capacityPrediction,
        hyperfocus_prediction: hyperfocusPrediction,
        adhd_accommodations_active: characterSheet.predictive_workflows?.cognitive_optimization?.adhd_accommodations,
        break_preferences: characterSheet.predictive_workflows?.cognitive_optimization?.break_preferences,
        context_switching_analysis: {
          recent_switches: 2,
          switching_cost: 0.15,
          severity: 'moderate'
        }
      };

    } catch (error) {
      console.error('Error getting cognitive context:', error);
      return this.getDefaultCognitiveContext();
    }
  }

  /**
   * Enhance workflow suggestions with cognitive optimization and memory insights
   */
  async enhanceWorkflowSuggestions(taskSuggestion, memorySuggestions, cognitiveAnalysis, characterSheet) {
    const allSuggestions = [];

    // Add task predictor suggestion if available
    if (taskSuggestion && taskSuggestion.steps) {
      allSuggestions.push({
        ...taskSuggestion,
        source: 'task_sequence_predictor',
        enhanced_with_cognitive: true
      });
    }

    // Add memory-based suggestions
    if (memorySuggestions.success && memorySuggestions.suggestions) {
      memorySuggestions.suggestions.forEach(suggestion => {
        allSuggestions.push({
          ...suggestion,
          source: 'workflow_memory',
          enhanced_with_cognitive: true
        });
      });
    }

    // Enhance all suggestions with cognitive optimization
    const enhancedSuggestions = await Promise.all(
      allSuggestions.map(suggestion => this.applyCognitiveOptimization(suggestion, cognitiveAnalysis, characterSheet))
    );

    return enhancedSuggestions;
  }

  /**
   * Apply cognitive optimization to a workflow suggestion
   */
  async applyCognitiveOptimization(workflowSuggestion, cognitiveAnalysis, characterSheet) {
    if (!this.components_ready.cognitive_predictor) {
      return workflowSuggestion;
    }

    try {
      // Optimize step timing based on cognitive capacity prediction
      const optimizedSteps = workflowSuggestion.steps.map(step => {
        const optimalTiming = this.findOptimalTimingForStep(step, cognitiveAnalysis);
        const cognitiveRecommendations = this.getCognitiveRecommendationsForStep(step, cognitiveAnalysis);

        return {
          ...step,
          optimal_timing_enhanced: optimalTiming,
          cognitive_recommendations: cognitiveRecommendations,
          break_recommendation: this.shouldRecommendBreakAfterStep(step, cognitiveAnalysis),
          adhd_accommodations: this.getADHDAccommodationsForStep(step, characterSheet)
        };
      });

      // Add cognitive load optimization metadata
      const cognitiveOptimization = {
        hyperfocus_alignment: this.alignWithHyperfocusCycles(optimizedSteps, cognitiveAnalysis),
        break_recommendations: this.generateBreakRecommendations(optimizedSteps, cognitiveAnalysis),
        context_switching_optimization: this.optimizeContextSwitching(optimizedSteps),
        adhd_accommodations_applied: characterSheet.predictive_workflows?.cognitive_optimization?.adhd_accommodations
      };

      return {
        ...workflowSuggestion,
        steps: optimizedSteps,
        cognitive_optimization: cognitiveOptimization,
        cognitively_optimized: true
      };

    } catch (error) {
      console.error('Error applying cognitive optimization:', error);
      return workflowSuggestion;
    }
  }

  /**
   * Find optimal timing for a workflow step
   */
  findOptimalTimingForStep(step, cognitiveAnalysis) {
    const currentCapacity = cognitiveAnalysis.current_capacity;
    const hyperfocusPrediction = cognitiveAnalysis.hyperfocus_prediction;

    // High cognitive load tasks should align with high capacity periods
    if (step.cognitive_load === 'high') {
      if (currentCapacity.predicted_capacity > 0.8) {
        return ['now', 'current_high_capacity'];
      }
      
      if (hyperfocusPrediction?.next_hyperfocus_window) {
        const hyperfocusStart = new Date(hyperfocusPrediction.next_hyperfocus_window.start_time);
        return [`hyperfocus_window_${hyperfocusStart.getHours()}:${hyperfocusStart.getMinutes()}`];
      }
      
      return ['morning_peak', 'afternoon_secondary_peak'];
    }

    // Medium cognitive load tasks are flexible
    if (step.cognitive_load === 'medium') {
      return ['current_moderate_capacity', 'flexible_timing'];
    }

    // Low cognitive load tasks can fill gaps
    return ['any_time', 'fill_low_capacity_gaps'];
  }

  /**
   * Get cognitive recommendations for a step
   */
  getCognitiveRecommendationsForStep(step, cognitiveAnalysis) {
    const recommendations = [];
    const currentCapacity = cognitiveAnalysis.current_capacity;

    // Capacity-based recommendations
    if (step.cognitive_load === 'high' && currentCapacity.predicted_capacity < 0.6) {
      recommendations.push({
        type: 'defer_high_load',
        message: 'Consider deferring this high-load task until higher cognitive capacity',
        priority: 'medium'
      });
    }

    // ADHD-specific recommendations
    if (cognitiveAnalysis.adhd_accommodations_active) {
      if (step.estimated_duration > 90) {
        recommendations.push({
          type: 'break_long_task',
          message: 'Consider breaking this task into smaller chunks for better ADHD management',
          priority: 'high'
        });
      }

      if (step.parallel_possible) {
        recommendations.push({
          type: 'parallel_execution',
          message: 'This task can run in parallel - good for maintaining engagement',
          priority: 'low'
        });
      }
    }

    // Context switching recommendations
    if (cognitiveAnalysis.context_switching_analysis?.severity === 'high') {
      recommendations.push({
        type: 'minimize_switching',
        message: 'Batch this task with similar activities to reduce context switching cost',
        priority: 'medium'
      });
    }

    return recommendations;
  }

  /**
   * Rank workflow suggestions based on various factors
   */
  rankWorkflowSuggestions(suggestions, cognitiveAnalysis) {
    return suggestions
      .map(suggestion => ({
        ...suggestion,
        ranking_score: this.calculateSuggestionScore(suggestion, cognitiveAnalysis)
      }))
      .sort((a, b) => b.ranking_score - a.ranking_score);
  }

  /**
   * Calculate ranking score for a workflow suggestion
   */
  calculateSuggestionScore(suggestion, cognitiveAnalysis) {
    let score = 0;

    // Base confidence score
    score += (suggestion.completion_probability || 0.5) * 30;

    // Memory-based suggestions get higher scores
    if (suggestion.pattern_based) {
      score += 20;
      score += Math.min(10, (suggestion.based_on_completions || 0) * 2);
    }

    // Cognitive optimization bonus
    if (suggestion.cognitively_optimized) {
      score += 15;
    }

    // Current cognitive capacity alignment
    const currentCapacity = cognitiveAnalysis.current_capacity?.predicted_capacity || 0.7;
    const highLoadSteps = (suggestion.steps || []).filter(s => s.cognitive_load === 'high').length;
    const totalSteps = suggestion.steps?.length || 1;
    const highLoadRatio = highLoadSteps / totalSteps;

    // Penalize high cognitive load when capacity is low
    if (currentCapacity < 0.5 && highLoadRatio > 0.5) {
      score -= 10;
    }

    // Bonus for good capacity alignment
    if (currentCapacity > 0.8 && highLoadRatio > 0.3) {
      score += 10;
    }

    // Duration preference (moderate length workflows preferred)
    const duration = suggestion.total_estimated_duration || 60;
    if (duration >= 30 && duration <= 120) {
      score += 5;
    }

    // ADHD accommodation bonus
    if (cognitiveAnalysis.adhd_accommodations_active && suggestion.cognitive_optimization?.adhd_accommodations_applied) {
      score += 8;
    }

    return Math.max(0, score);
  }

  /**
   * Configure autonomous routing for workflow execution
   */
  async configureAutonomousRouting(workflowId, characterSheet, options) {
    if (!this.components_ready.autonomous_router) {
      return options;
    }

    const workflow = this.activeWorkflows.get(workflowId);
    const autonomousSettings = characterSheet.predictive_workflows?.autonomous_routing || {};

    // Enable autonomous routing for the workflow orchestrator
    const enhancedOptions = {
      ...options,
      autonomousRouting: {
        enabled: autonomousSettings.enable_autopilot && this.config.autonomous_routing_enabled,
        confidence_threshold: autonomousSettings.confidence_threshold || this.config.autonomous_confidence_threshold,
        router: this.autonomousRouter,
        decision_callback: (decision) => this.recordAutonomousDecision(workflowId, decision)
      }
    };

    return enhancedOptions;
  }

  /**
   * Initialize cognitive monitoring for a workflow
   */
  async initializeCognitiveMonitoring(workflowId, characterSheet) {
    const monitoringConfig = {
      workflow_id: workflowId,
      start_time: new Date().toISOString(),
      break_preferences: characterSheet.predictive_workflows?.cognitive_optimization?.break_preferences,
      adhd_settings: characterSheet.predictive_workflows?.cognitive_optimization?.adhd_settings,
      capacity_checks: [],
      break_recommendations: [],
      context_switches: []
    };

    this.cognitiveMonitoring.set(workflowId, monitoringConfig);
  }

  /**
   * Start cognitive monitoring during workflow execution
   */
  async startCognitiveMonitoring(workflowId, characterSheet) {
    const monitoring = this.cognitiveMonitoring.get(workflowId);
    if (!monitoring) return;

    // Schedule periodic capacity checks
    monitoring.capacity_check_interval = setInterval(async () => {
      await this.performCapacityCheck(workflowId);
    }, 15 * 60 * 1000); // Every 15 minutes

    // Schedule break recommendations based on preferences
    const breakInterval = (characterSheet.predictive_workflows?.cognitive_optimization?.break_preferences?.micro_break_interval || 25) * 60 * 1000;
    monitoring.break_check_interval = setInterval(async () => {
      await this.checkBreakRecommendation(workflowId);
    }, breakInterval);
  }

  /**
   * Process workflow completion for learning
   */
  async processWorkflowCompletion(workflowId, executionResult, characterSheet) {
    try {
      const workflow = this.activeWorkflows.get(workflowId);
      if (!workflow || !this.config.workflow_learning_enabled) return;

      // Gather completion data
      const completionData = {
        workflow_id: workflowId,
        project_context: workflow.project_context,
        original_task: workflow.original_task,
        steps_completed: executionResult.steps_completed || 0,
        actual_duration: executionResult.duration || workflow.estimated_duration,
        estimated_duration: workflow.estimated_duration,
        success_rate: executionResult.success_rate || 1.0,
        user_modifications: workflow.user_modifications || [],
        cognitive_load_actual: this.getCognitiveLoadActual(workflowId),
        autonomous_routing_usage: this.getAutonomousRoutingUsage(workflowId),
        execution_strategy: workflow.execution_strategy
      };

      // Record completion in workflow memory
      await this.workflowMemory.recordWorkflowCompletion(completionData);

      // Clean up monitoring
      this.cleanupWorkflowMonitoring(workflowId);

      console.log(`Processed completion for workflow ${workflowId} - learning data recorded`);

    } catch (error) {
      console.error('Error processing workflow completion:', error);
    }
  }

  /**
   * Record autonomous routing decision
   */
  recordAutonomousDecision(workflowId, decision) {
    this.autonomousDecisionLog.push({
      workflow_id: workflowId,
      timestamp: new Date().toISOString(),
      decision: decision
    });

    // Keep only recent decisions
    if (this.autonomousDecisionLog.length > 100) {
      this.autonomousDecisionLog = this.autonomousDecisionLog.slice(-100);
    }
  }

  /**
   * Get autonomous decision count for workflow
   */
  getAutonomousDecisionCount(workflowId) {
    return this.autonomousDecisionLog.filter(log => log.workflow_id === workflowId).length;
  }

  /**
   * Get cognitive optimization count for workflow
   */
  getCognitiveOptimizationCount(workflowId) {
    const monitoring = this.cognitiveMonitoring.get(workflowId);
    return monitoring ? (monitoring.capacity_checks?.length || 0) + (monitoring.break_recommendations?.length || 0) : 0;
  }

  /**
   * Get cognitive load actual data for workflow
   */
  getCognitiveLoadActual(workflowId) {
    const monitoring = this.cognitiveMonitoring.get(workflowId);
    return monitoring?.capacity_checks || [];
  }

  /**
   * Get autonomous routing usage for workflow
   */
  getAutonomousRoutingUsage(workflowId) {
    const autonomousDecisions = this.getAutonomousDecisionCount(workflowId);
    const workflow = this.activeWorkflows.get(workflowId);
    const totalSteps = workflow?.steps?.length || 1;
    
    return autonomousDecisions / totalSteps;
  }

  /**
   * Cleanup workflow monitoring resources
   */
  cleanupWorkflowMonitoring(workflowId) {
    const monitoring = this.cognitiveMonitoring.get(workflowId);
    if (monitoring) {
      if (monitoring.capacity_check_interval) {
        clearInterval(monitoring.capacity_check_interval);
      }
      if (monitoring.break_check_interval) {
        clearInterval(monitoring.break_check_interval);
      }
      this.cognitiveMonitoring.delete(workflowId);
    }
    
    this.activeWorkflows.delete(workflowId);
  }

  /**
   * Get fallback suggestions when prediction components are unavailable
   */
  getFallbackSuggestions(taskInput, projectContext) {
    return {
      success: true,
      task_input: taskInput,
      project_context: projectContext,
      suggestions: [{
        workflow_id: `fallback_${Date.now()}`,
        name: `Default ${projectContext} Workflow`,
        project_context: projectContext,
        completion_probability: 0.7,
        total_estimated_duration: 90,
        steps: [
          {
            phase: 'Planning',
            task_type: 'planning',
            estimated_duration: 20,
            cognitive_load: 'medium',
            confidence: 0.7
          },
          {
            phase: 'Implementation',
            task_type: 'implementation',
            estimated_duration: 50,
            cognitive_load: 'high',
            confidence: 0.7
          },
          {
            phase: 'Review',
            task_type: 'review',
            estimated_duration: 20,
            cognitive_load: 'medium',
            confidence: 0.7
          }
        ],
        source: 'fallback_engine',
        enhanced_with_cognitive: false
      }],
      fallback: true,
      components_used: this.components_ready,
      learning_available: false
    };
  }

  /**
   * Get default cognitive context
   */
  getDefaultCognitiveContext() {
    return {
      current_capacity: {
        predicted_capacity: 0.7,
        confidence: 0.5,
        recommendations: []
      },
      hyperfocus_prediction: {
        next_hyperfocus_window: null,
        confidence: 0.5
      },
      adhd_accommodations_active: false,
      break_preferences: {
        micro_break_interval: 25,
        active_break_interval: 90
      },
      context_switching_analysis: {
        recent_switches: 1,
        switching_cost: 0.1,
        severity: 'minimal'
      }
    };
  }

  /**
   * Get engine status and statistics
   */
  getEngineStatus() {
    return {
      initialized: this.initialized,
      components_ready: this.components_ready,
      configuration: this.config,
      active_workflows: this.activeWorkflows.size,
      cognitive_monitoring_active: this.cognitiveMonitoring.size,
      autonomous_decisions_logged: this.autonomousDecisionLog.length,
      uptime: process.uptime()
    };
  }

  /**
   * Close the predictive workflow engine
   */
  async close() {
    try {
      // Clear all monitoring intervals
      for (const [workflowId] of this.cognitiveMonitoring) {
        this.cleanupWorkflowMonitoring(workflowId);
      }

      // Close all components
      await Promise.all([
        this.taskPredictor.close(),
        this.cognitivePredictor.close(),
        this.workflowOrchestrator.close(),
        this.autonomousRouter.close(),
        this.workflowMemory.close()
      ]);

      this.initialized = false;
      console.log('PredictiveWorkflowEngine closed');

    } catch (error) {
      console.error('Error closing PredictiveWorkflowEngine:', error);
    }
  }
}

module.exports = PredictiveWorkflowEngine;

// #endregion end: Predictive Workflow Engine