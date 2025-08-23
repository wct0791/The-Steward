// #region start: Workflow Memory Manager for The Steward
// Enhanced memory system for storing and retrieving workflow patterns
// Integrates with existing project memory to provide workflow-specific insights

const ProjectMemoryManager = require('./ProjectMemoryManager');
const ContextEngine = require('./ContextEngine');
const fs = require('fs').promises;
const path = require('path');

/**
 * WorkflowMemoryManager - Memory management for predictive workflows
 * 
 * Key Features:
 * - Store and retrieve successful workflow patterns
 * - Learn from workflow modifications and outcomes
 * - Provide workflow recommendations based on historical data
 * - Track cognitive load patterns and timing optimization
 * - Manage autonomous routing patterns for workflow steps
 */
class WorkflowMemoryManager {
  constructor(options = {}) {
    this.projectMemory = new ProjectMemoryManager(options);
    this.contextEngine = new ContextEngine(options);
    
    // Workflow-specific storage paths
    this.workflowStoragePath = options.workflowStoragePath || 
                               path.join(process.cwd(), 'storage', 'workflows');
    this.patternStoragePath = path.join(this.workflowStoragePath, 'patterns');
    this.cognitiveStoragePath = path.join(this.workflowStoragePath, 'cognitive');
    
    // In-memory caches for performance
    this.workflowPatterns = new Map();
    this.cognitivePatterns = new Map();
    this.workflowTemplates = new Map();
    this.autonomousPatterns = new Map();
    
    // Workflow learning configuration
    this.learningConfig = {
      min_pattern_occurrences: 3,     // Minimum times a pattern must occur to be reliable
      success_threshold: 0.7,         // Minimum success rate to consider pattern valid
      confidence_decay_rate: 0.1,     // Rate at which old patterns lose confidence
      cognitive_learning_weight: 0.3, // Weight given to cognitive load learning
      timing_accuracy_threshold: 0.8, // Minimum timing prediction accuracy
      pattern_stability_periods: 7    // Days to track for pattern stability
    };
  }

  /**
   * Initialize workflow memory manager
   */
  async initialize() {
    try {
      await this.projectMemory.initialize();
      await this.contextEngine.initialize();
      
      // Ensure storage directories exist
      await this.ensureStorageDirectories();
      
      // Load existing workflow patterns from storage
      await this.loadWorkflowPatterns();
      await this.loadCognitivePatterns();
      await this.loadWorkflowTemplates();
      
      console.log('WorkflowMemoryManager initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize WorkflowMemoryManager:', error);
      return false;
    }
  }

  /**
   * Ensure required storage directories exist
   */
  async ensureStorageDirectories() {
    const directories = [
      this.workflowStoragePath,
      this.patternStoragePath,
      this.cognitiveStoragePath
    ];

    for (const dir of directories) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        if (error.code !== 'EEXIST') {
          throw error;
        }
      }
    }
  }

  /**
   * Record a completed workflow for pattern learning
   */
  async recordWorkflowCompletion(workflowData) {
    try {
      const {
        workflow_id,
        project_context,
        original_task,
        steps_completed,
        actual_duration,
        estimated_duration,
        success_rate,
        user_modifications,
        cognitive_load_actual,
        autonomous_routing_usage,
        execution_strategy
      } = workflowData;

      // Store the completed workflow
      const completionRecord = {
        workflow_id,
        project_context,
        original_task,
        completion_timestamp: new Date().toISOString(),
        steps_completed,
        actual_duration,
        estimated_duration,
        duration_accuracy: Math.abs(actual_duration - estimated_duration) / estimated_duration,
        success_rate,
        user_modifications: user_modifications || [],
        cognitive_load_actual: cognitive_load_actual || [],
        autonomous_routing_usage: autonomous_routing_usage || 0,
        execution_strategy,
        learning_weight: this.calculateLearningWeight(workflowData)
      };

      // Update workflow patterns
      await this.updateWorkflowPattern(project_context, completionRecord);
      
      // Update cognitive patterns
      await this.updateCognitivePattern(project_context, completionRecord);
      
      // Update autonomous routing patterns if applicable
      if (autonomous_routing_usage > 0) {
        await this.updateAutonomousPattern(project_context, completionRecord);
      }

      // Save to persistent storage
      await this.saveWorkflowCompletion(completionRecord);

      console.log(`Recorded workflow completion: ${workflow_id} for ${project_context}`);
      
      return {
        success: true,
        workflow_id,
        patterns_updated: true,
        learning_weight: completionRecord.learning_weight
      };

    } catch (error) {
      console.error('Error recording workflow completion:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate learning weight for workflow data
   */
  calculateLearningWeight(workflowData) {
    let weight = 1.0;
    
    // Higher weight for successful workflows
    if (workflowData.success_rate > 0.8) weight *= 1.3;
    
    // Higher weight for workflows completed without major modifications
    if ((workflowData.user_modifications || []).length === 0) weight *= 1.2;
    
    // Higher weight for accurate time estimates
    const durationAccuracy = Math.abs(workflowData.actual_duration - workflowData.estimated_duration) / workflowData.estimated_duration;
    if (durationAccuracy < 0.2) weight *= 1.1;
    
    // Recent completions have higher weight
    weight *= 1.0 + (Date.now() - new Date().setHours(0, 0, 0, 0)) / (24 * 60 * 60 * 1000) * 0.1;
    
    return Math.min(2.0, weight); // Cap at 2.0
  }

  /**
   * Update workflow pattern with new completion data
   */
  async updateWorkflowPattern(projectContext, completionRecord) {
    const patternKey = `${projectContext}:workflow_pattern`;
    let pattern = this.workflowPatterns.get(patternKey);

    if (!pattern) {
      pattern = {
        project_context: projectContext,
        completions: [],
        success_rates: [],
        duration_predictions: [],
        common_steps: new Map(),
        modification_patterns: new Map(),
        confidence: 0.5,
        last_updated: new Date().toISOString(),
        pattern_stability: 0.5
      };
    }

    // Add completion to history
    pattern.completions.push(completionRecord);
    pattern.success_rates.push(completionRecord.success_rate);
    pattern.duration_predictions.push({
      estimated: completionRecord.estimated_duration,
      actual: completionRecord.actual_duration,
      accuracy: completionRecord.duration_accuracy
    });

    // Analyze common step patterns
    if (completionRecord.steps_completed) {
      completionRecord.steps_completed.forEach(step => {
        const stepKey = step.phase || step.task_type;
        const current = pattern.common_steps.get(stepKey) || { count: 0, avg_duration: 0, success_rate: 0 };
        current.count += 1;
        current.avg_duration = ((current.avg_duration * (current.count - 1)) + step.actual_duration) / current.count;
        current.success_rate = ((current.success_rate * (current.count - 1)) + (step.success ? 1 : 0)) / current.count;
        pattern.common_steps.set(stepKey, current);
      });
    }

    // Analyze modification patterns
    if (completionRecord.user_modifications.length > 0) {
      completionRecord.user_modifications.forEach(mod => {
        const modKey = `${mod.type}:${mod.field}`;
        const current = pattern.modification_patterns.get(modKey) || { count: 0, avg_change: 0 };
        current.count += 1;
        if (mod.value_change) {
          current.avg_change = ((current.avg_change * (current.count - 1)) + mod.value_change) / current.count;
        }
        pattern.modification_patterns.set(modKey, current);
      });
    }

    // Update confidence based on recent success rate and consistency
    const recentCompletions = pattern.completions.slice(-10);
    const recentSuccessRate = recentCompletions.reduce((sum, c) => sum + c.success_rate, 0) / recentCompletions.length;
    const consistency = this.calculatePatternConsistency(recentCompletions);
    
    pattern.confidence = Math.min(0.95, Math.max(0.3, 
      (recentSuccessRate * 0.6) + (consistency * 0.4)
    ));

    // Update pattern stability
    pattern.pattern_stability = this.calculatePatternStability(pattern);
    pattern.last_updated = new Date().toISOString();

    // Keep only recent completions to prevent unbounded growth
    if (pattern.completions.length > 50) {
      pattern.completions = pattern.completions.slice(-50);
      pattern.success_rates = pattern.success_rates.slice(-50);
      pattern.duration_predictions = pattern.duration_predictions.slice(-50);
    }

    this.workflowPatterns.set(patternKey, pattern);
  }

  /**
   * Update cognitive pattern with completion data
   */
  async updateCognitivePattern(projectContext, completionRecord) {
    const cognitiveKey = `${projectContext}:cognitive_pattern`;
    let cognitivePattern = this.cognitivePatterns.get(cognitiveKey);

    if (!cognitivePattern) {
      cognitivePattern = {
        project_context: projectContext,
        cognitive_load_history: [],
        timing_patterns: new Map(),
        hyperfocus_periods: [],
        context_switching_costs: [],
        capacity_predictions: [],
        break_effectiveness: [],
        last_updated: new Date().toISOString()
      };
    }

    // Add cognitive load data if available
    if (completionRecord.cognitive_load_actual) {
      cognitivePattern.cognitive_load_history.push({
        workflow_id: completionRecord.workflow_id,
        timestamp: completionRecord.completion_timestamp,
        cognitive_loads: completionRecord.cognitive_load_actual,
        duration: completionRecord.actual_duration,
        success_rate: completionRecord.success_rate
      });
    }

    // Analyze timing patterns by hour of day
    const completionHour = new Date(completionRecord.completion_timestamp).getHours();
    const hourPattern = cognitivePattern.timing_patterns.get(completionHour) || {
      completions: 0,
      avg_success_rate: 0,
      avg_duration_accuracy: 0,
      cognitive_capacity_estimates: []
    };
    
    hourPattern.completions += 1;
    hourPattern.avg_success_rate = ((hourPattern.avg_success_rate * (hourPattern.completions - 1)) + 
                                   completionRecord.success_rate) / hourPattern.completions;
    hourPattern.avg_duration_accuracy = ((hourPattern.avg_duration_accuracy * (hourPattern.completions - 1)) + 
                                        completionRecord.duration_accuracy) / hourPattern.completions;
    
    cognitivePattern.timing_patterns.set(completionHour, hourPattern);

    // Keep recent data only
    if (cognitivePattern.cognitive_load_history.length > 30) {
      cognitivePattern.cognitive_load_history = cognitivePattern.cognitive_load_history.slice(-30);
    }

    cognitivePattern.last_updated = new Date().toISOString();
    this.cognitivePatterns.set(cognitiveKey, cognitivePattern);
  }

  /**
   * Update autonomous routing pattern
   */
  async updateAutonomousPattern(projectContext, completionRecord) {
    const autonomousKey = `${projectContext}:autonomous_pattern`;
    let autonomousPattern = this.autonomousPatterns.get(autonomousKey);

    if (!autonomousPattern) {
      autonomousPattern = {
        project_context: projectContext,
        autonomous_decisions: [],
        success_rates_by_model: new Map(),
        confidence_calibration: new Map(),
        escalation_patterns: new Map(),
        last_updated: new Date().toISOString()
      };
    }

    // Record autonomous usage data
    const autonomousData = {
      workflow_id: completionRecord.workflow_id,
      usage_rate: completionRecord.autonomous_routing_usage,
      success_rate: completionRecord.success_rate,
      timestamp: completionRecord.completion_timestamp
    };

    autonomousPattern.autonomous_decisions.push(autonomousData);

    // Keep recent data only
    if (autonomousPattern.autonomous_decisions.length > 25) {
      autonomousPattern.autonomous_decisions = autonomousPattern.autonomous_decisions.slice(-25);
    }

    autonomousPattern.last_updated = new Date().toISOString();
    this.autonomousPatterns.set(autonomousKey, autonomousPattern);
  }

  /**
   * Calculate pattern consistency
   */
  calculatePatternConsistency(completions) {
    if (completions.length < 2) return 0.5;

    // Calculate variance in success rates and durations
    const successRates = completions.map(c => c.success_rate);
    const durationAccuracies = completions.map(c => c.duration_accuracy);

    const successVariance = this.calculateVariance(successRates);
    const durationVariance = this.calculateVariance(durationAccuracies);

    // Lower variance means higher consistency
    const successConsistency = Math.max(0, 1 - (successVariance * 2));
    const durationConsistency = Math.max(0, 1 - (durationVariance * 2));

    return (successConsistency + durationConsistency) / 2;
  }

  /**
   * Calculate pattern stability over time
   */
  calculatePatternStability(pattern) {
    if (pattern.completions.length < this.learningConfig.min_pattern_occurrences) {
      return 0.3;
    }

    // Analyze stability over time periods
    const recentCompletions = pattern.completions.slice(-10);
    const olderCompletions = pattern.completions.slice(-20, -10);

    if (olderCompletions.length === 0) return 0.6;

    const recentAvgSuccess = recentCompletions.reduce((sum, c) => sum + c.success_rate, 0) / recentCompletions.length;
    const olderAvgSuccess = olderCompletions.reduce((sum, c) => sum + c.success_rate, 0) / olderCompletions.length;

    const successStability = Math.max(0, 1 - Math.abs(recentAvgSuccess - olderAvgSuccess));
    
    return Math.min(0.95, Math.max(0.3, successStability));
  }

  /**
   * Calculate variance of an array of numbers
   */
  calculateVariance(values) {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  /**
   * Get workflow suggestions based on historical patterns
   */
  async getWorkflowSuggestions(projectContext, taskInput, options = {}) {
    try {
      const patternKey = `${projectContext}:workflow_pattern`;
      const pattern = this.workflowPatterns.get(patternKey);
      
      if (!pattern || pattern.completions.length < this.learningConfig.min_pattern_occurrences) {
        return this.getDefaultWorkflowSuggestions(projectContext, taskInput);
      }

      const suggestions = [];

      // Primary suggestion based on most successful pattern
      const primarySuggestion = await this.generatePatternBasedSuggestion(pattern, taskInput);
      if (primarySuggestion) {
        suggestions.push(primarySuggestion);
      }

      // Alternative suggestions based on different execution strategies
      const alternatives = await this.generateAlternativeSuggestions(pattern, taskInput);
      suggestions.push(...alternatives);

      return {
        success: true,
        suggestions: suggestions.slice(0, 3), // Limit to top 3
        pattern_confidence: pattern.confidence,
        based_on_completions: pattern.completions.length
      };

    } catch (error) {
      console.error('Error getting workflow suggestions:', error);
      return {
        success: false,
        error: error.message,
        suggestions: []
      };
    }
  }

  /**
   * Generate workflow suggestion based on learned patterns
   */
  async generatePatternBasedSuggestion(pattern, taskInput) {
    // Analyze most common successful step sequence
    const commonSteps = Array.from(pattern.common_steps.entries())
      .filter(([_, data]) => data.success_rate >= this.learningConfig.success_threshold)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 6); // Top 6 most common steps

    if (commonSteps.length === 0) return null;

    const steps = commonSteps.map(([stepName, data], index) => ({
      phase: stepName,
      task_type: stepName.toLowerCase(),
      estimated_duration: Math.round(data.avg_duration),
      cognitive_load: this.inferCognitiveLoad(data.avg_duration),
      confidence: Math.min(0.95, data.success_rate),
      dependencies: index > 0 ? [commonSteps[index - 1][0].toLowerCase()] : [],
      optimal_timing: this.getOptimalTiming(stepName),
      parallel_possible: this.canRunInParallel(stepName, index, commonSteps)
    }));

    const totalDuration = steps.reduce((sum, step) => sum + step.estimated_duration, 0);
    const avgConfidence = steps.reduce((sum, step) => sum + step.confidence, 0) / steps.length;

    return {
      workflow_id: `pattern_wf_${Date.now()}`,
      name: `${pattern.project_context} Learned Workflow`,
      project_context: pattern.project_context,
      completion_probability: Math.min(0.95, avgConfidence),
      total_estimated_duration: totalDuration,
      steps: steps,
      cognitive_load_distribution: this.calculateCognitiveDistribution(steps),
      pattern_based: true,
      learning_source: 'historical_completions'
    };
  }

  /**
   * Generate alternative workflow suggestions
   */
  async generateAlternativeSuggestions(pattern, taskInput) {
    const alternatives = [];

    // Quick/simplified version
    const quickVersion = this.generateQuickWorkflow(pattern, taskInput);
    if (quickVersion) alternatives.push(quickVersion);

    // Detailed/comprehensive version  
    const detailedVersion = this.generateDetailedWorkflow(pattern, taskInput);
    if (detailedVersion) alternatives.push(detailedVersion);

    return alternatives;
  }

  /**
   * Generate quick workflow variant
   */
  generateQuickWorkflow(pattern, taskInput) {
    const essentialSteps = Array.from(pattern.common_steps.entries())
      .filter(([_, data]) => data.success_rate >= 0.8 && data.count >= 3)
      .sort((a, b) => b[1].success_rate - a[1].success_rate)
      .slice(0, 3); // Top 3 essential steps

    if (essentialSteps.length === 0) return null;

    const steps = essentialSteps.map(([stepName, data], index) => ({
      phase: `Quick ${stepName}`,
      task_type: stepName.toLowerCase(),
      estimated_duration: Math.round(data.avg_duration * 0.7), // 30% faster
      cognitive_load: 'medium',
      confidence: data.success_rate * 0.9, // Slightly less confident
      dependencies: index > 0 ? [essentialSteps[index - 1][0].toLowerCase()] : [],
      optimal_timing: ['any'],
      parallel_possible: true
    }));

    return {
      workflow_id: `quick_wf_${Date.now()}`,
      name: `Quick ${pattern.project_context} Workflow`,
      project_context: pattern.project_context,
      completion_probability: 0.78,
      total_estimated_duration: steps.reduce((sum, step) => sum + step.estimated_duration, 0),
      steps: steps,
      cognitive_load_distribution: {
        high_load_percentage: 30,
        medium_load_percentage: 50,
        low_load_percentage: 20,
        cognitive_balance: 'Speed Focused'
      },
      pattern_based: true,
      learning_source: 'essential_steps_only'
    };
  }

  /**
   * Generate detailed workflow variant
   */
  generateDetailedWorkflow(pattern, taskInput) {
    const allSteps = Array.from(pattern.common_steps.entries())
      .filter(([_, data]) => data.success_rate >= 0.6)
      .sort((a, b) => b[1].success_rate - a[1].success_rate);

    if (allSteps.length === 0) return null;

    const steps = allSteps.map(([stepName, data], index) => ({
      phase: `Detailed ${stepName}`,
      task_type: stepName.toLowerCase(),
      estimated_duration: Math.round(data.avg_duration * 1.3), // 30% longer for thoroughness
      cognitive_load: this.inferCognitiveLoad(data.avg_duration * 1.3),
      confidence: Math.min(0.95, data.success_rate),
      dependencies: this.inferDependencies(stepName, allSteps, index),
      optimal_timing: this.getOptimalTiming(stepName),
      parallel_possible: false // More careful, sequential approach
    }));

    return {
      workflow_id: `detailed_wf_${Date.now()}`,
      name: `Comprehensive ${pattern.project_context} Workflow`,
      project_context: pattern.project_context,
      completion_probability: 0.91,
      total_estimated_duration: steps.reduce((sum, step) => sum + step.estimated_duration, 0),
      steps: steps,
      cognitive_load_distribution: {
        high_load_percentage: 45,
        medium_load_percentage: 40,
        low_load_percentage: 15,
        cognitive_balance: 'Thorough'
      },
      pattern_based: true,
      learning_source: 'comprehensive_analysis'
    };
  }

  /**
   * Get default workflow suggestions when no patterns available
   */
  getDefaultWorkflowSuggestions(projectContext, taskInput) {
    const defaultSteps = [
      {
        phase: 'Planning',
        task_type: 'planning',
        estimated_duration: 20,
        cognitive_load: 'medium',
        confidence: 0.8,
        dependencies: [],
        optimal_timing: ['morning'],
        parallel_possible: false
      },
      {
        phase: 'Implementation',
        task_type: 'implementation',
        estimated_duration: 60,
        cognitive_load: 'high',
        confidence: 0.7,
        dependencies: ['planning'],
        optimal_timing: ['hyperfocus window'],
        parallel_possible: false
      },
      {
        phase: 'Review',
        task_type: 'review',
        estimated_duration: 15,
        cognitive_load: 'medium',
        confidence: 0.75,
        dependencies: ['implementation'],
        optimal_timing: ['afternoon'],
        parallel_possible: true
      }
    ];

    return {
      success: true,
      suggestions: [{
        workflow_id: `default_wf_${Date.now()}`,
        name: `Default ${projectContext} Workflow`,
        project_context: projectContext,
        completion_probability: 0.75,
        total_estimated_duration: 95,
        steps: defaultSteps,
        cognitive_load_distribution: {
          high_load_percentage: 63,
          medium_load_percentage: 37,
          low_load_percentage: 0,
          cognitive_balance: 'Balanced'
        },
        pattern_based: false,
        learning_source: 'default_template'
      }],
      pattern_confidence: 0.5,
      based_on_completions: 0
    };
  }

  /**
   * Infer cognitive load based on step duration
   */
  inferCognitiveLoad(duration) {
    if (duration <= 15) return 'low';
    if (duration <= 45) return 'medium';
    return 'high';
  }

  /**
   * Get optimal timing recommendations for step type
   */
  getOptimalTiming(stepName) {
    const timingMap = {
      'planning': ['morning', 'early afternoon'],
      'implementation': ['hyperfocus window', 'morning peak'],
      'coding': ['hyperfocus window', 'morning peak'],
      'testing': ['afternoon', 'late morning'],
      'review': ['afternoon', 'evening'],
      'documentation': ['any', 'low energy periods'],
      'research': ['morning', 'afternoon']
    };

    return timingMap[stepName.toLowerCase()] || ['any'];
  }

  /**
   * Determine if step can run in parallel
   */
  canRunInParallel(stepName, index, allSteps) {
    const parallelizable = ['testing', 'documentation', 'review', 'research'];
    const stepLower = stepName.toLowerCase();
    
    // First step usually can't be parallel
    if (index === 0) return false;
    
    // Check if step type is generally parallelizable
    return parallelizable.some(type => stepLower.includes(type));
  }

  /**
   * Infer dependencies based on step relationships
   */
  inferDependencies(stepName, allSteps, index) {
    const dependencies = [];
    const stepLower = stepName.toLowerCase();
    
    // Common dependency patterns
    if (stepLower.includes('implementation') || stepLower.includes('coding')) {
      const planningStep = allSteps.find(([name]) => name.toLowerCase().includes('planning'));
      if (planningStep) dependencies.push(planningStep[0].toLowerCase());
    }
    
    if (stepLower.includes('testing') || stepLower.includes('test')) {
      const implStep = allSteps.find(([name]) => 
        name.toLowerCase().includes('implementation') || name.toLowerCase().includes('coding')
      );
      if (implStep) dependencies.push(implStep[0].toLowerCase());
    }
    
    if (stepLower.includes('documentation') || stepLower.includes('review')) {
      // Usually depends on most other steps being complete
      const nonDocSteps = allSteps.filter(([name]) => 
        !name.toLowerCase().includes('documentation') && 
        !name.toLowerCase().includes('review')
      ).slice(0, 1); // Just the first non-doc step for simplicity
      
      nonDocSteps.forEach(([name]) => dependencies.push(name.toLowerCase()));
    }
    
    return dependencies;
  }

  /**
   * Calculate cognitive load distribution for steps
   */
  calculateCognitiveDistribution(steps) {
    const totalDuration = steps.reduce((sum, step) => sum + step.estimated_duration, 0);
    
    let highLoadTime = 0;
    let mediumLoadTime = 0;
    let lowLoadTime = 0;
    
    steps.forEach(step => {
      switch (step.cognitive_load) {
        case 'high':
          highLoadTime += step.estimated_duration;
          break;
        case 'medium':
          mediumLoadTime += step.estimated_duration;
          break;
        case 'low':
          lowLoadTime += step.estimated_duration;
          break;
      }
    });
    
    return {
      high_load_percentage: Math.round((highLoadTime / totalDuration) * 100),
      medium_load_percentage: Math.round((mediumLoadTime / totalDuration) * 100),
      low_load_percentage: Math.round((lowLoadTime / totalDuration) * 100),
      cognitive_balance: this.determineCognitiveBalance(highLoadTime, mediumLoadTime, lowLoadTime)
    };
  }

  /**
   * Determine cognitive balance description
   */
  determineCognitiveBalance(high, medium, low) {
    const total = high + medium + low;
    const highPct = high / total;
    const mediumPct = medium / total;
    
    if (highPct > 0.6) return 'High Load';
    if (highPct < 0.2) return 'Light Load';
    if (mediumPct > 0.5) return 'Moderate';
    return 'Balanced';
  }

  /**
   * Save workflow patterns to persistent storage
   */
  async saveWorkflowPatterns() {
    try {
      const patternsPath = path.join(this.patternStoragePath, 'workflow_patterns.json');
      const patternsData = {};
      
      for (const [key, pattern] of this.workflowPatterns) {
        // Convert Maps to Objects for JSON serialization
        patternsData[key] = {
          ...pattern,
          common_steps: Object.fromEntries(pattern.common_steps),
          modification_patterns: Object.fromEntries(pattern.modification_patterns)
        };
      }
      
      await fs.writeFile(patternsPath, JSON.stringify(patternsData, null, 2));
      
    } catch (error) {
      console.error('Error saving workflow patterns:', error);
    }
  }

  /**
   * Load workflow patterns from persistent storage
   */
  async loadWorkflowPatterns() {
    try {
      const patternsPath = path.join(this.patternStoragePath, 'workflow_patterns.json');
      const data = await fs.readFile(patternsPath, 'utf8');
      const patternsData = JSON.parse(data);
      
      for (const [key, pattern] of Object.entries(patternsData)) {
        // Convert Objects back to Maps
        pattern.common_steps = new Map(Object.entries(pattern.common_steps));
        pattern.modification_patterns = new Map(Object.entries(pattern.modification_patterns));
        this.workflowPatterns.set(key, pattern);
      }
      
      console.log(`Loaded ${this.workflowPatterns.size} workflow patterns`);
      
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error loading workflow patterns:', error);
      }
    }
  }

  /**
   * Save cognitive patterns to storage
   */
  async saveCognitivePatterns() {
    try {
      const cognitivePath = path.join(this.cognitiveStoragePath, 'cognitive_patterns.json');
      const cognitiveData = {};
      
      for (const [key, pattern] of this.cognitivePatterns) {
        cognitiveData[key] = {
          ...pattern,
          timing_patterns: Object.fromEntries(pattern.timing_patterns)
        };
      }
      
      await fs.writeFile(cognitivePath, JSON.stringify(cognitiveData, null, 2));
      
    } catch (error) {
      console.error('Error saving cognitive patterns:', error);
    }
  }

  /**
   * Load cognitive patterns from storage
   */
  async loadCognitivePatterns() {
    try {
      const cognitivePath = path.join(this.cognitiveStoragePath, 'cognitive_patterns.json');
      const data = await fs.readFile(cognitivePath, 'utf8');
      const cognitiveData = JSON.parse(data);
      
      for (const [key, pattern] of Object.entries(cognitiveData)) {
        pattern.timing_patterns = new Map(Object.entries(pattern.timing_patterns));
        this.cognitivePatterns.set(key, pattern);
      }
      
      console.log(`Loaded ${this.cognitivePatterns.size} cognitive patterns`);
      
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error loading cognitive patterns:', error);
      }
    }
  }

  /**
   * Load workflow templates from storage
   */
  async loadWorkflowTemplates() {
    try {
      const templatesPath = path.join(this.workflowStoragePath, 'templates.json');
      const data = await fs.readFile(templatesPath, 'utf8');
      const templatesData = JSON.parse(data);
      
      for (const [key, template] of Object.entries(templatesData)) {
        this.workflowTemplates.set(key, template);
      }
      
      console.log(`Loaded ${this.workflowTemplates.size} workflow templates`);
      
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error loading workflow templates:', error);
      }
    }
  }

  /**
   * Save workflow completion to persistent storage
   */
  async saveWorkflowCompletion(completionRecord) {
    try {
      const completionsPath = path.join(this.workflowStoragePath, 'completions.jsonl');
      const completionLine = JSON.stringify(completionRecord) + '\n';
      
      await fs.appendFile(completionsPath, completionLine);
      
    } catch (error) {
      console.error('Error saving workflow completion:', error);
    }
  }

  /**
   * Get workflow statistics for project
   */
  async getWorkflowStatistics(projectContext) {
    const patternKey = `${projectContext}:workflow_pattern`;
    const pattern = this.workflowPatterns.get(patternKey);
    
    if (!pattern) {
      return {
        project_context: projectContext,
        total_completions: 0,
        avg_success_rate: 0,
        avg_duration_accuracy: 0,
        pattern_confidence: 0,
        learning_status: 'insufficient_data'
      };
    }
    
    const recentCompletions = pattern.completions.slice(-20);
    
    return {
      project_context: projectContext,
      total_completions: pattern.completions.length,
      avg_success_rate: recentCompletions.reduce((sum, c) => sum + c.success_rate, 0) / recentCompletions.length,
      avg_duration_accuracy: recentCompletions.reduce((sum, c) => sum + (1 - c.duration_accuracy), 0) / recentCompletions.length,
      pattern_confidence: pattern.confidence,
      pattern_stability: pattern.pattern_stability,
      common_steps: Array.from(pattern.common_steps.entries()).map(([name, data]) => ({
        step_name: name,
        frequency: data.count,
        success_rate: data.success_rate,
        avg_duration: data.avg_duration
      })),
      learning_status: pattern.completions.length >= this.learningConfig.min_pattern_occurrences ? 
                      'learning_active' : 'building_patterns'
    };
  }

  /**
   * Close workflow memory manager
   */
  async close() {
    try {
      // Save current state to persistent storage
      await this.saveWorkflowPatterns();
      await this.saveCognitivePatterns();
      
      // Close underlying memory managers
      await this.projectMemory.close();
      await this.contextEngine.close();
      
      console.log('WorkflowMemoryManager closed');
    } catch (error) {
      console.error('Error closing WorkflowMemoryManager:', error);
    }
  }
}

module.exports = WorkflowMemoryManager;

// #endregion end: Workflow Memory Manager