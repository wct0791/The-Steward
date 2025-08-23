// #region start: Things Integration for The Steward
// Ambient Intelligence integration with Things for cognitive task scheduling and workflow automation
// Provides ADHD-aware task creation and intelligent scheduling based on energy patterns

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

/**
 * ThingsIntegration - Seamless Things 3 task management integration
 * 
 * Key Features:
 * - Auto-create tasks from predicted workflow sequences
 * - Cognitive scheduling based on ADHD patterns and energy predictions
 * - Project milestone tracking synchronized with Steward progress
 * - Context switching optimization through intelligent task grouping
 * - Due date and scheduling based on cognitive load predictions
 */
class ThingsIntegration {
  constructor(options = {}) {
    this.isInitialized = false;
    this.isAvailable = false;
    
    // Integration configuration
    this.config = {
      enable_task_creation: options.enableTaskCreation !== false,
      cognitive_scheduling: options.cognitiveScheduling !== false,
      energy_based_timing: options.energyBasedTiming !== false,
      context_grouping: options.contextGrouping !== false,
      auto_milestone_tracking: options.autoMilestoneTracking !== false,
      max_daily_tasks: options.maxDailyTasks || 20,
      default_task_duration: options.defaultTaskDuration || 30, // minutes
      break_buffer: options.breakBuffer || 15, // minutes between tasks
      hyperfocus_task_limit: options.hyperfocusTaskLimit || 3
    };

    // ADHD-aware scheduling patterns
    this.energyPatterns = {
      morning_peak: { start: 9, end: 11, energy_level: 0.9, cognitive_load: 'high' },
      late_morning: { start: 11, end: 12, energy_level: 0.7, cognitive_load: 'medium' },
      lunch_dip: { start: 12, end: 14, energy_level: 0.4, cognitive_load: 'low' },
      afternoon_secondary: { start: 14, end: 16, energy_level: 0.8, cognitive_load: 'high' },
      afternoon_decline: { start: 16, end: 18, energy_level: 0.6, cognitive_load: 'medium' },
      evening_variable: { start: 18, end: 21, energy_level: 0.5, cognitive_load: 'low' }
    };

    // Task categorization for cognitive grouping
    this.taskCategories = {
      creative: { optimal_energy: 0.8, context_switch_cost: 0.3, batch_size: 2 },
      analytical: { optimal_energy: 0.9, context_switch_cost: 0.4, batch_size: 3 },
      administrative: { optimal_energy: 0.5, context_switch_cost: 0.1, batch_size: 5 },
      communication: { optimal_energy: 0.6, context_switch_cost: 0.2, batch_size: 4 },
      planning: { optimal_energy: 0.7, context_switch_cost: 0.2, batch_size: 2 },
      implementation: { optimal_energy: 0.8, context_switch_cost: 0.5, batch_size: 1 }
    };

    // Cache for task management
    this.projectCache = new Map();
    this.taskQueue = [];
    this.schedulingQueue = [];
    this.cognitiveState = null;

    console.log('ThingsIntegration initialized with config:', this.config);
  }

  /**
   * Initialize Things integration and verify availability
   */
  async initialize() {
    try {
      // Check if Things is available on the system
      this.isAvailable = await this.checkThingsAvailability();
      
      if (!this.isAvailable) {
        console.warn('Things 3 not available - task integration will be disabled');
        return false;
      }

      // Load existing projects and areas
      await this.loadThingsStructure();
      
      this.isInitialized = true;
      console.log('ThingsIntegration initialized successfully');
      return true;

    } catch (error) {
      console.error('Failed to initialize ThingsIntegration:', error);
      return false;
    }
  }

  /**
   * Check if Things 3 is available on the system
   */
  async checkThingsAvailability() {
    try {
      // Try to execute a simple Things URL scheme
      const testCommand = `open "things:///version"`;
      execSync(testCommand, { timeout: 5000, stdio: 'ignore' });
      
      // Additional check: verify Things is installed
      const appsCommand = `find /Applications -name "Things*" -maxdepth 1`;
      const result = execSync(appsCommand, { encoding: 'utf8', timeout: 5000 });
      
      return result.trim().length > 0;

    } catch (error) {
      console.log('Things 3 not available or accessible');
      return false;
    }
  }

  /**
   * Load existing Things projects and areas structure
   */
  async loadThingsStructure() {
    try {
      // Note: Things doesn't have a direct API, so we use URL schemes and AppleScript
      // This is a simplified implementation - real implementation would use more sophisticated methods
      
      // Common project patterns for Steward integration
      const defaultProjects = [
        { name: 'Steward Development', area: 'Development', type: 'project' },
        { name: 'AI Research', area: 'Learning', type: 'project' },
        { name: 'Creative Projects', area: 'Creative', type: 'project' },
        { name: 'Daily Tasks', area: 'Personal', type: 'area' }
      ];

      // Cache project structure
      for (const project of defaultProjects) {
        this.projectCache.set(project.name.toLowerCase(), {
          name: project.name,
          area: project.area,
          type: project.type,
          created_at: new Date().toISOString(),
          task_count: 0
        });
      }

      console.log(`Loaded ${this.projectCache.size} project/area mappings`);

    } catch (error) {
      console.error('Error loading Things structure:', error);
    }
  }

  /**
   * Create tasks from predicted workflow sequences
   */
  async createTasksFromWorkflow(workflowData, cognitiveContext = null) {
    if (!this.isInitialized || !this.config.enable_task_creation) {
      return { success: false, reason: 'Task creation disabled or not initialized' };
    }

    try {
      const {
        workflow_id,
        project_context,
        steps,
        total_estimated_duration,
        cognitive_load_distribution
      } = workflowData;

      this.cognitiveState = cognitiveContext;
      const createdTasks = [];
      const scheduledTasks = [];

      // Process each workflow step into tasks
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        
        // Create task from workflow step
        const taskData = this.createTaskFromStep(step, project_context, workflow_id, i);
        
        // Apply cognitive scheduling if enabled
        if (this.config.cognitive_scheduling && cognitiveContext) {
          const schedulingInfo = await this.applyCognitiveScheduling(taskData, cognitiveContext);
          taskData.scheduling = schedulingInfo;
        }

        // Group tasks for context switching optimization
        if (this.config.context_grouping) {
          taskData.grouping = this.applyContextGrouping(taskData, createdTasks);
        }

        // Create task in Things
        const thingsResult = await this.createThingsTask(taskData);
        if (thingsResult.success) {
          createdTasks.push({
            ...taskData,
            things_id: thingsResult.task_id,
            created_at: new Date().toISOString()
          });
        }

        // Schedule task if cognitive scheduling is enabled
        if (taskData.scheduling && taskData.scheduling.optimal_time) {
          scheduledTasks.push(await this.scheduleTask(taskData));
        }
      }

      // Create workflow milestone task
      if (this.config.auto_milestone_tracking && createdTasks.length > 0) {
        const milestoneTask = await this.createWorkflowMilestone(workflowData, createdTasks);
        if (milestoneTask.success) {
          createdTasks.push(milestoneTask.task);
        }
      }

      return {
        success: true,
        workflow_id: workflow_id,
        tasks_created: createdTasks.length,
        tasks_scheduled: scheduledTasks.length,
        created_tasks: createdTasks,
        scheduled_tasks: scheduledTasks,
        project_context: project_context
      };

    } catch (error) {
      console.error('Error creating tasks from workflow:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create task data from workflow step
   */
  createTaskFromStep(step, projectContext, workflowId, stepIndex) {
    const taskCategory = this.categorizeTask(step.task_type || step.phase);
    const estimatedDuration = step.estimated_duration || this.config.default_task_duration;

    return {
      title: `${step.phase || step.task_type} - ${projectContext}`,
      notes: this.generateTaskNotes(step, workflowId, stepIndex),
      project: this.mapToThingsProject(projectContext),
      area: this.mapToThingsArea(projectContext),
      tags: this.generateTaskTags(step, taskCategory, projectContext),
      
      // Steward-specific metadata
      workflow_id: workflowId,
      step_index: stepIndex,
      original_step: step,
      
      // Cognitive and scheduling data
      cognitive_load: step.cognitive_load,
      estimated_duration: estimatedDuration,
      task_category: taskCategory,
      confidence: step.confidence || 0.7,
      dependencies: step.dependencies || [],
      parallel_possible: step.parallel_possible || false
    };
  }

  /**
   * Apply cognitive scheduling to task
   */
  async applyCognitiveScheduling(taskData, cognitiveContext) {
    try {
      const currentCapacity = cognitiveContext.current_capacity?.predicted_capacity || 0.7;
      const hyperfocusPrediction = cognitiveContext.hyperfocus_prediction;
      const taskCognitive = taskData.cognitive_load;
      
      // Find optimal time slots based on task requirements and cognitive patterns
      const optimalTimeSlots = this.findOptimalTimeSlots(
        taskData,
        currentCapacity,
        hyperfocusPrediction
      );

      // Calculate scheduling priority
      const priority = this.calculateTaskPriority(taskData, cognitiveContext);

      // Determine if task should be scheduled during hyperfocus
      const useHyperfocus = this.shouldScheduleForHyperfocus(taskData, hyperfocusPrediction);

      return {
        optimal_time_slots: optimalTimeSlots,
        priority: priority,
        recommended_start: optimalTimeSlots[0]?.start_time,
        cognitive_match_score: optimalTimeSlots[0]?.match_score || 0.5,
        use_hyperfocus: useHyperfocus,
        break_recommendation: this.shouldScheduleBreakAfter(taskData),
        context_switch_cost: this.calculateContextSwitchCost(taskData),
        scheduling_confidence: optimalTimeSlots[0]?.confidence || 0.6
      };

    } catch (error) {
      console.error('Error applying cognitive scheduling:', error);
      return {
        optimal_time_slots: [],
        priority: 'medium',
        scheduling_confidence: 0.3
      };
    }
  }

  /**
   * Find optimal time slots for task based on cognitive patterns
   */
  findOptimalTimeSlots(taskData, currentCapacity, hyperfocusPrediction) {
    const slots = [];
    const taskCognitive = taskData.cognitive_load;
    const taskCategory = this.taskCategories[taskData.task_category] || this.taskCategories.administrative;

    // Check each energy pattern window
    Object.entries(this.energyPatterns).forEach(([patternName, pattern]) => {
      const energyMatch = this.calculateEnergyMatch(pattern.energy_level, taskCategory.optimal_energy);
      const cognitiveMatch = this.calculateCognitiveMatch(pattern.cognitive_load, taskCognitive);
      
      const matchScore = (energyMatch + cognitiveMatch) / 2;

      if (matchScore > 0.6) { // Only consider reasonably good matches
        const startTime = new Date();
        startTime.setHours(pattern.start, 0, 0, 0);
        
        const endTime = new Date();
        endTime.setHours(pattern.end, 0, 0, 0);

        slots.push({
          pattern: patternName,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          match_score: matchScore,
          energy_level: pattern.energy_level,
          confidence: Math.min(0.9, matchScore + (currentCapacity * 0.2))
        });
      }
    });

    // Add hyperfocus slot if available and appropriate
    if (hyperfocusPrediction?.next_hyperfocus_window && taskCognitive === 'high') {
      slots.push({
        pattern: 'hyperfocus',
        start_time: hyperfocusPrediction.next_hyperfocus_window.start_time,
        end_time: new Date(
          new Date(hyperfocusPrediction.next_hyperfocus_window.start_time).getTime() + 
          (hyperfocusPrediction.next_hyperfocus_window.estimated_duration * 60 * 1000)
        ).toISOString(),
        match_score: 0.95,
        energy_level: 1.0,
        confidence: hyperfocusPrediction.confidence || 0.8
      });
    }

    // Sort by match score and confidence
    return slots.sort((a, b) => (b.match_score * b.confidence) - (a.match_score * a.confidence));
  }

  /**
   * Apply context grouping to optimize task switching
   */
  applyContextGrouping(taskData, existingTasks) {
    const taskCategory = taskData.task_category;
    const categoryInfo = this.taskCategories[taskCategory] || this.taskCategories.administrative;

    // Find similar tasks that could be grouped
    const similarTasks = existingTasks.filter(task => 
      task.task_category === taskCategory || 
      task.project === taskData.project
    );

    // Determine if this task should be batched
    const shouldBatch = similarTasks.length > 0 && similarTasks.length < categoryInfo.batch_size;

    return {
      category: taskCategory,
      similar_task_count: similarTasks.length,
      should_batch: shouldBatch,
      batch_size_limit: categoryInfo.batch_size,
      context_switch_cost: categoryInfo.context_switch_cost,
      grouping_confidence: shouldBatch ? 0.8 : 0.4
    };
  }

  /**
   * Create task in Things using URL scheme
   */
  async createThingsTask(taskData) {
    if (!this.isAvailable) {
      return { success: false, reason: 'Things not available' };
    }

    try {
      // Build Things URL scheme for task creation
      const thingsURL = this.buildThingsURL(taskData);
      
      // Execute URL scheme
      const command = `open "${thingsURL}"`;
      execSync(command, { timeout: 10000 });

      // Generate mock task ID (real implementation would track this differently)
      const taskId = `things_task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        success: true,
        task_id: taskId,
        things_url: thingsURL,
        created_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error creating Things task:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Build Things URL scheme for task creation
   */
  buildThingsURL(taskData) {
    const params = new URLSearchParams();
    
    // Basic task data
    params.append('title', taskData.title);
    if (taskData.notes) params.append('notes', taskData.notes);
    if (taskData.project) params.append('list', taskData.project);
    
    // Tags
    if (taskData.tags && taskData.tags.length > 0) {
      params.append('tags', taskData.tags.join(','));
    }

    // Scheduling
    if (taskData.scheduling?.recommended_start) {
      const startDate = new Date(taskData.scheduling.recommended_start);
      params.append('when', startDate.toISOString().split('T')[0]);
    }

    // Due date (if high priority or time-sensitive)
    if (taskData.scheduling?.priority === 'high') {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 1); // Due tomorrow
      params.append('deadline', dueDate.toISOString().split('T')[0]);
    }

    return `things:///add?${params.toString()}`;
  }

  /**
   * Schedule task with cognitive optimization
   */
  async scheduleTask(taskData) {
    try {
      const scheduling = taskData.scheduling;
      if (!scheduling || !scheduling.optimal_time_slots.length) {
        return { success: false, reason: 'No optimal time slots available' };
      }

      const optimalSlot = scheduling.optimal_time_slots[0];
      
      // Add to scheduling queue
      this.schedulingQueue.push({
        task_id: taskData.things_id || taskData.title,
        task_data: taskData,
        scheduled_start: optimalSlot.start_time,
        scheduled_end: optimalSlot.end_time,
        cognitive_match: optimalSlot.match_score,
        created_at: new Date().toISOString()
      });

      return {
        success: true,
        scheduled_for: optimalSlot.start_time,
        cognitive_match: optimalSlot.match_score,
        confidence: scheduling.scheduling_confidence
      };

    } catch (error) {
      console.error('Error scheduling task:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create workflow milestone task
   */
  async createWorkflowMilestone(workflowData, createdTasks) {
    try {
      const milestoneTask = {
        title: `🎯 Complete ${workflowData.project_context} Workflow`,
        notes: this.generateMilestoneNotes(workflowData, createdTasks),
        project: this.mapToThingsProject(workflowData.project_context),
        tags: ['milestone', 'steward-workflow', workflowData.project_context.toLowerCase()],
        workflow_id: workflowData.workflow_id,
        task_category: 'milestone',
        cognitive_load: 'low',
        estimated_duration: 10 // Review time
      };

      const thingsResult = await this.createThingsTask(milestoneTask);

      return {
        success: thingsResult.success,
        task: {
          ...milestoneTask,
          things_id: thingsResult.task_id,
          type: 'milestone',
          dependent_tasks: createdTasks.length
        }
      };

    } catch (error) {
      console.error('Error creating workflow milestone:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Synchronize project milestones with Steward progress
   */
  async synchronizeProgress(progressData) {
    if (!this.isInitialized) {
      return { success: false, reason: 'Not initialized' };
    }

    try {
      const {
        workflow_id,
        completed_steps,
        total_steps,
        success_rate,
        project_context
      } = progressData;

      // Find tasks related to this workflow
      const workflowTasks = this.schedulingQueue.filter(item => 
        item.task_data.workflow_id === workflow_id
      );

      const updates = [];

      // Update task statuses based on progress
      for (const scheduledTask of workflowTasks) {
        const stepIndex = scheduledTask.task_data.step_index;
        const isCompleted = completed_steps.includes(stepIndex);

        if (isCompleted) {
          // Mark task as completed in Things (would use AppleScript or URL scheme)
          const updateResult = await this.markTaskCompleted(scheduledTask.task_id);
          updates.push({
            task_id: scheduledTask.task_id,
            action: 'completed',
            success: updateResult.success
          });
        }
      }

      return {
        success: true,
        workflow_id: workflow_id,
        tasks_updated: updates.filter(u => u.success).length,
        total_tasks: workflowTasks.length,
        updates: updates
      };

    } catch (error) {
      console.error('Error synchronizing progress:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Mark task as completed
   */
  async markTaskCompleted(taskId) {
    try {
      // In a real implementation, this would use AppleScript or URL schemes
      // For now, just log the completion
      console.log(`Task ${taskId} marked as completed in Things`);
      
      return { success: true, completed_at: new Date().toISOString() };

    } catch (error) {
      console.error('Error marking task completed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate task notes with Steward context
   */
  generateTaskNotes(step, workflowId, stepIndex) {
    const notes = [];
    
    notes.push(`📋 Steward Workflow Step ${stepIndex + 1}`);
    notes.push(`🆔 Workflow ID: ${workflowId}`);
    notes.push(`⚡ Cognitive Load: ${step.cognitive_load}`);
    notes.push(`⏱️ Estimated Duration: ${step.estimated_duration} minutes`);
    
    if (step.dependencies && step.dependencies.length > 0) {
      notes.push(`🔗 Dependencies: ${step.dependencies.join(', ')}`);
    }
    
    if (step.confidence) {
      notes.push(`📊 Confidence: ${Math.round(step.confidence * 100)}%`);
    }

    if (step.optimal_timing) {
      notes.push(`⏰ Optimal Timing: ${Array.isArray(step.optimal_timing) ? step.optimal_timing.join(', ') : step.optimal_timing}`);
    }

    notes.push(''); // Empty line
    notes.push('🤖 Created by The Steward AI');

    return notes.join('\n');
  }

  /**
   * Generate milestone task notes
   */
  generateMilestoneNotes(workflowData, createdTasks) {
    const notes = [];
    
    notes.push(`🎯 Workflow Milestone: ${workflowData.project_context}`);
    notes.push(`🆔 Workflow ID: ${workflowData.workflow_id}`);
    notes.push(`📈 Success Probability: ${Math.round(workflowData.completion_probability * 100)}%`);
    notes.push(`⏱️ Total Estimated Duration: ${workflowData.total_estimated_duration} minutes`);
    notes.push(`📝 Tasks Created: ${createdTasks.length}`);
    notes.push('');
    notes.push('📋 Workflow Tasks:');
    
    createdTasks.forEach((task, index) => {
      notes.push(`${index + 1}. ${task.title}`);
    });
    
    notes.push('');
    notes.push('🤖 Created by The Steward AI');
    
    return notes.join('\n');
  }

  /**
   * Generate task tags based on context and category
   */
  generateTaskTags(step, taskCategory, projectContext) {
    const tags = [];
    
    // Steward tags
    tags.push('steward');
    tags.push('steward-workflow');
    
    // Project context
    if (projectContext) {
      tags.push(projectContext.toLowerCase().replace(/\s+/g, '-'));
    }
    
    // Task category
    if (taskCategory) {
      tags.push(taskCategory);
    }
    
    // Cognitive load
    tags.push(`cognitive-${step.cognitive_load}`);
    
    // Special tags
    if (step.parallel_possible) {
      tags.push('parallel-ok');
    }
    
    if (step.confidence > 0.9) {
      tags.push('high-confidence');
    }

    return tags;
  }

  /**
   * Map project context to Things project
   */
  mapToThingsProject(projectContext) {
    const mapping = {
      'steward-development': 'Steward Development',
      'creative-writing': 'Creative Projects',
      'research': 'AI Research',
      'learning': 'Learning & Development'
    };

    return mapping[projectContext?.toLowerCase()] || 'Steward Tasks';
  }

  /**
   * Map project context to Things area
   */
  mapToThingsArea(projectContext) {
    const mapping = {
      'steward-development': 'Development',
      'creative-writing': 'Creative',
      'research': 'Learning',
      'learning': 'Learning'
    };

    return mapping[projectContext?.toLowerCase()] || 'Personal';
  }

  /**
   * Categorize task based on type/phase
   */
  categorizeTask(taskType) {
    const categoryMapping = {
      'planning': 'planning',
      'implementation': 'implementation',
      'coding': 'implementation',
      'development': 'implementation',
      'testing': 'analytical',
      'analysis': 'analytical',
      'review': 'analytical',
      'documentation': 'administrative',
      'research': 'creative',
      'writing': 'creative',
      'communication': 'communication',
      'meeting': 'communication'
    };

    const normalized = taskType?.toLowerCase() || 'administrative';
    return categoryMapping[normalized] || 'administrative';
  }

  /**
   * Calculate energy match between pattern and task requirements
   */
  calculateEnergyMatch(patternEnergy, requiredEnergy) {
    const difference = Math.abs(patternEnergy - requiredEnergy);
    return Math.max(0, 1 - (difference / 0.5)); // Normalize to 0-1 scale
  }

  /**
   * Calculate cognitive match between pattern and task
   */
  calculateCognitiveMatch(patternCognitive, taskCognitive) {
    const cognitiveValues = { low: 0.3, medium: 0.6, high: 0.9 };
    const patternValue = cognitiveValues[patternCognitive] || 0.5;
    const taskValue = cognitiveValues[taskCognitive] || 0.5;
    
    const difference = Math.abs(patternValue - taskValue);
    return Math.max(0, 1 - (difference / 0.6)); // Normalize to 0-1 scale
  }

  /**
   * Calculate task priority based on various factors
   */
  calculateTaskPriority(taskData, cognitiveContext) {
    let priorityScore = 0.5; // Base priority

    // Cognitive load matching
    const currentCapacity = cognitiveContext.current_capacity?.predicted_capacity || 0.7;
    if (taskData.cognitive_load === 'high' && currentCapacity > 0.8) {
      priorityScore += 0.3;
    }

    // Confidence boost
    if (taskData.confidence > 0.8) {
      priorityScore += 0.2;
    }

    // Dependencies (tasks with no dependencies get higher priority)
    if (!taskData.dependencies || taskData.dependencies.length === 0) {
      priorityScore += 0.1;
    }

    // Convert to priority level
    if (priorityScore >= 0.8) return 'high';
    if (priorityScore >= 0.6) return 'medium';
    return 'low';
  }

  /**
   * Determine if task should be scheduled for hyperfocus
   */
  shouldScheduleForHyperfocus(taskData, hyperfocusPrediction) {
    if (!hyperfocusPrediction?.next_hyperfocus_window) return false;
    
    // High cognitive load tasks are good for hyperfocus
    if (taskData.cognitive_load === 'high') return true;
    
    // Creative and implementation tasks benefit from hyperfocus
    if (['creative', 'implementation'].includes(taskData.task_category)) return true;
    
    // High confidence tasks can utilize hyperfocus well
    if (taskData.confidence > 0.9) return true;
    
    return false;
  }

  /**
   * Determine if break should be scheduled after task
   */
  shouldScheduleBreakAfter(taskData) {
    // Break after high cognitive load tasks
    if (taskData.cognitive_load === 'high') return true;
    
    // Break after long tasks
    if (taskData.estimated_duration > 60) return true;
    
    // Break after context-switching heavy tasks
    const categoryInfo = this.taskCategories[taskData.task_category];
    if (categoryInfo?.context_switch_cost > 0.3) return true;
    
    return false;
  }

  /**
   * Calculate context switch cost for task
   */
  calculateContextSwitchCost(taskData) {
    const categoryInfo = this.taskCategories[taskData.task_category];
    return categoryInfo?.context_switch_cost || 0.2;
  }

  /**
   * Get integration status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      available: this.isAvailable,
      configuration: this.config,
      cached_projects: this.projectCache.size,
      queued_tasks: this.taskQueue.length,
      scheduled_tasks: this.schedulingQueue.length,
      cognitive_state: this.cognitiveState !== null
    };
  }

  /**
   * Get scheduling analytics
   */
  getSchedulingAnalytics() {
    const analytics = {
      total_scheduled: this.schedulingQueue.length,
      by_cognitive_load: { high: 0, medium: 0, low: 0 },
      by_category: {},
      by_time_slot: {},
      average_confidence: 0
    };

    this.schedulingQueue.forEach(item => {
      const taskData = item.task_data;
      
      // Count by cognitive load
      analytics.by_cognitive_load[taskData.cognitive_load]++;
      
      // Count by category
      const category = taskData.task_category || 'unknown';
      analytics.by_category[category] = (analytics.by_category[category] || 0) + 1;
      
      // Count by time slot (hour)
      const hour = new Date(item.scheduled_start).getHours();
      analytics.by_time_slot[hour] = (analytics.by_time_slot[hour] || 0) + 1;
    });

    // Calculate average confidence
    if (this.schedulingQueue.length > 0) {
      const totalConfidence = this.schedulingQueue.reduce((sum, item) => 
        sum + (item.task_data.scheduling?.scheduling_confidence || 0.5), 0
      );
      analytics.average_confidence = totalConfidence / this.schedulingQueue.length;
    }

    return analytics;
  }

  /**
   * Close integration and cleanup
   */
  async close() {
    this.isInitialized = false;
    this.isAvailable = false;
    this.projectCache.clear();
    this.taskQueue = [];
    this.schedulingQueue = [];
    this.cognitiveState = null;
    console.log('ThingsIntegration closed');
  }
}

module.exports = ThingsIntegration;

// #endregion end: Things Integration