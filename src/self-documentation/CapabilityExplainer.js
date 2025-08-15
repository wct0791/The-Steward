// #region start: Capability Explanation Engine for The Steward
// Provides detailed explanations of routing decisions, integrations, and system capabilities
// Makes The Steward's AI decisions transparent and understandable

/**
 * CapabilityExplainer - Makes The Steward's decisions and capabilities transparent
 * 
 * Key Features:
 * - Routing decision explanations in plain language
 * - Model selection reasoning with context
 * - Integration benefits and setup guidance
 * - ADHD accommodation explanations
 * - Performance optimization insights
 * - Cost-benefit analysis of decisions
 */
class CapabilityExplainer {
  constructor(options = {}) {
    this.config = {
      smartRoutingEngine: options.smartRoutingEngine || null,
      selfAwarenessEngine: options.selfAwarenessEngine || null,
      modelInterface: options.modelInterface || null,
      enableDetailedExplanations: options.enableDetailedExplanations !== false,
      explainCosts: options.explainCosts !== false,
      explainPerformance: options.explainPerformance !== false,
      ...options
    };

    // Decision explanation templates
    this.explanationTemplates = {
      model_selection: {
        template: "I chose {model} because {reasoning}. This should give you {expected_outcome}.",
        factors: ['task_complexity', 'response_quality', 'speed_requirements', 'cost_considerations', 'privacy_needs']
      },
      routing_decision: {
        template: "Based on your {context}, I routed this to {destination} for {benefit}.",
        factors: ['user_preferences', 'task_type', 'system_state', 'performance_history']
      },
      adhd_accommodation: {
        template: "I {accommodation} because {reasoning}, which helps with {adhd_benefit}.",
        factors: ['cognitive_load', 'attention_management', 'executive_function', 'energy_management']
      },
      integration_benefit: {
        template: "The {integration} integration {action} so that {user_benefit}.",
        factors: ['workflow_efficiency', 'context_continuity', 'automation_benefit', 'cognitive_overhead']
      }
    };

    // Model characteristics for explanations
    this.modelCharacteristics = {
      'local_fast': {
        strengths: ['Very fast responses', 'Complete privacy', 'No API costs', 'Always available'],
        weaknesses: ['Limited reasoning ability', 'Smaller knowledge base', 'Basic creativity'],
        best_for: ['Quick questions', 'Simple tasks', 'Brainstorming', 'Privacy-sensitive content'],
        reasoning: 'speed and privacy'
      },
      'local_capable': {
        strengths: ['Good reasoning', 'Privacy protection', 'No ongoing costs', 'Reliable availability'],
        weaknesses: ['Slower than cloud models', 'Limited recent knowledge', 'Resource intensive'],
        best_for: ['Complex analysis', 'Coding tasks', 'Private discussions', 'Cost-sensitive work'],
        reasoning: 'balanced capability and privacy'
      },
      'cloud_quality': {
        strengths: ['Excellent reasoning', 'Latest knowledge', 'Creative capabilities', 'Specialized skills'],
        weaknesses: ['Higher costs', 'Requires internet', 'Privacy considerations', 'Rate limits'],
        best_for: ['Complex problems', 'Creative work', 'Latest information', 'Specialized domains'],
        reasoning: 'highest quality results'
      },
      'cloud_efficient': {
        strengths: ['Good quality', 'Reasonable cost', 'Fast responses', 'Reliable access'],
        weaknesses: ['Not the most capable', 'Internet required', 'Usage costs', 'Some limitations'],
        best_for: ['General questions', 'Balanced workloads', 'Regular conversations', 'Cost-conscious use'],
        reasoning: 'balanced quality and cost'
      }
    };

    // ADHD accommodation explanations
    this.adhdAccommodations = {
      task_breakdown: {
        what: 'Breaking complex tasks into smaller, manageable steps',
        why: 'Large tasks can be overwhelming and trigger executive dysfunction',
        benefit: 'Makes progress feel achievable and maintains momentum',
        example: 'Instead of "write a report", I suggest "1. Outline key points 2. Write introduction 3. Develop each section"'
      },
      context_preservation: {
        what: 'Maintaining context across conversations and sessions',
        why: 'Context switching is mentally expensive with ADHD',
        benefit: 'Reduces cognitive load and maintains flow state',
        example: 'I remember what we were discussing yesterday so you don\'t need to re-explain'
      },
      energy_awareness: {
        what: 'Adapting responses based on your current energy level',
        why: 'ADHD energy levels fluctuate throughout the day',
        benefit: 'Provides appropriate support when you need it most',
        example: 'During low-energy periods, I give more structured guidance and encouragement'
      },
      hyperfocus_respect: {
        what: 'Recognizing and preserving hyperfocus states',
        why: 'Hyperfocus is valuable but fragile for ADHD minds',
        benefit: 'Maximizes productive periods while they last',
        example: 'When you\'re in flow, I provide minimal, targeted responses to avoid disruption'
      },
      executive_support: {
        what: 'Providing structure and decision-making assistance',
        why: 'Executive function challenges are core to ADHD',
        benefit: 'Reduces decision fatigue and provides cognitive scaffolding',
        example: 'I help prioritize tasks and suggest next steps when you feel stuck'
      }
    };

    // Integration explanations
    this.integrationBenefits = {
      notion: {
        primary_benefit: 'Automatic documentation and project context',
        how_it_helps: 'Captures insights and maintains project continuity',
        example: 'When we discuss a project, I automatically update your Notion workspace with key insights',
        setup_value: 'Eliminates manual note-taking and context loss'
      },
      things: {
        primary_benefit: 'Intelligent task creation and cognitive scheduling',
        how_it_helps: 'Converts conversations into actionable tasks with ADHD-aware timing',
        example: 'When you mention "I need to call the client", I create a task scheduled for your peak energy time',
        setup_value: 'Transforms ideas into organized, schedule-aware actions'
      },
      apple_notes: {
        primary_benefit: 'Seamless session capture and research compilation',
        how_it_helps: 'Preserves valuable conversations and builds knowledge over time',
        example: 'Our brainstorming sessions are automatically saved with key insights highlighted',
        setup_value: 'Never lose valuable ideas or insights from our conversations'
      }
    };

    console.log('CapabilityExplainer initialized with decision transparency features');
  }

  /**
   * Explain a routing decision that was made
   */
  explainRoutingDecision(routingData, context = {}) {
    try {
      if (!routingData) {
        return this.createErrorExplanation('No routing data available to explain');
      }

      const explanation = {
        decision_summary: this.generateDecisionSummary(routingData),
        model_chosen: routingData.selection?.model || 'unknown',
        reasoning: this.generateModelReasoningExplanation(routingData),
        factors_considered: this.identifyDecisionFactors(routingData),
        expected_outcomes: this.predictOutcomes(routingData),
        alternatives: this.explainAlternatives(routingData),
        user_impact: this.explainUserImpact(routingData, context)
      };

      // Add cost explanation if enabled
      if (this.config.explainCosts && routingData.costAnalysis) {
        explanation.cost_reasoning = this.explainCostConsiderations(routingData);
      }

      // Add performance explanation if enabled
      if (this.config.explainPerformance && routingData.performanceData) {
        explanation.performance_reasoning = this.explainPerformanceConsiderations(routingData);
      }

      return {
        success: true,
        explanation,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error explaining routing decision:', error);
      return this.createErrorExplanation(error.message);
    }
  }

  /**
   * Generate a human-readable summary of the routing decision
   */
  generateDecisionSummary(routingData) {
    const model = routingData.selection?.model || 'default model';
    const taskType = routingData.classification?.type || 'general task';
    const confidence = routingData.selection?.confidence || 0.5;

    const confidenceLevel = confidence > 0.8 ? 'very confident' : 
                           confidence > 0.6 ? 'confident' : 'reasonably confident';

    return `I'm ${confidenceLevel} that ${model} is the best choice for this ${taskType}`;
  }

  /**
   * Generate detailed model selection reasoning
   */
  generateModelReasoningExplanation(routingData) {
    const modelType = this.classifyModelType(routingData.selection?.model);
    const taskClass = routingData.classification;
    const userPrefs = routingData.userPreferences || {};

    const reasoning = [];

    // Task-based reasoning
    if (taskClass?.complexity === 'high') {
      reasoning.push('the task requires advanced reasoning capabilities');
    } else if (taskClass?.complexity === 'low') {
      reasoning.push('this is a straightforward task that doesn\'t need the most advanced model');
    }

    // Speed considerations
    if (taskClass?.urgency === 'high' || userPrefs.prioritize_speed) {
      reasoning.push('you need a quick response');
    }

    // Privacy considerations
    if (taskClass?.privacy_sensitive || userPrefs.prefer_local) {
      reasoning.push('this involves private information best kept on your device');
    }

    // Cost considerations
    if (userPrefs.cost_conscious) {
      reasoning.push('this balances quality with cost-effectiveness');
    }

    // Quality considerations
    if (userPrefs.prioritize_quality) {
      reasoning.push('you prefer the highest quality responses');
    }

    const reasoningText = reasoning.length > 0 ? reasoning.join(', and ') : 'it\'s well-suited for this type of task';
    
    return `I selected this model because ${reasoningText}.`;
  }

  /**
   * Identify and explain decision factors
   */
  identifyDecisionFactors(routingData) {
    const factors = [];

    // Task classification factors
    if (routingData.classification) {
      const classification = routingData.classification;
      
      factors.push({
        factor: 'Task Complexity',
        value: classification.complexity || 'medium',
        impact: this.explainComplexityImpact(classification.complexity)
      });

      factors.push({
        factor: 'Task Type', 
        value: classification.type || 'general',
        impact: this.explainTaskTypeImpact(classification.type)
      });

      if (classification.urgency) {
        factors.push({
          factor: 'Urgency',
          value: classification.urgency,
          impact: this.explainUrgencyImpact(classification.urgency)
        });
      }
    }

    // User preferences
    if (routingData.userPreferences) {
      const prefs = routingData.userPreferences;
      
      if (prefs.prioritize_speed) {
        factors.push({
          factor: 'Speed Preference',
          value: 'high priority',
          impact: 'Favored faster models over slower but more capable ones'
        });
      }

      if (prefs.prioritize_quality) {
        factors.push({
          factor: 'Quality Preference',
          value: 'high priority', 
          impact: 'Favored more capable models even if slower or more expensive'
        });
      }

      if (prefs.cost_conscious) {
        factors.push({
          factor: 'Cost Consciousness',
          value: 'enabled',
          impact: 'Considered cost-effectiveness in model selection'
        });
      }
    }

    // System state factors
    if (routingData.systemState) {
      factors.push({
        factor: 'System Resources',
        value: routingData.systemState.resourceLevel || 'normal',
        impact: this.explainResourceImpact(routingData.systemState.resourceLevel)
      });
    }

    return factors;
  }

  /**
   * Predict outcomes of the routing decision
   */
  predictOutcomes(routingData) {
    const model = routingData.selection?.model;
    const modelType = this.classifyModelType(model);
    const characteristics = this.modelCharacteristics[modelType];

    if (!characteristics) {
      return {
        response_quality: 'Good quality response expected',
        response_time: 'Reasonable response time',
        cost: 'Standard cost'
      };
    }

    return {
      response_quality: this.predictQuality(characteristics, routingData),
      response_time: this.predictSpeed(characteristics, routingData),
      cost: this.predictCost(characteristics, routingData),
      other_benefits: characteristics.strengths.slice(0, 2)
    };
  }

  /**
   * Explain alternative models that could have been chosen
   */
  explainAlternatives(routingData) {
    const chosen = routingData.selection?.model;
    const alternatives = routingData.alternatives || [];

    return alternatives.slice(0, 2).map(alt => ({
      model: alt.model,
      score: alt.score,
      why_not_chosen: this.explainWhyNotChosen(alt, routingData),
      would_be_better_if: this.explainWhenBetter(alt, routingData)
    }));
  }

  /**
   * Explain user impact of the decision
   */
  explainUserImpact(routingData, context) {
    const impact = {
      immediate: [],
      long_term: []
    };

    // Immediate impacts
    const modelType = this.classifyModelType(routingData.selection?.model);
    if (modelType === 'local_fast') {
      impact.immediate.push('You\'ll get a very quick response');
      impact.immediate.push('Your data stays completely private on your device');
    } else if (modelType === 'cloud_quality') {
      impact.immediate.push('You\'ll get the highest quality response');
      impact.immediate.push('The model has access to the latest information');
    }

    // Long-term impacts
    if (routingData.userPreferences?.cost_conscious) {
      impact.long_term.push('This choice helps keep your AI costs manageable');
    }

    if (context.adhdAccommodations) {
      impact.long_term.push('This aligns with your cognitive preferences for better focus');
    }

    return impact;
  }

  /**
   * Explain ADHD accommodations that were applied
   */
  explainAdhdAccommodation(accommodationType, context = {}) {
    const accommodation = this.adhdAccommodations[accommodationType];
    
    if (!accommodation) {
      return {
        success: false,
        error: 'Unknown accommodation type',
        available_accommodations: Object.keys(this.adhdAccommodations)
      };
    }

    return {
      success: true,
      accommodation: {
        name: accommodationType.replace('_', ' '),
        what_it_does: accommodation.what,
        why_it_helps: accommodation.why,
        your_benefit: accommodation.benefit,
        example: accommodation.example,
        when_active: this.explainWhenAccommodationActive(accommodationType, context)
      }
    };
  }

  /**
   * Explain integration benefits and setup value
   */
  explainIntegrationBenefit(integrationType) {
    const integration = this.integrationBenefits[integrationType];
    
    if (!integration) {
      return {
        success: false,
        error: 'Unknown integration type',
        available_integrations: Object.keys(this.integrationBenefits)
      };
    }

    return {
      success: true,
      integration: {
        name: integrationType,
        main_benefit: integration.primary_benefit,
        how_it_works: integration.how_it_helps,
        real_example: integration.example,
        setup_value: integration.setup_value,
        time_savings: this.estimateTimeSavings(integrationType),
        cognitive_benefits: this.explainCognitiveBenefits(integrationType)
      }
    };
  }

  /**
   * Explain why a specific model wasn't chosen
   */
  explainWhyNotChosen(alternative, routingData) {
    const altType = this.classifyModelType(alternative.model);
    const chosenType = this.classifyModelType(routingData.selection?.model);

    if (altType === 'cloud_quality' && chosenType !== 'cloud_quality') {
      return 'While more capable, it would be slower and more expensive for this task';
    } else if (altType === 'local_fast' && chosenType !== 'local_fast') {
      return 'While faster, it might not provide the quality needed for this task';
    } else if (alternative.score < routingData.selection?.score) {
      return 'It scored lower overall considering your preferences and the task requirements';
    }

    return 'It was a close second choice but slightly less optimal for your specific needs';
  }

  /**
   * Classify model type for explanation purposes
   */
  classifyModelType(modelName) {
    if (!modelName) return 'unknown';
    
    const name = modelName.toLowerCase();
    
    if (name.includes('smol') || name.includes('fast') || name.includes('local')) {
      return 'local_fast';
    } else if (name.includes('gpt-4') || name.includes('claude')) {
      return 'cloud_quality';
    } else if (name.includes('gpt-3') || name.includes('efficient')) {
      return 'cloud_efficient';  
    } else if (name.includes('llama') || name.includes('mistral')) {
      return 'local_capable';
    }
    
    return 'cloud_efficient'; // Default assumption
  }

  /**
   * Create error explanation
   */
  createErrorExplanation(errorMessage) {
    return {
      success: false,
      error: errorMessage,
      fallback_explanation: 'I chose the model that seemed best for your request based on my general understanding of the task.',
      suggestion: 'Try asking about specific aspects like "why was this model chosen?" or "what are my routing preferences?"'
    };
  }

  /**
   * Helper methods for generating specific explanations
   */
  explainComplexityImpact(complexity) {
    const impacts = {
      low: 'Simple tasks can use faster, more efficient models',
      medium: 'Moderate complexity requires balanced capability and speed',
      high: 'Complex tasks need the most capable models for best results'
    };
    return impacts[complexity] || 'Complexity level influenced model selection';
  }

  explainTaskTypeImpact(taskType) {
    const impacts = {
      coding: 'Code-related tasks benefit from specialized programming models',
      creative: 'Creative tasks need models with strong generative capabilities',
      analytical: 'Analysis tasks require strong reasoning and logic capabilities',
      conversational: 'Conversations work well with balanced, responsive models'
    };
    return impacts[taskType] || 'Task type helped determine the most suitable model';
  }

  explainUrgencyImpact(urgency) {
    const impacts = {
      high: 'High urgency prioritized speed over absolute quality',
      low: 'Low urgency allowed for more thorough, higher-quality processing'
    };
    return impacts[urgency] || 'Urgency level influenced speed vs quality tradeoff';
  }

  explainResourceImpact(resourceLevel) {
    const impacts = {
      low: 'Limited resources favored efficient, lightweight models',
      high: 'Abundant resources allowed for more capable, resource-intensive models'
    };
    return impacts[resourceLevel] || 'System resources influenced model selection';
  }

  predictQuality(characteristics, routingData) {
    return characteristics.strengths.includes('Excellent reasoning') ? 
      'High quality, comprehensive response' : 
      'Good quality response appropriate for the task';
  }

  predictSpeed(characteristics, routingData) {
    return characteristics.strengths.includes('Very fast responses') ? 
      'Very quick response (under 2 seconds)' : 
      'Reasonable response time (2-10 seconds)';
  }

  predictCost(characteristics, routingData) {
    return characteristics.strengths.includes('No API costs') ? 
      'No cost (local processing)' : 
      'Standard usage cost based on response length';
  }

  explainWhenBetter(alternative, routingData) {
    const altType = this.classifyModelType(alternative.model);
    
    if (altType === 'cloud_quality') {
      return 'Would be better for very complex analysis or creative tasks requiring top-tier capabilities';
    } else if (altType === 'local_fast') {
      return 'Would be better when you need immediate responses or have privacy concerns';
    }
    
    return 'Would be better under different circumstances or preferences';
  }

  explainWhenAccommodationActive(accommodationType, context) {
    const conditions = {
      task_breakdown: 'When you\'re facing complex or overwhelming tasks',
      context_preservation: 'Across all our conversations to maintain continuity',
      energy_awareness: 'Based on time of day and your configured energy patterns', 
      hyperfocus_respect: 'When I detect you\'re in a focused, productive state',
      executive_support: 'When you seem stuck or need help with decisions'
    };
    
    return conditions[accommodationType] || 'When it would be most helpful for your productivity';
  }

  estimateTimeSavings(integrationType) {
    const savings = {
      notion: '15-30 minutes per session of manual note-taking and organization',
      things: '10-20 minutes daily of task creation and scheduling',
      apple_notes: '5-15 minutes per session of manual session capture'
    };
    
    return savings[integrationType] || 'Significant time savings through automation';
  }

  explainCognitiveBenefits(integrationType) {
    const benefits = {
      notion: 'Reduces cognitive load of remembering and organizing insights',
      things: 'Eliminates decision fatigue around task creation and prioritization',
      apple_notes: 'Preserves valuable ideas without interrupting your flow state'
    };
    
    return benefits[integrationType] || 'Reduces cognitive overhead and mental fatigue';
  }
}

module.exports = CapabilityExplainer;

// #endregion end: Capability Explanation Engine