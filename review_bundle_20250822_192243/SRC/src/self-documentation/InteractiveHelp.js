// #region start: Interactive Help System for The Steward
// Natural language help queries and context-aware guidance
// Provides intelligent assistance based on user intent and system state

const EventEmitter = require('events');

/**
 * InteractiveHelp - Natural language help system with context awareness
 * 
 * Key Features:
 * - Natural language query processing
 * - Context-aware help responses
 * - Progressive feature disclosure
 * - Step-by-step guidance
 * - User experience level adaptation
 * - Interactive troubleshooting
 */
class InteractiveHelp extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      selfAwarenessEngine: options.selfAwarenessEngine || null,
      defaultUserLevel: options.defaultUserLevel || 'intermediate',
      enableContextualHelp: options.enableContextualHelp !== false,
      enableProactiveHelp: options.enableProactiveHelp !== false,
      helpSessionTimeout: options.helpSessionTimeout || 1800000, // 30 minutes
      ...options
    };

    // Help session management
    this.activeSessions = new Map();
    this.helpHistory = [];
    this.userInteractionPatterns = new Map();

    // Natural language query patterns
    this.queryPatterns = {
      // How-to questions
      howTo: {
        patterns: [
          /how do i (.+)/i,
          /how to (.+)/i,
          /how can i (.+)/i,
          /what's the way to (.+)/i,
          /steps to (.+)/i
        ],
        handler: 'handleHowToQuery'
      },
      
      // What questions
      what: {
        patterns: [
          /what is (.+)/i,
          /what does (.+) do/i,
          /what are (.+)/i,
          /explain (.+)/i,
          /tell me about (.+)/i
        ],
        handler: 'handleWhatQuery'
      },
      
      // Why questions  
      why: {
        patterns: [
          /why (.+)/i,
          /why does (.+)/i,
          /why is (.+)/i,
          /reason for (.+)/i
        ],
        handler: 'handleWhyQuery'
      },
      
      // Troubleshooting
      troubleshooting: {
        patterns: [
          /(.+) not working/i,
          /(.+) isn't working/i,
          /problem with (.+)/i,
          /issue with (.+)/i,
          /(.+) is broken/i,
          /(.+) won't (.+)/i,
          /can't (.+)/i,
          /unable to (.+)/i
        ],
        handler: 'handleTroubleshootingQuery'
      },
      
      // Feature discovery
      discovery: {
        patterns: [
          /what can (.+) do/i,
          /features of (.+)/i,
          /capabilities (.+)/i,
          /show me (.+)/i,
          /available (.+)/i
        ],
        handler: 'handleDiscoveryQuery'
      },
      
      // Getting started
      gettingStarted: {
        patterns: [
          /getting started/i,
          /how to start/i,
          /first time/i,
          /setup/i,
          /configuration/i,
          /onboarding/i
        ],
        handler: 'handleGettingStartedQuery'
      }
    };

    // Context-specific help topics
    this.contextualTopics = {
      routing: {
        keywords: ['routing', 'model', 'selection', 'ai', 'response', 'performance'],
        relatedFeatures: ['smart routing', 'model selection', 'performance optimization'],
        commonQuestions: [
          'How does smart routing work?',
          'Why was this model selected?',
          'How can I improve response quality?',
          'How to customize routing preferences?'
        ]
      },
      personalization: {
        keywords: ['character', 'sheet', 'preferences', 'adhd', 'personalization', 'cognitive'],
        relatedFeatures: ['character sheet', 'ADHD accommodations', 'personalization'],
        commonQuestions: [
          'How to set up character sheet?',
          'What ADHD accommodations are available?',
          'How to customize communication style?',
          'How does personalization work?'
        ]
      },
      ambient: {
        keywords: ['ambient', 'workflow', 'apps', 'coordination', 'sync', 'notion', 'things', 'notes'],
        relatedFeatures: ['ambient intelligence', 'app integration', 'workflow coordination'],
        commonQuestions: [
          'How to set up app integrations?',
          'Why aren\'t my apps syncing?',
          'How does workflow coordination work?',
          'How to enable ambient intelligence?'
        ]
      },
      models: {
        keywords: ['models', 'local', 'cloud', 'api', 'connection', 'availability'],
        relatedFeatures: ['model interface', 'local models', 'cloud models'],
        commonQuestions: [
          'What models are available?',
          'How to add new models?',
          'Why is my model not working?',
          'Local vs cloud models?'
        ]
      }
    };

    // Progressive disclosure levels
    this.disclosureLevels = {
      beginner: {
        focus: 'basics',
        detail_level: 'high',
        show_examples: true,
        show_benefits: true,
        max_options: 3
      },
      intermediate: {
        focus: 'balanced',
        detail_level: 'medium',
        show_examples: true,
        show_benefits: false,
        max_options: 5
      },
      advanced: {
        focus: 'technical',
        detail_level: 'low',
        show_examples: false,
        show_benefits: false,
        max_options: 10
      }
    };

    console.log('InteractiveHelp system initialized with natural language processing');
  }

  /**
   * Process natural language help query
   */
  async processHelpQuery(query, context = {}) {
    try {
      const sessionId = context.sessionId || this.generateSessionId();
      const userLevel = context.userLevel || this.config.defaultUserLevel;
      
      // Create or update help session
      const session = this.getOrCreateSession(sessionId, userLevel);
      session.lastActivity = Date.now();
      session.queryCount++;
      
      // Analyze query intent and extract key information
      const queryAnalysis = this.analyzeQuery(query);
      
      // Generate contextual response
      const response = await this.generateHelpResponse(queryAnalysis, session, context);
      
      // Track interaction for learning
      this.trackInteraction(sessionId, query, queryAnalysis, response);
      
      // Emit help event for analytics
      this.emit('help_query_processed', {
        session_id: sessionId,
        query,
        intent: queryAnalysis.intent,
        response_type: response.type,
        user_level: userLevel
      });

      return {
        success: true,
        response,
        session_id: sessionId,
        query_analysis: queryAnalysis
      };

    } catch (error) {
      console.error('Error processing help query:', error);
      return {
        success: false,
        error: error.message,
        fallback_response: this.getFallbackResponse(query)
      };
    }
  }

  /**
   * Analyze natural language query to determine intent and extract entities
   */
  analyzeQuery(query) {
    const analysis = {
      original_query: query,
      intent: 'unknown',
      entities: [],
      topic: null,
      confidence: 0,
      context_keywords: []
    };

    // Normalize query
    const normalizedQuery = query.toLowerCase().trim();
    
    // Match against query patterns
    for (const [intentType, intentConfig] of Object.entries(this.queryPatterns)) {
      for (const pattern of intentConfig.patterns) {
        const match = normalizedQuery.match(pattern);
        if (match) {
          analysis.intent = intentType;
          analysis.entities = match.slice(1); // Extract captured groups
          analysis.confidence = 0.8;
          break;
        }
      }
      if (analysis.intent !== 'unknown') break;
    }

    // Identify topic/context
    for (const [topicName, topicConfig] of Object.entries(this.contextualTopics)) {
      const keywordMatches = topicConfig.keywords.filter(keyword => 
        normalizedQuery.includes(keyword)
      );
      
      if (keywordMatches.length > 0) {
        analysis.topic = topicName;
        analysis.context_keywords = keywordMatches;
        analysis.confidence += keywordMatches.length * 0.1;
      }
    }

    // If no specific intent found, try to classify as general question
    if (analysis.intent === 'unknown') {
      if (normalizedQuery.includes('?')) {
        analysis.intent = 'general_question';
        analysis.confidence = 0.3;
      } else {
        analysis.intent = 'request_clarification';
        analysis.confidence = 0.2;
      }
    }

    return analysis;
  }

  /**
   * Generate contextual help response based on query analysis
   */
  async generateHelpResponse(analysis, session, context) {
    const userLevel = session.userLevel;
    const disclosureConfig = this.disclosureLevels[userLevel];

    // Route to appropriate handler based on intent
    const handlerName = this.queryPatterns[analysis.intent]?.handler;
    if (handlerName && this[handlerName]) {
      return await this[handlerName](analysis, session, context);
    }

    // Fallback to general response generation
    return await this.generateGeneralResponse(analysis, session, context);
  }

  /**
   * Handle "how to" queries
   */
  async handleHowToQuery(analysis, session, context) {
    const entity = analysis.entities[0];
    const topic = analysis.topic;

    let response = {
      type: 'how_to_guide',
      title: `How to ${entity}`,
      steps: [],
      tips: [],
      related_help: []
    };

    // Get system introspection for current capabilities
    let systemStatus = null;
    if (this.config.selfAwarenessEngine) {
      systemStatus = await this.config.selfAwarenessEngine.performSystemIntrospection();
    }

    // Generate topic-specific how-to guidance
    if (topic === 'routing') {
      response = await this.generateRoutingHowTo(entity, systemStatus, session);
    } else if (topic === 'personalization') {
      response = await this.generatePersonalizationHowTo(entity, systemStatus, session);
    } else if (topic === 'ambient') {
      response = await this.generateAmbientHowTo(entity, systemStatus, session);
    } else {
      response = await this.generateGeneralHowTo(entity, analysis, session);
    }

    // Add contextual suggestions based on user level
    this.addContextualSuggestions(response, session, topic);

    return response;
  }

  /**
   * Handle "what is" queries
   */
  async handleWhatQuery(analysis, session, context) {
    const entity = analysis.entities[0];
    
    // Use self-awareness engine to explain capabilities
    if (this.config.selfAwarenessEngine) {
      const explanation = this.config.selfAwarenessEngine.explainCapability(entity, session.userLevel);
      
      if (explanation.success) {
        return {
          type: 'capability_explanation',
          title: explanation.explanation.name,
          description: explanation.explanation.description,
          key_features: explanation.explanation.key_features,
          benefits: explanation.explanation.how_it_helps,
          examples: explanation.explanation.examples,
          advanced_features: explanation.explanation.advanced_features,
          related_capabilities: explanation.related_capabilities
        };
      }
    }

    // Fallback to general explanation
    return {
      type: 'general_explanation',
      title: `About ${entity}`,
      description: `${entity} is a feature of The Steward that helps improve your AI experience.`,
      suggestion: 'Ask me about specific features like "routing", "personalization", or "ambient intelligence" for detailed explanations.'
    };
  }

  /**
   * Handle "why" queries
   */
  async handleWhyQuery(analysis, session, context) {
    const entity = analysis.entities[0];
    const topic = analysis.topic;

    // Generate reasoning based on topic
    if (topic === 'routing') {
      return await this.explainRoutingReasoning(entity, context);
    } else if (topic === 'personalization') {
      return await this.explainPersonalizationReasoning(entity, context);
    }

    return {
      type: 'reasoning_explanation',
      title: `Why ${entity}`,
      reasoning: this.generateGenericReasoning(entity),
      context: 'This helps optimize your experience with The Steward',
      learn_more: `Ask me "how to" questions to learn how to use ${entity} effectively`
    };
  }

  /**
   * Handle troubleshooting queries
   */
  async handleTroubleshootingQuery(analysis, session, context) {
    const issue = analysis.entities[0];
    
    // Use self-awareness engine for troubleshooting guidance
    if (this.config.selfAwarenessEngine) {
      const troubleshooting = this.config.selfAwarenessEngine.generateTroubleshootingGuidance(issue);
      
      if (troubleshooting.success) {
        return {
          type: 'troubleshooting_guide',
          issue_type: troubleshooting.issue_type,
          component: troubleshooting.component,
          steps: troubleshooting.troubleshooting_steps,
          additional_guidance: troubleshooting.guidance,
          related_docs: troubleshooting.related_docs
        };
      }
    }

    // Fallback troubleshooting
    return {
      type: 'general_troubleshooting',
      title: `Troubleshooting ${issue}`,
      steps: [
        'Check system status and connections',
        'Review configuration settings',
        'Try restarting the affected component',
        'Check for error messages in logs'
      ],
      suggestion: 'If the issue persists, please provide more specific details about what\'s not working'
    };
  }

  /**
   * Handle feature discovery queries
   */
  async handleDiscoveryQuery(analysis, session, context) {
    const entity = analysis.entities[0];
    
    // Get current system capabilities
    let capabilities = {};
    if (this.config.selfAwarenessEngine) {
      const introspection = await this.config.selfAwarenessEngine.performSystemIntrospection();
      capabilities = introspection.available_capabilities || {};
    }

    return {
      type: 'feature_discovery',
      title: `${entity} Capabilities`,
      available_features: this.formatCapabilitiesForDiscovery(capabilities, entity),
      getting_started: this.getGettingStartedSuggestions(entity),
      related_topics: this.getRelatedTopics(entity)
    };
  }

  /**
   * Handle getting started queries
   */
  async handleGettingStartedQuery(analysis, session, context) {
    // Get system status to provide personalized onboarding
    let systemStatus = null;
    if (this.config.selfAwarenessEngine) {
      systemStatus = await this.config.selfAwarenessEngine.performSystemIntrospection();
    }

    const onboardingPath = this.generateOnboardingPath(systemStatus, session);

    return {
      type: 'getting_started_guide',
      title: 'Getting Started with The Steward',
      current_status: this.assessCurrentSetup(systemStatus),
      recommended_steps: onboardingPath,
      quick_wins: this.getQuickWins(systemStatus),
      estimated_time: this.estimateOnboardingTime(onboardingPath)
    };
  }

  /**
   * Generate routing-specific how-to guidance
   */
  async generateRoutingHowTo(entity, systemStatus, session) {
    const routingGuides = {
      'change routing preferences': {
        steps: [
          'Open The Steward configuration',
          'Navigate to Routing Preferences',
          'Adjust model selection criteria',
          'Set cost vs. quality preferences',
          'Save your preferences'
        ],
        tips: ['Start with balanced settings', 'Monitor performance after changes'],
        prerequisites: ['Character sheet setup recommended']
      },
      'improve response quality': {
        steps: [
          'Review current routing settings',
          'Enable quality-focused routing',
          'Update character sheet with your preferences',
          'Provide more specific prompts',
          'Monitor response improvements'
        ],
        tips: ['Be specific in your requests', 'Configure ADHD accommodations if applicable']
      }
    };

    const guide = routingGuides[entity.toLowerCase()] || this.generateFallbackGuide(entity);
    
    return {
      type: 'routing_how_to',
      title: `How to ${entity}`,
      ...guide,
      current_routing_status: systemStatus?.system_health?.smart_routing?.status || 'unknown'
    };
  }

  /**
   * Generate personalization how-to guidance
   */
  async generatePersonalizationHowTo(entity, systemStatus, session) {
    const personalizationGuides = {
      'set up character sheet': {
        steps: [
          'Create or open character-sheet.yaml',
          'Fill in cognitive preferences section',
          'Configure communication style preferences',
          'Set work patterns and availability',
          'Add ADHD accommodations if applicable',
          'Save and test the configuration'
        ],
        tips: ['Start with basic preferences', 'Update gradually based on experience'],
        estimated_time: '10-15 minutes'
      },
      'configure adhd accommodations': {
        steps: [
          'Open character sheet configuration',
          'Enable ADHD-aware features',
          'Set energy management preferences',
          'Configure context switching support',
          'Enable task breakdown features',
          'Test accommodations with sample tasks'
        ],
        tips: ['Be honest about your needs', 'Adjust settings based on what helps']
      }
    };

    const guide = personalizationGuides[entity.toLowerCase()] || this.generateFallbackGuide(entity);
    
    return {
      type: 'personalization_how_to',
      title: `How to ${entity}`,
      ...guide,
      character_sheet_status: systemStatus?.configuration_status?.character_sheet?.status || 'unknown'
    };
  }

  /**
   * Generate ambient intelligence how-to guidance
   */
  async generateAmbientHowTo(entity, systemStatus, session) {
    const ambientGuides = {
      'set up app integrations': {
        steps: [
          'Configure Notion API token (optional)',
          'Enable Things 3 URL scheme access',
          'Set up Apple Notes permissions',
          'Test individual app connections',
          'Enable ambient intelligence coordination',
          'Verify cross-app synchronization'
        ],
        tips: ['Start with one app at a time', 'Check permissions carefully'],
        prerequisites: ['Notion, Things 3, or Apple Notes installed']
      },
      'enable workflow coordination': {
        steps: [
          'Ensure app integrations are working',
          'Enable ambient intelligence in settings',
          'Configure workflow preferences',
          'Set up automation rules',
          'Test with a simple workflow',
          'Monitor coordination results'
        ],
        tips: ['Start with simple workflows', 'Monitor for conflicts']
      }
    };

    const guide = ambientGuides[entity.toLowerCase()] || this.generateFallbackGuide(entity);
    
    return {
      type: 'ambient_how_to',
      title: `How to ${entity}`,
      ...guide,
      ambient_status: systemStatus?.integration_status?.ambient?.status || 'unknown'
    };
  }

  /**
   * Generate fallback guide for unrecognized entities
   */
  generateFallbackGuide(entity) {
    return {
      steps: [
        'Identify what you want to accomplish',
        'Check current system status',
        'Review related documentation',
        'Try basic configuration steps',
        'Test the functionality'
      ],
      tips: ['Start with simple steps', 'Ask for specific help if needed'],
      note: `Specific guidance for "${entity}" is not available. Try asking about routing, personalization, or ambient intelligence.`
    };
  }

  /**
   * Add contextual suggestions based on user level and topic
   */
  addContextualSuggestions(response, session, topic) {
    const suggestions = [];
    
    // Add topic-specific suggestions
    if (topic && this.contextualTopics[topic]) {
      const topicConfig = this.contextualTopics[topic];
      suggestions.push(...topicConfig.commonQuestions.slice(0, 3));
    }

    // Add user level-appropriate suggestions
    if (session.userLevel === 'beginner') {
      suggestions.unshift('What is The Steward?', 'How to get started?');
    } else if (session.userLevel === 'advanced') {
      suggestions.push('Advanced configuration options', 'System optimization tips');
    }

    response.suggestions = suggestions.slice(0, 5);
  }

  /**
   * Get or create help session
   */
  getOrCreateSession(sessionId, userLevel) {
    if (!this.activeSessions.has(sessionId)) {
      this.activeSessions.set(sessionId, {
        id: sessionId,
        userLevel: userLevel,
        created: Date.now(),
        lastActivity: Date.now(),
        queryCount: 0,
        context: {},
        helpHistory: []
      });
    }
    return this.activeSessions.get(sessionId);
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    return `help_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track user interaction for learning and improvement
   */
  trackInteraction(sessionId, query, analysis, response) {
    const interaction = {
      session_id: sessionId,
      timestamp: Date.now(),
      query,
      intent: analysis.intent,
      topic: analysis.topic,
      response_type: response.type,
      confidence: analysis.confidence
    };

    this.helpHistory.push(interaction);
    
    // Keep history manageable
    if (this.helpHistory.length > 1000) {
      this.helpHistory = this.helpHistory.slice(-500);
    }
  }

  /**
   * Get fallback response for failed queries
   */
  getFallbackResponse(query) {
    return {
      type: 'fallback',
      message: 'I\'m not sure how to help with that specific question.',
      suggestions: [
        'Try asking "What is smart routing?"',
        'Ask "How do I set up character sheet?"',
        'Try "What can ambient intelligence do?"',
        'Ask "How to troubleshoot slow responses?"'
      ],
      note: 'I work best with questions about routing, personalization, ambient intelligence, and troubleshooting.'
    };
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    const expiredSessions = [];

    this.activeSessions.forEach((session, sessionId) => {
      if (now - session.lastActivity > this.config.helpSessionTimeout) {
        expiredSessions.push(sessionId);
      }
    });

    expiredSessions.forEach(sessionId => {
      this.activeSessions.delete(sessionId);
    });

    if (expiredSessions.length > 0) {
      console.log(`Cleaned up ${expiredSessions.length} expired help sessions`);
    }
  }

  /**
   * Get help analytics
   */
  getAnalytics() {
    return {
      active_sessions: this.activeSessions.size,
      total_queries: this.helpHistory.length,
      popular_intents: this.getPopularIntents(),
      popular_topics: this.getPopularTopics(),
      user_levels: this.getUserLevelDistribution()
    };
  }

  /**
   * Get popular intents from help history
   */
  getPopularIntents() {
    const intentCounts = {};
    this.helpHistory.forEach(interaction => {
      intentCounts[interaction.intent] = (intentCounts[interaction.intent] || 0) + 1;
    });

    return Object.entries(intentCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([intent, count]) => ({ intent, count }));
  }

  /**
   * Get popular topics from help history
   */
  getPopularTopics() {
    const topicCounts = {};
    this.helpHistory.forEach(interaction => {
      if (interaction.topic) {
        topicCounts[interaction.topic] = (topicCounts[interaction.topic] || 0) + 1;
      }
    });

    return Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }));
  }

  /**
   * Get user level distribution
   */
  getUserLevelDistribution() {
    const levelCounts = { beginner: 0, intermediate: 0, advanced: 0 };
    
    this.activeSessions.forEach(session => {
      levelCounts[session.userLevel] = (levelCounts[session.userLevel] || 0) + 1;
    });

    return levelCounts;
  }

  /**
   * Generate generic reasoning for unknown topics
   */
  generateGenericReasoning(entity) {
    return `${entity} is designed to enhance your productivity and experience with The Steward by providing intelligent assistance and automation.`;
  }

  /**
   * Generate general response for unhandled queries
   */
  async generateGeneralResponse(analysis, session, context) {
    return {
      type: 'general_response',
      title: 'General Information',
      message: `I understand you're asking about "${analysis.original_query}". Let me provide some general guidance.`,
      suggestions: [
        'Try asking "What is smart routing?"',
        'Ask "How do I set up character sheet?"',
        'Try "What can ambient intelligence do?"'
      ]
    };
  }

  /**
   * Generate general how-to guide
   */
  async generateGeneralHowTo(entity, analysis, session) {
    return {
      type: 'how_to_guide',
      title: `How to ${entity}`,
      steps: [
        'Check the system status to understand current state',
        'Review the documentation for specific guidance',
        'Try the feature with basic settings first',
        'Adjust configuration based on your needs'
      ],
      tips: ['Start with simple configurations', 'Ask for specific help if needed'],
      note: `For more specific guidance about "${entity}", try asking about routing, personalization, or ambient intelligence.`
    };
  }

  /**
   * Explain routing reasoning for why queries
   */
  async explainRoutingReasoning(entity, context) {
    return {
      type: 'reasoning_explanation',
      title: `Why Smart Routing`,
      reasoning: 'Smart routing automatically selects the best AI model for each task to balance speed, quality, and cost based on your preferences and the task requirements.',
      context: 'This ensures you get optimal responses while managing resources efficiently',
      learn_more: 'Ask "How does smart routing work?" for more details'
    };
  }

  /**
   * Explain personalization reasoning
   */
  async explainPersonalizationReasoning(entity, context) {
    return {
      type: 'reasoning_explanation', 
      title: `Why Personalization`,
      reasoning: 'Personalization adapts The Steward to your specific cognitive patterns, work style, and preferences, especially ADHD accommodations.',
      context: 'This makes interactions more effective and reduces cognitive load',
      learn_more: 'Ask "How to set up character sheet?" to get started'
    };
  }
}

module.exports = InteractiveHelp;

// #endregion end: Interactive Help System