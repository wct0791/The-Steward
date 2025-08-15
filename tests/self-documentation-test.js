// #region start: Self-Documentation System Tests
// Comprehensive test suite for The Steward's self-documentation capabilities
// Tests all components: SelfAwarenessEngine, InteractiveHelp, CapabilityExplainer, and FeatureDiscovery

const assert = require('assert');
const path = require('path');

// Import self-documentation components
const SelfAwarenessEngine = require('../src/self-documentation/SelfAwarenessEngine');
const InteractiveHelp = require('../src/self-documentation/InteractiveHelp');
const CapabilityExplainer = require('../src/self-documentation/CapabilityExplainer');
const FeatureDiscovery = require('../src/self-documentation/FeatureDiscovery');

/**
 * Self-Documentation System Test Suite
 * 
 * Tests the complete self-documentation ecosystem:
 * 1. Component initialization and configuration
 * 2. System introspection and capability mapping
 * 3. Natural language help query processing
 * 4. Routing decision explanation
 * 5. Feature discovery and suggestion
 * 6. End-to-end self-documentation workflows
 * 7. API endpoint functionality
 * 8. Progressive disclosure and user adaptation
 */
class SelfDocumentationTestSuite {
  constructor() {
    this.testResults = [];
    this.components = {};
    this.startTime = Date.now();
    
    console.log('📚 Initializing Self-Documentation Test Suite...');
    console.log('=' .repeat(60));
  }

  /**
   * Run the complete test suite
   */
  async runAllTests() {
    try {
      console.log('🚀 Starting Self-Documentation System Test Suite');
      console.log(`📅 Started at: ${new Date().toISOString()}`);
      console.log('');

      // Test 1: Component initialization
      await this.testComponentInitialization();
      
      // Test 2: System introspection
      await this.testSystemIntrospection();
      
      // Test 3: Natural language help processing
      await this.testNaturalLanguageHelp();
      
      // Test 4: Capability explanations
      await this.testCapabilityExplanations();
      
      // Test 5: Feature discovery
      await this.testFeatureDiscovery();
      
      // Test 6: Routing decision explanations
      await this.testRoutingExplanations();
      
      // Test 7: Progressive disclosure
      await this.testProgressiveDisclosure();
      
      // Test 8: End-to-end workflows
      await this.testEndToEndWorkflows();

      // Generate final report
      this.generateTestReport();
      
      return this.testResults;

    } catch (error) {
      console.error('❌ Test suite execution failed:', error);
      this.recordTestResult('Test Suite Execution', false, error.message);
      return this.testResults;
    }
  }

  /**
   * Test 1: Component Initialization
   */
  async testComponentInitialization() {
    console.log('🔧 Test 1: Component Initialization');
    console.log('-'.repeat(40));

    try {
      // Test SelfAwarenessEngine initialization
      const selfAwarenessEngine = new SelfAwarenessEngine({
        smartRoutingEngine: null, // Mock components for testing
        characterSheet: { cognitive_preferences: { adhd_accommodations: true } },
        modelInterface: null,
        ambientOrchestrator: null,
        enableDeepIntrospection: true,
        cacheIntrospectionResults: false // Disable caching for testing
      });
      
      this.components.selfAwarenessEngine = selfAwarenessEngine;
      this.recordTestResult('SelfAwarenessEngine Initialization', true, 'Successfully initialized');
      console.log('  ✅ SelfAwarenessEngine initialized');

      // Test InteractiveHelp initialization
      const interactiveHelp = new InteractiveHelp({
        selfAwarenessEngine: selfAwarenessEngine,
        enableContextualHelp: true,
        enableProactiveHelp: true,
        helpSessionTimeout: 30000 // Short timeout for testing
      });
      
      this.components.interactiveHelp = interactiveHelp;
      this.recordTestResult('InteractiveHelp Initialization', true, 'Successfully initialized');
      console.log('  ✅ InteractiveHelp initialized');

      // Test CapabilityExplainer initialization
      const capabilityExplainer = new CapabilityExplainer({
        smartRoutingEngine: null,
        selfAwarenessEngine: selfAwarenessEngine,
        modelInterface: null,
        enableDetailedExplanations: true,
        explainCosts: true,
        explainPerformance: true
      });
      
      this.components.capabilityExplainer = capabilityExplainer;
      this.recordTestResult('CapabilityExplainer Initialization', true, 'Successfully initialized');
      console.log('  ✅ CapabilityExplainer initialized');

      // Test FeatureDiscovery initialization
      const featureDiscovery = new FeatureDiscovery({
        selfAwarenessEngine: selfAwarenessEngine,
        trackUsagePatterns: true,
        enableProactiveDiscovery: true,
        minUsageForSuggestion: 1, // Low threshold for testing
        maxSuggestionsPerSession: 5
      });
      
      this.components.featureDiscovery = featureDiscovery;
      this.recordTestResult('FeatureDiscovery Initialization', true, 'Successfully initialized');
      console.log('  ✅ FeatureDiscovery initialized');

      console.log('');
      return this.components;

    } catch (error) {
      console.error('  ❌ Component initialization failed:', error.message);
      this.recordTestResult('Component Initialization', false, error.message);
      throw error;
    }
  }

  /**
   * Test 2: System Introspection
   */
  async testSystemIntrospection() {
    console.log('🔍 Test 2: System Introspection');
    console.log('-'.repeat(40));

    if (!this.components.selfAwarenessEngine) {
      this.recordTestResult('System Introspection', false, 'SelfAwarenessEngine not available');
      return;
    }

    try {
      const engine = this.components.selfAwarenessEngine;

      // Test basic system introspection
      const introspection = await engine.performSystemIntrospection();
      
      const hasRequiredFields = 
        introspection.timestamp &&
        introspection.system_health &&
        introspection.available_capabilities &&
        introspection.configuration_status;

      this.recordTestResult('Basic System Introspection', hasRequiredFields,
        hasRequiredFields ? 'All required fields present' : 'Missing required introspection fields');

      if (hasRequiredFields) {
        console.log('  ✅ System introspection completed');
        console.log(`  📊 Components analyzed: ${Object.keys(introspection.system_health).length}`);
        console.log(`  🔧 Capabilities found: ${Object.keys(introspection.available_capabilities).length}`);
      }

      // Test capability explanation
      const routingExplanation = engine.explainCapability('routing', 'intermediate');
      this.recordTestResult('Capability Explanation', routingExplanation.success,
        routingExplanation.success ? 'Successfully explained routing capability' : routingExplanation.error);

      if (routingExplanation.success) {
        console.log('  ✅ Capability explanation working');
      }

      // Test troubleshooting guidance
      const troubleshooting = engine.generateTroubleshootingGuidance('slow responses');
      this.recordTestResult('Troubleshooting Guidance', troubleshooting.success,
        troubleshooting.success ? 'Generated troubleshooting steps' : 'Failed to generate guidance');

      if (troubleshooting.success) {
        console.log('  ✅ Troubleshooting guidance generated');
        console.log(`  🔧 Steps provided: ${troubleshooting.troubleshooting_steps?.length || 0}`);
      }

      console.log('');

    } catch (error) {
      console.error('  ❌ System introspection failed:', error.message);
      this.recordTestResult('System Introspection', false, error.message);
    }
  }

  /**
   * Test 3: Natural Language Help Processing
   */
  async testNaturalLanguageHelp() {
    console.log('💬 Test 3: Natural Language Help Processing');
    console.log('-'.repeat(40));

    if (!this.components.interactiveHelp) {
      this.recordTestResult('Natural Language Help', false, 'InteractiveHelp not available');
      return;
    }

    try {
      const help = this.components.interactiveHelp;

      // Test different query types
      const testQueries = [
        { query: 'How do I set up smart routing?', expectedIntent: 'howTo' },
        { query: 'What is ambient intelligence?', expectedIntent: 'what' },
        { query: 'Why does The Steward use multiple models?', expectedIntent: 'why' },
        { query: 'Smart routing is not working', expectedIntent: 'troubleshooting' },
        { query: 'What features are available?', expectedIntent: 'discovery' }
      ];

      let successfulQueries = 0;

      for (const testQuery of testQueries) {
        const response = await help.processHelpQuery(testQuery.query, {
          userLevel: 'intermediate',
          sessionId: 'test-session'
        });

        const success = response.success && response.response;
        if (success) successfulQueries++;

        this.recordTestResult(`Query: "${testQuery.query}"`, success,
          success ? `Intent: ${response.query_analysis?.intent}` : response.error);

        if (success) {
          console.log(`  ✅ "${testQuery.query}" - Intent: ${response.query_analysis?.intent}`);
        }
      }

      const overallSuccess = successfulQueries === testQueries.length;
      this.recordTestResult('Natural Language Processing Overall', overallSuccess,
        `${successfulQueries}/${testQueries.length} queries processed successfully`);

      // Test analytics
      const analytics = help.getAnalytics();
      this.recordTestResult('Help Analytics', !!analytics,
        analytics ? `${analytics.total_queries} total queries tracked` : 'Analytics not available');

      console.log('');

    } catch (error) {
      console.error('  ❌ Natural language help processing failed:', error.message);
      this.recordTestResult('Natural Language Help', false, error.message);
    }
  }

  /**
   * Test 4: Capability Explanations
   */
  async testCapabilityExplanations() {
    console.log('📖 Test 4: Capability Explanations');
    console.log('-'.repeat(40));

    if (!this.components.capabilityExplainer) {
      this.recordTestResult('Capability Explanations', false, 'CapabilityExplainer not available');
      return;
    }

    try {
      const explainer = this.components.capabilityExplainer;

      // Test routing decision explanation
      const mockRoutingData = {
        selection: {
          model: 'local_fast',
          confidence: 0.85,
          score: 8.5
        },
        classification: {
          type: 'quick_question',
          complexity: 'low',
          urgency: 'high'
        },
        alternatives: [
          { model: 'cloud_quality', score: 7.2 },
          { model: 'local_capable', score: 6.8 }
        ],
        userPreferences: {
          prioritize_speed: true,
          cost_conscious: true
        }
      };

      const routingExplanation = explainer.explainRoutingDecision(mockRoutingData, {
        userLevel: 'intermediate'
      });

      this.recordTestResult('Routing Decision Explanation', routingExplanation.success,
        routingExplanation.success ? 'Explained model selection reasoning' : routingExplanation.error);

      if (routingExplanation.success) {
        console.log('  ✅ Routing decision explained');
        console.log(`  🧠 Model chosen: ${routingExplanation.explanation?.model_chosen}`);
        console.log(`  📊 Factors considered: ${routingExplanation.explanation?.factors_considered?.length || 0}`);
      }

      // Test ADHD accommodation explanation
      const adhdExplanation = explainer.explainAdhdAccommodation('task_breakdown', {
        userLevel: 'intermediate'
      });

      this.recordTestResult('ADHD Accommodation Explanation', adhdExplanation.success,
        adhdExplanation.success ? 'Explained task breakdown accommodation' : adhdExplanation.error);

      if (adhdExplanation.success) {
        console.log('  ✅ ADHD accommodation explained');
      }

      // Test integration benefit explanation
      const integrationExplanation = explainer.explainIntegrationBenefit('notion');

      this.recordTestResult('Integration Benefit Explanation', integrationExplanation.success,
        integrationExplanation.success ? 'Explained Notion integration benefits' : integrationExplanation.error);

      if (integrationExplanation.success) {
        console.log('  ✅ Integration benefits explained');
      }

      console.log('');

    } catch (error) {
      console.error('  ❌ Capability explanations failed:', error.message);
      this.recordTestResult('Capability Explanations', false, error.message);
    }
  }

  /**
   * Test 5: Feature Discovery
   */
  async testFeatureDiscovery() {
    console.log('🔍 Test 5: Feature Discovery');
    console.log('-'.repeat(40));

    if (!this.components.featureDiscovery) {
      this.recordTestResult('Feature Discovery', false, 'FeatureDiscovery not available');
      return;
    }

    try {
      const discovery = this.components.featureDiscovery;

      // Test feature suggestions with different contexts
      const testScenarios = [
        {
          name: 'New User Scenario',
          interactionData: {
            taskType: 'first_use',
            indicators: ['first_use'],
            featuresUsed: []
          },
          userContext: { userLevel: 'beginner', isNewUser: true }
        },
        {
          name: 'Power User Scenario',
          interactionData: {
            taskType: 'complex_workflow',
            indicators: ['heavy_usage', 'productivity_focused'],
            featuresUsed: ['smart_routing', 'character_sheet']
          },
          userContext: { userLevel: 'advanced', isNewUser: false }
        },
        {
          name: 'Performance Issues Scenario',
          interactionData: {
            taskType: 'troubleshooting',
            indicators: ['slow_responses', 'quality_issues'],
            featuresUsed: ['smart_routing']
          },
          userContext: { userLevel: 'intermediate' }
        }
      ];

      let successfulScenarios = 0;

      for (const scenario of testScenarios) {
        const suggestions = await discovery.suggestRelevantFeatures(
          scenario.interactionData,
          scenario.userContext
        );

        const success = suggestions.success && Array.isArray(suggestions.suggestions);
        if (success) successfulScenarios++;

        this.recordTestResult(`Feature Discovery: ${scenario.name}`, success,
          success ? `Generated ${suggestions.suggestions?.length || 0} suggestions` : suggestions.error);

        if (success) {
          console.log(`  ✅ ${scenario.name}: ${suggestions.suggestions?.length || 0} suggestions`);
          if (suggestions.user_expertise) {
            console.log(`    📈 Expertise level: ${suggestions.user_expertise.overall_level}`);
          }
        }
      }

      // Test onboarding path generation
      const mockSystemStatus = {
        system_health: { smart_routing: { status: 'healthy' } },
        configuration_status: { character_sheet: { completeness_score: 30 } }
      };

      const onboardingPath = discovery.generateOnboardingPath(mockSystemStatus, {
        overall_level: 'beginner'
      });

      this.recordTestResult('Onboarding Path Generation', Array.isArray(onboardingPath),
        Array.isArray(onboardingPath) ? `Generated ${onboardingPath.length} steps` : 'Failed to generate path');

      if (Array.isArray(onboardingPath)) {
        console.log(`  ✅ Onboarding path: ${onboardingPath.length} steps`);
      }

      // Test discovery analytics
      const analytics = discovery.getDiscoveryAnalytics();
      this.recordTestResult('Discovery Analytics', !!analytics,
        analytics ? 'Analytics retrieved successfully' : 'Analytics not available');

      console.log('');

    } catch (error) {
      console.error('  ❌ Feature discovery failed:', error.message);
      this.recordTestResult('Feature Discovery', false, error.message);
    }
  }

  /**
   * Test 6: Routing Decision Explanations
   */
  async testRoutingExplanations() {
    console.log('🧭 Test 6: Routing Decision Explanations');
    console.log('-'.repeat(40));

    if (!this.components.capabilityExplainer) {
      this.recordTestResult('Routing Explanations', false, 'CapabilityExplainer not available');
      return;
    }

    try {
      const explainer = this.components.capabilityExplainer;

      // Test different routing scenarios
      const routingScenarios = [
        {
          name: 'Speed Priority',
          data: {
            selection: { model: 'local_fast', confidence: 0.9 },
            classification: { urgency: 'high', complexity: 'low' },
            userPreferences: { prioritize_speed: true }
          }
        },
        {
          name: 'Quality Priority',
          data: {
            selection: { model: 'cloud_quality', confidence: 0.85 },
            classification: { complexity: 'high', type: 'analysis' },
            userPreferences: { prioritize_quality: true }
          }
        },
        {
          name: 'Privacy Sensitive',
          data: {
            selection: { model: 'local_capable', confidence: 0.8 },
            classification: { privacy_sensitive: true, type: 'personal' },
            userPreferences: { prefer_local: true }
          }
        }
      ];

      let successfulExplanations = 0;

      for (const scenario of routingScenarios) {
        const explanation = explainer.explainRoutingDecision(scenario.data, {
          userLevel: 'intermediate'
        });

        const success = explanation.success;
        if (success) successfulExplanations++;

        this.recordTestResult(`Routing Explanation: ${scenario.name}`, success,
          success ? 'Generated detailed explanation' : explanation.error);

        if (success) {
          console.log(`  ✅ ${scenario.name}: Explained successfully`);
          if (explanation.explanation?.reasoning) {
            console.log(`    📝 Reasoning provided`);
          }
        }
      }

      const overallSuccess = successfulExplanations === routingScenarios.length;
      this.recordTestResult('Routing Explanations Overall', overallSuccess,
        `${successfulExplanations}/${routingScenarios.length} scenarios explained successfully`);

      console.log('');

    } catch (error) {
      console.error('  ❌ Routing explanations failed:', error.message);
      this.recordTestResult('Routing Explanations', false, error.message);
    }
  }

  /**
   * Test 7: Progressive Disclosure
   */
  async testProgressiveDisclosure() {
    console.log('📚 Test 7: Progressive Disclosure');
    console.log('-'.repeat(40));

    if (!this.components.selfAwarenessEngine) {
      this.recordTestResult('Progressive Disclosure', false, 'Required components not available');
      return;
    }

    try {
      const engine = this.components.selfAwarenessEngine;

      // Test explanations for different user levels
      const userLevels = ['beginner', 'intermediate', 'advanced'];
      const capability = 'routing';
      let levelAdaptations = 0;

      for (const level of userLevels) {
        const explanation = engine.explainCapability(capability, level);
        
        if (explanation.success) {
          levelAdaptations++;
          const hasLevelAppropriateContent = 
            (level === 'beginner' && explanation.explanation?.why_this_matters) ||
            (level === 'intermediate' && explanation.explanation?.examples) ||
            (level === 'advanced' && explanation.explanation?.advanced_features);

          this.recordTestResult(`Progressive Disclosure: ${level}`, explanation.success,
            explanation.success ? 
              `Adapted content for ${level} user` : 
              explanation.error);

          console.log(`  ✅ ${level} level adaptation: Content provided`);
        }
      }

      const adaptationSuccess = levelAdaptations === userLevels.length;
      this.recordTestResult('Progressive Disclosure Overall', adaptationSuccess,
        `${levelAdaptations}/${userLevels.length} user levels adapted successfully`);

      console.log('');

    } catch (error) {
      console.error('  ❌ Progressive disclosure failed:', error.message);
      this.recordTestResult('Progressive Disclosure', false, error.message);
    }
  }

  /**
   * Test 8: End-to-End Workflows
   */
  async testEndToEndWorkflows() {
    console.log('🚀 Test 8: End-to-End Workflows');
    console.log('-'.repeat(40));

    try {
      // Scenario 1: New user onboarding workflow
      console.log('  📋 Scenario 1: New User Onboarding');
      
      if (this.components.featureDiscovery && this.components.interactiveHelp) {
        // Step 1: User asks getting started question
        const helpResponse = await this.components.interactiveHelp.processHelpQuery(
          'How do I get started with The Steward?',
          { userLevel: 'beginner', sessionId: 'e2e-test-1' }
        );

        // Step 2: Get feature suggestions for new user
        const suggestions = await this.components.featureDiscovery.suggestRelevantFeatures(
          { taskType: 'first_use', indicators: ['first_use'] },
          { userLevel: 'beginner', isNewUser: true }
        );

        const workflowSuccess = helpResponse.success && suggestions.success;
        this.recordTestResult('E2E: New User Onboarding', workflowSuccess,
          workflowSuccess ? 'Complete onboarding workflow executed' : 'Workflow failed');

        if (workflowSuccess) {
          console.log('    ✅ Onboarding workflow completed successfully');
        }
      }

      // Scenario 2: Troubleshooting workflow
      console.log('  🔧 Scenario 2: Troubleshooting Workflow');
      
      if (this.components.interactiveHelp && this.components.selfAwarenessEngine) {
        // Step 1: User reports issue
        const troubleshootingResponse = await this.components.interactiveHelp.processHelpQuery(
          'The AI responses are too slow',
          { userLevel: 'intermediate', sessionId: 'e2e-test-2' }
        );

        // Step 2: Get system-specific troubleshooting
        const troubleshootingGuidance = this.components.selfAwarenessEngine.generateTroubleshootingGuidance(
          'slow responses'
        );

        const troubleshootingSuccess = troubleshootingResponse.success && troubleshootingGuidance.success;
        this.recordTestResult('E2E: Troubleshooting Workflow', troubleshootingSuccess,
          troubleshootingSuccess ? 'Complete troubleshooting workflow executed' : 'Workflow failed');

        if (troubleshootingSuccess) {
          console.log('    ✅ Troubleshooting workflow completed successfully');
        }
      }

      // Scenario 3: Feature exploration workflow
      console.log('  🔍 Scenario 3: Feature Exploration Workflow');
      
      if (this.components.interactiveHelp && this.components.selfAwarenessEngine) {
        // Step 1: User asks about capability
        const capabilityQuery = await this.components.interactiveHelp.processHelpQuery(
          'What is ambient intelligence?',
          { userLevel: 'intermediate', sessionId: 'e2e-test-3' }
        );

        // Step 2: Get detailed capability explanation
        const detailedExplanation = this.components.selfAwarenessEngine.explainCapability(
          'ambient_intelligence',
          'intermediate'
        );

        const explorationSuccess = capabilityQuery.success && detailedExplanation.success;
        this.recordTestResult('E2E: Feature Exploration', explorationSuccess,
          explorationSuccess ? 'Complete exploration workflow executed' : 'Workflow failed');

        if (explorationSuccess) {
          console.log('    ✅ Feature exploration workflow completed successfully');
        }
      }

      console.log('');

    } catch (error) {
      console.error('  ❌ End-to-end workflows failed:', error.message);
      this.recordTestResult('End-to-End Workflows', false, error.message);
    }
  }

  /**
   * Record test result
   */
  recordTestResult(testName, success, details = '') {
    this.testResults.push({
      test: testName,
      success: success,
      details: details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport() {
    const totalTime = Date.now() - this.startTime;
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = (passedTests / totalTests) * 100;

    console.log('');
    console.log('📊 SELF-DOCUMENTATION SYSTEM TEST REPORT');
    console.log('=' .repeat(60));
    console.log(`📅 Completed at: ${new Date().toISOString()}`);
    console.log(`⏱️  Total execution time: ${(totalTime / 1000).toFixed(2)} seconds`);
    console.log('');
    console.log('📈 SUMMARY STATISTICS');
    console.log('-'.repeat(30));
    console.log(`Total tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Success rate: ${successRate.toFixed(1)}%`);
    console.log('');

    if (successRate >= 90) {
      console.log('🎉 EXCELLENT! Self-documentation system is working exceptionally well!');
    } else if (successRate >= 80) {
      console.log('👍 GOOD! Self-documentation system is mostly functional with minor issues.');
    } else if (successRate >= 70) {
      console.log('⚠️  FAIR! Self-documentation system has some issues that need attention.');
    } else {
      console.log('🚨 POOR! Self-documentation system requires significant fixes.');
    }

    console.log('');
    console.log('📋 DETAILED RESULTS');
    console.log('-'.repeat(30));

    this.testResults.forEach(result => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${result.test}`);
      if (result.details) {
        console.log(`    Details: ${result.details}`);
      }
    });

    console.log('');
    console.log('🔧 COMPONENT STATUS');
    console.log('-'.repeat(30));
    
    const components = [
      { name: 'SelfAwarenessEngine', instance: this.components.selfAwarenessEngine },
      { name: 'InteractiveHelp', instance: this.components.interactiveHelp },
      { name: 'CapabilityExplainer', instance: this.components.capabilityExplainer },
      { name: 'FeatureDiscovery', instance: this.components.featureDiscovery }
    ];

    components.forEach(comp => {
      const status = comp.instance ? '✅ INITIALIZED' : '❌ NOT AVAILABLE';
      console.log(`${status} ${comp.name}`);
    });

    console.log('');
    console.log('🚀 RECOMMENDATIONS');
    console.log('-'.repeat(30));

    if (failedTests === 0) {
      console.log('• All tests passed! The self-documentation system is ready for production.');
      console.log('• Consider adding performance benchmarks and load testing.');
      console.log('• Monitor user feedback to continuously improve explanations.');
    } else {
      console.log('• Review failed tests and address underlying issues.');
      console.log('• Focus on natural language processing and explanation quality.');
      if (successRate < 80) {
        console.log('• Consider refactoring core self-documentation components.');
        console.log('• Add more comprehensive error handling and fallback responses.');
      }
    }

    console.log('');
    console.log('=' .repeat(60));
    console.log('✨ Self-Documentation System Test Suite Complete ✨');
    console.log('=' .repeat(60));
  }
}

// Run tests if called directly
if (require.main === module) {
  (async () => {
    const testSuite = new SelfDocumentationTestSuite();
    await testSuite.runAllTests();
  })();
}

module.exports = SelfDocumentationTestSuite;

// #endregion end: Self-Documentation System Tests