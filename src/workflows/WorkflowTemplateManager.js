// #region start: Workflow Template Manager for The Steward
// Manages workflow templates and automation rules for ambient intelligence
// Provides template creation, customization, and execution management

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

/**
 * WorkflowTemplateManager - Manages reusable workflow templates and automation
 * 
 * Key Features:
 * - Create and manage custom workflow templates
 * - Define automation rules and triggers
 * - Template versioning and inheritance
 * - Cross-project pattern recognition and template suggestions
 * - Performance tracking and template optimization
 * - Integration with ambient intelligence system
 */
class WorkflowTemplateManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      templates_directory: options.templatesDirectory || './data/workflow-templates',
      auto_save_templates: options.autoSaveTemplates !== false,
      template_versioning: options.templateVersioning !== false,
      cross_project_learning: options.crossProjectLearning !== false,
      min_template_usage: options.minTemplateUsage || 3, // Minimum uses before suggesting template
      template_confidence_threshold: options.templateConfidenceThreshold || 0.7,
      max_templates_per_category: options.maxTemplatesPerCategory || 20
    };

    // Template storage
    this.templates = new Map();
    this.automationRules = new Map();
    this.templateUsageStats = new Map();
    this.templateVersions = new Map();
    
    // Categories for organization
    this.templateCategories = {
      steward_development: {
        name: 'Steward Development',
        description: 'Workflows for AI assistant development and improvement',
        color: '#1976d2',
        default_apps: ['notion', 'things', 'apple_notes']
      },
      creative_writing: {
        name: 'Creative Writing',
        description: 'Workflows for creative writing and content creation',
        color: '#9c27b0',
        default_apps: ['apple_notes', 'notion']
      },
      technical_research: {
        name: 'Technical Research',
        description: 'Workflows for technical research and analysis',
        color: '#f57c00',
        default_apps: ['notion', 'apple_notes']
      },
      quick_administrative: {
        name: 'Quick Administrative',
        description: 'Simple administrative and organizational tasks',
        color: '#4caf50',
        default_apps: ['things', 'apple_notes']
      },
      complex_analysis: {
        name: 'Complex Analysis',
        description: 'Multi-step analytical workflows',
        color: '#e91e63',
        default_apps: ['notion', 'things', 'apple_notes']
      }
    };

    // Built-in automation rules
    this.builtInAutomationRules = {
      session_start: {
        name: 'Session Start Coordination',
        description: 'Automatically coordinate apps when Steward session begins',
        trigger: 'steward_session_begins',
        conditions: [
          { condition: 'session_longer_than', value: 300 }, // 5 minutes
          { condition: 'project_context_available', value: true }
        ],
        actions: [
          'detect_project_context_from_notion',
          'prepare_apple_notes_capture',
          'check_things_task_schedule',
          'sync_contexts_across_apps'
        ],
        enabled: true,
        confidence: 0.9
      },
      workflow_creation: {
        name: 'Workflow Creation Automation',
        description: 'Auto-setup when predictive workflow is generated',
        trigger: 'predictive_workflow_generated',
        conditions: [
          { condition: 'workflow_confidence', value: 0.8 },
          { condition: 'cross_app_coordination_enabled', value: true }
        ],
        actions: [
          'create_things_tasks',
          'setup_notion_documentation',
          'initialize_notes_research_compilation',
          'establish_cross_app_sync_points'
        ],
        enabled: true,
        confidence: 0.85
      },
      session_completion: {
        name: 'Session Completion Processing',
        description: 'Process results when Steward session ends',
        trigger: 'steward_session_ends',
        conditions: [
          { condition: 'session_duration', value: 180 }, // 3 minutes minimum
          { condition: 'meaningful_content_generated', value: true }
        ],
        actions: [
          'capture_session_in_apple_notes',
          'update_things_task_progress',
          'sync_session_data_to_notion',
          'analyze_workflow_performance'
        ],
        enabled: true,
        confidence: 0.8
      },
      context_change_detected: {
        name: 'Context Change Propagation',
        description: 'Propagate context changes across apps',
        trigger: 'project_context_switch',
        conditions: [],
        actions: [
          'propagate_context_to_all_apps',
          'update_task_contexts_in_things',
          'create_context_switch_note',
          'adjust_cognitive_scheduling'
        ],
        enabled: true,
        confidence: 0.75,
        debounce: 30000 // 30 seconds
      }
    };

    console.log('WorkflowTemplateManager initialized with config:', this.config);
  }

  /**
   * Initialize the template manager
   */
  async initialize() {
    try {
      // Ensure templates directory exists
      await this.ensureTemplatesDirectory();
      
      // Load existing templates
      await this.loadTemplates();
      
      // Initialize built-in automation rules
      this.initializeBuiltInRules();
      
      // Load usage statistics
      await this.loadTemplateUsageStats();
      
      console.log(`WorkflowTemplateManager initialized with ${this.templates.size} templates and ${this.automationRules.size} rules`);
      return true;

    } catch (error) {
      console.error('Failed to initialize WorkflowTemplateManager:', error);
      return false;
    }
  }

  /**
   * Create a new workflow template
   */
  async createTemplate(templateData) {
    try {
      const {
        name,
        category = 'custom',
        description,
        steps,
        apps = [],
        cognitive_optimization = true,
        estimated_duration,
        complexity_level = 'medium',
        project_context,
        metadata = {}
      } = templateData;

      if (!name || !steps || steps.length === 0) {
        throw new Error('Template name and steps are required');
      }

      const templateId = this.generateTemplateId(name, category);
      
      const template = {
        id: templateId,
        name,
        category,
        description: description || `${name} workflow template`,
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'user',
        
        // Template configuration
        apps,
        cognitive_optimization,
        estimated_duration: estimated_duration || this.estimateTemplateDuration(steps),
        complexity_level,
        project_context,
        
        // Workflow structure
        steps: steps.map((step, index) => ({
          ...step,
          step_index: index,
          template_step_id: `${templateId}_step_${index}`
        })),
        
        // Usage and performance tracking
        usage_count: 0,
        success_rate: 0,
        performance_history: [],
        user_modifications: [],
        
        // Learning data
        cross_project_patterns: [],
        optimization_suggestions: [],
        
        // Metadata
        metadata: {
          ...metadata,
          source: 'user_created',
          learning_enabled: true
        }
      };

      // Validate template
      const validation = this.validateTemplate(template);
      if (!validation.valid) {
        throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
      }

      // Store template
      this.templates.set(templateId, template);
      
      // Initialize usage stats
      this.templateUsageStats.set(templateId, {
        total_uses: 0,
        successful_uses: 0,
        average_duration: 0,
        common_modifications: [],
        user_satisfaction: 0,
        created_at: new Date().toISOString()
      });

      // Save to disk if enabled
      if (this.config.auto_save_templates) {
        await this.saveTemplate(template);
      }

      // Emit template creation event
      this.emit('template_created', {
        template_id: templateId,
        template: template,
        category: category
      });

      console.log(`Created workflow template: ${name} (${templateId})`);
      return { success: true, template_id: templateId, template };

    } catch (error) {
      console.error('Error creating template:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get workflow templates by category or criteria
   */
  getTemplates(criteria = {}) {
    const {
      category,
      project_context,
      apps,
      complexity_level,
      min_success_rate,
      limit = 50
    } = criteria;

    let filteredTemplates = Array.from(this.templates.values());

    // Apply filters
    if (category) {
      filteredTemplates = filteredTemplates.filter(t => t.category === category);
    }

    if (project_context) {
      filteredTemplates = filteredTemplates.filter(t => 
        t.project_context === project_context || 
        t.cross_project_patterns.includes(project_context)
      );
    }

    if (apps && apps.length > 0) {
      filteredTemplates = filteredTemplates.filter(t =>
        apps.every(app => t.apps.includes(app))
      );
    }

    if (complexity_level) {
      filteredTemplates = filteredTemplates.filter(t => t.complexity_level === complexity_level);
    }

    if (min_success_rate !== undefined) {
      filteredTemplates = filteredTemplates.filter(t => t.success_rate >= min_success_rate);
    }

    // Sort by relevance (usage count, success rate, recency)
    filteredTemplates.sort((a, b) => {
      const scoreA = this.calculateTemplateRelevanceScore(a);
      const scoreB = this.calculateTemplateRelevanceScore(b);
      return scoreB - scoreA;
    });

    return filteredTemplates.slice(0, limit);
  }

  /**
   * Suggest templates based on current task and context
   */
  async suggestTemplates(taskInput, projectContext, options = {}) {
    try {
      const suggestions = [];
      
      // Analyze task input for patterns
      const taskAnalysis = this.analyzeTaskInput(taskInput);
      
      // Get templates that match the analysis
      const candidateTemplates = this.getTemplates({
        category: taskAnalysis.suggested_category,
        project_context: projectContext,
        complexity_level: taskAnalysis.complexity_level
      });

      // Score and rank templates
      for (const template of candidateTemplates) {
        const relevanceScore = this.calculateTemplateRelevance(template, taskInput, projectContext);
        
        if (relevanceScore > this.config.template_confidence_threshold) {
          suggestions.push({
            template,
            relevance_score: relevanceScore,
            confidence: Math.min(0.95, relevanceScore),
            adaptation_suggestions: this.suggestTemplateAdaptations(template, taskAnalysis),
            estimated_time_savings: this.estimateTimeSavings(template, taskAnalysis)
          });
        }
      }

      // Sort by relevance score
      suggestions.sort((a, b) => b.relevance_score - a.relevance_score);

      return {
        success: true,
        suggestions: suggestions.slice(0, 5), // Top 5 suggestions
        task_analysis: taskAnalysis,
        total_templates_analyzed: candidateTemplates.length
      };

    } catch (error) {
      console.error('Error suggesting templates:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create automation rule
   */
  createAutomationRule(ruleData) {
    try {
      const {
        name,
        description,
        trigger,
        conditions = [],
        actions = [],
        enabled = true,
        priority = 'medium',
        debounce = 0,
        metadata = {}
      } = ruleData;

      if (!name || !trigger || actions.length === 0) {
        throw new Error('Rule name, trigger, and actions are required');
      }

      const ruleId = this.generateRuleId(name);
      
      const rule = {
        id: ruleId,
        name,
        description: description || `Automation rule: ${name}`,
        trigger,
        conditions,
        actions,
        enabled,
        priority,
        debounce,
        
        // Performance tracking
        execution_count: 0,
        success_count: 0,
        failure_count: 0,
        average_execution_time: 0,
        
        // Metadata
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata
      };

      // Store rule
      this.automationRules.set(ruleId, rule);

      // Emit rule creation event
      this.emit('automation_rule_created', {
        rule_id: ruleId,
        rule: rule
      });

      console.log(`Created automation rule: ${name} (${ruleId})`);
      return { success: true, rule_id: ruleId, rule };

    } catch (error) {
      console.error('Error creating automation rule:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute automation rule
   */
  async executeAutomationRule(ruleId, triggerData = {}) {
    try {
      const rule = this.automationRules.get(ruleId);
      if (!rule) {
        throw new Error(`Automation rule not found: ${ruleId}`);
      }

      if (!rule.enabled) {
        return { success: false, reason: 'Rule is disabled' };
      }

      const startTime = Date.now();
      
      // Check conditions
      const conditionsMet = this.evaluateConditions(rule.conditions, triggerData);
      if (!conditionsMet) {
        return { success: false, reason: 'Conditions not met' };
      }

      // Execute actions
      const actionResults = [];
      for (const action of rule.actions) {
        try {
          const actionResult = await this.executeAction(action, triggerData);
          actionResults.push({ action, success: true, result: actionResult });
        } catch (error) {
          actionResults.push({ action, success: false, error: error.message });
        }
      }

      const executionTime = Date.now() - startTime;
      const successfulActions = actionResults.filter(r => r.success).length;
      const overallSuccess = successfulActions === rule.actions.length;

      // Update rule statistics
      rule.execution_count++;
      if (overallSuccess) {
        rule.success_count++;
      } else {
        rule.failure_count++;
      }
      rule.average_execution_time = (rule.average_execution_time + executionTime) / 2;
      rule.updated_at = new Date().toISOString();

      // Emit execution event
      this.emit('automation_rule_executed', {
        rule_id: ruleId,
        success: overallSuccess,
        execution_time: executionTime,
        actions_executed: actionResults.length,
        actions_successful: successfulActions
      });

      return {
        success: overallSuccess,
        rule_id: ruleId,
        execution_time: executionTime,
        actions_executed: actionResults,
        trigger_data: triggerData
      };

    } catch (error) {
      console.error('Error executing automation rule:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Record template usage and performance
   */
  async recordTemplateUsage(templateId, usageData) {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      const {
        success,
        actual_duration,
        user_modifications = [],
        user_satisfaction,
        completion_rate = 1.0,
        cognitive_load_accuracy
      } = usageData;

      // Update template statistics
      template.usage_count++;
      const prevSuccess = template.success_rate * (template.usage_count - 1);
      template.success_rate = (prevSuccess + (success ? 1 : 0)) / template.usage_count;
      template.updated_at = new Date().toISOString();

      // Record performance data
      template.performance_history.push({
        timestamp: new Date().toISOString(),
        success,
        actual_duration,
        completion_rate,
        cognitive_load_accuracy,
        user_satisfaction
      });

      // Keep only recent history
      if (template.performance_history.length > 50) {
        template.performance_history = template.performance_history.slice(-50);
      }

      // Track user modifications
      if (user_modifications.length > 0) {
        template.user_modifications.push({
          timestamp: new Date().toISOString(),
          modifications: user_modifications
        });

        // Suggest template improvements based on common modifications
        this.analyzeCommonModifications(template);
      }

      // Update usage statistics
      const stats = this.templateUsageStats.get(templateId);
      if (stats) {
        stats.total_uses++;
        if (success) stats.successful_uses++;
        
        stats.average_duration = (stats.average_duration + actual_duration) / 2;
        if (user_satisfaction) {
          stats.user_satisfaction = (stats.user_satisfaction + user_satisfaction) / 2;
        }
      }

      // Check if template should be suggested for optimization
      if (template.usage_count >= this.config.min_template_usage) {
        this.generateOptimizationSuggestions(template);
      }

      // Save updated template
      if (this.config.auto_save_templates) {
        await this.saveTemplate(template);
      }

      this.emit('template_usage_recorded', {
        template_id: templateId,
        usage_data: usageData,
        updated_stats: template
      });

      return { success: true, template_id: templateId };

    } catch (error) {
      console.error('Error recording template usage:', error);
      return { success: false, error: error.message };
    }
  }

  // Utility methods

  generateTemplateId(name, category) {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const timestamp = Date.now();
    return `${category}_${cleanName}_${timestamp}`;
  }

  generateRuleId(name) {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const timestamp = Date.now();
    return `rule_${cleanName}_${timestamp}`;
  }

  validateTemplate(template) {
    const errors = [];

    if (!template.name) errors.push('Template name is required');
    if (!template.steps || template.steps.length === 0) errors.push('Template must have at least one step');
    if (!template.category) errors.push('Template category is required');

    // Validate steps
    template.steps.forEach((step, index) => {
      if (!step.phase && !step.task_type) {
        errors.push(`Step ${index} must have a phase or task_type`);
      }
      if (!step.estimated_duration || step.estimated_duration <= 0) {
        errors.push(`Step ${index} must have a positive estimated duration`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  estimateTemplateDuration(steps) {
    return steps.reduce((total, step) => total + (step.estimated_duration || 30), 0);
  }

  calculateTemplateRelevanceScore(template) {
    const recencyBonus = this.calculateRecencyBonus(template.updated_at);
    const usageBonus = Math.min(1, template.usage_count / 10) * 0.3;
    const successBonus = template.success_rate * 0.4;
    
    return recencyBonus + usageBonus + successBonus;
  }

  calculateRecencyBonus(updatedAt) {
    const daysSinceUpdate = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, 1 - (daysSinceUpdate / 30)) * 0.3; // Decay over 30 days
  }

  analyzeTaskInput(taskInput) {
    const input = taskInput.toLowerCase();
    
    // Simple keyword-based analysis (could be enhanced with NLP)
    const categoryKeywords = {
      steward_development: ['steward', 'ai', 'model', 'routing', 'development'],
      creative_writing: ['story', 'write', 'creative', 'narrative', 'character'],
      technical_research: ['research', 'analysis', 'technical', 'study', 'investigate'],
      quick_administrative: ['quick', 'simple', 'organize', 'list', 'schedule'],
      complex_analysis: ['complex', 'analyze', 'detailed', 'comprehensive', 'multi-step']
    };

    let suggestedCategory = 'custom';
    let maxMatches = 0;

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      const matches = keywords.filter(keyword => input.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        suggestedCategory = category;
      }
    }

    const complexityLevel = 
      input.includes('complex') || input.includes('detailed') || input.includes('comprehensive') ? 'high' :
      input.includes('quick') || input.includes('simple') ? 'low' : 'medium';

    return {
      suggested_category: suggestedCategory,
      complexity_level: complexityLevel,
      keyword_matches: maxMatches,
      confidence: Math.min(0.9, maxMatches * 0.2 + 0.3)
    };
  }

  calculateTemplateRelevance(template, taskInput, projectContext) {
    let score = 0;

    // Category match
    const taskAnalysis = this.analyzeTaskInput(taskInput);
    if (template.category === taskAnalysis.suggested_category) {
      score += 0.4;
    }

    // Project context match
    if (template.project_context === projectContext) {
      score += 0.3;
    } else if (template.cross_project_patterns.includes(projectContext)) {
      score += 0.2;
    }

    // Performance bonus
    score += template.success_rate * 0.2;

    // Usage bonus
    score += Math.min(0.1, template.usage_count / 20);

    return Math.min(1.0, score);
  }

  suggestTemplateAdaptations(template, taskAnalysis) {
    const suggestions = [];

    // Complexity adaptations
    if (taskAnalysis.complexity_level !== template.complexity_level) {
      suggestions.push({
        type: 'complexity_adjustment',
        suggestion: `Adjust complexity from ${template.complexity_level} to ${taskAnalysis.complexity_level}`,
        confidence: 0.7
      });
    }

    // Duration adjustments based on complexity
    const complexityMultipliers = { low: 0.7, medium: 1.0, high: 1.4 };
    const suggestedDuration = template.estimated_duration * complexityMultipliers[taskAnalysis.complexity_level];
    
    if (Math.abs(suggestedDuration - template.estimated_duration) > 15) {
      suggestions.push({
        type: 'duration_adjustment',
        suggestion: `Adjust estimated duration to ${Math.round(suggestedDuration)} minutes`,
        confidence: 0.6
      });
    }

    return suggestions;
  }

  estimateTimeSavings(template, taskAnalysis) {
    // Simple heuristic for time savings
    const baseTime = taskAnalysis.complexity_level === 'high' ? 120 : 
                    taskAnalysis.complexity_level === 'medium' ? 60 : 30;
    
    const templateTime = template.estimated_duration;
    const timeSavings = Math.max(0, baseTime - templateTime);
    
    return {
      estimated_time_without_template: baseTime,
      estimated_time_with_template: templateTime,
      time_savings_minutes: timeSavings,
      efficiency_gain: timeSavings / baseTime
    };
  }

  evaluateConditions(conditions, triggerData) {
    return conditions.every(condition => {
      const { condition: conditionType, value } = condition;
      const triggerValue = triggerData[conditionType];

      switch (conditionType) {
        case 'session_longer_than':
          return triggerData.session_duration >= value;
        case 'project_context_available':
          return !!triggerData.project_context === value;
        case 'workflow_confidence':
          return (triggerData.workflow_confidence || 0) >= value;
        case 'cross_app_coordination_enabled':
          return !!triggerData.cross_app_coordination === value;
        case 'session_duration':
          return (triggerData.session_duration || 0) >= value;
        case 'meaningful_content_generated':
          return !!triggerData.meaningful_content === value;
        default:
          console.warn(`Unknown condition type: ${conditionType}`);
          return true;
      }
    });
  }

  async executeAction(action, triggerData) {
    // This would integrate with the actual ambient intelligence system
    console.log(`Executing action: ${action} with data:`, triggerData);
    
    // Return mock result for now
    return {
      success: true,
      action: action,
      executed_at: new Date().toISOString()
    };
  }

  analyzeCommonModifications(template) {
    const recentModifications = template.user_modifications.slice(-10);
    const commonPatterns = {};

    recentModifications.forEach(mod => {
      mod.modifications.forEach(change => {
        const key = `${change.type}_${change.field}`;
        commonPatterns[key] = (commonPatterns[key] || 0) + 1;
      });
    });

    // If a modification appears in >50% of recent uses, suggest template update
    Object.entries(commonPatterns).forEach(([pattern, count]) => {
      if (count / recentModifications.length > 0.5) {
        template.optimization_suggestions.push({
          type: 'common_modification',
          pattern: pattern,
          frequency: count / recentModifications.length,
          suggestion: `Consider updating template to include common modification: ${pattern}`,
          confidence: count / recentModifications.length
        });
      }
    });
  }

  generateOptimizationSuggestions(template) {
    const suggestions = [];
    const history = template.performance_history;

    if (history.length < 3) return;

    // Analyze duration accuracy
    const avgActualDuration = history.reduce((sum, h) => sum + h.actual_duration, 0) / history.length;
    const estimatedDuration = template.estimated_duration;
    
    if (Math.abs(avgActualDuration - estimatedDuration) > estimatedDuration * 0.2) {
      suggestions.push({
        type: 'duration_optimization',
        current_estimate: estimatedDuration,
        actual_average: Math.round(avgActualDuration),
        suggestion: `Update estimated duration from ${estimatedDuration} to ${Math.round(avgActualDuration)} minutes`,
        confidence: 0.8
      });
    }

    // Analyze success rate trends
    const recentHistory = history.slice(-10);
    const recentSuccessRate = recentHistory.filter(h => h.success).length / recentHistory.length;
    
    if (recentSuccessRate < 0.7 && template.success_rate > 0.8) {
      suggestions.push({
        type: 'quality_decline',
        trend: 'declining',
        suggestion: 'Template performance has declined recently. Consider reviewing and updating steps.',
        confidence: 0.7
      });
    }

    template.optimization_suggestions = suggestions;
  }

  async ensureTemplatesDirectory() {
    try {
      await fs.mkdir(this.config.templates_directory, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  async loadTemplates() {
    // Implementation would load from filesystem or database
    console.log('Loading templates from storage...');
  }

  async saveTemplate(template) {
    if (!this.config.auto_save_templates) return;
    
    try {
      const templatePath = path.join(this.config.templates_directory, `${template.id}.json`);
      await fs.writeFile(templatePath, JSON.stringify(template, null, 2));
    } catch (error) {
      console.error('Error saving template:', error);
    }
  }

  initializeBuiltInRules() {
    Object.entries(this.builtInAutomationRules).forEach(([ruleId, ruleData]) => {
      this.automationRules.set(ruleId, {
        ...ruleData,
        id: ruleId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        execution_count: 0,
        success_count: 0,
        failure_count: 0,
        average_execution_time: 0,
        metadata: { source: 'built_in' }
      });
    });
  }

  async loadTemplateUsageStats() {
    // Implementation would load from storage
    console.log('Loading template usage statistics...');
  }

  /**
   * Get template and automation statistics
   */
  getStats() {
    return {
      templates: {
        total: this.templates.size,
        by_category: this.getTemplatesByCategory(),
        average_success_rate: this.calculateAverageSuccessRate(),
        most_used: this.getMostUsedTemplates(5)
      },
      automation_rules: {
        total: this.automationRules.size,
        enabled: Array.from(this.automationRules.values()).filter(r => r.enabled).length,
        total_executions: Array.from(this.automationRules.values()).reduce((sum, r) => sum + r.execution_count, 0),
        success_rate: this.calculateAutomationSuccessRate()
      },
      categories: this.templateCategories
    };
  }

  getTemplatesByCategory() {
    const byCategory = {};
    Array.from(this.templates.values()).forEach(template => {
      byCategory[template.category] = (byCategory[template.category] || 0) + 1;
    });
    return byCategory;
  }

  calculateAverageSuccessRate() {
    const templates = Array.from(this.templates.values());
    if (templates.length === 0) return 0;
    
    const totalSuccess = templates.reduce((sum, t) => sum + t.success_rate, 0);
    return totalSuccess / templates.length;
  }

  getMostUsedTemplates(limit = 5) {
    return Array.from(this.templates.values())
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, limit)
      .map(t => ({ id: t.id, name: t.name, usage_count: t.usage_count }));
  }

  calculateAutomationSuccessRate() {
    const rules = Array.from(this.automationRules.values());
    const totalExecutions = rules.reduce((sum, r) => sum + r.execution_count, 0);
    const totalSuccesses = rules.reduce((sum, r) => sum + r.success_count, 0);
    
    return totalExecutions > 0 ? totalSuccesses / totalExecutions : 0;
  }

  /**
   * Close template manager
   */
  async close() {
    this.templates.clear();
    this.automationRules.clear();
    this.templateUsageStats.clear();
    this.templateVersions.clear();
    this.removeAllListeners();
    
    console.log('WorkflowTemplateManager closed');
  }
}

module.exports = WorkflowTemplateManager;

// #endregion end: Workflow Template Manager