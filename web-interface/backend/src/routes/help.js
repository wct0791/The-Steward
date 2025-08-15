// #region start: Help API Routes for Self-Documentation System
// Provides REST API endpoints for The Steward's self-documentation capabilities
// Integrates all self-documentation components with the web interface

const express = require('express');
const router = express.Router();
const path = require('path');

// Import self-documentation components
const SelfAwarenessEngine = require('../../../../src/self-documentation/SelfAwarenessEngine');
const InteractiveHelp = require('../../../../src/self-documentation/InteractiveHelp');
const CapabilityExplainer = require('../../../../src/self-documentation/CapabilityExplainer');
const FeatureDiscovery = require('../../../../src/self-documentation/FeatureDiscovery');

/**
 * Help API Router - Self-Documentation System Integration
 * 
 * Provides 5 core API endpoints:
 * 1. POST /api/help/explain/:topic - Get detailed explanations of capabilities
 * 2. POST /api/help/discover - Get feature suggestions based on context
 * 3. POST /api/help/routing-decision - Explain routing decisions
 * 4. GET /api/help/quick-start - Get personalized onboarding guidance
 * 5. POST /api/help/troubleshoot - Get troubleshooting assistance
 */

// Initialize self-documentation components
let selfAwarenessEngine = null;
let interactiveHelp = null;
let capabilityExplainer = null;
let featureDiscovery = null;

/**
 * Initialize self-documentation system components
 */
function initializeSelfDocumentationSystem(systemComponents = {}) {
  try {
    // Initialize SelfAwarenessEngine with system components
    selfAwarenessEngine = new SelfAwarenessEngine({
      smartRoutingEngine: systemComponents.smartRoutingEngine,
      characterSheet: systemComponents.characterSheet,
      modelInterface: systemComponents.modelInterface,
      ambientOrchestrator: systemComponents.ambientOrchestrator,
      enableDeepIntrospection: true,
      cacheIntrospectionResults: true
    });

    // Initialize InteractiveHelp with SelfAwarenessEngine
    interactiveHelp = new InteractiveHelp({
      selfAwarenessEngine: selfAwarenessEngine,
      enableContextualHelp: true,
      enableProactiveHelp: true
    });

    // Initialize CapabilityExplainer
    capabilityExplainer = new CapabilityExplainer({
      smartRoutingEngine: systemComponents.smartRoutingEngine,
      selfAwarenessEngine: selfAwarenessEngine,
      modelInterface: systemComponents.modelInterface,
      enableDetailedExplanations: true,
      explainCosts: true,
      explainPerformance: true
    });

    // Initialize FeatureDiscovery
    featureDiscovery = new FeatureDiscovery({
      selfAwarenessEngine: selfAwarenessEngine,
      trackUsagePatterns: true,
      enableProactiveDiscovery: true
    });

    console.log('✅ Self-documentation system initialized for Help API');
    return true;

  } catch (error) {
    console.error('❌ Failed to initialize self-documentation system:', error);
    return false;
  }
}

/**
 * Middleware to ensure components are initialized
 */
function ensureInitialized(req, res, next) {
  if (!selfAwarenessEngine || !interactiveHelp || !capabilityExplainer || !featureDiscovery) {
    return res.status(503).json({
      success: false,
      error: 'Self-documentation system not initialized',
      suggestion: 'Please contact administrator to initialize help system components'
    });
  }
  next();
}

/**
 * 1. POST /api/help/explain/:topic
 * Get detailed explanations of system capabilities and features
 */
router.post('/explain/:topic', ensureInitialized, async (req, res) => {
  try {
    const { topic } = req.params;
    const { userLevel = 'intermediate', context = {} } = req.body;

    console.log(`📝 Help explanation request for topic: ${topic}`);

    // Get capability explanation from SelfAwarenessEngine
    const explanation = selfAwarenessEngine.explainCapability(topic, userLevel);

    if (!explanation.success) {
      // Try interactive help for broader topic handling
      const helpResponse = await interactiveHelp.processHelpQuery(
        `what is ${topic}`,
        { userLevel, ...context }
      );

      if (helpResponse.success) {
        return res.json({
          success: true,
          explanation: helpResponse.response,
          source: 'interactive_help',
          user_level: userLevel
        });
      }
    }

    // Add system status context if available
    let systemStatus = null;
    try {
      systemStatus = await selfAwarenessEngine.performSystemIntrospection();
    } catch (error) {
      console.warn('Could not get system status for explanation:', error.message);
    }

    res.json({
      success: explanation.success,
      explanation: explanation.explanation || explanation.fallback_explanation,
      user_level: explanation.user_level || userLevel,
      related_capabilities: explanation.related_capabilities || [],
      system_context: systemStatus ? {
        overall_health: systemStatus.system_health,
        available_capabilities: systemStatus.available_capabilities
      } : null,
      error: explanation.error || null
    });

  } catch (error) {
    console.error('Error in explain endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate explanation',
      details: error.message
    });
  }
});

/**
 * 2. POST /api/help/discover
 * Get intelligent feature suggestions based on user interaction context
 */
router.post('/discover', ensureInitialized, async (req, res) => {
  try {
    const {
      interactionData = {},
      userContext = {},
      requestType = 'general'
    } = req.body;

    console.log(`🔍 Feature discovery request: ${requestType}`);

    // Use FeatureDiscovery to suggest relevant features
    const suggestions = await featureDiscovery.suggestRelevantFeatures(
      interactionData,
      userContext
    );

    // Get current system capabilities for additional context
    let systemCapabilities = null;
    try {
      const systemStatus = await selfAwarenessEngine.performSystemIntrospection();
      systemCapabilities = systemStatus.available_capabilities;
    } catch (error) {
      console.warn('Could not get system capabilities for discovery:', error.message);
    }

    // Generate onboarding path if user is new
    let onboardingPath = null;
    if (userContext.userLevel === 'beginner' || userContext.isNewUser) {
      try {
        const systemStatus = await selfAwarenessEngine.performSystemIntrospection();
        onboardingPath = featureDiscovery.generateOnboardingPath(
          systemStatus,
          suggestions.user_expertise || { overall_level: 'beginner' }
        );
      } catch (error) {
        console.warn('Could not generate onboarding path:', error.message);
      }
    }

    res.json({
      success: suggestions.success,
      feature_suggestions: suggestions.suggestions || [],
      user_expertise: suggestions.user_expertise,
      discovery_context: suggestions.discovery_context,
      onboarding_path: onboardingPath,
      system_capabilities: systemCapabilities,
      analytics: featureDiscovery.getDiscoveryAnalytics(),
      error: suggestions.error || null
    });

  } catch (error) {
    console.error('Error in discover endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate feature suggestions',
      details: error.message
    });
  }
});

/**
 * 3. POST /api/help/routing-decision
 * Explain AI model routing decisions and provide reasoning
 */
router.post('/routing-decision', ensureInitialized, async (req, res) => {
  try {
    const { routingData, context = {} } = req.body;

    console.log(`🧭 Routing decision explanation request`);

    if (!routingData) {
      return res.status(400).json({
        success: false,
        error: 'Routing data is required',
        suggestion: 'Please provide routing decision data to explain'
      });
    }

    // Use CapabilityExplainer to explain the routing decision
    const explanation = capabilityExplainer.explainRoutingDecision(routingData, context);

    // Add ADHD accommodations explanation if applicable
    let adhdExplanation = null;
    if (context.adhdAccommodations || routingData.adhdOptimizations) {
      const accommodationType = routingData.adhdOptimizations?.type || 'task_breakdown';
      adhdExplanation = capabilityExplainer.explainAdhdAccommodation(accommodationType, context);
    }

    res.json({
      success: explanation.success,
      routing_explanation: explanation.explanation,
      adhd_accommodations: adhdExplanation,
      timestamp: explanation.timestamp,
      error: explanation.error || null
    });

  } catch (error) {
    console.error('Error in routing-decision endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to explain routing decision',
      details: error.message
    });
  }
});

/**
 * 4. GET /api/help/quick-start
 * Get personalized onboarding and quick-start guidance
 */
router.get('/quick-start', ensureInitialized, async (req, res) => {
  try {
    const {
      userLevel = 'intermediate',
      existingSetup = false,
      focusAreas = []
    } = req.query;

    console.log(`🚀 Quick-start guidance request for ${userLevel} user`);

    // Get system status to provide personalized guidance
    const systemStatus = await selfAwarenessEngine.performSystemIntrospection();

    // Process getting started query through InteractiveHelp
    const helpResponse = await interactiveHelp.processHelpQuery(
      'getting started',
      { userLevel, systemStatus, existingSetup }
    );

    // Generate feature suggestions for quick wins
    const quickWinSuggestions = await featureDiscovery.suggestRelevantFeatures(
      {
        taskType: 'onboarding',
        indicators: focusAreas.length > 0 ? focusAreas : ['first_use']
      },
      { userLevel, isNewUser: !existingSetup }
    );

    // Get system recommendations
    const recommendations = systemStatus.recommendations || [];

    res.json({
      success: true,
      quick_start_guide: helpResponse.success ? helpResponse.response : null,
      system_status: {
        overall_health: systemStatus.system_health,
        configuration_status: systemStatus.configuration_status,
        integration_status: systemStatus.integration_status
      },
      quick_wins: quickWinSuggestions.suggestions?.slice(0, 3) || [],
      recommendations: recommendations.slice(0, 5),
      estimated_setup_time: this.estimateSetupTime(systemStatus, userLevel),
      next_steps: this.generateNextSteps(systemStatus, userLevel, existingSetup),
      user_level: userLevel
    });

  } catch (error) {
    console.error('Error in quick-start endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate quick-start guidance',
      details: error.message
    });
  }
});

/**
 * 5. POST /api/help/troubleshoot
 * Get intelligent troubleshooting assistance for system issues
 */
router.post('/troubleshoot', ensureInitialized, async (req, res) => {
  try {
    const {
      issue,
      context = {},
      userLevel = 'intermediate'
    } = req.body;

    console.log(`🔧 Troubleshooting request: ${issue}`);

    if (!issue) {
      return res.status(400).json({
        success: false,
        error: 'Issue description is required',
        suggestion: 'Please describe the problem you are experiencing'
      });
    }

    // Process troubleshooting query through InteractiveHelp
    const helpResponse = await interactiveHelp.processHelpQuery(
      `${issue} not working`,
      { userLevel, ...context }
    );

    // Get system-specific troubleshooting from SelfAwarenessEngine
    const troubleshootingGuidance = selfAwarenessEngine.generateTroubleshootingGuidance(issue);

    // Get current system status for diagnostic context
    const systemStatus = await selfAwarenessEngine.performSystemIntrospection();

    // Generate integration-specific guidance if applicable
    let integrationGuidance = null;
    if (issue.toLowerCase().includes('sync') || issue.toLowerCase().includes('integration')) {
      const integrations = ['notion', 'things', 'apple_notes'];
      const relevantIntegration = integrations.find(int => 
        issue.toLowerCase().includes(int.replace('_', ' '))
      );
      
      if (relevantIntegration) {
        integrationGuidance = capabilityExplainer.explainIntegrationBenefit(relevantIntegration);
      }
    }

    res.json({
      success: true,
      troubleshooting_guide: helpResponse.success ? helpResponse.response : null,
      system_guidance: troubleshootingGuidance,
      integration_guidance: integrationGuidance,
      system_diagnostics: {
        overall_health: systemStatus.system_health,
        potential_issues: this.identifyPotentialIssues(systemStatus, issue),
        affected_components: this.identifyAffectedComponents(systemStatus, issue)
      },
      recommended_actions: this.generateTroubleshootingActions(issue, systemStatus),
      escalation_guidance: this.getEscalationGuidance(issue, troubleshootingGuidance)
    });

  } catch (error) {
    console.error('Error in troubleshoot endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate troubleshooting guidance',
      details: error.message
    });
  }
});

/**
 * GET /api/help/system-status
 * Get current system status and health information
 */
router.get('/system-status', ensureInitialized, async (req, res) => {
  try {
    console.log('📊 System status request');

    // Get comprehensive system status
    const systemStatus = await selfAwarenessEngine.performSystemIntrospection();
    const quickStatus = selfAwarenessEngine.getSystemStatusSummary();

    // Get help system analytics
    const helpAnalytics = interactiveHelp.getAnalytics();
    const discoveryAnalytics = featureDiscovery.getDiscoveryAnalytics();

    res.json({
      success: true,
      system_health: systemStatus.system_health,
      capabilities: systemStatus.available_capabilities,
      configuration: systemStatus.configuration_status,
      integrations: systemStatus.integration_status,
      performance: systemStatus.performance_metrics,
      quick_summary: quickStatus,
      help_analytics: helpAnalytics,
      discovery_analytics: discoveryAnalytics,
      last_introspection: systemStatus.timestamp,
      recommendations: systemStatus.recommendations || []
    });

  } catch (error) {
    console.error('Error in system-status endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve system status',
      details: error.message
    });
  }
});

/**
 * POST /api/help/query
 * General natural language help query endpoint
 */
router.post('/query', ensureInitialized, async (req, res) => {
  try {
    const {
      query,
      context = {},
      userLevel = 'intermediate'
    } = req.body;

    console.log(`💬 Natural language help query: "${query}"`);

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
        suggestion: 'Please provide a question or request for help'
      });
    }

    // Process the query through InteractiveHelp
    const response = await interactiveHelp.processHelpQuery(query, {
      userLevel,
      ...context
    });

    res.json({
      success: response.success,
      response: response.response,
      query_analysis: response.query_analysis,
      session_id: response.session_id,
      error: response.error || null,
      fallback_response: response.fallback_response || null
    });

  } catch (error) {
    console.error('Error in query endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process help query',
      details: error.message
    });
  }
});

/**
 * Helper function to estimate setup time
 */
function estimateSetupTime(systemStatus, userLevel) {
  let baseTime = userLevel === 'beginner' ? 30 : userLevel === 'intermediate' ? 20 : 10;
  
  // Add time for unconfigured components
  if (systemStatus.configuration_status?.character_sheet?.status !== 'configured') {
    baseTime += 10;
  }
  if (systemStatus.integration_status?.ambient?.status !== 'active') {
    baseTime += 15;
  }
  
  return `${baseTime}-${baseTime + 10} minutes`;
}

/**
 * Helper function to generate next steps
 */
function generateNextSteps(systemStatus, userLevel, existingSetup) {
  const steps = [];
  
  if (!existingSetup) {
    steps.push('Complete character sheet setup for personalized responses');
  }
  
  if (systemStatus.configuration_status?.character_sheet?.completeness_score < 75) {
    steps.push('Finish character sheet configuration');
  }
  
  if (systemStatus.integration_status?.ambient?.status !== 'active') {
    steps.push('Set up app integrations for workflow coordination');
  }
  
  steps.push('Try asking specific questions to test the help system');
  
  return steps;
}

/**
 * Helper function to identify potential issues
 */
function identifyPotentialIssues(systemStatus, issue) {
  const issues = [];
  
  if (issue.toLowerCase().includes('slow')) {
    if (systemStatus.performance_metrics?.efficiency_score < 80) {
      issues.push('System performance below optimal levels');
    }
  }
  
  if (issue.toLowerCase().includes('sync') || issue.toLowerCase().includes('integration')) {
    if (systemStatus.integration_status?.ambient?.status !== 'active') {
      issues.push('Ambient intelligence integration not active');
    }
  }
  
  return issues;
}

/**
 * Helper function to identify affected components
 */
function identifyAffectedComponents(systemStatus, issue) {
  const components = [];
  
  if (issue.toLowerCase().includes('routing') || issue.toLowerCase().includes('model')) {
    components.push('smart-routing');
  }
  
  if (issue.toLowerCase().includes('sync') || issue.toLowerCase().includes('workflow')) {
    components.push('ambient-intelligence');
  }
  
  if (issue.toLowerCase().includes('personalization') || issue.toLowerCase().includes('preference')) {
    components.push('character-sheet');
  }
  
  return components;
}

/**
 * Helper function to generate troubleshooting actions
 */
function generateTroubleshootingActions(issue, systemStatus) {
  const actions = [];
  
  actions.push('Check system status and overall health');
  
  if (issue.toLowerCase().includes('slow')) {
    actions.push('Review model selection and routing preferences');
    actions.push('Check network connectivity');
  }
  
  if (issue.toLowerCase().includes('sync')) {
    actions.push('Verify app permissions and API credentials');
    actions.push('Test individual app connections');
  }
  
  actions.push('Review related documentation and guides');
  actions.push('Contact support if issue persists');
  
  return actions;
}

/**
 * Helper function to get escalation guidance
 */
function getEscalationGuidance(issue, troubleshootingGuidance) {
  if (!troubleshootingGuidance.success) {
    return {
      when_to_escalate: 'If basic troubleshooting steps don\'t resolve the issue',
      how_to_escalate: 'Provide detailed description of the problem and steps already tried',
      what_to_include: [
        'Specific error messages',
        'Steps that led to the issue',
        'System configuration details',
        'Any recent changes made'
      ]
    };
  }
  
  return {
    when_to_escalate: 'After trying all suggested troubleshooting steps',
    next_level_support: 'Technical support with system-specific expertise',
    expected_response_time: '1-2 business days for complex technical issues'
  };
}

// Export the router and initialization function
module.exports = {
  router,
  initializeSelfDocumentationSystem
};

// #endregion end: Help API Routes for Self-Documentation System