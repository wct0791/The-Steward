// #region start: Ambient Intelligence System Tests
// Comprehensive test suite for ambient intelligence cross-app workflow coordination
// Tests all components: orchestration, context bridging, workflow templates, and automation

const assert = require('assert');
const path = require('path');

// Import ambient intelligence components
const AmbientOrchestrator = require('../src/integrations/AmbientOrchestrator');
const ContextBridge = require('../src/integrations/ContextBridge');
const WorkflowTemplateManager = require('../src/workflows/WorkflowTemplateManager');
const AutomationEngine = require('../src/workflows/AutomationEngine');

/**
 * Ambient Intelligence Test Suite
 * 
 * Tests the complete ambient intelligence ecosystem:
 * 1. Component initialization and integration
 * 2. Cross-app workflow coordination
 * 3. Context synchronization and bridging
 * 4. Workflow template management and execution
 * 5. Automation rule processing and triggers
 * 6. End-to-end ambient intelligence workflows
 * 7. Performance and reliability testing
 */
class AmbientIntelligenceTestSuite {
  constructor() {
    this.testResults = [];
    this.components = {};
    this.startTime = Date.now();
    
    console.log('🧪 Initializing Ambient Intelligence Test Suite...');
    console.log('=' .repeat(60));
  }

  /**
   * Run the complete test suite
   */
  async runAllTests() {
    try {
      console.log('🚀 Starting Ambient Intelligence Test Suite');
      console.log(`📅 Started at: ${new Date().toISOString()}`);
      console.log('');

      // Test 1: Component initialization
      await this.testComponentInitialization();
      
      // Test 2: Cross-app workflow coordination
      await this.testWorkflowCoordination();
      
      // Test 3: Context synchronization
      await this.testContextSynchronization();
      
      // Test 4: Workflow templates
      await this.testWorkflowTemplates();
      
      // Test 5: Automation engine
      await this.testAutomationEngine();
      
      // Test 6: End-to-end scenarios
      await this.testEndToEndScenarios();
      
      // Test 7: Performance testing
      await this.testPerformance();
      
      // Test 8: Error handling and recovery
      await this.testErrorHandling();

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
      // Test WorkflowTemplateManager initialization
      const templateManager = new WorkflowTemplateManager({
        templatesDirectory: './test-data/workflow-templates',
        autoSaveTemplates: false
      });
      
      const templateInit = await templateManager.initialize();
      this.recordTestResult('WorkflowTemplateManager Initialization', templateInit, 
        templateInit ? 'Successfully initialized' : 'Failed to initialize');
      
      if (templateInit) {
        this.components.templateManager = templateManager;
        console.log(`  ✅ Template manager initialized with ${templateManager.templates.size} templates`);
      }

      // Test AutomationEngine initialization
      const automationEngine = new AutomationEngine({
        maxConcurrentAutomations: 3,
        performanceTracking: true
      });
      
      const automationInit = await automationEngine.initialize({
        templateManager: this.components.templateManager
      });
      
      this.recordTestResult('AutomationEngine Initialization', automationInit,
        automationInit ? 'Successfully initialized' : 'Failed to initialize');
      
      if (automationInit) {
        this.components.automationEngine = automationEngine;
        console.log('  ✅ Automation engine initialized and started');
      }

      // Test ContextBridge initialization
      const contextBridge = new ContextBridge({
        enableBidirectionalSync: true,
        contextChangeDebounce: 100 // Fast for testing
      });
      
      this.components.contextBridge = contextBridge;
      this.recordTestResult('ContextBridge Initialization', true, 'Successfully created');
      console.log('  ✅ Context bridge created');

      // Test AmbientOrchestrator initialization
      const orchestrator = new AmbientOrchestrator({
        enableCrossAppWorkflows: true,
        autoSyncFrequency: 'manual', // Manual for testing
        notion: { apiToken: null, autoDocumentation: false },
        things: { enableTaskCreation: false },
        appleNotes: { enableSessionCapture: false }
      });
      
      const orchestratorInit = await orchestrator.initialize();
      this.recordTestResult('AmbientOrchestrator Initialization', orchestratorInit,
        orchestratorInit ? 'Successfully initialized' : 'Failed to initialize');
      
      if (orchestratorInit) {
        this.components.orchestrator = orchestrator;
        console.log('  ✅ Ambient orchestrator initialized');
      }

      console.log('');
      return this.components;

    } catch (error) {
      console.error('  ❌ Component initialization failed:', error.message);
      this.recordTestResult('Component Initialization', false, error.message);
      throw error;
    }
  }

  /**
   * Test 2: Cross-app Workflow Coordination
   */
  async testWorkflowCoordination() {
    console.log('🔄 Test 2: Cross-app Workflow Coordination');
    console.log('-'.repeat(40));

    if (!this.components.orchestrator) {
      this.recordTestResult('Workflow Coordination', false, 'Orchestrator not available');
      return;
    }

    try {
      // Test basic workflow coordination
      const workflowData = {
        id: 'test-workflow-001',
        name: 'Test Development Workflow',
        project_context: 'steward-development',
        steps: [
          {
            phase: 'research',
            task_type: 'information_gathering',
            description: 'Research ambient intelligence patterns',
            estimated_duration: 30
          },
          {
            phase: 'implementation',
            task_type: 'code_development',
            description: 'Implement ambient intelligence features',
            estimated_duration: 60
          }
        ],
        cognitive_optimization: {
          energy_based_scheduling: true,
          context_switching_minimization: true
        }
      };

      const coordinationResult = await this.components.orchestrator.coordinateWorkflow(
        workflowData,
        ['notion', 'things', 'apple_notes'],
        { dryRun: true }
      );

      this.recordTestResult('Basic Workflow Coordination', coordinationResult.success,
        coordinationResult.success ? 
          `Coordinated workflow across ${coordinationResult.apps_coordinated?.length || 0} apps` :
          coordinationResult.error || 'Unknown error');

      if (coordinationResult.success) {
        console.log(`  ✅ Workflow coordinated: ${workflowData.name}`);
        console.log(`  📱 Apps involved: ${coordinationResult.apps_coordinated?.join(', ') || 'none'}`);
        
        // Test workflow status retrieval
        const status = this.components.orchestrator.getStatus();
        this.recordTestResult('Workflow Status Retrieval', !!status,
          status ? 'Successfully retrieved status' : 'Failed to get status');
      }

      console.log('');

    } catch (error) {
      console.error('  ❌ Workflow coordination failed:', error.message);
      this.recordTestResult('Workflow Coordination', false, error.message);
    }
  }

  /**
   * Test 3: Context Synchronization
   */
  async testContextSynchronization() {
    console.log('🔄 Test 3: Context Synchronization');
    console.log('-'.repeat(40));

    if (!this.components.contextBridge || !this.components.orchestrator) {
      this.recordTestResult('Context Synchronization', false, 'Required components not available');
      return;
    }

    try {
      // Test context bridging
      const contextData = {
        project_context: 'steward-development',
        current_focus: 'ambient-intelligence-testing',
        session_id: 'test-session-001',
        cognitive_state: {
          energy_level: 0.8,
          focus_duration: 45,
          context_switches: 2
        }
      };

      const bridgeResult = await this.components.contextBridge.bridgeContext(
        'steward',
        ['notion', 'things', 'apple_notes'],
        contextData,
        { dryRun: true }
      );

      this.recordTestResult('Context Bridging', bridgeResult.success,
        bridgeResult.success ?
          `Context bridged to ${bridgeResult.transformations?.length || 0} apps` :
          bridgeResult.error || 'Unknown error');

      if (bridgeResult.success) {
        console.log('  ✅ Context successfully bridged');
        console.log(`  🔄 Transformations: ${bridgeResult.transformations?.length || 0}`);
      }

      // Test context synchronization through orchestrator
      const syncResult = await this.components.orchestrator.synchronizeContext(
        contextData,
        'steward',
        ['notion', 'things']
      );

      this.recordTestResult('Context Synchronization', syncResult.success,
        syncResult.success ?
          'Context synchronized across apps' :
          syncResult.error || 'Unknown error');

      if (syncResult.success) {
        console.log('  ✅ Context synchronized through orchestrator');
      }

      console.log('');

    } catch (error) {
      console.error('  ❌ Context synchronization failed:', error.message);
      this.recordTestResult('Context Synchronization', false, error.message);
    }
  }

  /**
   * Test 4: Workflow Templates
   */
  async testWorkflowTemplates() {
    console.log('📋 Test 4: Workflow Templates');
    console.log('-'.repeat(40));

    if (!this.components.templateManager) {
      this.recordTestResult('Workflow Templates', false, 'Template manager not available');
      return;
    }

    try {
      // Test template creation
      const templateData = {
        name: 'Ambient Intelligence Test Workflow',
        category: 'steward_development',
        description: 'Test workflow for ambient intelligence validation',
        steps: [
          {
            phase: 'setup',
            task_type: 'preparation',
            description: 'Initialize test environment',
            estimated_duration: 10
          },
          {
            phase: 'execution',
            task_type: 'testing',
            description: 'Run ambient intelligence tests',
            estimated_duration: 30
          },
          {
            phase: 'validation',
            task_type: 'verification',
            description: 'Validate test results',
            estimated_duration: 15
          }
        ],
        apps: ['notion', 'things', 'apple_notes'],
        complexity_level: 'medium',
        project_context: 'steward-development'
      };

      const createResult = await this.components.templateManager.createTemplate(templateData);
      this.recordTestResult('Template Creation', createResult.success,
        createResult.success ?
          `Template created: ${createResult.template_id}` :
          createResult.error || 'Unknown error');

      if (createResult.success) {
        console.log(`  ✅ Template created: ${templateData.name}`);
        console.log(`  🆔 Template ID: ${createResult.template_id}`);

        // Test template retrieval
        const templates = this.components.templateManager.getTemplates({
          category: 'steward_development'
        });

        this.recordTestResult('Template Retrieval', templates.length > 0,
          `Retrieved ${templates.length} templates`);

        if (templates.length > 0) {
          console.log(`  ✅ Retrieved ${templates.length} template(s) from category`);
        }

        // Test template suggestion
        const suggestions = await this.components.templateManager.suggestTemplates(
          'test ambient intelligence workflow',
          'steward-development'
        );

        this.recordTestResult('Template Suggestions', suggestions.success,
          suggestions.success ?
            `Found ${suggestions.suggestions?.length || 0} template suggestions` :
            suggestions.error || 'Unknown error');

        if (suggestions.success) {
          console.log(`  ✅ Template suggestions: ${suggestions.suggestions?.length || 0} found`);
        }
      }

      console.log('');

    } catch (error) {
      console.error('  ❌ Workflow template testing failed:', error.message);
      this.recordTestResult('Workflow Templates', false, error.message);
    }
  }

  /**
   * Test 5: Automation Engine
   */
  async testAutomationEngine() {
    console.log('⚡ Test 5: Automation Engine');
    console.log('-'.repeat(40));

    if (!this.components.automationEngine) {
      this.recordTestResult('Automation Engine', false, 'Automation engine not available');
      return;
    }

    try {
      // Test trigger registration
      const testTriggerData = {
        session_id: 'test-session-001',
        project_context: 'steward-development',
        duration_estimate: 60
      };

      // Register a session start trigger
      this.components.automationEngine.registerTrigger('steward_session_begins', testTriggerData);
      this.recordTestResult('Trigger Registration', true, 'Session start trigger registered');
      console.log('  ✅ Trigger registered: steward_session_begins');

      // Test automation rule creation through template manager
      if (this.components.templateManager) {
        const ruleData = {
          name: 'Test Automation Rule',
          description: 'Test rule for ambient intelligence validation',
          trigger: 'steward_session_begins',
          conditions: [
            { condition: 'session_longer_than', value: 30 }
          ],
          actions: [
            'detect_project_context_from_notion',
            'prepare_apple_notes_capture'
          ],
          priority: 'medium'
        };

        const ruleResult = this.components.templateManager.createAutomationRule(ruleData);
        this.recordTestResult('Automation Rule Creation', ruleResult.success,
          ruleResult.success ?
            `Rule created: ${ruleResult.rule_id}` :
            ruleResult.error || 'Unknown error');

        if (ruleResult.success) {
          console.log(`  ✅ Automation rule created: ${ruleData.name}`);
        }
      }

      // Test engine status
      const engineStatus = this.components.automationEngine.getStatus();
      this.recordTestResult('Engine Status Check', !!engineStatus,
        engineStatus ? 'Engine status retrieved' : 'Failed to get status');

      if (engineStatus) {
        console.log(`  ✅ Engine running: ${engineStatus.running}`);
        console.log(`  📊 Active automations: ${engineStatus.active_automations}`);
        console.log(`  🔧 Supported triggers: ${engineStatus.supported_triggers.length}`);
      }

      // Test analytics
      const analytics = this.components.automationEngine.getAnalytics();
      this.recordTestResult('Automation Analytics', !!analytics,
        analytics ? 'Analytics retrieved' : 'Failed to get analytics');

      if (analytics) {
        console.log('  ✅ Automation analytics retrieved');
      }

      console.log('');

    } catch (error) {
      console.error('  ❌ Automation engine testing failed:', error.message);
      this.recordTestResult('Automation Engine', false, error.message);
    }
  }

  /**
   * Test 6: End-to-End Scenarios
   */
  async testEndToEndScenarios() {
    console.log('🚀 Test 6: End-to-End Scenarios');
    console.log('-'.repeat(40));

    try {
      // Scenario 1: Complete workflow from session start to completion
      console.log('  📋 Scenario 1: Complete Workflow Lifecycle');
      
      if (this.components.orchestrator && this.components.automationEngine) {
        // Simulate session start
        this.components.automationEngine.registerTrigger('steward_session_begins', {
          session_id: 'e2e-test-001',
          project_context: 'steward-development',
          duration_estimate: 90
        });

        // Create and coordinate a workflow
        const workflowData = {
          id: 'e2e-workflow-001',
          name: 'End-to-End Test Workflow',
          project_context: 'steward-development',
          steps: [
            {
              phase: 'analysis',
              task_type: 'system_analysis',
              description: 'Analyze ambient intelligence system',
              estimated_duration: 25
            }
          ]
        };

        const e2eResult = await this.components.orchestrator.coordinateWorkflow(
          workflowData,
          ['notion', 'things', 'apple_notes'],
          { enableAutomation: true }
        );

        this.recordTestResult('End-to-End Workflow', e2eResult.success,
          e2eResult.success ?
            'Complete workflow executed successfully' :
            e2eResult.error || 'Workflow execution failed');

        if (e2eResult.success) {
          console.log('    ✅ Complete workflow lifecycle executed');
          
          // Simulate session completion
          this.components.automationEngine.registerTrigger('steward_session_ends', {
            session_id: 'e2e-test-001',
            duration: 90,
            success: true,
            meaningful_content: true
          });

          console.log('    ✅ Session completion trigger registered');
        }
      } else {
        this.recordTestResult('End-to-End Workflow', false, 'Required components not available');
      }

      // Scenario 2: Context change propagation
      console.log('  🔄 Scenario 2: Context Change Propagation');
      
      if (this.components.contextBridge && this.components.automationEngine) {
        // Register context change trigger
        this.components.automationEngine.registerTrigger('project_context_switch', {
          old_context: 'general-development',
          new_context: 'ambient-intelligence-testing',
          confidence: 0.92,
          source: 'notion'
        });

        const contextChange = {
          project_context: 'ambient-intelligence-testing',
          change_source: 'notion',
          change_reason: 'user_navigation'
        };

        const propagationResult = await this.components.contextBridge.monitorContextChange(
          'notion',
          contextChange,
          { propagateToAll: true }
        );

        this.recordTestResult('Context Change Propagation', propagationResult.success,
          propagationResult.success ?
            'Context change propagated successfully' :
            propagationResult.error || 'Propagation failed');

        if (propagationResult.success) {
          console.log('    ✅ Context change propagated across apps');
        }
      } else {
        this.recordTestResult('Context Change Propagation', false, 'Required components not available');
      }

      console.log('');

    } catch (error) {
      console.error('  ❌ End-to-end scenario testing failed:', error.message);
      this.recordTestResult('End-to-End Scenarios', false, error.message);
    }
  }

  /**
   * Test 7: Performance Testing
   */
  async testPerformance() {
    console.log('⚡ Test 7: Performance Testing');
    console.log('-'.repeat(40));

    try {
      const performanceTests = [];

      // Test 1: Workflow coordination performance
      if (this.components.orchestrator) {
        const startTime = Date.now();
        
        const workflowPromises = [];
        for (let i = 0; i < 5; i++) {
          workflowPromises.push(
            this.components.orchestrator.coordinateWorkflow(
              {
                id: `perf-test-${i}`,
                name: `Performance Test Workflow ${i}`,
                project_context: 'performance-testing',
                steps: [{ phase: 'test', task_type: 'performance', description: 'Test', estimated_duration: 5 }]
              },
              ['notion'],
              { dryRun: true }
            )
          );
        }

        const results = await Promise.all(workflowPromises);
        const endTime = Date.now();
        
        const allSuccessful = results.every(r => r.success);
        const avgTime = (endTime - startTime) / results.length;

        performanceTests.push({
          name: 'Concurrent Workflow Coordination',
          success: allSuccessful && avgTime < 1000, // Under 1 second average
          details: `${results.length} workflows, ${avgTime.toFixed(2)}ms average`
        });
      }

      // Test 2: Context bridging performance
      if (this.components.contextBridge) {
        const startTime = Date.now();
        
        const contextPromises = [];
        for (let i = 0; i < 10; i++) {
          contextPromises.push(
            this.components.contextBridge.bridgeContext(
              'steward',
              ['notion', 'things'],
              { test_data: `performance-test-${i}`, timestamp: Date.now() },
              { dryRun: true }
            )
          );
        }

        const results = await Promise.all(contextPromises);
        const endTime = Date.now();
        
        const allSuccessful = results.every(r => r.success);
        const avgTime = (endTime - startTime) / results.length;

        performanceTests.push({
          name: 'Context Bridging Performance',
          success: allSuccessful && avgTime < 500, // Under 500ms average
          details: `${results.length} bridges, ${avgTime.toFixed(2)}ms average`
        });
      }

      // Test 3: Automation engine performance
      if (this.components.automationEngine) {
        const startTime = Date.now();
        
        for (let i = 0; i < 20; i++) {
          this.components.automationEngine.registerTrigger('steward_session_begins', {
            session_id: `perf-test-${i}`,
            project_context: 'performance-testing',
            duration_estimate: 30
          });
        }

        const endTime = Date.now();
        const totalTime = endTime - startTime;

        performanceTests.push({
          name: 'Trigger Registration Performance',
          success: totalTime < 1000, // Under 1 second for 20 triggers
          details: `20 triggers registered in ${totalTime}ms`
        });
      }

      // Record all performance test results
      performanceTests.forEach(test => {
        this.recordTestResult(test.name, test.success, test.details);
        console.log(`  ${test.success ? '✅' : '❌'} ${test.name}: ${test.details}`);
      });

      console.log('');

    } catch (error) {
      console.error('  ❌ Performance testing failed:', error.message);
      this.recordTestResult('Performance Testing', false, error.message);
    }
  }

  /**
   * Test 8: Error Handling and Recovery
   */
  async testErrorHandling() {
    console.log('🛡️ Test 8: Error Handling and Recovery');
    console.log('-'.repeat(40));

    try {
      // Test 1: Invalid workflow data handling
      if (this.components.orchestrator) {
        const invalidResult = await this.components.orchestrator.coordinateWorkflow(
          null, // Invalid workflow data
          ['notion'],
          {}
        );

        this.recordTestResult('Invalid Workflow Handling', !invalidResult.success,
          !invalidResult.success ? 'Correctly handled invalid input' : 'Failed to catch invalid input');
        
        console.log(`  ${!invalidResult.success ? '✅' : '❌'} Invalid workflow data handling`);
      }

      // Test 2: Empty context handling
      if (this.components.contextBridge) {
        const emptyContextResult = await this.components.contextBridge.bridgeContext(
          '', // Empty source app
          [],  // Empty target apps
          null, // Null context data
          {}
        );

        this.recordTestResult('Empty Context Handling', !emptyContextResult.success,
          !emptyContextResult.success ? 'Correctly handled empty context' : 'Failed to catch empty context');
        
        console.log(`  ${!emptyContextResult.success ? '✅' : '❌'} Empty context handling`);
      }

      // Test 3: Invalid template data
      if (this.components.templateManager) {
        const invalidTemplateResult = await this.components.templateManager.createTemplate({
          // Missing required fields
          description: 'Test template with missing fields'
        });

        this.recordTestResult('Invalid Template Handling', !invalidTemplateResult.success,
          !invalidTemplateResult.success ? 'Correctly rejected invalid template' : 'Failed to validate template');
        
        console.log(`  ${!invalidTemplateResult.success ? '✅' : '❌'} Invalid template handling`);
      }

      // Test 4: Unknown trigger handling
      if (this.components.automationEngine) {
        // This should not crash the engine
        this.components.automationEngine.registerTrigger('unknown_trigger_type', {
          test_data: 'should be ignored'
        });

        const status = this.components.automationEngine.getStatus();
        this.recordTestResult('Unknown Trigger Handling', status.running,
          status.running ? 'Engine remained stable with unknown trigger' : 'Engine destabilized');
        
        console.log(`  ${status.running ? '✅' : '❌'} Unknown trigger handling`);
      }

      console.log('');

    } catch (error) {
      console.error('  ❌ Error handling testing failed:', error.message);
      this.recordTestResult('Error Handling', false, error.message);
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
    console.log('📊 AMBIENT INTELLIGENCE TEST REPORT');
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

    if (successRate >= 85) {
      console.log('🎉 EXCELLENT! Ambient intelligence system is working very well!');
    } else if (successRate >= 70) {
      console.log('👍 GOOD! Ambient intelligence system is mostly functional with some issues.');
    } else if (successRate >= 50) {
      console.log('⚠️  FAIR! Ambient intelligence system has significant issues that need attention.');
    } else {
      console.log('🚨 POOR! Ambient intelligence system requires major fixes.');
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
    console.log('🔧 SYSTEM COMPONENT STATUS');
    console.log('-'.repeat(30));
    
    const components = [
      { name: 'AmbientOrchestrator', instance: this.components.orchestrator },
      { name: 'ContextBridge', instance: this.components.contextBridge },
      { name: 'WorkflowTemplateManager', instance: this.components.templateManager },
      { name: 'AutomationEngine', instance: this.components.automationEngine }
    ];

    components.forEach(comp => {
      const status = comp.instance ? '✅ INITIALIZED' : '❌ NOT AVAILABLE';
      console.log(`${status} ${comp.name}`);
    });

    console.log('');
    console.log('🚀 RECOMMENDATIONS');
    console.log('-'.repeat(30));

    if (failedTests === 0) {
      console.log('• All tests passed! The ambient intelligence system is ready for production.');
      console.log('• Consider adding more edge case tests for comprehensive coverage.');
    } else {
      console.log('• Review failed tests and address underlying issues.');
      console.log('• Focus on error handling and recovery mechanisms.');
      if (successRate < 70) {
        console.log('• Consider refactoring core components before deployment.');
      }
    }

    console.log('');
    console.log('=' .repeat(60));
    console.log('✨ Ambient Intelligence Test Suite Complete ✨');
    console.log('=' .repeat(60));
  }

  /**
   * Clean up test resources
   */
  async cleanup() {
    try {
      if (this.components.automationEngine) {
        await this.components.automationEngine.close();
      }
      if (this.components.templateManager) {
        await this.components.templateManager.close();
      }
      if (this.components.contextBridge) {
        await this.components.contextBridge.close();
      }
      if (this.components.orchestrator) {
        await this.components.orchestrator.close();
      }

      console.log('🧹 Test cleanup completed');
    } catch (error) {
      console.error('⚠️ Error during cleanup:', error.message);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  (async () => {
    const testSuite = new AmbientIntelligenceTestSuite();
    
    try {
      await testSuite.runAllTests();
    } finally {
      await testSuite.cleanup();
    }
  })();
}

module.exports = AmbientIntelligenceTestSuite;

// #endregion end: Ambient Intelligence System Tests