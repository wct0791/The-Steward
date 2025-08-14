// #region start: Predictive Workflows Test Suite
// Comprehensive test suite for predictive workflows and autonomous routing system
// Tests integration between all workflow components and validates functionality

const PredictiveWorkflowEngine = require('./src/core/PredictiveWorkflowEngine');
const fs = require('fs').promises;
const path = require('path');

/**
 * Test suite for The Steward's Predictive Workflows Implementation
 * 
 * Tests:
 * - Workflow prediction engine initialization
 * - Task sequence prediction functionality
 * - Cognitive load prediction and optimization
 * - Autonomous routing for workflow steps
 * - Workflow orchestration and execution
 * - Memory system integration and learning
 * - Dashboard component data integration
 */
class PredictiveWorkflowTestSuite {
  constructor() {
    this.engine = null;
    this.testResults = [];
    this.mockCharacterSheet = this.createMockCharacterSheet();
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting Predictive Workflows Test Suite...\n');

    try {
      // Test 1: Engine initialization
      await this.testEngineInitialization();

      // Test 2: Workflow suggestion generation
      await this.testWorkflowSuggestionGeneration();

      // Test 3: Cognitive optimization
      await this.testCognitiveOptimization();

      // Test 4: Workflow creation and orchestration
      await this.testWorkflowCreationAndOrchestration();

      // Test 5: Autonomous routing
      await this.testAutonomousRouting();

      // Test 6: Memory integration and learning
      await this.testMemoryIntegrationAndLearning();

      // Test 7: Dashboard data integration
      await this.testDashboardDataIntegration();

      // Test 8: Performance and error handling
      await this.testPerformanceAndErrorHandling();

      // Generate test report
      this.generateTestReport();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      this.recordTestResult('Test Suite', false, error.message);
    } finally {
      // Cleanup
      if (this.engine) {
        await this.engine.close();
      }
    }
  }

  /**
   * Test 1: Engine Initialization
   */
  async testEngineInitialization() {
    console.log('🧪 Test 1: Engine Initialization');

    try {
      // Test basic initialization
      this.engine = new PredictiveWorkflowEngine({
        predictiveWorkflowsEnabled: true,
        autonomousRoutingEnabled: true,
        cognitiveOptimizationEnabled: true,
        workflowLearningEnabled: true
      });

      const initialized = await this.engine.initialize();
      
      if (!initialized) {
        throw new Error('Engine failed to initialize');
      }

      // Test engine status
      const status = this.engine.getEngineStatus();
      
      const tests = [
        ['Engine initialized', status.initialized],
        ['Components ready', Object.values(status.components_ready).some(ready => ready)],
        ['Configuration loaded', status.configuration.predictive_workflows_enabled],
        ['Active workflows tracking', status.active_workflows === 0]
      ];

      tests.forEach(([name, condition]) => {
        this.recordTestResult(`Init: ${name}`, condition, condition ? 'OK' : 'Failed');
      });

      console.log('✅ Engine initialization tests completed\n');

    } catch (error) {
      console.error('❌ Engine initialization failed:', error.message);
      this.recordTestResult('Engine Initialization', false, error.message);
    }
  }

  /**
   * Test 2: Workflow Suggestion Generation
   */
  async testWorkflowSuggestionGeneration() {
    console.log('🧪 Test 2: Workflow Suggestion Generation');

    try {
      const taskInput = "Implement new user authentication system with JWT tokens";
      const projectContext = "steward-development";

      // Test basic suggestion generation
      const suggestions = await this.engine.generateWorkflowSuggestions(
        taskInput,
        projectContext,
        this.mockCharacterSheet
      );

      const tests = [
        ['Suggestions generated', suggestions.success],
        ['Has suggestions array', Array.isArray(suggestions.suggestions)],
        ['Has at least one suggestion', suggestions.suggestions.length > 0],
        ['Suggestions have required fields', this.validateSuggestionStructure(suggestions.suggestions[0])],
        ['Cognitive analysis included', !!suggestions.cognitive_analysis],
        ['Generation time reasonable', suggestions.generation_time < 5000] // Less than 5 seconds
      ];

      tests.forEach(([name, condition]) => {
        this.recordTestResult(`Suggestions: ${name}`, condition, condition ? 'OK' : 'Failed');
      });

      // Test suggestion quality
      const firstSuggestion = suggestions.suggestions[0];
      const qualityTests = [
        ['Has reasonable duration', firstSuggestion.total_estimated_duration > 0 && firstSuggestion.total_estimated_duration < 480], // Less than 8 hours
        ['Has steps', firstSuggestion.steps && firstSuggestion.steps.length > 0],
        ['Steps have cognitive loads', firstSuggestion.steps.every(step => ['low', 'medium', 'high'].includes(step.cognitive_load))],
        ['Has completion probability', firstSuggestion.completion_probability > 0 && firstSuggestion.completion_probability <= 1]
      ];

      qualityTests.forEach(([name, condition]) => {
        this.recordTestResult(`Quality: ${name}`, condition, condition ? 'OK' : 'Failed');
      });

      console.log('✅ Workflow suggestion generation tests completed\n');

    } catch (error) {
      console.error('❌ Workflow suggestion generation failed:', error.message);
      this.recordTestResult('Workflow Suggestion Generation', false, error.message);
    }
  }

  /**
   * Test 3: Cognitive Optimization
   */
  async testCognitiveOptimization() {
    console.log('🧪 Test 3: Cognitive Optimization');

    try {
      // Test cognitive context retrieval
      const cognitiveContext = await this.engine.getCognitiveContext(this.mockCharacterSheet);

      const contextTests = [
        ['Has current capacity', !!cognitiveContext.current_capacity],
        ['Has capacity prediction', typeof cognitiveContext.current_capacity.predicted_capacity === 'number'],
        ['Has hyperfocus prediction', !!cognitiveContext.hyperfocus_prediction],
        ['Has ADHD accommodations flag', typeof cognitiveContext.adhd_accommodations_active === 'boolean'],
        ['Has break preferences', !!cognitiveContext.break_preferences],
        ['Has context switching analysis', !!cognitiveContext.context_switching_analysis]
      ];

      contextTests.forEach(([name, condition]) => {
        this.recordTestResult(`Cognitive: ${name}`, condition, condition ? 'OK' : 'Failed');
      });

      // Test cognitive optimization in workflow suggestions
      const taskInput = "Complex algorithm implementation with multiple optimization phases";
      const suggestions = await this.engine.generateWorkflowSuggestions(
        taskInput,
        "steward-development",
        this.mockCharacterSheet
      );

      const optimizationTests = [
        ['Cognitive analysis present', !!suggestions.cognitive_analysis],
        ['Suggestions consider capacity', suggestions.suggestions.some(s => s.cognitively_optimized)],
        ['Steps have timing recommendations', suggestions.suggestions[0].steps.some(step => step.optimal_timing_enhanced)],
        ['ADHD accommodations considered', suggestions.cognitive_analysis.adhd_accommodations_active === this.mockCharacterSheet.predictive_workflows.cognitive_optimization.adhd_accommodations]
      ];

      optimizationTests.forEach(([name, condition]) => {
        this.recordTestResult(`Optimization: ${name}`, condition, condition ? 'OK' : 'Failed');
      });

      console.log('✅ Cognitive optimization tests completed\n');

    } catch (error) {
      console.error('❌ Cognitive optimization tests failed:', error.message);
      this.recordTestResult('Cognitive Optimization', false, error.message);
    }
  }

  /**
   * Test 4: Workflow Creation and Orchestration
   */
  async testWorkflowCreationAndOrchestration() {
    console.log('🧪 Test 4: Workflow Creation and Orchestration');

    try {
      // Get workflow suggestions first
      const suggestions = await this.engine.generateWorkflowSuggestions(
        "Create API endpoint for user management",
        "steward-development",
        this.mockCharacterSheet
      );

      if (!suggestions.success || suggestions.suggestions.length === 0) {
        throw new Error('No workflow suggestions available for testing');
      }

      const selectedSuggestion = suggestions.suggestions[0];

      // Test workflow creation
      const creationResult = await this.engine.createWorkflow(
        "Create API endpoint for user management",
        "steward-development",
        this.mockCharacterSheet,
        selectedSuggestion,
        {
          executionStrategy: 'adaptive'
        }
      );

      const creationTests = [
        ['Workflow created successfully', creationResult.success],
        ['Has workflow ID', !!creationResult.workflow_id],
        ['Has workflow object', !!creationResult.workflow],
        ['Engine integration configured', !!creationResult.engine_integration],
        ['Cognitive monitoring enabled', creationResult.engine_integration.cognitive_monitoring],
        ['Autonomous routing configured', typeof creationResult.engine_integration.autonomous_routing === 'boolean']
      ];

      creationTests.forEach(([name, condition]) => {
        this.recordTestResult(`Creation: ${name}`, condition, condition ? 'OK' : 'Failed');
      });

      // Test workflow status tracking
      const engineStatus = this.engine.getEngineStatus();
      const statusTests = [
        ['Active workflow tracked', engineStatus.active_workflows === 1],
        ['Cognitive monitoring initialized', engineStatus.cognitive_monitoring_active >= 0]
      ];

      statusTests.forEach(([name, condition]) => {
        this.recordTestResult(`Status: ${name}`, condition, condition ? 'OK' : 'Failed');
      });

      console.log('✅ Workflow creation and orchestration tests completed\n');

    } catch (error) {
      console.error('❌ Workflow creation and orchestration tests failed:', error.message);
      this.recordTestResult('Workflow Creation and Orchestration', false, error.message);
    }
  }

  /**
   * Test 5: Autonomous Routing
   */
  async testAutonomousRouting() {
    console.log('🧪 Test 5: Autonomous Routing');

    try {
      // Create character sheet with autonomous routing enabled
      const autonomousCharacterSheet = {
        ...this.mockCharacterSheet,
        predictive_workflows: {
          ...this.mockCharacterSheet.predictive_workflows,
          autonomous_routing: {
            enable_autopilot: true,
            confidence_threshold: 0.85,
            enable_for_workflows: true,
            enable_for_routine_steps: true,
            manual_override_always_available: true,
            decision_logging: true
          }
        }
      };

      // Test autonomous routing configuration
      const suggestions = await this.engine.generateWorkflowSuggestions(
        "Routine code review and documentation update",
        "steward-development",
        autonomousCharacterSheet
      );

      const creationResult = await this.engine.createWorkflow(
        "Routine code review and documentation update",
        "steward-development",
        autonomousCharacterSheet,
        suggestions.suggestions[0]
      );

      const autonomousTests = [
        ['Workflow created with autonomous routing', creationResult.success],
        ['Autonomous routing integration present', !!creationResult.engine_integration.autonomous_routing]
      ];

      autonomousTests.forEach(([name, condition]) => {
        this.recordTestResult(`Autonomous: ${name}`, condition, condition ? 'OK' : 'Failed');
      });

      // Test engine status includes autonomous tracking
      const status = this.engine.getEngineStatus();
      const trackingTests = [
        ['Engine tracks autonomous decisions', typeof status.autonomous_decisions_logged === 'number'],
        ['Active workflows include autonomous config', status.active_workflows > 0]
      ];

      trackingTests.forEach(([name, condition]) => {
        this.recordTestResult(`Tracking: ${name}`, condition, condition ? 'OK' : 'Failed');
      });

      console.log('✅ Autonomous routing tests completed\n');

    } catch (error) {
      console.error('❌ Autonomous routing tests failed:', error.message);
      this.recordTestResult('Autonomous Routing', false, error.message);
    }
  }

  /**
   * Test 6: Memory Integration and Learning
   */
  async testMemoryIntegrationAndLearning() {
    console.log('🧪 Test 6: Memory Integration and Learning');

    try {
      // Test memory system integration
      const workflowMemory = this.engine.workflowMemory;
      
      const memoryTests = [
        ['Workflow memory initialized', !!workflowMemory],
        ['Memory components ready', this.engine.components_ready.workflow_memory]
      ];

      memoryTests.forEach(([name, condition]) => {
        this.recordTestResult(`Memory: ${name}`, condition, condition ? 'OK' : 'Failed');
      });

      // Test learning configuration
      const config = this.engine.config;
      const learningTests = [
        ['Learning enabled in config', config.workflow_learning_enabled],
        ['Feedback integration configured', typeof config.feedback_integration_weight === 'number'],
        ['Pattern stability requirement set', typeof config.pattern_stability_requirement === 'number'],
        ['Minimum completions for learning set', typeof config.min_completions_for_learning === 'number']
      ];

      learningTests.forEach(([name, condition]) => {
        this.recordTestResult(`Learning: ${name}`, condition, condition ? 'OK' : 'Failed');
      });

      // Test workflow suggestions include memory-based insights
      const suggestions = await this.engine.generateWorkflowSuggestions(
        "Test memory integration",
        "steward-development",
        this.mockCharacterSheet
      );

      const insightTests = [
        ['Suggestions generated with memory integration', suggestions.success],
        ['Learning availability reported', typeof suggestions.learning_available === 'boolean'],
        ['Components usage tracked', !!suggestions.components_used]
      ];

      insightTests.forEach(([name, condition]) => {
        this.recordTestResult(`Insights: ${name}`, condition, condition ? 'OK' : 'Failed');
      });

      console.log('✅ Memory integration and learning tests completed\n');

    } catch (error) {
      console.error('❌ Memory integration and learning tests failed:', error.message);
      this.recordTestResult('Memory Integration and Learning', false, error.message);
    }
  }

  /**
   * Test 7: Dashboard Data Integration
   */
  async testDashboardDataIntegration() {
    console.log('🧪 Test 7: Dashboard Data Integration');

    try {
      // Test data structures for dashboard components
      const suggestions = await this.engine.generateWorkflowSuggestions(
        "Dashboard data integration test",
        "steward-development",
        this.mockCharacterSheet
      );

      // Test PredictiveWorkflowPanel data structure
      const panelDataTests = [
        ['Workflow suggestions array available', Array.isArray(suggestions.suggestions)],
        ['Cognitive load predictions present', !!suggestions.cognitive_analysis],
        ['Suggestions have required dashboard fields', this.validateDashboardWorkflowData(suggestions.suggestions[0])],
        ['Generation metadata available', !!suggestions.generation_time]
      ];

      panelDataTests.forEach(([name, condition]) => {
        this.recordTestResult(`Panel: ${name}`, condition, condition ? 'OK' : 'Failed');
      });

      // Test AutonomousRoutingControl data structure
      const engineStatus = this.engine.getEngineStatus();
      const autonomousDataTests = [
        ['Engine status available', !!engineStatus],
        ['Components ready status', !!engineStatus.components_ready],
        ['Configuration accessible', !!engineStatus.configuration],
        ['Active workflows count', typeof engineStatus.active_workflows === 'number'],
        ['Autonomous decisions logged', typeof engineStatus.autonomous_decisions_logged === 'number']
      ];

      autonomousDataTests.forEach(([name, condition]) => {
        this.recordTestResult(`Autonomous Data: ${name}`, condition, condition ? 'OK' : 'Failed');
      });

      // Test CognitiveOptimizationGuide data structure
      const cognitiveContext = await this.engine.getCognitiveContext(this.mockCharacterSheet);
      const cognitiveDataTests = [
        ['Current cognitive state available', !!cognitiveContext.current_capacity],
        ['Hyperfocus predictions available', !!cognitiveContext.hyperfocus_prediction],
        ['Break preferences accessible', !!cognitiveContext.break_preferences],
        ['Context switching analysis', !!cognitiveContext.context_switching_analysis],
        ['ADHD accommodations flag', typeof cognitiveContext.adhd_accommodations_active === 'boolean']
      ];

      cognitiveDataTests.forEach(([name, condition]) => {
        this.recordTestResult(`Cognitive Data: ${name}`, condition, condition ? 'OK' : 'Failed');
      });

      console.log('✅ Dashboard data integration tests completed\n');

    } catch (error) {
      console.error('❌ Dashboard data integration tests failed:', error.message);
      this.recordTestResult('Dashboard Data Integration', false, error.message);
    }
  }

  /**
   * Test 8: Performance and Error Handling
   */
  async testPerformanceAndErrorHandling() {
    console.log('🧪 Test 8: Performance and Error Handling');

    try {
      // Test performance with multiple concurrent requests
      const startTime = Date.now();
      const concurrentPromises = [];

      for (let i = 0; i < 5; i++) {
        concurrentPromises.push(
          this.engine.generateWorkflowSuggestions(
            `Concurrent test task ${i}`,
            "steward-development",
            this.mockCharacterSheet
          )
        );
      }

      const results = await Promise.all(concurrentPromises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const performanceTests = [
        ['All concurrent requests succeeded', results.every(r => r.success)],
        ['Reasonable response time for 5 concurrent requests', totalTime < 10000], // Less than 10 seconds
        ['Average response time acceptable', (totalTime / 5) < 3000] // Less than 3 seconds per request
      ];

      performanceTests.forEach(([name, condition]) => {
        this.recordTestResult(`Performance: ${name}`, condition, condition ? 'OK' : `Failed (${totalTime}ms total)`);
      });

      // Test error handling
      try {
        await this.engine.generateWorkflowSuggestions(
          null, // Invalid task input
          "steward-development",
          this.mockCharacterSheet
        );
        this.recordTestResult('Error: Handles invalid input', false, 'Should have thrown error for null task input');
      } catch (error) {
        this.recordTestResult('Error: Handles invalid input', true, 'Correctly threw error for null input');
      }

      try {
        await this.engine.createWorkflow(
          "Valid task",
          "steward-development",
          this.mockCharacterSheet,
          null // Invalid workflow suggestion
        );
        this.recordTestResult('Error: Handles invalid workflow suggestion', false, 'Should have thrown error for null suggestion');
      } catch (error) {
        this.recordTestResult('Error: Handles invalid workflow suggestion', true, 'Correctly threw error for null suggestion');
      }

      // Test graceful degradation when components fail
      const fallbackSuggestions = await this.engine.generateWorkflowSuggestions(
        "Test fallback behavior",
        "unknown-project",
        {}
      );

      const fallbackTests = [
        ['Fallback suggestions generated', fallbackSuggestions.success],
        ['Fallback flag present', fallbackSuggestions.fallback || fallbackSuggestions.suggestions[0].source === 'fallback_engine']
      ];

      fallbackTests.forEach(([name, condition]) => {
        this.recordTestResult(`Fallback: ${name}`, condition, condition ? 'OK' : 'Failed');
      });

      console.log('✅ Performance and error handling tests completed\n');

    } catch (error) {
      console.error('❌ Performance and error handling tests failed:', error.message);
      this.recordTestResult('Performance and Error Handling', false, error.message);
    }
  }

  /**
   * Validate workflow suggestion structure
   */
  validateSuggestionStructure(suggestion) {
    const requiredFields = [
      'workflow_id',
      'name', 
      'project_context',
      'completion_probability',
      'total_estimated_duration',
      'steps'
    ];

    return requiredFields.every(field => suggestion.hasOwnProperty(field)) &&
           Array.isArray(suggestion.steps) &&
           suggestion.steps.length > 0 &&
           suggestion.steps.every(step => 
             step.hasOwnProperty('phase') &&
             step.hasOwnProperty('cognitive_load') &&
             step.hasOwnProperty('estimated_duration')
           );
  }

  /**
   * Validate dashboard workflow data structure
   */
  validateDashboardWorkflowData(workflow) {
    const dashboardFields = [
      'workflow_id',
      'name',
      'completion_probability',
      'total_estimated_duration',
      'steps',
      'cognitive_load_distribution'
    ];

    return dashboardFields.every(field => workflow.hasOwnProperty(field)) &&
           workflow.steps.every(step => 
             step.hasOwnProperty('cognitive_load') &&
             step.hasOwnProperty('confidence') &&
             step.hasOwnProperty('estimated_duration')
           );
  }

  /**
   * Create mock character sheet for testing
   */
  createMockCharacterSheet() {
    return {
      name: "Test User",
      neurotype_style: "ADHD-aware, clarity-first, scaffold-friendly",
      predictive_workflows: {
        enabled: true,
        workflow_prediction: {
          generate_suggestions: true,
          confidence_threshold: 0.7,
          max_suggestions: 3,
          auto_accept_high_confidence: false,
          preferred_execution_strategy: "adaptive"
        },
        cognitive_optimization: {
          enabled: true,
          adhd_accommodations: true,
          hyperfocus_detection: true,
          break_recommendations: true,
          capacity_monitoring: true,
          context_switching_analysis: true,
          adhd_settings: {
            hyperfocus_protection: true,
            rapid_switching_detection: true,
            capacity_variance_tracking: true,
            context_anchoring_strategies: true,
            timer_based_work_sessions: true
          },
          break_preferences: {
            micro_break_interval: 25,
            active_break_interval: 90,
            break_duration_micro: 5,
            break_duration_active: 15,
            auto_break_reminders: true,
            hyperfocus_protection_duration: 120
          }
        },
        autonomous_routing: {
          enable_autopilot: false,
          confidence_threshold: 0.9,
          enable_for_workflows: true,
          enable_for_routine_steps: true,
          manual_override_always_available: true,
          decision_logging: true,
          user_feedback_integration: true
        },
        workflow_memory: {
          remember_successful_workflows: true,
          track_completion_rates: true,
          analyze_duration_accuracy: true,
          learn_cognitive_patterns: true,
          cross_session_workflow_learning: true
        }
      }
    };
  }

  /**
   * Record test result
   */
  recordTestResult(testName, passed, details) {
    this.testResults.push({
      test: testName,
      passed: passed,
      details: details,
      timestamp: new Date().toISOString()
    });

    const status = passed ? '✅' : '❌';
    console.log(`  ${status} ${testName}: ${details}`);
  }

  /**
   * Generate test report
   */
  generateTestReport() {
    console.log('\n📊 Test Report Summary');
    console.log('=' * 50);

    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);

    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${successRate}%`);

    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => !r.passed)
        .forEach(result => {
          console.log(`  - ${result.test}: ${result.details}`);
        });
    }

    console.log('\n🎯 Test Categories:');
    const categories = {};
    this.testResults.forEach(result => {
      const category = result.test.split(':')[0];
      if (!categories[category]) {
        categories[category] = { total: 0, passed: 0 };
      }
      categories[category].total++;
      if (result.passed) categories[category].passed++;
    });

    Object.entries(categories).forEach(([category, stats]) => {
      const rate = ((stats.passed / stats.total) * 100).toFixed(1);
      console.log(`  ${category}: ${stats.passed}/${stats.total} (${rate}%)`);
    });

    // Overall assessment
    console.log('\n🏆 Overall Assessment:');
    if (successRate >= 95) {
      console.log('🌟 EXCELLENT: Predictive Workflows system is fully functional and ready for production!');
    } else if (successRate >= 85) {
      console.log('✨ GOOD: Predictive Workflows system is mostly functional with minor issues to address.');
    } else if (successRate >= 70) {
      console.log('⚠️  FAIR: Predictive Workflows system has core functionality but needs improvements.');
    } else {
      console.log('🚨 POOR: Predictive Workflows system needs significant work before deployment.');
    }

    console.log('\n🚀 Next Steps:');
    console.log('1. Address any failed tests');
    console.log('2. Run integration tests with real data');
    console.log('3. Performance optimization based on test results');
    console.log('4. User acceptance testing');
    console.log('5. Documentation and deployment preparation');
  }
}

/**
 * Run the test suite
 */
async function runTests() {
  const testSuite = new PredictiveWorkflowTestSuite();
  await testSuite.runAllTests();
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = PredictiveWorkflowTestSuite;

// #endregion end: Predictive Workflows Test Suite