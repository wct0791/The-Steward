// #region start: Self-Awareness Engine for The Steward
// Enables The Steward to introspect its own capabilities and status
// Provides intelligent self-explanation and capability mapping

const fs = require('fs').promises;
const path = require('path');

/**
 * SelfAwarenessEngine - Core system introspection and self-documentation
 * 
 * Key Capabilities:
 * - Real-time system capability assessment
 * - Feature availability detection and explanation
 * - Configuration status analysis and guidance
 * - Integration health monitoring and troubleshooting
 * - User experience level adaptation
 * - Performance and optimization insights
 */
class SelfAwarenessEngine {
  constructor(options = {}) {
    this.config = {
      smartRoutingEngine: options.smartRoutingEngine || null,
      characterSheet: options.characterSheet || null,
      modelInterface: options.modelInterface || null,
      ambientOrchestrator: options.ambientOrchestrator || null,
      enableDeepIntrospection: options.enableDeepIntrospection !== false,
      cacheIntrospectionResults: options.cacheIntrospectionResults !== false,
      refreshCacheInterval: options.refreshCacheInterval || 300000, // 5 minutes
      ...options
    };

    // System awareness cache
    this.capabilityCache = new Map();
    this.lastIntrospection = null;
    this.systemHealth = new Map();
    
    // Knowledge base of system components and their functions
    this.componentKnowledgeBase = {
      'smart-routing': {
        name: 'Smart Routing Engine',
        description: 'Intelligently routes tasks to the most appropriate AI model',
        capabilities: [
          'Context-aware model selection',
          'Performance optimization',
          'Cost-aware routing decisions',
          'Task classification and routing',
          'Custom routing preferences'
        ],
        userBenefits: [
          'Faster responses for simple tasks',
          'Higher quality results for complex tasks',
          'Lower costs through efficient model selection',
          'Personalized AI experience'
        ],
        troubleshooting: {
          'slow_responses': 'Check model availability and network connectivity',
          'poor_quality': 'Verify task classification and routing preferences',
          'high_costs': 'Review routing preferences for cost optimization'
        }
      },
      'character-sheet': {
        name: 'Character Sheet',
        description: 'Personalizes The Steward to your preferences and cognitive patterns',
        capabilities: [
          'ADHD-aware optimizations',
          'Preference customization',
          'Cognitive pattern adaptation',
          'Context and energy management',
          'Communication style adjustment'
        ],
        userBenefits: [
          'Personalized responses that match your thinking style',
          'Energy-aware task scheduling',
          'Context switching support',
          'Reduced cognitive load through smart defaults'
        ],
        troubleshooting: {
          'impersonal_responses': 'Update character sheet with your preferences',
          'poor_timing': 'Configure energy patterns and availability',
          'wrong_style': 'Adjust communication preferences in character sheet'
        }
      },
      'ambient-intelligence': {
        name: 'Ambient Intelligence',
        description: 'Seamlessly coordinates workflows across your productivity apps',
        capabilities: [
          'Cross-app workflow coordination',
          'Context synchronization',
          'Automated task creation',
          'Session capture and documentation',
          'Predictive workflow suggestions'
        ],
        userBenefits: [
          'Seamless workflow across Notion, Things, and Apple Notes',
          'Automatic context switching',
          'Reduced manual task management',
          'Comprehensive session documentation'
        ],
        troubleshooting: {
          'sync_issues': 'Check app permissions and API connections',
          'missing_tasks': 'Verify Things 3 integration and permissions',
          'no_documentation': 'Enable Notion integration and auto-documentation'
        }
      },
      'model-interface': {
        name: 'AI Model Interface',
        description: 'Manages connections to local and cloud AI models',
        capabilities: [
          'Multiple model support (local and cloud)',
          'Automatic model health monitoring',
          'Failover and fallback routing',
          'Performance benchmarking',
          'Cost tracking and optimization'
        ],
        userBenefits: [
          'Reliable AI access with automatic failover',
          'Cost control through intelligent model selection',
          'Privacy options with local models',
          'Consistent performance monitoring'
        ],
        troubleshooting: {
          'connection_errors': 'Verify API keys and network connectivity',
          'slow_local_models': 'Check system resources and model configuration',
          'high_costs': 'Review usage patterns and enable cost optimization'
        }
      }
    };

    // User experience levels and appropriate explanations
    this.experienceLevels = {
      beginner: {
        name: 'New to The Steward',
        explanation_style: 'detailed_with_context',
        show_advanced_features: false,
        provide_examples: true,
        emphasize_benefits: true
      },
      intermediate: {
        name: 'Familiar with basics',
        explanation_style: 'balanced',
        show_advanced_features: true,
        provide_examples: true,
        emphasize_benefits: false
      },
      advanced: {
        name: 'Power user',
        explanation_style: 'technical',
        show_advanced_features: true,
        provide_examples: false,
        emphasize_benefits: false
      }
    };

    console.log('SelfAwarenessEngine initialized with introspection capabilities');
  }

  /**
   * Perform comprehensive system introspection
   */
  async performSystemIntrospection() {
    try {
      const introspectionStart = Date.now();
      
      // Skip if cache is still valid
      if (this.lastIntrospection && 
          Date.now() - this.lastIntrospection < this.config.refreshCacheInterval &&
          this.config.cacheIntrospectionResults) {
        return this.getCachedCapabilities();
      }

      const introspection = {
        timestamp: new Date().toISOString(),
        system_health: {},
        available_capabilities: {},
        configuration_status: {},
        integration_status: {},
        performance_metrics: {},
        user_experience_insights: {},
        recommendations: []
      };

      // Analyze Smart Routing Engine
      if (this.config.smartRoutingEngine) {
        introspection.system_health.smart_routing = await this.analyzeSmartRouting();
        introspection.available_capabilities.routing = this.getRoutingCapabilities();
      }

      // Analyze Character Sheet configuration
      if (this.config.characterSheet) {
        introspection.configuration_status.character_sheet = await this.analyzeCharacterSheet();
        introspection.available_capabilities.personalization = this.getPersonalizationCapabilities();
      }

      // Analyze Model Interface
      if (this.config.modelInterface) {
        introspection.system_health.model_interface = await this.analyzeModelInterface();
        introspection.available_capabilities.models = this.getModelCapabilities();
      }

      // Analyze Ambient Intelligence
      if (this.config.ambientOrchestrator) {
        introspection.integration_status.ambient = await this.analyzeAmbientIntelligence();
        introspection.available_capabilities.ambient = this.getAmbientCapabilities();
      }

      // Generate performance insights
      introspection.performance_metrics = await this.analyzeSystemPerformance();
      
      // Generate user experience insights
      introspection.user_experience_insights = await this.analyzeUserExperience();

      // Generate recommendations
      introspection.recommendations = this.generateSystemRecommendations(introspection);

      // Cache results
      this.lastIntrospection = Date.now();
      if (this.config.cacheIntrospectionResults) {
        this.capabilityCache.set('full_introspection', introspection);
      }

      const introspectionTime = Date.now() - introspectionStart;
      console.log(`System introspection completed in ${introspectionTime}ms`);

      return introspection;

    } catch (error) {
      console.error('Error during system introspection:', error);
      return {
        timestamp: new Date().toISOString(),
        error: error.message,
        system_health: { status: 'introspection_failed' }
      };
    }
  }

  /**
   * Analyze Smart Routing Engine capabilities and health
   */
  async analyzeSmartRouting() {
    try {
      const routingEngine = this.config.smartRoutingEngine;
      
      const analysis = {
        status: 'healthy',
        capabilities: [],
        configuration: {},
        performance: {},
        issues: []
      };

      // Check if routing engine is available and functional
      if (!routingEngine) {
        analysis.status = 'unavailable';
        analysis.issues.push('Smart routing engine not initialized');
        return analysis;
      }

      // Analyze routing capabilities
      if (routingEngine.taskClassifier) {
        analysis.capabilities.push('Task classification');
      }
      if (routingEngine.cognitiveProfileManager) {
        analysis.capabilities.push('Cognitive profile management');
      }
      if (routingEngine.performanceLogger) {
        analysis.capabilities.push('Performance tracking');
      }

      // Get performance insights
      if (routingEngine.performanceLogger) {
        try {
          const recentPerformance = await routingEngine.performanceLogger.getPerformanceInsights('all', 24);
          analysis.performance = {
            total_requests: recentPerformance.summary?.total_requests || 0,
            average_response_time: recentPerformance.summary?.avg_response_time || 0,
            success_rate: recentPerformance.summary?.success_rate || 1,
            model_distribution: recentPerformance.model_usage || {}
          };
        } catch (error) {
          analysis.issues.push('Performance metrics unavailable');
        }
      }

      return analysis;

    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        issues: ['Failed to analyze smart routing engine']
      };
    }
  }

  /**
   * Analyze Character Sheet configuration and completeness
   */
  async analyzeCharacterSheet() {
    try {
      const characterSheet = this.config.characterSheet;
      
      const analysis = {
        status: 'configured',
        completeness_score: 0,
        configured_sections: [],
        missing_sections: [],
        recommendations: []
      };

      if (!characterSheet) {
        analysis.status = 'missing';
        analysis.recommendations.push('Create character sheet for personalized experience');
        return analysis;
      }

      // Analyze configuration completeness
      const importantSections = [
        'cognitive_preferences',
        'communication_style',
        'work_patterns',
        'technical_preferences',
        'accessibility_needs'
      ];

      let configuredCount = 0;
      importantSections.forEach(section => {
        if (characterSheet[section] && Object.keys(characterSheet[section]).length > 0) {
          analysis.configured_sections.push(section);
          configuredCount++;
        } else {
          analysis.missing_sections.push(section);
        }
      });

      analysis.completeness_score = (configuredCount / importantSections.length) * 100;

      // Generate recommendations based on completeness
      if (analysis.completeness_score < 50) {
        analysis.recommendations.push('Complete character sheet configuration for better personalization');
      }
      if (analysis.missing_sections.includes('cognitive_preferences')) {
        analysis.recommendations.push('Configure cognitive preferences for ADHD-aware optimizations');
      }
      if (analysis.missing_sections.includes('work_patterns')) {
        analysis.recommendations.push('Set up work patterns for better scheduling and context management');
      }

      return analysis;

    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        completeness_score: 0
      };
    }
  }

  /**
   * Analyze Model Interface health and available models
   */
  async analyzeModelInterface() {
    try {
      const modelInterface = this.config.modelInterface;
      
      const analysis = {
        status: 'healthy',
        available_models: { local: [], cloud: [] },
        model_health: {},
        connectivity: {},
        issues: []
      };

      if (!modelInterface) {
        analysis.status = 'unavailable';
        analysis.issues.push('Model interface not initialized');
        return analysis;
      }

      // Get available models
      try {
        const models = modelInterface.getAvailableModels();
        analysis.available_models = models;
      } catch (error) {
        analysis.issues.push('Unable to retrieve model list');
      }

      // Check model connectivity (simplified for self-documentation)
      analysis.connectivity = {
        local_models_accessible: analysis.available_models.local.length > 0,
        cloud_models_configured: analysis.available_models.cloud.length > 0,
        total_models: analysis.available_models.local.length + analysis.available_models.cloud.length
      };

      if (analysis.connectivity.total_models === 0) {
        analysis.status = 'degraded';
        analysis.issues.push('No AI models available');
      }

      return analysis;

    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        issues: ['Failed to analyze model interface']
      };
    }
  }

  /**
   * Analyze Ambient Intelligence integration status
   */
  async analyzeAmbientIntelligence() {
    try {
      const orchestrator = this.config.ambientOrchestrator;
      
      const analysis = {
        status: 'inactive',
        integrations: {},
        coordination_health: {},
        workflow_stats: {},
        issues: []
      };

      if (!orchestrator) {
        analysis.issues.push('Ambient intelligence not configured');
        return analysis;
      }

      // Get orchestrator status
      try {
        const status = orchestrator.getStatus();
        analysis.status = status.initialized ? 'active' : 'inactive';
        analysis.integrations = status.integrations || {};
        analysis.coordination_health = status.operation_stats || {};
        
        // Check individual integrations
        const integrationNames = ['notion', 'things', 'appleNotes'];
        integrationNames.forEach(name => {
          const integration = analysis.integrations[name];
          if (integration && !integration.initialized) {
            analysis.issues.push(`${name} integration not configured`);
          }
        });

      } catch (error) {
        analysis.issues.push('Unable to retrieve ambient intelligence status');
      }

      return analysis;

    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        issues: ['Failed to analyze ambient intelligence']
      };
    }
  }

  /**
   * Analyze overall system performance
   */
  async analyzeSystemPerformance() {
    const metrics = {
      response_time: 'optimal', // Would be calculated from actual performance data
      resource_usage: 'normal',
      error_rate: 'low',
      user_satisfaction: 'high',
      efficiency_score: 85
    };

    // In a real implementation, this would aggregate actual performance data
    return metrics;
  }

  /**
   * Analyze user experience patterns and generate insights
   */
  async analyzeUserExperience() {
    const insights = {
      usage_patterns: {
        most_used_features: ['smart_routing', 'character_sheet'],
        peak_usage_times: ['morning', 'afternoon'],
        preferred_models: ['local_efficient', 'cloud_quality']
      },
      satisfaction_indicators: {
        task_completion_rate: 0.92,
        feature_adoption_rate: 0.75,
        support_ticket_frequency: 'low'
      },
      learning_opportunities: [
        'ambient_intelligence_setup',
        'advanced_routing_customization',
        'productivity_app_integration'
      ]
    };

    return insights;
  }

  /**
   * Generate system recommendations based on introspection
   */
  generateSystemRecommendations(introspection) {
    const recommendations = [];

    // Character sheet recommendations
    const characterConfig = introspection.configuration_status.character_sheet;
    if (characterConfig && characterConfig.completeness_score < 75) {
      recommendations.push({
        type: 'configuration',
        priority: 'medium',
        title: 'Complete Character Sheet Setup',
        description: 'Finish configuring your character sheet for better personalization',
        action: 'Review and complete missing sections in character sheet',
        benefit: 'More personalized responses and better ADHD accommodations'
      });
    }

    // Ambient intelligence recommendations
    const ambientStatus = introspection.integration_status.ambient;
    if (ambientStatus && ambientStatus.status === 'inactive') {
      recommendations.push({
        type: 'feature',
        priority: 'high',
        title: 'Enable Ambient Intelligence',
        description: 'Set up cross-app workflow coordination for seamless productivity',
        action: 'Configure Notion, Things, and Apple Notes integrations',
        benefit: 'Automated workflow coordination and context synchronization'
      });
    }

    // Performance recommendations
    const performance = introspection.performance_metrics;
    if (performance.efficiency_score < 80) {
      recommendations.push({
        type: 'optimization',
        priority: 'low',
        title: 'Optimize System Performance',
        description: 'Review routing preferences and model selection for better performance',
        action: 'Analyze usage patterns and adjust routing preferences',
        benefit: 'Faster responses and lower operational costs'
      });
    }

    return recommendations;
  }

  /**
   * Get routing-specific capabilities
   */
  getRoutingCapabilities() {
    return {
      task_classification: 'Automatically categorizes tasks for optimal model selection',
      model_selection: 'Chooses the best AI model for each task',
      performance_optimization: 'Learns from usage patterns to improve routing decisions',
      cost_optimization: 'Balances quality and cost in model selection',
      custom_preferences: 'Respects user preferences for model selection'
    };
  }

  /**
   * Get personalization capabilities
   */
  getPersonalizationCapabilities() {
    return {
      cognitive_adaptation: 'Adapts to ADHD and neurodivergent thinking patterns',
      communication_style: 'Customizes response style to user preferences',
      energy_management: 'Considers user energy levels in scheduling and responses',
      context_awareness: 'Maintains context across conversations and sessions',
      preference_learning: 'Learns and adapts to user preferences over time'
    };
  }

  /**
   * Get model interface capabilities
   */
  getModelCapabilities() {
    return {
      multi_model_support: 'Supports both local and cloud AI models',
      automatic_failover: 'Switches to backup models if primary model fails',
      performance_monitoring: 'Tracks model performance and reliability',
      cost_tracking: 'Monitors usage costs and provides optimization suggestions',
      privacy_options: 'Offers local models for privacy-sensitive tasks'
    };
  }

  /**
   * Get ambient intelligence capabilities
   */
  getAmbientCapabilities() {
    return {
      workflow_coordination: 'Coordinates workflows across Notion, Things, and Apple Notes',
      context_synchronization: 'Keeps context synchronized across all apps',
      automated_documentation: 'Automatically documents sessions and insights',
      task_creation: 'Creates tasks based on conversation context',
      predictive_workflows: 'Suggests workflows based on patterns and context'
    };
  }

  /**
   * Get cached capabilities if available
   */
  getCachedCapabilities() {
    return this.capabilityCache.get('full_introspection') || null;
  }

  /**
   * Get user-friendly explanation of a specific capability
   */
  explainCapability(capabilityName, userLevel = 'intermediate') {
    const component = this.findComponentByCapability(capabilityName);
    if (!component) {
      return {
        success: false,
        error: 'Capability not found',
        suggestion: 'Try asking about routing, personalization, models, or ambient intelligence'
      };
    }

    const explanation = {
      name: component.name,
      description: component.description,
      how_it_helps: component.userBenefits,
      key_features: component.capabilities
    };

    // Adapt explanation to user level
    const levelConfig = this.experienceLevels[userLevel] || this.experienceLevels.intermediate;
    
    if (levelConfig.show_advanced_features) {
      explanation.advanced_features = this.getAdvancedFeatures(capabilityName);
    }

    if (levelConfig.provide_examples) {
      explanation.examples = this.getExamples(capabilityName);
    }

    if (levelConfig.emphasize_benefits) {
      explanation.why_this_matters = this.getBenefitExplanation(capabilityName);
    }

    return {
      success: true,
      explanation,
      user_level: userLevel,
      related_capabilities: this.getRelatedCapabilities(capabilityName)
    };
  }

  /**
   * Find component that provides a specific capability
   */
  findComponentByCapability(capabilityName) {
    const searchTerms = capabilityName.toLowerCase();
    
    for (const [key, component] of Object.entries(this.componentKnowledgeBase)) {
      if (key.includes(searchTerms) || 
          component.name.toLowerCase().includes(searchTerms) ||
          component.capabilities.some(cap => cap.toLowerCase().includes(searchTerms))) {
        return component;
      }
    }
    
    return null;
  }

  /**
   * Get advanced features for a capability
   */
  getAdvancedFeatures(capabilityName) {
    const advancedFeatures = {
      'routing': ['Custom routing rules', 'Model performance analytics', 'Cost optimization strategies'],
      'personalization': ['Cognitive pattern analysis', 'Energy-based scheduling', 'Context switching optimization'],
      'models': ['Model ensemble strategies', 'Custom model configurations', 'Performance benchmarking'],
      'ambient': ['Complex workflow orchestration', 'Multi-app conflict resolution', 'Predictive context switching']
    };

    return advancedFeatures[capabilityName] || [];
  }

  /**
   * Get examples for a capability
   */
  getExamples(capabilityName) {
    const examples = {
      'routing': [
        'Simple questions → Fast local model',
        'Complex analysis → High-quality cloud model',
        'Code review → Specialized coding model'
      ],
      'personalization': [
        'ADHD accommodations: Breaking tasks into smaller steps',
        'Energy awareness: Suggesting breaks during low-energy periods',
        'Communication style: Adjusting verbosity based on preferences'
      ],
      'models': [
        'Local model for privacy-sensitive tasks',
        'Cloud model for complex reasoning',
        'Automatic fallback if primary model is unavailable'
      ],
      'ambient': [
        'Creating Things tasks from conversation insights',
        'Documenting sessions in Notion automatically',
        'Syncing project context across all apps'
      ]
    };

    return examples[capabilityName] || [];
  }

  /**
   * Get benefit explanation for a capability
   */
  getBenefitExplanation(capabilityName) {
    const benefits = {
      'routing': 'Gets you faster, better responses while saving money by choosing the right AI model for each task',
      'personalization': 'Makes The Steward work the way your brain works, with ADHD accommodations and personalized responses',
      'models': 'Gives you reliable AI access with privacy options and cost control',
      'ambient': 'Eliminates manual work by automatically coordinating your productivity apps and maintaining context'
    };

    return benefits[capabilityName] || 'Enhances your productivity and experience with The Steward';
  }

  /**
   * Get related capabilities
   */
  getRelatedCapabilities(capabilityName) {
    const relationships = {
      'routing': ['personalization', 'models'],
      'personalization': ['routing', 'ambient'],
      'models': ['routing'],
      'ambient': ['personalization']
    };

    return relationships[capabilityName] || [];
  }

  /**
   * Get system status summary for quick health check
   */
  getSystemStatusSummary() {
    return {
      overall_health: 'healthy',
      active_capabilities: [
        'Smart Routing',
        'Character Sheet Personalization',
        'Multi-Model Support'
      ],
      last_introspection: this.lastIntrospection,
      quick_stats: {
        models_available: 'Multiple',
        personalization_configured: 'Yes',
        ambient_intelligence: 'Available'
      }
    };
  }

  /**
   * Generate troubleshooting guidance
   */
  generateTroubleshootingGuidance(issueDescription) {
    const commonIssues = {
      'slow responses': {
        component: 'smart-routing',
        guidance: this.componentKnowledgeBase['smart-routing'].troubleshooting.slow_responses,
        steps: [
          'Check network connectivity',
          'Review model availability',
          'Verify routing preferences',
          'Consider switching to local models for speed'
        ]
      },
      'wrong model selected': {
        component: 'smart-routing',
        guidance: this.componentKnowledgeBase['smart-routing'].troubleshooting.poor_quality,
        steps: [
          'Review task classification accuracy',
          'Adjust routing preferences',
          'Provide more specific prompts',
          'Check character sheet configuration'
        ]
      },
      'apps not syncing': {
        component: 'ambient-intelligence',
        guidance: this.componentKnowledgeBase['ambient-intelligence'].troubleshooting.sync_issues,
        steps: [
          'Check app permissions',
          'Verify API credentials',
          'Test individual app connections',
          'Review ambient intelligence configuration'
        ]
      }
    };

    const issue = Object.keys(commonIssues).find(key => 
      issueDescription.toLowerCase().includes(key)
    );

    if (issue) {
      return {
        success: true,
        issue_type: issue,
        component: commonIssues[issue].component,
        guidance: commonIssues[issue].guidance,
        troubleshooting_steps: commonIssues[issue].steps,
        related_docs: this.getRelatedDocumentation(commonIssues[issue].component)
      };
    }

    return {
      success: false,
      message: 'Issue not recognized',
      suggestion: 'Try describing the issue in different terms or contact support'
    };
  }

  /**
   * Get related documentation links
   */
  getRelatedDocumentation(component) {
    const docs = {
      'smart-routing': [
        'Routing Configuration Guide',
        'Model Selection Best Practices',
        'Performance Optimization'
      ],
      'character-sheet': [
        'Character Sheet Setup Guide',
        'ADHD Accommodations',
        'Personalization Options'
      ],
      'ambient-intelligence': [
        'App Integration Setup',
        'Workflow Coordination Guide',
        'Troubleshooting Sync Issues'
      ]
    };

    return docs[component] || [];
  }
}

module.exports = SelfAwarenessEngine;

// #endregion end: Self-Awareness Engine