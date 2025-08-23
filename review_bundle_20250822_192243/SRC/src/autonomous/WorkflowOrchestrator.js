// #region start: Workflow Orchestrator for The Steward
// Coordinates multi-step task sequences with cognitive load management
// Manages task dependencies, progress tracking, and workflow optimization

const TaskSequencePredictor = require('../workflows/TaskSequencePredictor');
const CognitiveLoadPredictor = require('../workflows/CognitiveLoadPredictor');
const HighConfidenceRouter = require('./HighConfidenceRouter');
const { makeRoutingDecision } = require('../core/routing-engine');

/**
 * WorkflowOrchestrator - Coordinates complex multi-step workflows
 * 
 * Key Features:
 * - Coordinate multi-step task sequences with dependencies
 * - Handle task prerequisites and optimal ordering
 * - Manage cognitive load across workflow steps
 * - Provide workflow progress tracking and adjustment
 * - Enable workflow templates based on project patterns
 * - Integrate autonomous routing for workflow efficiency
 */
class WorkflowOrchestrator {
  constructor(options = {}) {
    this.taskPredictor = new TaskSequencePredictor(options);
    this.cognitivePredictor = new CognitiveLoadPredictor(options);
    this.autonomousRouter = new HighConfidenceRouter(options);
    
    this.activeWorkflows = new Map();
    this.workflowTemplates = new Map();
    this.workflowHistory = [];
    
    // Workflow execution configuration
    this.executionConfig = {
      max_concurrent_workflows: 3,
      default_step_timeout: 120, // minutes
      cognitive_load_threshold: 0.8,
      auto_break_duration: 15, // minutes
      context_switch_buffer: 5, // minutes
      enable_adaptive_scheduling: true
    };

    // Workflow states
    this.workflowStates = {
      CREATED: 'created',
      SCHEDULED: 'scheduled', 
      IN_PROGRESS: 'in_progress',
      PAUSED: 'paused',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled',
      FAILED: 'failed'
    };

    // Step execution strategies
    this.executionStrategies = {
      sequential: 'Execute steps one after another',
      parallel: 'Execute compatible steps simultaneously', 
      adaptive: 'Dynamically adjust based on cognitive load',
      user_paced: 'Wait for user confirmation between steps'
    };
  }

  /**
   * Initialize workflow orchestrator
   */
  async initialize() {
    try {
      await this.taskPredictor.initialize();
      await this.cognitivePredictor.initialize();
      await this.autonomousRouter.initialize();
      
      await this.loadWorkflowTemplates();
      
      console.log('WorkflowOrchestrator initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize WorkflowOrchestrator:', error);
      return false;
    }
  }

  /**
   * Load workflow templates from historical patterns
   */
  async loadWorkflowTemplates() {
    // Load common workflow patterns
    const templates = {
      'steward-development': {
        name: 'Steward Development Workflow',
        steps: [
          { task: 'planning', duration: 30, dependencies: [], cognitive_load: 'medium' },
          { task: 'implementation', duration: 90, dependencies: ['planning'], cognitive_load: 'high' },
          { task: 'testing', duration: 45, dependencies: ['implementation'], cognitive_load: 'medium' },
          { task: 'documentation', duration: 60, dependencies: ['testing'], cognitive_load: 'low' }
        ],
        success_rate: 0.85,
        average_duration: 225
      },
      'creative-writing': {
        name: 'Creative Writing Workflow',
        steps: [
          { task: 'research', duration: 40, dependencies: [], cognitive_load: 'medium' },
          { task: 'planning', duration: 20, dependencies: ['research'], cognitive_load: 'low' },
          { task: 'implementation', duration: 120, dependencies: ['planning'], cognitive_load: 'high' },
          { task: 'review', duration: 30, dependencies: ['implementation'], cognitive_load: 'medium' }
        ],
        success_rate: 0.78,
        average_duration: 210
      }
    };

    for (const [key, template] of Object.entries(templates)) {
      this.workflowTemplates.set(key, template);
    }

    console.log(`Loaded ${this.workflowTemplates.size} workflow templates`);
  }

  /**
   * Create a new workflow from task input
   */
  async createWorkflow(taskInput, projectContext, characterSheet, options = {}) {
    try {
      const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Generate workflow suggestion using task predictor
      const workflowSuggestion = await this.taskPredictor.generateWorkflowSuggestion(
        projectContext,
        options.currentProgress || []
      );

      // Enhance with cognitive load predictions
      const enhancedSteps = await this.enhanceStepsWithCognitivePredictions(
        workflowSuggestion.steps,
        characterSheet
      );

      // Create workflow object
      const workflow = {
        id: workflowId,
        name: options.name || `${projectContext} Workflow`,
        project_context: projectContext,
        original_task: taskInput,
        state: this.workflowStates.CREATED,
        execution_strategy: options.executionStrategy || 'adaptive',
        
        // Steps and scheduling
        steps: enhancedSteps,
        current_step: 0,
        completed_steps: [],
        failed_steps: [],
        
        // Timing and progress
        created_at: new Date().toISOString(),
        estimated_duration: workflowSuggestion.total_estimated_duration,
        actual_start_time: null,
        actual_end_time: null,
        
        // Cognitive management
        cognitive_load_distribution: workflowSuggestion.cognitive_load_distribution,
        scheduled_breaks: [],
        cognitive_capacity_requirements: this.calculateCapacityRequirements(enhancedSteps),
        
        // Metadata
        completion_probability: workflowSuggestion.completion_probability,
        user_preferences: options.userPreferences || {},
        autonomous_routing_enabled: options.autonomousRouting !== false,
        
        // Progress tracking
        progress_percentage: 0,
        milestones: this.identifyMilestones(enhancedSteps),
        success_metrics: this.defineSuccessMetrics(enhancedSteps)
      };

      // Store workflow
      this.activeWorkflows.set(workflowId, workflow);

      console.log(`Created workflow ${workflowId} with ${workflow.steps.length} steps`);
      
      return {
        success: true,
        workflow_id: workflowId,
        workflow: workflow,
        next_action: 'schedule_workflow'
      };

    } catch (error) {
      console.error('Error creating workflow:', error);
      return {
        success: false,
        error: error.message,
        fallback: 'Create workflow manually'
      };
    }
  }

  /**
   * Enhance workflow steps with cognitive load predictions
   */
  async enhanceStepsWithCognitivePredictions(steps, characterSheet) {
    const enhancedSteps = [];
    let currentTime = new Date();

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      // Predict cognitive capacity for this step
      const capacityPrediction = this.cognitivePredictor.predictCognitiveCapacity(
        currentTime,
        step.cognitive_load,
        { step_index: i, total_steps: steps.length }
      );

      // Find optimal timing window
      const optimalWindow = this.cognitivePredictor.findOptimalTimeWindow(
        currentTime,
        step.cognitive_load
      );

      const enhancedStep = {
        ...step,
        step_index: i,
        cognitive_prediction: capacityPrediction,
        optimal_timing_windows: optimalWindow,
        scheduled_start: optimalWindow[0]?.start_time || currentTime.toISOString(),
        capacity_match: capacityPrediction.predicted_capacity,
        break_recommended: this.shouldRecommendBreak(step, i, steps),
        autonomous_routing_eligible: await this.checkAutonomousEligibility(step, characterSheet)
      };

      enhancedSteps.push(enhancedStep);
      
      // Update current time for next step scheduling
      currentTime = new Date(new Date(enhancedStep.scheduled_start).getTime() + 
                           (step.estimated_duration * 60 * 1000));
    }

    return enhancedSteps;
  }

  /**
   * Check if step is eligible for autonomous routing
   */
  async checkAutonomousEligibility(step, characterSheet) {
    // Simple heuristic - could be enhanced with actual pattern matching
    return step.cognitive_load === 'low' && 
           step.confidence > 0.8 &&
           characterSheet.autonomous_routing?.enable_autopilot;
  }

  /**
   * Schedule workflow execution
   */
  async scheduleWorkflow(workflowId, schedulingOptions = {}) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    try {
      // Update workflow state
      workflow.state = this.workflowStates.SCHEDULED;
      workflow.scheduling_options = schedulingOptions;

      // Generate execution schedule
      const executionSchedule = await this.generateExecutionSchedule(workflow, schedulingOptions);
      workflow.execution_schedule = executionSchedule;

      // Schedule breaks if needed
      if (this.executionConfig.enable_adaptive_scheduling) {
        workflow.scheduled_breaks = this.scheduleAdaptiveBreaks(workflow);
      }

      console.log(`Scheduled workflow ${workflowId} for execution`);
      
      return {
        success: true,
        workflow_id: workflowId,
        scheduled_start: executionSchedule.start_time,
        estimated_completion: executionSchedule.end_time,
        scheduled_breaks: workflow.scheduled_breaks.length
      };

    } catch (error) {
      console.error('Error scheduling workflow:', error);
      workflow.state = this.workflowStates.CREATED; // Reset state
      throw error;
    }
  }

  /**
   * Generate execution schedule for workflow
   */
  async generateExecutionSchedule(workflow, options) {
    const startTime = new Date(options.startTime || Date.now());
    let currentTime = new Date(startTime);
    
    const schedule = {
      workflow_id: workflow.id,
      start_time: startTime.toISOString(),
      steps: [],
      total_duration: 0,
      cognitive_load_peaks: [],
      break_intervals: []
    };

    for (const step of workflow.steps) {
      // Account for context switching buffer
      if (schedule.steps.length > 0) {
        currentTime = new Date(currentTime.getTime() + 
                              (this.executionConfig.context_switch_buffer * 60 * 1000));
      }

      const stepSchedule = {
        step_index: step.step_index,
        scheduled_start: currentTime.toISOString(),
        scheduled_end: new Date(currentTime.getTime() + 
                               (step.estimated_duration * 60 * 1000)).toISOString(),
        cognitive_load: step.cognitive_load,
        capacity_required: step.capacity_match,
        break_after: step.break_recommended
      };

      schedule.steps.push(stepSchedule);
      schedule.total_duration += step.estimated_duration;

      // Track cognitive load peaks
      if (step.cognitive_load === 'high') {
        schedule.cognitive_load_peaks.push({
          step_index: step.step_index,
          start_time: stepSchedule.scheduled_start,
          duration: step.estimated_duration
        });
      }

      // Add break after high cognitive load steps
      if (step.break_recommended) {
        currentTime = new Date(new Date(stepSchedule.scheduled_end).getTime() + 
                              (this.executionConfig.auto_break_duration * 60 * 1000));
        
        schedule.break_intervals.push({
          after_step: step.step_index,
          break_start: stepSchedule.scheduled_end,
          break_end: currentTime.toISOString(),
          break_duration: this.executionConfig.auto_break_duration
        });
      } else {
        currentTime = new Date(stepSchedule.scheduled_end);
      }
    }

    schedule.end_time = currentTime.toISOString();
    return schedule;
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(workflowId, executionOptions = {}) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    if (workflow.state !== this.workflowStates.SCHEDULED) {
      throw new Error(`Workflow ${workflowId} is not scheduled for execution`);
    }

    try {
      workflow.state = this.workflowStates.IN_PROGRESS;
      workflow.actual_start_time = new Date().toISOString();
      workflow.execution_log = [];

      console.log(`Starting execution of workflow ${workflowId}`);

      // Execute based on strategy
      const result = await this.executeWorkflowStrategy(workflow, executionOptions);
      
      return result;

    } catch (error) {
      workflow.state = this.workflowStates.FAILED;
      workflow.error = error.message;
      console.error(`Workflow ${workflowId} execution failed:`, error);
      throw error;
    }
  }

  /**
   * Execute workflow based on chosen strategy
   */
  async executeWorkflowStrategy(workflow, options) {
    switch (workflow.execution_strategy) {
      case 'sequential':
        return await this.executeSequentialWorkflow(workflow, options);
      case 'parallel':
        return await this.executeParallelWorkflow(workflow, options);
      case 'adaptive':
        return await this.executeAdaptiveWorkflow(workflow, options);
      case 'user_paced':
        return await this.executeUserPacedWorkflow(workflow, options);
      default:
        return await this.executeAdaptiveWorkflow(workflow, options);
    }
  }

  /**
   * Execute workflow sequentially
   */
  async executeSequentialWorkflow(workflow, options) {
    const results = [];

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      
      try {
        // Check if step prerequisites are met
        if (!this.arePrerequisitesMet(step, workflow.completed_steps)) {
          throw new Error(`Prerequisites not met for step ${i}`);
        }

        // Execute step
        const stepResult = await this.executeWorkflowStep(step, workflow, options);
        results.push(stepResult);

        // Update workflow progress
        workflow.completed_steps.push(i);
        workflow.current_step = i + 1;
        workflow.progress_percentage = ((i + 1) / workflow.steps.length) * 100;

        // Log execution
        this.logWorkflowStepExecution(workflow.id, step, stepResult);

        // Check if break is needed
        if (step.break_recommended && i < workflow.steps.length - 1) {
          await this.scheduleAdaptiveBreak(workflow, step);
        }

      } catch (error) {
        workflow.failed_steps.push({ step_index: i, error: error.message });
        
        // Decide whether to continue or fail
        if (options.stopOnFailure !== false) {
          throw error;
        }
      }
    }

    return this.completeWorkflow(workflow, results);
  }

  /**
   * Execute workflow with adaptive scheduling
   */
  async executeAdaptiveWorkflow(workflow, options) {
    const results = [];
    
    // Monitor cognitive load and adapt execution
    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      
      // Check current cognitive capacity
      const currentCapacity = this.cognitivePredictor.predictCognitiveCapacity(
        new Date(),
        step.cognitive_load
      );

      // If capacity is too low, suggest rescheduling or break
      if (currentCapacity.predicted_capacity < 0.4 && step.cognitive_load === 'high') {
        const suggestion = await this.suggestAdaptiveAction(step, currentCapacity, workflow);
        
        if (suggestion.action === 'reschedule') {
          workflow.state = this.workflowStates.PAUSED;
          return {
            success: false,
            action: 'reschedule',
            reason: suggestion.reason,
            suggested_time: suggestion.suggested_time,
            completed_steps: workflow.completed_steps.length
          };
        }
      }

      // Execute step with cognitive monitoring
      try {
        const stepResult = await this.executeWorkflowStep(step, workflow, {
          ...options,
          cognitive_monitoring: true,
          adaptive_execution: true
        });
        
        results.push(stepResult);
        workflow.completed_steps.push(i);
        workflow.current_step = i + 1;
        workflow.progress_percentage = ((i + 1) / workflow.steps.length) * 100;

      } catch (error) {
        workflow.failed_steps.push({ step_index: i, error: error.message });
        
        // Adaptive error handling
        const recovery = await this.attemptStepRecovery(step, error, workflow);
        if (!recovery.success) {
          throw error;
        }
      }
    }

    return this.completeWorkflow(workflow, results);
  }

  /**
   * Execute individual workflow step
   */
  async executeWorkflowStep(step, workflow, options = {}) {
    const stepStartTime = Date.now();
    
    try {
      // Generate step-specific task description
      const stepTask = this.generateStepTask(step, workflow);
      
      // Attempt autonomous routing if enabled
      let routingResult;
      if (step.autonomous_routing_eligible && workflow.autonomous_routing_enabled) {
        const autonomousResult = await this.autonomousRouter.attemptAutonomousRouting(
          stepTask,
          workflow.user_preferences,
          { step_context: step, workflow_context: workflow }
        );
        
        if (autonomousResult.autonomous) {
          routingResult = autonomousResult.decision;
        } else {
          // Fall back to standard routing
          routingResult = await makeRoutingDecision(
            stepTask,
            workflow.user_preferences,
            { step_context: step, workflow_context: workflow }
          );
        }
      } else {
        // Standard routing
        routingResult = await makeRoutingDecision(
          stepTask,
          workflow.user_preferences,
          { step_context: step, workflow_context: workflow }
        );
      }

      const executionTime = Date.now() - stepStartTime;

      return {
        step_index: step.step_index,
        success: true,
        routing_decision: routingResult,
        execution_time: executionTime,
        start_time: new Date(stepStartTime).toISOString(),
        end_time: new Date().toISOString(),
        autonomous_routing: step.autonomous_routing_eligible && 
                           workflow.autonomous_routing_enabled &&
                           routingResult.autonomous
      };

    } catch (error) {
      return {
        step_index: step.step_index,
        success: false,
        error: error.message,
        execution_time: Date.now() - stepStartTime
      };
    }
  }

  /**
   * Generate task description for workflow step
   */
  generateStepTask(step, workflow) {
    const stepDescriptions = {
      planning: `Plan the ${workflow.project_context} project: ${workflow.original_task}`,
      implementation: `Implement the planned solution for: ${workflow.original_task}`, 
      testing: `Test and verify the implementation for: ${workflow.original_task}`,
      documentation: `Document the completed work for: ${workflow.original_task}`,
      research: `Research background information for: ${workflow.original_task}`,
      review: `Review and optimize the work done on: ${workflow.original_task}`
    };

    return stepDescriptions[step.task_type] || 
           `Complete ${step.task_type} step for: ${workflow.original_task}`;
  }

  /**
   * Check if step prerequisites are met
   */
  arePrerequisitesMet(step, completedSteps) {
    if (!step.dependencies || step.dependencies.length === 0) {
      return true;
    }

    // Check if all dependency step indices are completed
    return step.dependencies.every(dep => completedSteps.includes(dep));
  }

  /**
   * Complete workflow execution
   */
  completeWorkflow(workflow, stepResults) {
    workflow.state = this.workflowStates.COMPLETED;
    workflow.actual_end_time = new Date().toISOString();
    workflow.step_results = stepResults;
    workflow.success_rate = stepResults.filter(r => r.success).length / stepResults.length;

    // Calculate actual vs estimated duration
    const actualDuration = (new Date(workflow.actual_end_time).getTime() - 
                           new Date(workflow.actual_start_time).getTime()) / (1000 * 60);
    workflow.actual_duration = actualDuration;
    workflow.duration_variance = actualDuration - workflow.estimated_duration;

    // Record workflow completion for learning
    this.recordWorkflowCompletion(workflow);

    console.log(`Workflow ${workflow.id} completed with ${Math.round(workflow.success_rate * 100)}% success rate`);

    return {
      success: true,
      workflow_id: workflow.id,
      completion_time: workflow.actual_end_time,
      success_rate: workflow.success_rate,
      duration: actualDuration,
      steps_completed: workflow.completed_steps.length,
      steps_failed: workflow.failed_steps.length
    };
  }

  /**
   * Calculate capacity requirements for steps
   */
  calculateCapacityRequirements(steps) {
    const requirements = {
      peak_load: Math.max(...steps.map(s => s.capacity_match || 0.5)),
      sustained_load: steps.reduce((sum, s) => sum + (s.capacity_match || 0.5), 0) / steps.length,
      high_load_duration: steps.filter(s => s.cognitive_load === 'high')
                               .reduce((sum, s) => sum + s.estimated_duration, 0),
      context_switches: this.countContextSwitches(steps)
    };

    return requirements;
  }

  /**
   * Count context switches between steps
   */
  countContextSwitches(steps) {
    let switches = 0;
    for (let i = 1; i < steps.length; i++) {
      if (steps[i].task_type !== steps[i-1].task_type) {
        switches++;
      }
    }
    return switches;
  }

  /**
   * Identify workflow milestones
   */
  identifyMilestones(steps) {
    const milestones = [];
    let currentPhase = null;
    
    steps.forEach((step, index) => {
      if (step.phase !== currentPhase) {
        milestones.push({
          step_index: index,
          phase: step.phase,
          description: `${step.phase} phase completed`
        });
        currentPhase = step.phase;
      }
    });

    return milestones;
  }

  /**
   * Define success metrics for workflow
   */
  defineSuccessMetrics(steps) {
    return {
      completion_rate_target: 0.9,
      time_efficiency_target: 1.1, // Allow 10% time variance
      cognitive_load_balance: 'balanced',
      autonomous_routing_rate: steps.filter(s => s.autonomous_routing_eligible).length / steps.length
    };
  }

  /**
   * Should recommend break after step
   */
  shouldRecommendBreak(step, stepIndex, allSteps) {
    // Recommend break after high cognitive load tasks
    if (step.cognitive_load === 'high') return true;
    
    // Recommend break after every 2 hours of work
    const cumulativeDuration = allSteps.slice(0, stepIndex + 1)
                                      .reduce((sum, s) => sum + s.estimated_duration, 0);
    if (cumulativeDuration >= 120) return true;
    
    // Recommend break before context switch to high cognitive load
    const nextStep = allSteps[stepIndex + 1];
    if (nextStep && nextStep.cognitive_load === 'high' && step.cognitive_load !== 'high') {
      return true;
    }
    
    return false;
  }

  /**
   * Record workflow completion for future learning
   */
  recordWorkflowCompletion(workflow) {
    const completionRecord = {
      workflow_id: workflow.id,
      project_context: workflow.project_context,
      completion_time: workflow.actual_end_time,
      success_rate: workflow.success_rate,
      actual_duration: workflow.actual_duration,
      estimated_duration: workflow.estimated_duration,
      steps_completed: workflow.completed_steps.length,
      autonomous_routing_usage: workflow.step_results?.filter(r => r.autonomous_routing).length || 0,
      recorded_at: new Date().toISOString()
    };

    this.workflowHistory.push(completionRecord);
    
    // Keep only last 100 workflow records
    if (this.workflowHistory.length > 100) {
      this.workflowHistory = this.workflowHistory.slice(-100);
    }
  }

  /**
   * Get workflow status
   */
  getWorkflowStatus(workflowId) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) {
      return { found: false };
    }

    return {
      found: true,
      workflow_id: workflowId,
      state: workflow.state,
      progress_percentage: workflow.progress_percentage,
      current_step: workflow.current_step,
      total_steps: workflow.steps.length,
      completed_steps: workflow.completed_steps.length,
      failed_steps: workflow.failed_steps.length,
      estimated_remaining: this.calculateRemainingTime(workflow),
      next_step: workflow.steps[workflow.current_step] || null
    };
  }

  /**
   * Calculate remaining time for workflow
   */
  calculateRemainingTime(workflow) {
    const remainingSteps = workflow.steps.slice(workflow.current_step);
    return remainingSteps.reduce((sum, step) => sum + step.estimated_duration, 0);
  }

  /**
   * Get active workflows summary
   */
  getActiveWorkflows() {
    const active = Array.from(this.activeWorkflows.values());
    
    return {
      total_active: active.length,
      by_state: this.groupWorkflowsByState(active),
      by_project: this.groupWorkflowsByProject(active),
      execution_statistics: this.getExecutionStatistics()
    };
  }

  /**
   * Group workflows by state
   */
  groupWorkflowsByState(workflows) {
    const byState = {};
    for (const state of Object.values(this.workflowStates)) {
      byState[state] = workflows.filter(w => w.state === state).length;
    }
    return byState;
  }

  /**
   * Group workflows by project
   */
  groupWorkflowsByProject(workflows) {
    const byProject = {};
    workflows.forEach(workflow => {
      const project = workflow.project_context;
      byProject[project] = (byProject[project] || 0) + 1;
    });
    return byProject;
  }

  /**
   * Get execution statistics
   */
  getExecutionStatistics() {
    const completed = this.workflowHistory.slice(-20); // Last 20 completed workflows
    
    if (completed.length === 0) {
      return { no_data: true };
    }

    return {
      average_success_rate: completed.reduce((sum, w) => sum + w.success_rate, 0) / completed.length,
      average_duration_variance: completed.reduce((sum, w) => 
        sum + Math.abs(w.actual_duration - w.estimated_duration), 0) / completed.length,
      autonomous_routing_adoption: completed.reduce((sum, w) => 
        sum + (w.autonomous_routing_usage / (w.steps_completed || 1)), 0) / completed.length,
      total_workflows_completed: this.workflowHistory.length
    };
  }

  /**
   * Close orchestrator and cleanup
   */
  async close() {
    await this.taskPredictor.close();
    await this.cognitivePredictor.close();
    await this.autonomousRouter.close();
  }
}

module.exports = WorkflowOrchestrator;

// #endregion end: Workflow Orchestrator