// #region start: Automation Engine for The Steward
// Executes automation rules and manages workflow automation triggers
// Coordinates with ambient intelligence system for seamless workflow execution

const EventEmitter = require('events');

/**
 * AutomationEngine - Manages and executes automation rules for ambient intelligence
 * 
 * Key Features:
 * - Execute automation rules based on triggers and conditions
 * - Monitor system events and trigger appropriate automations
 * - Manage automation rule dependencies and conflict resolution
 * - Track automation performance and learning
 * - Integration with ambient intelligence orchestrator
 * - Real-time automation monitoring and control
 */
class AutomationEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      max_concurrent_automations: options.maxConcurrentAutomations || 5,
      automation_timeout: options.automationTimeout || 30000, // 30 seconds
      retry_failed_automations: options.retryFailedAutomations !== false,
      max_retries: options.maxRetries || 3,
      retry_delay: options.retryDelay || 5000, // 5 seconds
      enable_learning: options.enableLearning !== false,
      performance_tracking: options.performanceTracking !== false,
      conflict_resolution: options.conflictResolution || 'priority_based' // priority_based, timestamp_based, cancel_duplicate
    };

    // State management
    this.isRunning = false;
    this.activeAutomations = new Map();
    this.automationQueue = [];
    this.triggerListeners = new Map();
    this.performanceStats = new Map();
    
    // Dependencies
    this.templateManager = null;
    this.ambientOrchestrator = null;
    this.contextBridge = null;
    
    // Automation execution history
    this.executionHistory = [];
    this.maxHistoryLength = options.maxHistoryLength || 1000;
    
    // Built-in trigger types
    this.supportedTriggers = {
      steward_session_begins: {
        description: 'Triggered when a Steward session starts',
        data_format: { session_id: 'string', project_context: 'string', duration_estimate: 'number' }
      },
      steward_session_ends: {
        description: 'Triggered when a Steward session ends',
        data_format: { session_id: 'string', duration: 'number', success: 'boolean', content_generated: 'boolean' }
      },
      predictive_workflow_generated: {
        description: 'Triggered when a predictive workflow is created',
        data_format: { workflow_id: 'string', confidence: 'number', steps: 'array', project_context: 'string' }
      },
      project_context_switch: {
        description: 'Triggered when project context changes',
        data_format: { old_context: 'string', new_context: 'string', confidence: 'number', source: 'string' }
      },
      task_completed: {
        description: 'Triggered when a task is completed',
        data_format: { task_id: 'string', project_context: 'string', completion_time: 'string' }
      },
      milestone_reached: {
        description: 'Triggered when a project milestone is reached',
        data_format: { milestone_id: 'string', project_context: 'string', progress: 'number' }
      },
      error_detected: {
        description: 'Triggered when an error is detected in the system',
        data_format: { error_type: 'string', severity: 'string', context: 'object' }
      },
      user_feedback_received: {
        description: 'Triggered when user provides feedback',
        data_format: { feedback_type: 'string', rating: 'number', context: 'string' }
      }
    };

    console.log('AutomationEngine initialized with config:', this.config);
  }

  /**
   * Initialize the automation engine
   */
  async initialize(dependencies = {}) {
    try {
      // Store dependencies
      this.templateManager = dependencies.templateManager;
      this.ambientOrchestrator = dependencies.ambientOrchestrator;
      this.contextBridge = dependencies.contextBridge;

      if (!this.templateManager) {
        console.warn('AutomationEngine: No template manager provided - template-based automations will be limited');
      }

      // Start the automation engine
      this.startEngine();
      
      // Set up built-in trigger listeners
      this.setupBuiltInTriggers();
      
      console.log('AutomationEngine initialized and started');
      return true;

    } catch (error) {
      console.error('Failed to initialize AutomationEngine:', error);
      return false;
    }
  }

  /**
   * Start the automation engine
   */
  startEngine() {
    if (this.isRunning) return;

    this.isRunning = true;
    
    // Start the automation queue processor
    this.startQueueProcessor();
    
    // Start performance monitoring
    if (this.config.performance_tracking) {
      this.startPerformanceMonitoring();
    }

    this.emit('engine_started');
    console.log('Automation engine started');
  }

  /**
   * Stop the automation engine
   */
  stopEngine() {
    if (!this.isRunning) return;

    this.isRunning = false;
    
    // Clear intervals
    if (this.queueProcessorInterval) {
      clearInterval(this.queueProcessorInterval);
    }
    if (this.performanceMonitoringInterval) {
      clearInterval(this.performanceMonitoringInterval);
    }

    // Cancel active automations
    this.activeAutomations.forEach((automation, id) => {
      this.cancelAutomation(id);
    });

    this.emit('engine_stopped');
    console.log('Automation engine stopped');
  }

  /**
   * Register a trigger event
   */
  registerTrigger(triggerType, triggerData = {}) {
    if (!this.isRunning) {
      console.warn(`Automation engine not running, ignoring trigger: ${triggerType}`);
      return;
    }

    try {
      // Validate trigger type
      if (!this.supportedTriggers[triggerType]) {
        console.warn(`Unknown trigger type: ${triggerType}`);
        return;
      }

      // Add timestamp and ID
      const enrichedTriggerData = {
        ...triggerData,
        trigger_type: triggerType,
        trigger_id: this.generateTriggerId(),
        timestamp: new Date().toISOString()
      };

      console.log(`Trigger registered: ${triggerType}`, enrichedTriggerData);

      // Find matching automation rules
      this.processTriggeredAutomations(triggerType, enrichedTriggerData);

      // Emit trigger event
      this.emit('trigger_registered', {
        trigger_type: triggerType,
        trigger_data: enrichedTriggerData
      });

    } catch (error) {
      console.error('Error registering trigger:', error);
    }
  }

  /**
   * Process automations triggered by an event
   */
  async processTriggeredAutomations(triggerType, triggerData) {
    try {
      if (!this.templateManager) {
        console.warn('No template manager available for automation processing');
        return;
      }

      // Get automation rules that match this trigger
      const matchingRules = this.getMatchingAutomationRules(triggerType);
      
      if (matchingRules.length === 0) {
        console.log(`No automation rules found for trigger: ${triggerType}`);
        return;
      }

      console.log(`Found ${matchingRules.length} automation rules for trigger: ${triggerType}`);

      // Process each matching rule
      for (const rule of matchingRules) {
        await this.queueAutomationExecution(rule, triggerData);
      }

    } catch (error) {
      console.error('Error processing triggered automations:', error);
    }
  }

  /**
   * Get automation rules that match a trigger type
   */
  getMatchingAutomationRules(triggerType) {
    if (!this.templateManager || !this.templateManager.automationRules) {
      return [];
    }

    return Array.from(this.templateManager.automationRules.values())
      .filter(rule => rule.enabled && rule.trigger === triggerType);
  }

  /**
   * Queue an automation for execution
   */
  async queueAutomationExecution(rule, triggerData) {
    try {
      // Check for conflicts with existing automations
      const conflict = this.checkForAutomationConflicts(rule, triggerData);
      if (conflict) {
        console.log(`Automation conflict detected for rule: ${rule.name}`, conflict);
        await this.resolveAutomationConflict(rule, triggerData, conflict);
        return;
      }

      // Apply debounce if specified
      if (rule.debounce && rule.debounce > 0) {
        const existingDebounce = this.findExistingDebounce(rule.id);
        if (existingDebounce) {
          console.log(`Automation rule ${rule.name} is debounced, skipping`);
          return;
        }
        
        // Set debounce
        setTimeout(() => {
          this.executeAutomation(rule, triggerData);
        }, rule.debounce);
        
        return;
      }

      // Queue for immediate execution
      this.automationQueue.push({
        rule,
        trigger_data: triggerData,
        queued_at: Date.now(),
        attempts: 0
      });

      console.log(`Queued automation: ${rule.name}`);

    } catch (error) {
      console.error('Error queueing automation execution:', error);
    }
  }

  /**
   * Execute an automation rule
   */
  async executeAutomation(rule, triggerData) {
    const automationId = this.generateAutomationId();
    const startTime = Date.now();

    try {
      console.log(`Executing automation: ${rule.name} (${automationId})`);

      // Check if we're at max concurrent automations
      if (this.activeAutomations.size >= this.config.max_concurrent_automations) {
        console.warn(`Max concurrent automations reached (${this.config.max_concurrent_automations}), queueing automation`);
        this.automationQueue.push({
          rule,
          trigger_data: triggerData,
          queued_at: Date.now(),
          attempts: 0
        });
        return;
      }

      // Create automation execution context
      const automationContext = {
        id: automationId,
        rule,
        trigger_data: triggerData,
        start_time: startTime,
        status: 'executing',
        actions_completed: 0,
        actions_total: rule.actions.length
      };

      // Track active automation
      this.activeAutomations.set(automationId, automationContext);

      // Execute the automation through template manager
      const executionResult = await this.templateManager.executeAutomationRule(rule.id, triggerData);

      const executionTime = Date.now() - startTime;

      // Update automation context
      automationContext.status = executionResult.success ? 'completed' : 'failed';
      automationContext.execution_time = executionTime;
      automationContext.result = executionResult;

      // Record execution history
      this.recordExecutionHistory({
        automation_id: automationId,
        rule_id: rule.id,
        rule_name: rule.name,
        trigger_type: triggerData.trigger_type,
        success: executionResult.success,
        execution_time: executionTime,
        actions_executed: executionResult.actions_executed?.length || 0,
        timestamp: new Date().toISOString(),
        error: executionResult.error
      });

      // Update performance stats
      this.updatePerformanceStats(rule.id, {
        success: executionResult.success,
        execution_time: executionTime
      });

      // Remove from active automations
      this.activeAutomations.delete(automationId);

      // Emit completion event
      this.emit('automation_completed', {
        automation_id: automationId,
        rule: rule,
        success: executionResult.success,
        execution_time: executionTime
      });

      console.log(`Automation completed: ${rule.name} (${executionResult.success ? 'success' : 'failed'}) in ${executionTime}ms`);

      return executionResult;

    } catch (error) {
      console.error(`Error executing automation ${rule.name}:`, error);

      // Update automation context
      const automationContext = this.activeAutomations.get(automationId);
      if (automationContext) {
        automationContext.status = 'error';
        automationContext.error = error.message;
        automationContext.execution_time = Date.now() - startTime;
      }

      // Record failed execution
      this.recordExecutionHistory({
        automation_id: automationId,
        rule_id: rule.id,
        rule_name: rule.name,
        trigger_type: triggerData.trigger_type,
        success: false,
        execution_time: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error.message
      });

      // Remove from active automations
      this.activeAutomations.delete(automationId);

      // Emit error event
      this.emit('automation_error', {
        automation_id: automationId,
        rule: rule,
        error: error.message
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * Check for automation conflicts
   */
  checkForAutomationConflicts(rule, triggerData) {
    // Check if the same rule is already executing
    for (const [id, automation] of this.activeAutomations) {
      if (automation.rule.id === rule.id) {
        return {
          type: 'same_rule_executing',
          conflicting_automation: id,
          message: `Rule ${rule.name} is already executing`
        };
      }
    }

    // Check for resource conflicts (e.g., same project context)
    if (triggerData.project_context) {
      for (const [id, automation] of this.activeAutomations) {
        if (automation.trigger_data.project_context === triggerData.project_context &&
            automation.rule.priority === rule.priority) {
          return {
            type: 'resource_conflict',
            conflicting_automation: id,
            resource: 'project_context',
            value: triggerData.project_context,
            message: `Conflicting automation for project context: ${triggerData.project_context}`
          };
        }
      }
    }

    return null;
  }

  /**
   * Resolve automation conflicts
   */
  async resolveAutomationConflict(rule, triggerData, conflict) {
    switch (this.config.conflict_resolution) {
      case 'priority_based':
        await this.resolvePriorityBasedConflict(rule, triggerData, conflict);
        break;
      case 'timestamp_based':
        await this.resolveTimestampBasedConflict(rule, triggerData, conflict);
        break;
      case 'cancel_duplicate':
        console.log(`Cancelling duplicate automation: ${rule.name}`);
        break;
      default:
        console.warn(`Unknown conflict resolution strategy: ${this.config.conflict_resolution}`);
    }
  }

  async resolvePriorityBasedConflict(rule, triggerData, conflict) {
    const conflictingAutomation = this.activeAutomations.get(conflict.conflicting_automation);
    if (!conflictingAutomation) return;

    const rulePriority = this.getPriorityValue(rule.priority);
    const conflictingPriority = this.getPriorityValue(conflictingAutomation.rule.priority);

    if (rulePriority > conflictingPriority) {
      console.log(`Cancelling lower priority automation: ${conflictingAutomation.rule.name}`);
      await this.cancelAutomation(conflict.conflicting_automation);
      
      // Queue the higher priority automation
      this.automationQueue.push({
        rule,
        trigger_data: triggerData,
        queued_at: Date.now(),
        attempts: 0
      });
    }
  }

  async resolveTimestampBasedConflict(rule, triggerData, conflict) {
    // In timestamp-based resolution, newer automations wait
    console.log(`Queueing automation due to timestamp-based conflict: ${rule.name}`);
    this.automationQueue.push({
      rule,
      trigger_data: triggerData,
      queued_at: Date.now(),
      attempts: 0
    });
  }

  /**
   * Cancel an active automation
   */
  async cancelAutomation(automationId) {
    const automation = this.activeAutomations.get(automationId);
    if (!automation) return;

    automation.status = 'cancelled';
    automation.cancelled_at = Date.now();

    // Remove from active automations
    this.activeAutomations.delete(automationId);

    this.emit('automation_cancelled', {
      automation_id: automationId,
      rule: automation.rule
    });

    console.log(`Automation cancelled: ${automation.rule.name}`);
  }

  /**
   * Start the automation queue processor
   */
  startQueueProcessor() {
    this.queueProcessorInterval = setInterval(() => {
      this.processAutomationQueue();
    }, 1000); // Process queue every second
  }

  /**
   * Process the automation queue
   */
  async processAutomationQueue() {
    if (this.automationQueue.length === 0) return;
    if (this.activeAutomations.size >= this.config.max_concurrent_automations) return;

    const queuedAutomation = this.automationQueue.shift();
    if (!queuedAutomation) return;

    const { rule, trigger_data, attempts } = queuedAutomation;

    // Check if automation has timed out in queue
    const queueTime = Date.now() - queuedAutomation.queued_at;
    if (queueTime > this.config.automation_timeout) {
      console.warn(`Automation timed out in queue: ${rule.name}`);
      return;
    }

    try {
      await this.executeAutomation(rule, trigger_data);
    } catch (error) {
      console.error(`Error processing queued automation ${rule.name}:`, error);
      
      // Retry if enabled and under retry limit
      if (this.config.retry_failed_automations && attempts < this.config.max_retries) {
        console.log(`Retrying automation ${rule.name} (attempt ${attempts + 1}/${this.config.max_retries})`);
        
        setTimeout(() => {
          this.automationQueue.push({
            ...queuedAutomation,
            attempts: attempts + 1
          });
        }, this.config.retry_delay);
      }
    }
  }

  /**
   * Set up built-in trigger listeners
   */
  setupBuiltInTriggers() {
    // Set up listeners for common system events
    this.on('steward_session_start', (data) => {
      this.registerTrigger('steward_session_begins', data);
    });

    this.on('steward_session_end', (data) => {
      this.registerTrigger('steward_session_ends', data);
    });

    this.on('workflow_generated', (data) => {
      this.registerTrigger('predictive_workflow_generated', data);
    });

    this.on('context_switch', (data) => {
      this.registerTrigger('project_context_switch', data);
    });

    console.log('Built-in trigger listeners set up');
  }

  /**
   * Start performance monitoring
   */
  startPerformanceMonitoring() {
    this.performanceMonitoringInterval = setInterval(() => {
      this.analyzeAutomationPerformance();
    }, 60000); // Every minute
  }

  /**
   * Analyze automation performance
   */
  analyzeAutomationPerformance() {
    // Analyze recent execution history for performance insights
    const recentExecutions = this.executionHistory.slice(-100); // Last 100 executions
    
    if (recentExecutions.length === 0) return;

    const performanceInsights = {
      total_executions: recentExecutions.length,
      success_rate: recentExecutions.filter(e => e.success).length / recentExecutions.length,
      average_execution_time: recentExecutions.reduce((sum, e) => sum + e.execution_time, 0) / recentExecutions.length,
      most_active_rules: this.getMostActiveRules(recentExecutions),
      performance_trends: this.analyzePerformanceTrends(recentExecutions)
    };

    this.emit('performance_analysis', performanceInsights);
  }

  getMostActiveRules(executions) {
    const ruleCounts = {};
    executions.forEach(execution => {
      ruleCounts[execution.rule_id] = (ruleCounts[execution.rule_id] || 0) + 1;
    });

    return Object.entries(ruleCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([ruleId, count]) => ({ rule_id: ruleId, execution_count: count }));
  }

  analyzePerformanceTrends(executions) {
    // Simple trend analysis - could be enhanced
    const firstHalf = executions.slice(0, Math.floor(executions.length / 2));
    const secondHalf = executions.slice(Math.floor(executions.length / 2));

    const firstHalfSuccessRate = firstHalf.filter(e => e.success).length / firstHalf.length;
    const secondHalfSuccessRate = secondHalf.filter(e => e.success).length / secondHalf.length;

    return {
      success_rate_trend: secondHalfSuccessRate > firstHalfSuccessRate ? 'improving' : 
                         secondHalfSuccessRate < firstHalfSuccessRate ? 'declining' : 'stable',
      success_rate_change: secondHalfSuccessRate - firstHalfSuccessRate
    };
  }

  // Utility methods

  generateTriggerId() {
    return `trigger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateAutomationId() {
    return `automation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  findExistingDebounce(ruleId) {
    // Simple implementation - could be enhanced with proper debounce tracking
    return false;
  }

  getPriorityValue(priority) {
    const priorityMap = { low: 1, medium: 2, high: 3, critical: 4 };
    return priorityMap[priority] || 2;
  }

  recordExecutionHistory(execution) {
    this.executionHistory.push(execution);
    
    // Maintain history length limit
    if (this.executionHistory.length > this.maxHistoryLength) {
      this.executionHistory = this.executionHistory.slice(-this.maxHistoryLength);
    }
  }

  updatePerformanceStats(ruleId, stats) {
    if (!this.performanceStats.has(ruleId)) {
      this.performanceStats.set(ruleId, {
        total_executions: 0,
        successful_executions: 0,
        total_execution_time: 0,
        average_execution_time: 0,
        last_updated: new Date().toISOString()
      });
    }

    const ruleStats = this.performanceStats.get(ruleId);
    ruleStats.total_executions++;
    if (stats.success) ruleStats.successful_executions++;
    ruleStats.total_execution_time += stats.execution_time;
    ruleStats.average_execution_time = ruleStats.total_execution_time / ruleStats.total_executions;
    ruleStats.last_updated = new Date().toISOString();
  }

  /**
   * Get automation engine status
   */
  getStatus() {
    return {
      running: this.isRunning,
      active_automations: this.activeAutomations.size,
      queued_automations: this.automationQueue.length,
      supported_triggers: Object.keys(this.supportedTriggers),
      execution_history_length: this.executionHistory.length,
      performance_stats_count: this.performanceStats.size,
      configuration: this.config
    };
  }

  /**
   * Get automation analytics
   */
  getAnalytics() {
    const recentExecutions = this.executionHistory.slice(-100);
    
    return {
      recent_executions: recentExecutions.length,
      overall_success_rate: recentExecutions.length > 0 ? 
        recentExecutions.filter(e => e.success).length / recentExecutions.length : 0,
      average_execution_time: recentExecutions.length > 0 ?
        recentExecutions.reduce((sum, e) => sum + e.execution_time, 0) / recentExecutions.length : 0,
      most_triggered: this.getMostTriggeredTypes(recentExecutions),
      performance_by_rule: this.getPerformanceByRule(),
      active_automations: this.activeAutomations.size,
      queue_length: this.automationQueue.length
    };
  }

  getMostTriggeredTypes(executions) {
    const triggerCounts = {};
    executions.forEach(execution => {
      const trigger = execution.trigger_type;
      triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
    });

    return Object.entries(triggerCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([trigger, count]) => ({ trigger_type: trigger, count }));
  }

  getPerformanceByRule() {
    const performanceData = {};
    this.performanceStats.forEach((stats, ruleId) => {
      performanceData[ruleId] = {
        success_rate: stats.successful_executions / stats.total_executions,
        average_execution_time: stats.average_execution_time,
        total_executions: stats.total_executions
      };
    });
    return performanceData;
  }

  /**
   * Close automation engine
   */
  async close() {
    this.stopEngine();
    this.removeAllListeners();
    this.activeAutomations.clear();
    this.automationQueue = [];
    this.executionHistory = [];
    this.performanceStats.clear();
    
    console.log('AutomationEngine closed');
  }
}

module.exports = AutomationEngine;

// #endregion end: Automation Engine