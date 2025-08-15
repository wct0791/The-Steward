// #region start: Feature Discovery System for The Steward
// Intelligently suggests relevant features and provides just-in-time learning
// Tracks user expertise and adapts feature introduction accordingly

/**
 * FeatureDiscovery - Intelligent feature suggestion and progressive disclosure system
 * 
 * Key Capabilities:
 * - Usage pattern analysis for feature suggestions
 * - Progressive feature introduction based on user expertise
 * - Context-aware feature recommendations
 * - Just-in-time learning opportunities
 * - Expertise level tracking and adaptation
 * - Onboarding optimization
 */
class FeatureDiscovery {
  constructor(options = {}) {
    this.config = {
      selfAwarenessEngine: options.selfAwarenessEngine || null,
      trackUsagePatterns: options.trackUsagePatterns !== false,
      enableProactiveDiscovery: options.enableProactiveDiscovery !== false,
      minUsageForSuggestion: options.minUsageForSuggestion || 3,
      expertiseThreshold: options.expertiseThreshold || 10, // interactions to be considered experienced
      maxSuggestionsPerSession: options.maxSuggestionsPerSession || 3,
      cooldownBetweenSuggestions: options.cooldownBetweenSuggestions || 3600000, // 1 hour
      ...options
    };

    // User expertise and usage tracking
    this.userExpertise = new Map(); // Feature -> usage count
    this.usagePatterns = new Map(); // Pattern tracking
    this.featureSuggestionHistory = [];
    this.lastSuggestionTime = new Map(); // Feature -> last suggested time

    // Feature database with progressive disclosure logic
    this.featureDatabase = {
      // Basic features - shown to new users
      basic: {
        smart_routing: {
          name: 'Smart Routing',
          description: 'Automatic AI model selection for optimal responses',
          benefits: ['Faster responses', 'Better quality', 'Cost optimization'],
          prerequisites: [],
          setup_difficulty: 'automatic',
          time_to_value: '0 minutes',
          usage_indicators: ['multiple_requests', 'varied_task_types'],
          discovery_triggers: ['first_use', 'poor_response_quality'],
          explanation: 'The Steward automatically chooses the best AI model for each task'
        },
        character_sheet: {
          name: 'Character Sheet',
          description: 'Personalize responses to match your preferences and cognitive style',
          benefits: ['Personalized responses', 'ADHD accommodations', 'Better task matching'],
          prerequisites: [],
          setup_difficulty: 'easy',
          time_to_value: '5 minutes',
          usage_indicators: ['repeated_use', 'preference_mentions'],
          discovery_triggers: ['impersonal_responses', 'after_3_sessions'],
          explanation: 'Tell The Steward about your preferences and cognitive patterns for better assistance'
        }
      },

      // Intermediate features - shown after basic mastery
      intermediate: {
        routing_preferences: {
          name: 'Routing Preferences',
          description: 'Customize how The Steward selects AI models for your tasks',
          benefits: ['Fine-tuned responses', 'Cost control', 'Speed optimization'],
          prerequisites: ['smart_routing'],
          setup_difficulty: 'medium',
          time_to_value: '10 minutes',
          usage_indicators: ['model_dissatisfaction', 'cost_concerns', 'speed_issues'],
          discovery_triggers: ['after_routing_mastery', 'cost_spike', 'slow_responses'],
          explanation: 'Adjust model selection criteria to match your specific quality, speed, and cost preferences'
        },
        performance_analytics: {
          name: 'Performance Analytics',
          description: 'Track and optimize your AI usage patterns and costs',
          benefits: ['Usage insights', 'Cost optimization', 'Performance tracking'],
          prerequisites: ['smart_routing'],
          setup_difficulty: 'easy',
          time_to_value: '2 minutes',
          usage_indicators: ['heavy_usage', 'cost_consciousness'],
          discovery_triggers: ['high_usage_week', 'cost_threshold'],
          explanation: 'Monitor your AI usage, costs, and response quality to optimize your setup'
        }
      },

      // Advanced features - shown to power users
      advanced: {
        ambient_intelligence: {
          name: 'Ambient Intelligence',
          description: 'Seamless workflow coordination across Notion, Things, and Apple Notes',
          benefits: ['Automated workflows', 'Context synchronization', 'Productivity boost'],
          prerequisites: ['character_sheet'],
          setup_difficulty: 'complex',
          time_to_value: '30 minutes',
          usage_indicators: ['productivity_mentions', 'app_usage', 'workflow_discussions'],
          discovery_triggers: ['workflow_inefficiency', 'productivity_focus', 'power_user_status'],
          explanation: 'Connect your productivity apps for automatic task creation, context sync, and workflow coordination'
        },
        custom_models: {
          name: 'Custom Model Integration',
          description: 'Add and configure your own local or specialized AI models',
          benefits: ['Model flexibility', 'Specialized capabilities', 'Ultimate customization'],
          prerequisites: ['routing_preferences', 'performance_analytics'],
          setup_difficulty: 'expert',
          time_to_value: '60 minutes',
          usage_indicators: ['model_limitations', 'specialized_needs', 'technical_discussions'],
          discovery_triggers: ['model_frustration', 'specialized_requirements', 'expert_status'],
          explanation: 'Integrate specialized or custom AI models for specific use cases and requirements'
        },
        automation_rules: {
          name: 'Automation Rules',
          description: 'Create custom automation rules for The Steward\'s behavior',
          benefits: ['Custom workflows', 'Advanced automation', 'Personalized AI behavior'],
          prerequisites: ['ambient_intelligence'],
          setup_difficulty: 'expert',
          time_to_value: '45 minutes',
          usage_indicators: ['repetitive_patterns', 'workflow_optimization', 'power_user_behavior'],
          discovery_triggers: ['workflow_mastery', 'repetitive_tasks', 'automation_interest'],
          explanation: 'Define custom rules for how The Steward responds to specific situations and contexts'
        }
      },

      // Experimental features - shown contextually
      experimental: {
        voice_interface: {
          name: 'Voice Interface',
          description: 'Interact with The Steward using voice commands and responses',
          benefits: ['Hands-free interaction', 'Natural conversation', 'Accessibility'],
          prerequisites: ['character_sheet'],
          setup_difficulty: 'medium',
          time_to_value: '15 minutes',
          usage_indicators: ['accessibility_needs', 'mobile_usage', 'multitasking'],
          discovery_triggers: ['accessibility_request', 'mobile_heavy_usage'],
          explanation: 'Use voice commands to interact with The Steward naturally and hands-free'
        },
        collaboration_mode: {
          name: 'Collaboration Mode',
          description: 'Share contexts and workflows with team members',
          benefits: ['Team coordination', 'Shared context', 'Collaborative AI'],
          prerequisites: ['ambient_intelligence'],
          setup_difficulty: 'complex',
          time_to_value: '20 minutes',
          usage_indicators: ['team_mentions', 'collaboration_needs', 'sharing_requests'],
          discovery_triggers: ['team_work_detected', 'sharing_attempts'],
          explanation: 'Enable secure collaboration features for team-based AI assistance'
        }
      }
    };

    // Discovery patterns and triggers
    this.discoveryPatterns = {
      usage_based: {
        heavy_user: {
          threshold: 50, // interactions
          suggests: ['performance_analytics', 'routing_preferences'],
          message: 'As a frequent user, these features can optimize your experience'
        },
        cost_conscious: {
          indicators: ['cost_mentions', 'local_model_preference'],
          suggests: ['routing_preferences', 'performance_analytics'],
          message: 'These features help control and optimize your AI costs'
        },
        productivity_focused: {
          indicators: ['workflow_mentions', 'task_discussions', 'productivity_apps'],
          suggests: ['ambient_intelligence', 'automation_rules'],
          message: 'These productivity features can streamline your workflows'
        }
      },
      context_based: {
        adhd_user: {
          indicators: ['adhd_mentions', 'focus_issues', 'context_switching'],
          suggests: ['character_sheet', 'ambient_intelligence'],
          message: 'These features provide ADHD-aware accommodations and support'
        },
        developer: {
          indicators: ['code_requests', 'technical_discussions', 'programming_language'],
          suggests: ['custom_models', 'automation_rules'],
          message: 'These advanced features support technical and development workflows'
        },
        creative_user: {
          indicators: ['creative_requests', 'writing_tasks', 'brainstorming'],
          suggests: ['routing_preferences', 'voice_interface'],
          message: 'These features enhance creative workflows and ideation'
        }
      },
      problem_based: {
        slow_responses: {
          indicators: ['speed_complaints', 'timeout_mentions'],
          suggests: ['routing_preferences', 'performance_analytics'],
          message: 'These features can help improve response speed and reliability'
        },
        quality_issues: {
          indicators: ['quality_complaints', 'unsatisfied_responses'],
          suggests: ['routing_preferences', 'custom_models'],
          message: 'These features provide better control over response quality'
        },
        workflow_inefficiency: {
          indicators: ['manual_work_mentions', 'repetitive_tasks', 'inefficiency_complaints'],
          suggests: ['ambient_intelligence', 'automation_rules'],
          message: 'These automation features can eliminate manual work and repetitive tasks'
        }
      }
    };

    console.log('FeatureDiscovery system initialized with intelligent suggestion capabilities');
  }

  /**
   * Analyze user interaction and suggest relevant features
   */
  async suggestRelevantFeatures(interactionData, userContext = {}) {
    try {
      // Update usage patterns
      this.updateUsagePatterns(interactionData);
      
      // Get user expertise level
      const expertiseLevel = this.assessUserExpertise(userContext);
      
      // Find relevant feature suggestions
      const suggestions = await this.findRelevantSuggestions(interactionData, expertiseLevel);
      
      // Filter and prioritize suggestions
      const prioritizedSuggestions = this.prioritizeAndFilterSuggestions(suggestions, userContext);
      
      // Track suggestion history
      this.trackSuggestions(prioritizedSuggestions);

      return {
        success: true,
        suggestions: prioritizedSuggestions,
        user_expertise: expertiseLevel,
        discovery_context: {
          patterns_detected: this.analyzeDiscoveryPatterns(interactionData),
          next_logical_features: this.identifyNextLogicalFeatures(expertiseLevel),
          onboarding_progress: this.assessOnboardingProgress(userContext)
        }
      };

    } catch (error) {
      console.error('Error suggesting relevant features:', error);
      return {
        success: false,
        error: error.message,
        fallback_suggestions: this.getFallbackSuggestions()
      };
    }
  }

  /**
   * Update usage patterns based on user interaction
   */
  updateUsagePatterns(interactionData) {
    const patterns = this.usagePatterns;
    
    // Track overall usage
    const totalUsage = patterns.get('total_interactions') || 0;
    patterns.set('total_interactions', totalUsage + 1);
    
    // Track task types
    if (interactionData.taskType) {
      const taskCount = patterns.get(`task_${interactionData.taskType}`) || 0;
      patterns.set(`task_${interactionData.taskType}`, taskCount + 1);
    }
    
    // Track feature usage
    if (interactionData.featuresUsed) {
      interactionData.featuresUsed.forEach(feature => {
        const featureCount = this.userExpertise.get(feature) || 0;
        this.userExpertise.set(feature, featureCount + 1);
      });
    }
    
    // Track contextual indicators
    if (interactionData.indicators) {
      interactionData.indicators.forEach(indicator => {
        const indicatorCount = patterns.get(`indicator_${indicator}`) || 0;
        patterns.set(`indicator_${indicator}`, indicatorCount + 1);
      });
    }
    
    // Track timing patterns
    const hour = new Date().getHours();
    const hourlyUsage = patterns.get(`hour_${hour}`) || 0;
    patterns.set(`hour_${hour}`, hourlyUsage + 1);
  }

  /**
   * Assess user expertise level across different areas
   */
  assessUserExpertise(userContext) {
    const totalInteractions = this.usagePatterns.get('total_interactions') || 0;
    
    const expertise = {
      overall_level: this.classifyOverallLevel(totalInteractions),
      feature_expertise: {},
      strengths: [],
      growth_areas: []
    };

    // Assess per-feature expertise
    for (const [feature, count] of this.userExpertise.entries()) {
      if (count >= this.config.expertiseThreshold) {
        expertise.feature_expertise[feature] = 'expert';
        expertise.strengths.push(feature);
      } else if (count >= this.config.minUsageForSuggestion) {
        expertise.feature_expertise[feature] = 'intermediate';
      } else {
        expertise.feature_expertise[feature] = 'beginner';
        expertise.growth_areas.push(feature);
      }
    }

    return expertise;
  }

  /**
   * Find relevant feature suggestions based on patterns and context
   */
  async findRelevantSuggestions(interactionData, expertiseLevel) {
    const suggestions = [];
    
    // Usage-based suggestions
    const usageSuggestions = this.findUsageBasedSuggestions(interactionData, expertiseLevel);
    suggestions.push(...usageSuggestions);
    
    // Context-based suggestions
    const contextSuggestions = this.findContextBasedSuggestions(interactionData);
    suggestions.push(...contextSuggestions);
    
    // Problem-based suggestions
    const problemSuggestions = this.findProblemBasedSuggestions(interactionData);
    suggestions.push(...problemSuggestions);
    
    // Progressive disclosure suggestions
    const progressiveSuggestions = this.findProgressiveDisclosureSuggestions(expertiseLevel);
    suggestions.push(...progressiveSuggestions);

    return suggestions;
  }

  /**
   * Find usage-based feature suggestions
   */
  findUsageBasedSuggestions(interactionData, expertiseLevel) {
    const suggestions = [];
    const totalUsage = this.usagePatterns.get('total_interactions') || 0;

    // Heavy user suggestions
    if (totalUsage >= this.discoveryPatterns.usage_based.heavy_user.threshold) {
      const heavyUserSuggestions = this.discoveryPatterns.usage_based.heavy_user.suggests;
      heavyUserSuggestions.forEach(feature => {
        if (this.shouldSuggestFeature(feature, expertiseLevel)) {
          suggestions.push(this.createSuggestion(feature, 'usage_based', 'heavy_user'));
        }
      });
    }

    // Cost-conscious user suggestions
    if (this.detectPattern('cost_conscious', interactionData)) {
      const costSuggestions = this.discoveryPatterns.usage_based.cost_conscious.suggests;
      costSuggestions.forEach(feature => {
        if (this.shouldSuggestFeature(feature, expertiseLevel)) {
          suggestions.push(this.createSuggestion(feature, 'usage_based', 'cost_conscious'));
        }
      });
    }

    // Productivity-focused suggestions
    if (this.detectPattern('productivity_focused', interactionData)) {
      const productivitySuggestions = this.discoveryPatterns.usage_based.productivity_focused.suggests;
      productivitySuggestions.forEach(feature => {
        if (this.shouldSuggestFeature(feature, expertiseLevel)) {
          suggestions.push(this.createSuggestion(feature, 'usage_based', 'productivity_focused'));
        }
      });
    }

    return suggestions;
  }

  /**
   * Find context-based suggestions
   */
  findContextBasedSuggestions(interactionData) {
    const suggestions = [];

    // ADHD user context
    if (this.detectPattern('adhd_user', interactionData)) {
      const adhdSuggestions = this.discoveryPatterns.context_based.adhd_user.suggests;
      adhdSuggestions.forEach(feature => {
        suggestions.push(this.createSuggestion(feature, 'context_based', 'adhd_user'));
      });
    }

    // Developer context
    if (this.detectPattern('developer', interactionData)) {
      const devSuggestions = this.discoveryPatterns.context_based.developer.suggests;
      devSuggestions.forEach(feature => {
        suggestions.push(this.createSuggestion(feature, 'context_based', 'developer'));
      });
    }

    // Creative user context
    if (this.detectPattern('creative_user', interactionData)) {
      const creativeSuggestions = this.discoveryPatterns.context_based.creative_user.suggests;
      creativeSuggestions.forEach(feature => {
        suggestions.push(this.createSuggestion(feature, 'context_based', 'creative_user'));
      });
    }

    return suggestions;
  }

  /**
   * Find problem-based suggestions
   */
  findProblemBasedSuggestions(interactionData) {
    const suggestions = [];

    // Slow response issues
    if (this.detectPattern('slow_responses', interactionData)) {
      const speedSuggestions = this.discoveryPatterns.problem_based.slow_responses.suggests;
      speedSuggestions.forEach(feature => {
        suggestions.push(this.createSuggestion(feature, 'problem_based', 'slow_responses'));
      });
    }

    // Quality issues
    if (this.detectPattern('quality_issues', interactionData)) {
      const qualitySuggestions = this.discoveryPatterns.problem_based.quality_issues.suggests;
      qualitySuggestions.forEach(feature => {
        suggestions.push(this.createSuggestion(feature, 'problem_based', 'quality_issues'));
      });
    }

    // Workflow inefficiency
    if (this.detectPattern('workflow_inefficiency', interactionData)) {
      const workflowSuggestions = this.discoveryPatterns.problem_based.workflow_inefficiency.suggests;
      workflowSuggestions.forEach(feature => {
        suggestions.push(this.createSuggestion(feature, 'problem_based', 'workflow_inefficiency'));
      });
    }

    return suggestions;
  }

  /**
   * Find progressive disclosure suggestions
   */
  findProgressiveDisclosureSuggestions(expertiseLevel) {
    const suggestions = [];
    const level = expertiseLevel.overall_level;

    let featuresToSuggest = [];
    if (level === 'beginner') {
      featuresToSuggest = Object.keys(this.featureDatabase.basic);
    } else if (level === 'intermediate') {
      featuresToSuggest = Object.keys(this.featureDatabase.intermediate);
    } else if (level === 'advanced') {
      featuresToSuggest = Object.keys(this.featureDatabase.advanced);
    }

    featuresToSuggest.forEach(feature => {
      if (this.shouldSuggestFeature(feature, expertiseLevel)) {
        suggestions.push(this.createSuggestion(feature, 'progressive', level));
      }
    });

    return suggestions;
  }

  /**
   * Create a feature suggestion object
   */
  createSuggestion(featureKey, reasonType, reasonSubtype) {
    const feature = this.findFeatureInDatabase(featureKey);
    
    if (!feature) return null;

    return {
      feature_key: featureKey,
      feature_name: feature.name,
      description: feature.description,
      benefits: feature.benefits,
      setup_difficulty: feature.setup_difficulty,
      time_to_value: feature.time_to_value,
      reason_type: reasonType,
      reason_subtype: reasonSubtype,
      explanation: feature.explanation,
      priority: this.calculateSuggestionPriority(featureKey, reasonType),
      setup_guidance: this.getSetupGuidance(featureKey)
    };
  }

  /**
   * Find feature in database across all levels
   */
  findFeatureInDatabase(featureKey) {
    for (const level of ['basic', 'intermediate', 'advanced', 'experimental']) {
      if (this.featureDatabase[level][featureKey]) {
        return this.featureDatabase[level][featureKey];
      }
    }
    return null;
  }

  /**
   * Determine if a feature should be suggested
   */
  shouldSuggestFeature(featureKey, expertiseLevel) {
    // Check if already expert in this feature
    if (expertiseLevel.feature_expertise[featureKey] === 'expert') {
      return false;
    }

    // Check cooldown period
    const lastSuggested = this.lastSuggestionTime.get(featureKey);
    if (lastSuggested && Date.now() - lastSuggested < this.config.cooldownBetweenSuggestions) {
      return false;
    }

    // Check prerequisites
    const feature = this.findFeatureInDatabase(featureKey);
    if (feature && feature.prerequisites) {
      return feature.prerequisites.every(prereq => 
        expertiseLevel.feature_expertise[prereq] === 'intermediate' ||
        expertiseLevel.feature_expertise[prereq] === 'expert'
      );
    }

    return true;
  }

  /**
   * Prioritize and filter suggestions
   */
  prioritizeAndFilterSuggestions(suggestions, userContext) {
    // Remove duplicates
    const uniqueSuggestions = suggestions.filter((suggestion, index, self) =>
      index === self.findIndex(s => s.feature_key === suggestion.feature_key)
    );

    // Sort by priority
    uniqueSuggestions.sort((a, b) => b.priority - a.priority);

    // Apply max suggestions limit
    return uniqueSuggestions.slice(0, this.config.maxSuggestionsPerSession);
  }

  /**
   * Calculate suggestion priority
   */
  calculateSuggestionPriority(featureKey, reasonType) {
    let priority = 0;

    // Base priority by reason type
    const reasonPriorities = {
      problem_based: 10,     // Highest - solving current problems
      context_based: 8,      // High - relevant to user context
      usage_based: 6,        // Medium - based on usage patterns
      progressive: 4         // Lower - natural progression
    };
    
    priority += reasonPriorities[reasonType] || 0;

    // Adjust for feature complexity
    const feature = this.findFeatureInDatabase(featureKey);
    if (feature) {
      const difficultyAdjustment = {
        automatic: 3,
        easy: 2,
        medium: 1,
        complex: -1,
        expert: -2
      };
      priority += difficultyAdjustment[feature.setup_difficulty] || 0;
    }

    // Adjust for recency of related patterns
    const recentUsage = this.getRecentUsageScore(featureKey);
    priority += recentUsage;

    return priority;
  }

  /**
   * Detect patterns in interaction data
   */
  detectPattern(patternName, interactionData) {
    const pattern = this.findPatternDefinition(patternName);
    if (!pattern || !pattern.indicators) return false;

    // Check if any indicators match
    return pattern.indicators.some(indicator => {
      if (interactionData.indicators && interactionData.indicators.includes(indicator)) {
        return true;
      }
      
      // Check historical patterns
      const historicalCount = this.usagePatterns.get(`indicator_${indicator}`) || 0;
      return historicalCount >= this.config.minUsageForSuggestion;
    });
  }

  /**
   * Find pattern definition across all pattern types
   */
  findPatternDefinition(patternName) {
    for (const patternType of ['usage_based', 'context_based', 'problem_based']) {
      if (this.discoveryPatterns[patternType][patternName]) {
        return this.discoveryPatterns[patternType][patternName];
      }
    }
    return null;
  }

  /**
   * Classify overall user expertise level
   */
  classifyOverallLevel(totalInteractions) {
    if (totalInteractions < 5) return 'beginner';
    if (totalInteractions < 25) return 'intermediate';
    return 'advanced';
  }

  /**
   * Get recent usage score for priority calculation
   */
  getRecentUsageScore(featureKey) {
    // This would analyze recent usage patterns
    // For now, return a baseline score
    return 0;
  }

  /**
   * Get setup guidance for a feature
   */
  getSetupGuidance(featureKey) {
    const guidanceMap = {
      smart_routing: 'Already active! Just start using The Steward normally.',
      character_sheet: 'Create a character-sheet.yaml file with your preferences.',
      routing_preferences: 'Access settings to customize model selection criteria.',
      performance_analytics: 'Check the performance dashboard for insights.',
      ambient_intelligence: 'Connect your productivity apps in the integrations section.',
      custom_models: 'Add model configurations in the advanced settings.',
      automation_rules: 'Define rules in the automation section.',
      voice_interface: 'Enable microphone permissions and voice features.',
      collaboration_mode: 'Set up team sharing in collaboration settings.'
    };

    return guidanceMap[featureKey] || 'Check the feature documentation for setup instructions.';
  }

  /**
   * Track suggestion history
   */
  trackSuggestions(suggestions) {
    const timestamp = Date.now();
    
    suggestions.forEach(suggestion => {
      this.featureSuggestionHistory.push({
        timestamp,
        feature: suggestion.feature_key,
        reason: suggestion.reason_type,
        priority: suggestion.priority
      });
      
      this.lastSuggestionTime.set(suggestion.feature_key, timestamp);
    });

    // Maintain history size
    if (this.featureSuggestionHistory.length > 100) {
      this.featureSuggestionHistory = this.featureSuggestionHistory.slice(-50);
    }
  }

  /**
   * Generate onboarding path for new users
   */
  generateOnboardingPath(systemStatus, userExpertise) {
    const path = [];
    
    // Start with basic features
    if (userExpertise.overall_level === 'beginner') {
      path.push({
        step: 1,
        feature: 'smart_routing',
        title: 'Experience Smart Routing',
        description: 'Try asking different types of questions to see how The Steward adapts',
        estimated_time: '5 minutes'
      });
      
      path.push({
        step: 2,
        feature: 'character_sheet',
        title: 'Set Up Your Character Sheet',
        description: 'Tell The Steward about your preferences and cognitive style',
        estimated_time: '10 minutes'
      });
    }

    // Add intermediate features for progressing users
    if (userExpertise.overall_level === 'intermediate') {
      path.push({
        step: 3,
        feature: 'routing_preferences',
        title: 'Customize Routing Preferences',
        description: 'Fine-tune model selection for your specific needs',
        estimated_time: '10 minutes'
      });
    }

    return path;
  }

  /**
   * Get fallback suggestions for error cases
   */
  getFallbackSuggestions() {
    return [
      {
        feature_key: 'character_sheet',
        feature_name: 'Character Sheet',
        description: 'Personalize your AI experience',
        priority: 5
      },
      {
        feature_key: 'smart_routing',
        feature_name: 'Smart Routing',
        description: 'Automatic AI model optimization',
        priority: 4
      }
    ];
  }

  /**
   * Get discovery analytics
   */
  getDiscoveryAnalytics() {
    return {
      total_suggestions_made: this.featureSuggestionHistory.length,
      user_expertise_levels: this.getUserExpertiseSummary(),
      popular_suggestions: this.getPopularSuggestions(),
      discovery_effectiveness: this.calculateDiscoveryEffectiveness()
    };
  }

  /**
   * Get user expertise summary
   */
  getUserExpertiseSummary() {
    const summary = {};
    
    for (const [feature, count] of this.userExpertise.entries()) {
      if (count >= this.config.expertiseThreshold) {
        summary[feature] = 'expert';
      } else if (count >= this.config.minUsageForSuggestion) {
        summary[feature] = 'intermediate';
      } else {
        summary[feature] = 'beginner';
      }
    }
    
    return summary;
  }

  /**
   * Get popular feature suggestions
   */
  getPopularSuggestions() {
    const suggestionCounts = {};
    
    this.featureSuggestionHistory.forEach(suggestion => {
      suggestionCounts[suggestion.feature] = (suggestionCounts[suggestion.feature] || 0) + 1;
    });
    
    return Object.entries(suggestionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([feature, count]) => ({ feature, count }));
  }

  /**
   * Calculate discovery effectiveness
   */
  calculateDiscoveryEffectiveness() {
    // This would calculate how often suggestions lead to feature adoption
    // For now, return a placeholder metric
    return {
      suggestion_to_adoption_rate: 0.65,
      average_time_to_adoption: '2.3 days',
      most_effective_discovery_type: 'problem_based'
    };
  }

  /**
   * Analyze discovery patterns from interaction data
   */
  analyzeDiscoveryPatterns(interactionData) {
    const patterns = {
      usage_indicators: interactionData.indicators || [],
      task_types: [interactionData.taskType || 'general'],
      feature_context: interactionData.featuresUsed || [],
      discovery_triggers: []
    };

    // Analyze patterns based on indicators
    if (interactionData.indicators) {
      interactionData.indicators.forEach(indicator => {
        if (indicator.includes('first_use')) {
          patterns.discovery_triggers.push('new_user_onboarding');
        }
        if (indicator.includes('performance')) {
          patterns.discovery_triggers.push('optimization_needed');
        }
        if (indicator.includes('workflow')) {
          patterns.discovery_triggers.push('productivity_enhancement');
        }
      });
    }

    return patterns;
  }

  /**
   * Identify next logical features based on expertise level
   */
  identifyNextLogicalFeatures(expertiseLevel) {
    const level = expertiseLevel.overall_level || 'intermediate';
    
    if (level === 'beginner') {
      return ['smart_routing', 'character_sheet'];
    } else if (level === 'intermediate') {
      return ['routing_preferences', 'performance_analytics'];
    } else {
      return ['ambient_intelligence', 'custom_models', 'automation_rules'];
    }
  }

  /**
   * Assess onboarding progress
   */
  assessOnboardingProgress(userContext) {
    const progress = {
      completion_percentage: 0,
      completed_steps: [],
      next_steps: [],
      estimated_remaining_time: '30 minutes'
    };

    // Calculate progress based on user context
    if (userContext.systemConfiguration?.character_sheet?.completeness_score) {
      progress.completion_percentage += userContext.systemConfiguration.character_sheet.completeness_score * 0.4;
      if (userContext.systemConfiguration.character_sheet.completeness_score > 50) {
        progress.completed_steps.push('character_sheet_setup');
      } else {
        progress.next_steps.push('complete_character_sheet');
      }
    }

    if (userContext.userLevel !== 'beginner') {
      progress.completion_percentage += 30;
      progress.completed_steps.push('basic_familiarity');
    }

    if (progress.completion_percentage < 50) {
      progress.next_steps.unshift('basic_setup_completion');
    } else if (progress.completion_percentage < 80) {
      progress.next_steps.push('advanced_features_exploration');
    }

    return progress;
  }
}

module.exports = FeatureDiscovery;

// #endregion end: Feature Discovery System