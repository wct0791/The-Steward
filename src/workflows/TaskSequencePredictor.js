// #region start: Task Sequence Predictor for The Steward
// Analyzes historical patterns to predict optimal task sequences and dependencies
// Provides workflow suggestions with confidence scores and timing recommendations

const ProjectMemoryManager = require('../memory/ProjectMemoryManager');

/**
 * TaskSequencePredictor - Predicts optimal task sequences based on historical patterns
 * 
 * Key Features:
 * - Analyze project patterns from memory system
 * - Identify common task sequences and dependencies
 * - Predict next likely tasks with confidence scores
 * - Generate workflow recommendations with timing
 * - Learn from completion patterns and user feedback
 */
class TaskSequencePredictor {
  constructor(options = {}) {
    this.memoryManager = new ProjectMemoryManager(options);
    this.sequencePatterns = new Map();
    this.taskDependencies = new Map();
    this.completionPatterns = new Map();
    
    // Task classification patterns for workflow prediction
    this.taskTypes = {
      planning: {
        keywords: ['plan', 'design', 'architecture', 'strategy', 'roadmap', 'requirements'],
        typical_duration: 30, // minutes
        cognitive_load: 'medium',
        dependencies: []
      },
      implementation: {
        keywords: ['implement', 'build', 'create', 'develop', 'code', 'write'],
        typical_duration: 90,
        cognitive_load: 'high',
        dependencies: ['planning']
      },
      testing: {
        keywords: ['test', 'verify', 'validate', 'debug', 'fix', 'check'],
        typical_duration: 45,
        cognitive_load: 'medium',
        dependencies: ['implementation']
      },
      documentation: {
        keywords: ['document', 'readme', 'guide', 'explain', 'instructions'],
        typical_duration: 60,
        cognitive_load: 'low',
        dependencies: ['implementation', 'testing']
      },
      research: {
        keywords: ['research', 'investigate', 'explore', 'analyze', 'study'],
        typical_duration: 40,
        cognitive_load: 'medium',
        dependencies: []
      },
      review: {
        keywords: ['review', 'evaluate', 'assess', 'feedback', 'optimize'],
        typical_duration: 30,
        cognitive_load: 'low',
        dependencies: ['implementation']
      }
    };

    // Common workflow templates by project type
    this.workflowTemplates = {
      'steward-development': [
        { task: 'planning', phase: 'design' },
        { task: 'implementation', phase: 'build' },
        { task: 'testing', phase: 'validate' },
        { task: 'documentation', phase: 'document' }
      ],
      'creative-writing': [
        { task: 'research', phase: 'preparation' },
        { task: 'planning', phase: 'outline' },
        { task: 'implementation', phase: 'writing' },
        { task: 'review', phase: 'editing' }
      ],
      'technical-development': [
        { task: 'research', phase: 'analysis' },
        { task: 'planning', phase: 'design' },
        { task: 'implementation', phase: 'coding' },
        { task: 'testing', phase: 'validation' },
        { task: 'review', phase: 'optimization' }
      ],
      'quick-tasks': [
        { task: 'implementation', phase: 'execution' }
      ]
    };
  }

  /**
   * Initialize the predictor with historical data
   */
  async initialize() {
    try {
      await this.memoryManager.initialize();
      await this.loadHistoricalPatterns();
      return true;
    } catch (error) {
      console.error('Failed to initialize TaskSequencePredictor:', error);
      return false;
    }
  }

  /**
   * Load historical patterns from memory system
   */
  async loadHistoricalPatterns() {
    try {
      const crossSessionInsights = await this.memoryManager.getCrossSessionInsights();
      
      // Build sequence patterns from historical data
      for (const project of crossSessionInsights.projects || []) {
        const projectInsights = await this.memoryManager.getProjectInsights(project.project_context);
        this.buildSequencePatterns(project.project_context, projectInsights);
      }
      
      console.log(`Loaded sequence patterns for ${this.sequencePatterns.size} project types`);
    } catch (error) {
      console.warn('Could not load historical patterns:', error.message);
    }
  }

  /**
   * Build sequence patterns from project insights
   */
  buildSequencePatterns(projectContext, projectInsights) {
    const patterns = {
      common_sequences: [],
      task_frequencies: {},
      completion_rates: {},
      average_durations: {}
    };

    // Simulate pattern building from project insights
    const template = this.workflowTemplates[projectContext] || this.workflowTemplates['technical-development'];
    
    patterns.common_sequences = template.map((step, index) => ({
      sequence_id: `${projectContext}_seq_${index}`,
      tasks: template.slice(index, index + 2).map(t => t.task),
      frequency: Math.max(0.5, 1 - (index * 0.2)), // Decreasing frequency for later steps
      success_rate: 0.8 + (Math.random() * 0.15),
      average_duration: template.slice(index, index + 2).reduce((sum, t) => 
        sum + (this.taskTypes[t.task]?.typical_duration || 30), 0)
    }));

    // Build task frequencies
    template.forEach(step => {
      patterns.task_frequencies[step.task] = 0.6 + (Math.random() * 0.3);
      patterns.completion_rates[step.task] = 0.75 + (Math.random() * 0.2);
      patterns.average_durations[step.task] = this.taskTypes[step.task]?.typical_duration || 30;
    });

    this.sequencePatterns.set(projectContext, patterns);
  }

  /**
   * Predict next tasks based on current task and project context
   */
  async predictNextTasks(currentTask, projectContext, options = {}) {
    try {
      const currentTaskType = this.classifyTask(currentTask);
      const patterns = this.sequencePatterns.get(projectContext);
      const template = this.workflowTemplates[projectContext] || this.workflowTemplates['technical-development'];
      
      if (!patterns) {
        return this.generateFallbackPredictions(currentTaskType, projectContext, template);
      }

      // Find current position in common sequences
      const predictions = [];
      
      for (const sequence of patterns.common_sequences) {
        const currentIndex = sequence.tasks.indexOf(currentTaskType);
        
        if (currentIndex >= 0 && currentIndex < sequence.tasks.length - 1) {
          const nextTask = sequence.tasks[currentIndex + 1];
          const taskInfo = this.taskTypes[nextTask];
          
          predictions.push({
            task_type: nextTask,
            confidence: sequence.success_rate * 0.9, // Slight confidence reduction for prediction
            reasoning: `Common sequence: ${currentTaskType} → ${nextTask}`,
            estimated_duration: taskInfo?.typical_duration || 30,
            cognitive_load: taskInfo?.cognitive_load || 'medium',
            dependencies_met: this.checkDependencies(nextTask, [currentTaskType]),
            sequence_id: sequence.sequence_id,
            historical_frequency: patterns.task_frequencies[nextTask] || 0.5
          });
        }
      }

      // Add dependency-based predictions
      const dependencyPredictions = this.generateDependencyBasedPredictions(
        currentTaskType, 
        projectContext, 
        patterns
      );
      
      predictions.push(...dependencyPredictions);

      // Sort by confidence and remove duplicates
      const uniquePredictions = this.deduplicatePredictions(predictions);
      return uniquePredictions.slice(0, options.limit || 5);

    } catch (error) {
      console.error('Error predicting next tasks:', error);
      return this.generateFallbackPredictions(currentTaskType, projectContext);
    }
  }

  /**
   * Generate complete workflow suggestion for a project
   */
  async generateWorkflowSuggestion(projectContext, currentProgress = [], options = {}) {
    try {
      const template = this.workflowTemplates[projectContext] || this.workflowTemplates['technical-development'];
      const patterns = this.sequencePatterns.get(projectContext);
      
      // Determine completed tasks
      const completedTasks = currentProgress.map(p => this.classifyTask(p.task));
      
      // Generate remaining workflow steps
      const remainingSteps = template.filter(step => !completedTasks.includes(step.task));
      
      const workflowSteps = remainingSteps.map((step, index) => {
        const taskInfo = this.taskTypes[step.task];
        const patternData = patterns?.task_frequencies[step.task];
        
        return {
          step_id: `${projectContext}_step_${index}`,
          task_type: step.task,
          phase: step.phase,
          estimated_duration: taskInfo?.typical_duration || 30,
          cognitive_load: taskInfo?.cognitive_load || 'medium',
          confidence: patternData || 0.7,
          dependencies: taskInfo?.dependencies || [],
          prerequisites_met: this.checkDependencies(step.task, completedTasks),
          optimal_timing: this.suggestOptimalTiming(step.task, taskInfo?.cognitive_load),
          parallel_possible: this.canRunInParallel(step.task, remainingSteps.slice(index + 1))
        };
      });

      // Calculate workflow metrics
      const totalDuration = workflowSteps.reduce((sum, step) => sum + step.estimated_duration, 0);
      const averageConfidence = workflowSteps.length > 0 ? 
        workflowSteps.reduce((sum, step) => sum + step.confidence, 0) / workflowSteps.length : 0;

      return {
        workflow_id: `${projectContext}_workflow_${Date.now()}`,
        project_context: projectContext,
        steps: workflowSteps,
        total_estimated_duration: totalDuration,
        average_confidence: averageConfidence,
        completion_probability: this.calculateCompletionProbability(workflowSteps),
        cognitive_load_distribution: this.analyzeCognitiveLoadDistribution(workflowSteps),
        suggested_schedule: this.generateScheduleSuggestion(workflowSteps),
        created_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error generating workflow suggestion:', error);
      return this.generateFallbackWorkflow(projectContext);
    }
  }

  /**
   * Classify task type from task description
   */
  classifyTask(taskDescription) {
    if (!taskDescription || typeof taskDescription !== 'string') {
      return 'implementation'; // Default fallback
    }

    const lowered = taskDescription.toLowerCase();
    let bestMatch = { type: 'implementation', score: 0 };

    for (const [taskType, config] of Object.entries(this.taskTypes)) {
      const score = config.keywords.filter(keyword => lowered.includes(keyword)).length;
      if (score > bestMatch.score) {
        bestMatch = { type: taskType, score };
      }
    }

    return bestMatch.type;
  }

  /**
   * Check if task dependencies are met
   */
  checkDependencies(taskType, completedTasks) {
    const taskInfo = this.taskTypes[taskType];
    if (!taskInfo || !taskInfo.dependencies) return true;

    return taskInfo.dependencies.every(dep => completedTasks.includes(dep));
  }

  /**
   * Generate dependency-based predictions
   */
  generateDependencyBasedPredictions(currentTaskType, projectContext, patterns) {
    const predictions = [];
    
    // Find tasks that depend on current task
    for (const [taskType, taskInfo] of Object.entries(this.taskTypes)) {
      if (taskInfo.dependencies && taskInfo.dependencies.includes(currentTaskType)) {
        predictions.push({
          task_type: taskType,
          confidence: 0.75,
          reasoning: `Dependency: ${currentTaskType} enables ${taskType}`,
          estimated_duration: taskInfo.typical_duration,
          cognitive_load: taskInfo.cognitive_load,
          dependencies_met: true,
          sequence_id: 'dependency_based',
          historical_frequency: patterns?.task_frequencies[taskType] || 0.6
        });
      }
    }

    return predictions;
  }

  /**
   * Generate fallback predictions when no patterns are available
   */
  generateFallbackPredictions(currentTaskType, projectContext, template = null) {
    const fallbackTemplate = template || this.workflowTemplates['technical-development'];
    const currentIndex = fallbackTemplate.findIndex(step => step.task === currentTaskType);
    
    if (currentIndex >= 0 && currentIndex < fallbackTemplate.length - 1) {
      const nextStep = fallbackTemplate[currentIndex + 1];
      const taskInfo = this.taskTypes[nextStep.task];
      
      return [{
        task_type: nextStep.task,
        confidence: 0.6,
        reasoning: `Template-based: typical ${projectContext} workflow`,
        estimated_duration: taskInfo?.typical_duration || 30,
        cognitive_load: taskInfo?.cognitive_load || 'medium',
        dependencies_met: true,
        sequence_id: 'template_fallback',
        historical_frequency: 0.5
      }];
    }

    return [];
  }

  /**
   * Remove duplicate predictions and merge similar ones
   */
  deduplicatePredictions(predictions) {
    const uniqueMap = new Map();
    
    for (const prediction of predictions) {
      const key = prediction.task_type;
      const existing = uniqueMap.get(key);
      
      if (!existing || prediction.confidence > existing.confidence) {
        uniqueMap.set(key, prediction);
      }
    }
    
    return Array.from(uniqueMap.values()).sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Suggest optimal timing for task based on cognitive load
   */
  suggestOptimalTiming(taskType, cognitiveLoad) {
    const timingMap = {
      'high': ['morning_hyperfocus', 'early_afternoon'],
      'medium': ['late_morning', 'mid_afternoon', 'early_evening'],
      'low': ['any_time', 'between_meetings', 'end_of_day']
    };

    return timingMap[cognitiveLoad] || timingMap['medium'];
  }

  /**
   * Check if task can run in parallel with others
   */
  canRunInParallel(taskType, otherTasks) {
    // Tasks with different cognitive loads or no dependencies can potentially run in parallel
    const taskInfo = this.taskTypes[taskType];
    const parallelCandidates = otherTasks.filter(other => {
      const otherInfo = this.taskTypes[other.task];
      return otherInfo && 
             otherInfo.cognitive_load !== taskInfo?.cognitive_load &&
             !otherInfo.dependencies?.includes(taskType) &&
             !taskInfo?.dependencies?.includes(other.task);
    });

    return parallelCandidates.length > 0;
  }

  /**
   * Calculate workflow completion probability
   */
  calculateCompletionProbability(workflowSteps) {
    if (workflowSteps.length === 0) return 0;
    
    // Base probability decreases with workflow length and complexity
    const baseProb = 0.9;
    const lengthPenalty = Math.max(0, (workflowSteps.length - 3) * 0.1);
    const confidenceFactor = workflowSteps.reduce((sum, step) => sum + step.confidence, 0) / workflowSteps.length;
    
    return Math.max(0.3, (baseProb - lengthPenalty) * confidenceFactor);
  }

  /**
   * Analyze cognitive load distribution across workflow
   */
  analyzeCognitiveLoadDistribution(workflowSteps) {
    const distribution = { high: 0, medium: 0, low: 0 };
    
    workflowSteps.forEach(step => {
      distribution[step.cognitive_load] = (distribution[step.cognitive_load] || 0) + 1;
    });

    const total = workflowSteps.length;
    return {
      high_load_percentage: total > 0 ? (distribution.high / total) * 100 : 0,
      medium_load_percentage: total > 0 ? (distribution.medium / total) * 100 : 0,
      low_load_percentage: total > 0 ? (distribution.low / total) * 100 : 0,
      cognitive_balance: this.assessCognitiveBalance(distribution, total)
    };
  }

  /**
   * Assess cognitive balance of workflow
   */
  assessCognitiveBalance(distribution, total) {
    if (total === 0) return 'unknown';
    
    const highRatio = distribution.high / total;
    const lowRatio = distribution.low / total;
    
    if (highRatio > 0.6) return 'high_intensity';
    if (lowRatio > 0.6) return 'low_intensity';
    if (Math.abs(highRatio - lowRatio) < 0.3) return 'balanced';
    
    return 'mixed';
  }

  /**
   * Generate schedule suggestion for workflow
   */
  generateScheduleSuggestion(workflowSteps) {
    const schedule = [];
    let currentTime = new Date();
    
    workflowSteps.forEach((step, index) => {
      const startTime = new Date(currentTime.getTime() + (index > 0 ? 15 * 60 * 1000 : 0)); // 15 min buffer
      const endTime = new Date(startTime.getTime() + step.estimated_duration * 60 * 1000);
      
      schedule.push({
        step_id: step.step_id,
        suggested_start: startTime.toISOString(),
        suggested_end: endTime.toISOString(),
        optimal_timing: step.optimal_timing,
        break_recommended: step.cognitive_load === 'high' && index < workflowSteps.length - 1
      });
      
      currentTime = endTime;
    });

    return schedule;
  }

  /**
   * Generate fallback workflow when no patterns available
   */
  generateFallbackWorkflow(projectContext) {
    const template = this.workflowTemplates[projectContext] || this.workflowTemplates['technical-development'];
    
    const steps = template.map((step, index) => {
      const taskInfo = this.taskTypes[step.task];
      return {
        step_id: `fallback_step_${index}`,
        task_type: step.task,
        phase: step.phase,
        estimated_duration: taskInfo?.typical_duration || 30,
        cognitive_load: taskInfo?.cognitive_load || 'medium',
        confidence: 0.6,
        dependencies: taskInfo?.dependencies || [],
        prerequisites_met: index === 0 || this.checkDependencies(step.task, template.slice(0, index).map(s => s.task))
      };
    });

    return {
      workflow_id: `fallback_workflow_${Date.now()}`,
      project_context: projectContext,
      steps: steps,
      total_estimated_duration: steps.reduce((sum, step) => sum + step.estimated_duration, 0),
      average_confidence: 0.6,
      completion_probability: 0.7,
      created_at: new Date().toISOString(),
      fallback: true
    };
  }

  /**
   * Record workflow completion for learning
   */
  async recordWorkflowCompletion(workflowId, completedSteps, actualDurations, userFeedback) {
    try {
      // This would record workflow patterns for future learning
      console.log(`Recording workflow completion: ${workflowId}, completed ${completedSteps.length} steps`);
      
      // Update patterns based on actual completion
      // Future enhancement: machine learning on workflow patterns
      
      return true;
    } catch (error) {
      console.error('Error recording workflow completion:', error);
      return false;
    }
  }

  /**
   * Close predictor and cleanup
   */
  async close() {
    if (this.memoryManager) {
      await this.memoryManager.close();
    }
  }
}

module.exports = TaskSequencePredictor;

// #endregion end: Task Sequence Predictor