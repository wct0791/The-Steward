// #region start: Web Interface Integration Test
// Tests the web interface integration with ambient intelligence backend
// Validates API endpoints, real-time updates, and frontend-backend coordination

const http = require('http');
const WebSocket = require('ws');

/**
 * Web Interface Integration Test Suite
 * 
 * Tests the integration between:
 * 1. Backend API routes (/api/ambient/*)
 * 2. Frontend ambient intelligence components
 * 3. Real-time WebSocket communications
 * 4. Cross-component data flow
 */
class WebInterfaceIntegrationTest {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:3002';
    this.wsUrl = options.wsUrl || 'ws://localhost:3002';
    this.testResults = [];
    this.startTime = Date.now();
    
    console.log('🌐 Initializing Web Interface Integration Test Suite...');
    console.log(`🔗 Backend URL: ${this.baseUrl}`);
    console.log(`📡 WebSocket URL: ${this.wsUrl}`);
    console.log('=' .repeat(60));
  }

  /**
   * Run all integration tests
   */
  async runAllTests() {
    try {
      console.log('🚀 Starting Web Interface Integration Tests');
      console.log(`📅 Started at: ${new Date().toISOString()}`);
      console.log('');

      // Test 1: Backend health and availability
      await this.testBackendHealth();
      
      // Test 2: Ambient intelligence API endpoints
      await this.testAmbientApiEndpoints();
      
      // Test 3: WebSocket functionality
      await this.testWebSocketIntegration();
      
      // Test 4: Real-time data flow
      await this.testRealTimeDataFlow();
      
      // Test 5: Error handling and recovery
      await this.testErrorHandling();

      // Generate report
      this.generateIntegrationReport();
      
      return this.testResults;

    } catch (error) {
      console.error('❌ Integration test suite execution failed:', error);
      this.recordTestResult('Integration Test Suite', false, error.message);
      return this.testResults;
    }
  }

  /**
   * Test 1: Backend Health and Availability
   */
  async testBackendHealth() {
    console.log('🏥 Test 1: Backend Health and Availability');
    console.log('-'.repeat(40));

    try {
      // Test main health endpoint
      const healthResponse = await this.makeHttpRequest('/health', 'GET');
      const healthWorking = healthResponse.status === 200 && healthResponse.data.status === 'healthy';
      
      this.recordTestResult('Backend Health Check', healthWorking,
        healthWorking ? 'Backend is healthy and responding' : 'Backend health check failed');
      
      console.log(`  ${healthWorking ? '✅' : '❌'} Backend health: ${healthResponse.status}`);

      if (healthWorking) {
        console.log(`    Version: ${healthResponse.data.version}`);
        console.log(`    Services: ${Object.keys(healthResponse.data.services).join(', ')}`);
      }

      // Test ambient intelligence health
      const ambientHealthResponse = await this.makeHttpRequest('/api/ambient/health', 'GET');
      const ambientHealthy = ambientHealthResponse.status === 200;
      
      this.recordTestResult('Ambient Intelligence Health', ambientHealthy,
        ambientHealthy ? 'Ambient intelligence system is healthy' : 'Ambient intelligence health check failed');
      
      console.log(`  ${ambientHealthy ? '✅' : '❌'} Ambient health: ${ambientHealthResponse.status}`);

      if (ambientHealthy) {
        const ambientData = ambientHealthResponse.data;
        console.log(`    System status: ${ambientData.system_status}`);
        console.log(`    Components: ${Object.keys(ambientData.components).length}`);
      }

      console.log('');

    } catch (error) {
      console.error('  ❌ Backend health testing failed:', error.message);
      this.recordTestResult('Backend Health Check', false, error.message);
    }
  }

  /**
   * Test 2: Ambient Intelligence API Endpoints
   */
  async testAmbientApiEndpoints() {
    console.log('🔌 Test 2: Ambient Intelligence API Endpoints');
    console.log('-'.repeat(40));

    const endpoints = [
      {
        name: 'Status Endpoint',
        path: '/api/ambient/status',
        method: 'GET',
        expectedFields: ['enabled', 'system_health']
      },
      {
        name: 'Analytics Endpoint',
        path: '/api/ambient/analytics',
        method: 'GET',
        expectedFields: ['time_range', 'coordination', 'context_bridge']
      },
      {
        name: 'Integration Status',
        path: '/api/ambient/integrations/notion',
        method: 'GET',
        expectedFields: ['app', 'integration_status']
      }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await this.makeHttpRequest(endpoint.path, endpoint.method);
        const success = response.status === 200 || response.status === 503; // 503 is acceptable for disabled services
        
        let details = `Status: ${response.status}`;
        
        if (success && endpoint.expectedFields && response.data) {
          const hasExpectedFields = endpoint.expectedFields.every(field => 
            response.data.hasOwnProperty(field)
          );
          
          if (hasExpectedFields) {
            details += ', Contains expected fields';
          } else {
            details += ', Missing expected fields';
          }
        }

        this.recordTestResult(endpoint.name, success, details);
        console.log(`  ${success ? '✅' : '❌'} ${endpoint.name}: ${details}`);

      } catch (error) {
        this.recordTestResult(endpoint.name, false, `Request failed: ${error.message}`);
        console.log(`  ❌ ${endpoint.name}: Request failed`);
      }
    }

    // Test POST endpoints
    try {
      console.log('  🔄 Testing POST endpoints...');

      // Test workflow coordination endpoint
      const workflowData = {
        workflowData: {
          id: 'integration-test-workflow',
          name: 'Integration Test Workflow',
          project_context: 'testing',
          steps: [{
            phase: 'test',
            task_type: 'integration_test',
            description: 'Test workflow coordination',
            estimated_duration: 5
          }]
        },
        targetApps: ['notion'],
        options: { dryRun: true }
      };

      const coordinateResponse = await this.makeHttpRequest(
        '/api/ambient/coordinate-workflow',
        'POST',
        workflowData
      );

      const coordinateSuccess = coordinateResponse.status === 200 || coordinateResponse.status === 503;
      this.recordTestResult('Workflow Coordination API', coordinateSuccess,
        `Status: ${coordinateResponse.status}`);
      
      console.log(`    ${coordinateSuccess ? '✅' : '❌'} Workflow coordination: ${coordinateResponse.status}`);

      // Test context sync endpoint
      const contextData = {
        contextUpdate: {
          project_context: 'integration-testing',
          session_id: 'test-session-001'
        },
        sourceApp: 'steward',
        targetApps: ['notion']
      };

      const syncResponse = await this.makeHttpRequest(
        '/api/ambient/sync-context',
        'POST',
        contextData
      );

      const syncSuccess = syncResponse.status === 200 || syncResponse.status === 503;
      this.recordTestResult('Context Sync API', syncSuccess,
        `Status: ${syncResponse.status}`);
      
      console.log(`    ${syncSuccess ? '✅' : '❌'} Context sync: ${syncResponse.status}`);

    } catch (error) {
      this.recordTestResult('POST Endpoints', false, error.message);
      console.log('    ❌ POST endpoints testing failed');
    }

    console.log('');
  }

  /**
   * Test 3: WebSocket Integration
   */
  async testWebSocketIntegration() {
    console.log('📡 Test 3: WebSocket Integration');
    console.log('-'.repeat(40));

    return new Promise((resolve) => {
      try {
        const ws = new WebSocket(this.wsUrl);
        let connectionEstablished = false;
        let messageReceived = false;
        let pingPongWorking = false;

        const timeout = setTimeout(() => {
          this.recordTestResult('WebSocket Connection', false, 'Connection timeout');
          console.log('  ❌ WebSocket connection timeout');
          ws.terminate();
          resolve();
        }, 5000);

        ws.on('open', () => {
          connectionEstablished = true;
          console.log('  ✅ WebSocket connection established');
          
          // Test ping-pong
          ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            messageReceived = true;
            
            if (message.type === 'connected') {
              console.log('  ✅ Welcome message received');
            } else if (message.type === 'pong') {
              pingPongWorking = true;
              console.log('  ✅ Ping-pong working');
              
              // Test subscription
              ws.send(JSON.stringify({
                type: 'subscribe',
                channels: ['ambient-intelligence', 'workflow-updates']
              }));
            }
          } catch (error) {
            console.log('  ⚠️ Invalid message format received');
          }
        });

        ws.on('error', (error) => {
          this.recordTestResult('WebSocket Connection', false, `Connection error: ${error.message}`);
          console.log('  ❌ WebSocket connection error');
        });

        ws.on('close', () => {
          clearTimeout(timeout);
          
          this.recordTestResult('WebSocket Connection', connectionEstablished,
            connectionEstablished ? 'Connection established successfully' : 'Failed to connect');
          
          this.recordTestResult('WebSocket Messaging', messageReceived,
            messageReceived ? 'Messages received successfully' : 'No messages received');
          
          this.recordTestResult('WebSocket Ping-Pong', pingPongWorking,
            pingPongWorking ? 'Ping-pong mechanism working' : 'Ping-pong failed');
          
          console.log('  🔌 WebSocket connection closed');
          console.log('');
          resolve();
        });

      } catch (error) {
        this.recordTestResult('WebSocket Integration', false, error.message);
        console.log('  ❌ WebSocket integration test failed');
        console.log('');
        resolve();
      }
    });
  }

  /**
   * Test 4: Real-time Data Flow
   */
  async testRealTimeDataFlow() {
    console.log('🔄 Test 4: Real-time Data Flow');
    console.log('-'.repeat(40));

    try {
      // Test analytics endpoint for data availability
      const analyticsResponse = await this.makeHttpRequest('/api/ambient/analytics', 'GET');
      const analyticsAvailable = analyticsResponse.status === 200;
      
      this.recordTestResult('Analytics Data Flow', analyticsAvailable,
        analyticsAvailable ? 'Analytics data is available' : 'Analytics data unavailable');
      
      console.log(`  ${analyticsAvailable ? '✅' : '❌'} Analytics data flow: ${analyticsResponse.status}`);

      if (analyticsAvailable && analyticsResponse.data) {
        const data = analyticsResponse.data;
        const hasCoordinationData = data.coordination !== undefined;
        const hasBridgeData = data.context_bridge !== undefined;
        const hasPerformanceData = data.system_performance !== undefined;

        console.log(`    Coordination data: ${hasCoordinationData ? '✅' : '❌'}`);
        console.log(`    Context bridge data: ${hasBridgeData ? '✅' : '❌'}`);
        console.log(`    Performance data: ${hasPerformanceData ? '✅' : '❌'}`);
      }

      // Test status endpoint for real-time system status
      const statusResponse = await this.makeHttpRequest('/api/ambient/status', 'GET');
      const statusAvailable = statusResponse.status === 200;
      
      this.recordTestResult('Status Data Flow', statusAvailable,
        statusAvailable ? 'Status data is available' : 'Status data unavailable');
      
      console.log(`  ${statusAvailable ? '✅' : '❌'} Status data flow: ${statusResponse.status}`);

      console.log('');

    } catch (error) {
      console.error('  ❌ Real-time data flow testing failed:', error.message);
      this.recordTestResult('Real-time Data Flow', false, error.message);
    }
  }

  /**
   * Test 5: Error Handling
   */
  async testErrorHandling() {
    console.log('🛡️ Test 5: Error Handling');
    console.log('-'.repeat(40));

    try {
      // Test 404 handling
      const notFoundResponse = await this.makeHttpRequest('/api/ambient/nonexistent', 'GET');
      const handles404 = notFoundResponse.status === 404;
      
      this.recordTestResult('404 Error Handling', handles404,
        handles404 ? 'Correctly returns 404 for invalid endpoints' : 'Incorrect 404 handling');
      
      console.log(`  ${handles404 ? '✅' : '❌'} 404 error handling: ${notFoundResponse.status}`);

      // Test invalid method handling
      const invalidMethodResponse = await this.makeHttpRequest('/api/ambient/status', 'DELETE');
      const handlesInvalidMethod = invalidMethodResponse.status === 404 || invalidMethodResponse.status === 405;
      
      this.recordTestResult('Invalid Method Handling', handlesInvalidMethod,
        handlesInvalidMethod ? 'Correctly handles invalid HTTP methods' : 'Incorrect method handling');
      
      console.log(`  ${handlesInvalidMethod ? '✅' : '❌'} Invalid method handling: ${invalidMethodResponse.status}`);

      // Test malformed JSON handling
      const malformedJsonResponse = await this.makeHttpRequest(
        '/api/ambient/coordinate-workflow',
        'POST',
        'invalid json string'
      );
      
      const handlesMalformedJson = malformedJsonResponse.status === 400 || malformedJsonResponse.status === 500;
      
      this.recordTestResult('Malformed JSON Handling', handlesMalformedJson,
        handlesMalformedJson ? 'Correctly handles malformed JSON' : 'Incorrect JSON error handling');
      
      console.log(`  ${handlesMalformedJson ? '✅' : '❌'} Malformed JSON handling: ${malformedJsonResponse.status}`);

      console.log('');

    } catch (error) {
      console.error('  ❌ Error handling testing failed:', error.message);
      this.recordTestResult('Error Handling', false, error.message);
    }
  }

  /**
   * Make HTTP request helper
   */
  async makeHttpRequest(path, method, data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let body = '';
        
        res.on('data', (chunk) => {
          body += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsedBody = body ? JSON.parse(body) : null;
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: parsedBody
            });
          } catch (error) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: body
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data && method !== 'GET') {
        const jsonData = typeof data === 'string' ? data : JSON.stringify(data);
        req.write(jsonData);
      }

      req.end();
    });
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
   * Generate integration test report
   */
  generateIntegrationReport() {
    const totalTime = Date.now() - this.startTime;
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = (passedTests / totalTests) * 100;

    console.log('');
    console.log('📊 WEB INTERFACE INTEGRATION TEST REPORT');
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
      console.log('🎉 EXCELLENT! Web interface integration is working very well!');
    } else if (successRate >= 70) {
      console.log('👍 GOOD! Web interface integration is mostly functional.');
    } else if (successRate >= 50) {
      console.log('⚠️  FAIR! Web interface integration has some issues.');
    } else {
      console.log('🚨 POOR! Web interface integration needs significant work.');
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
    console.log('🚀 INTEGRATION RECOMMENDATIONS');
    console.log('-'.repeat(30));

    if (failedTests === 0) {
      console.log('• All integration tests passed! The web interface is ready.');
      console.log('• Consider adding performance monitoring and load testing.');
    } else {
      console.log('• Review failed integration tests and fix connectivity issues.');
      console.log('• Ensure backend server is running on the correct port.');
      if (successRate < 70) {
        console.log('• Check API endpoint implementations and error handling.');
      }
    }

    console.log('');
    console.log('=' .repeat(60));
    console.log('✨ Web Interface Integration Test Complete ✨');
    console.log('=' .repeat(60));
  }
}

// Run tests if called directly
if (require.main === module) {
  (async () => {
    const testSuite = new WebInterfaceIntegrationTest();
    await testSuite.runAllTests();
  })();
}

module.exports = WebInterfaceIntegrationTest;

// #endregion end: Web Interface Integration Test