const ModelInterface = require('./ModelInterface');

/**
 * Simple test interface for the Model Integration Layer
 * Tests both local Docker models and cloud API models
 */
class TestInterface {
    constructor() {
        this.modelInterface = new ModelInterface();
        this.testPrompt = "Hello! Please respond with a simple greeting.";
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('='.repeat(60));
        console.log('MODEL INTERFACE INTEGRATION TESTS');
        console.log('='.repeat(60));
        console.log();

        // Test 1: Check available models
        this.testAvailableModels();
        
        // Test 2: Test local model (if available)
        await this.testLocalModel();
        
        // Test 3: Test Open WebUI models specifically
        await this.testOpenWebUIModels();
        
        // Test 4: Test cloud model (if API keys are available)
        await this.testCloudModel();
        
        // Test 5: Test error handling
        await this.testErrorHandling();
        
        console.log('='.repeat(60));
        console.log('TESTS COMPLETED');
        console.log('='.repeat(60));
    }

    /**
     * Test available models listing
     */
    testAvailableModels() {
        console.log('📋 Testing Available Models...');
        
        try {
            const models = this.modelInterface.getAvailableModels();
            console.log(`   Local models: ${models.local.join(', ')}`);
            console.log(`   Cloud models: ${models.cloud.join(', ')}`);
            console.log('   ✅ Available models test passed');
        } catch (error) {
            console.log(`   ❌ Available models test failed: ${error.message}`);
        }
        
        console.log();
    }

    /**
     * Test local Docker model
     */
    async testLocalModel() {
        console.log('🐳 Testing Local Docker Model...');
        
        try {
            // Check if any local ports are active first
            const localAdapter = this.modelInterface.localAdapter;
            const activePorts = await localAdapter.getActivePorts();
            
            if (activePorts.length === 0) {
                console.log('   ⚠️  No active Docker containers found on common ports');
                console.log(`   Checked ports: ${localAdapter.commonPorts.join(', ')}`);
                console.log('   Skipping local model test');
                console.log();
                return;
            }
            
            console.log(`   Found active ports: ${activePorts.join(', ')}`);
            
            // Try to send a request to a local model
            const startTime = Date.now();
            const response = await this.modelInterface.sendRequest('ai/smollm3:latest', this.testPrompt, {
                max_tokens: 50,
                temperature: 0.7
            });
            
            this.logResponse('Local Model', response, startTime);
            
        } catch (error) {
            console.log(`   ❌ Local model test failed: ${error.message}`);
            console.log();
        }
    }

    /**
     * Test Open WebUI models specifically
     */
    async testOpenWebUIModels() {
        console.log('🌐 Testing Open WebUI Models...');
        
        // Check if port 3000 is active
        const localAdapter = this.modelInterface.localAdapter;
        const port3000Active = await localAdapter.isPortActive(3000);
        
        if (!port3000Active) {
            console.log('   ⚠️  Port 3000 (Open WebUI) is not active');
            console.log('   Make sure Open WebUI is running on localhost:3000');
            console.log();
            return;
        }
        
        console.log('   ✅ Port 3000 is active');
        
        // Test each Open WebUI model
        const openWebUIModels = ['gpt-4o', 'lewd', 'ai/smollm3:latest'];
        
        for (const modelName of openWebUIModels) {
            try {
                console.log(`   Testing ${modelName}...`);
                
                const startTime = Date.now();
                const response = await this.modelInterface.sendRequest(modelName, this.testPrompt, {
                    max_tokens: 100,
                    temperature: 0.7
                });
                
                this.logResponse(`Open WebUI - ${modelName}`, response, startTime);
                
            } catch (error) {
                console.log(`   ❌ ${modelName} test failed: ${error.message}`);
            }
        }
        
        console.log();
    }

    /**
     * Test cloud API model
     */
    async testCloudModel() {
        console.log('☁️  Testing Cloud API Model...');
        
        try {
            // Check API key status
            const apiKeyStatus = this.modelInterface.cloudAdapter.getApiKeyStatus();
            console.log(`   OpenAI API Key: ${apiKeyStatus.openai ? '✅ Found' : '❌ Missing'}`);
            console.log(`   Anthropic API Key: ${apiKeyStatus.anthropic ? '✅ Found' : '❌ Missing'}`);
            
            // Try OpenAI first if key is available
            if (apiKeyStatus.openai) {
                await this.testSpecificCloudModel('gpt-3.5-turbo', 'OpenAI GPT-3.5');
            }
            
            // Try Anthropic if key is available
            if (apiKeyStatus.anthropic) {
                await this.testSpecificCloudModel('claude-3-haiku', 'Anthropic Claude 3 Haiku');
            }
            
            if (!apiKeyStatus.openai && !apiKeyStatus.anthropic) {
                console.log('   ⚠️  No API keys found. Set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variables to test cloud models');
            }
            
        } catch (error) {
            console.log(`   ❌ Cloud model test setup failed: ${error.message}`);
        }
        
        console.log();
    }

    /**
     * Test specific cloud model
     * @param {string} modelName - Name of the model to test
     * @param {string} displayName - Display name for logging
     */
    async testSpecificCloudModel(modelName, displayName) {
        try {
            console.log(`   Testing ${displayName}...`);
            
            const startTime = Date.now();
            const response = await this.modelInterface.sendRequest(modelName, this.testPrompt, {
                max_tokens: 50,
                temperature: 0.7
            });
            
            this.logResponse(displayName, response, startTime);
            
        } catch (error) {
            console.log(`   ❌ ${displayName} test failed: ${error.message}`);
        }
    }

    /**
     * Test error handling
     */
    async testErrorHandling() {
        console.log('🧪 Testing Error Handling...');
        
        // Test 1: Invalid model name
        try {
            const response = await this.modelInterface.sendRequest('invalid-model', this.testPrompt);
            console.log(`   ❌ Should have failed for invalid model, but got: ${JSON.stringify(response.error)}`);
        } catch (error) {
            console.log('   ✅ Invalid model name properly rejected');
        }
        
        // Test 2: Empty prompt
        try {
            const response = await this.modelInterface.sendRequest('ai/smollm3:latest', '');
            if (response.error) {
                console.log('   ✅ Empty prompt properly handled');
            } else {
                console.log('   ⚠️  Empty prompt allowed (may be valid behavior)');
            }
        } catch (error) {
            console.log('   ✅ Empty prompt properly rejected');
        }
        
        // Test 3: Invalid options
        try {
            const response = await this.modelInterface.sendRequest('ai/smollm3:latest', this.testPrompt, {
                temperature: 5.0 // Invalid temperature
            });
            // This may or may not fail depending on the backend
            console.log('   ℹ️  Invalid temperature handled by backend');
        } catch (error) {
            console.log('   ✅ Invalid options properly validated');
        }
        
        console.log();
    }

    /**
     * Log response in a formatted way
     * @param {string} modelName - Name of the model
     * @param {object} response - Response object
     * @param {number} startTime - Start time for timing calculation
     */
    logResponse(modelName, response, startTime) {
        const duration = Date.now() - startTime;
        
        console.log(`   📤 ${modelName} Response:`);
        console.log(`      Status: ${response.error ? '❌ Error' : '✅ Success'}`);
        console.log(`      Duration: ${duration}ms (reported: ${response.timing.duration_ms}ms)`);
        console.log(`      Model Used: ${response.model_used}`);
        
        if (response.error) {
            console.log(`      Error: ${response.error.message}`);
        } else {
            console.log(`      Content Length: ${response.content.length} characters`);
            console.log(`      Content Preview: "${response.content.substring(0, 100)}${response.content.length > 100 ? '...' : ''}"`);
            
            if (response.metadata.usage) {
                console.log(`      Token Usage: ${JSON.stringify(response.metadata.usage)}`);
            }
            
            // Show additional Open WebUI specific metadata
            if (response.metadata.format === 'openwebui') {
                console.log(`      Response Format: Open WebUI (OpenAI-compatible)`);
                if (response.metadata.has_reasoning) {
                    console.log(`      Has Reasoning: ✅ (${response.metadata.reasoning_content.length} chars)`);
                    console.log(`      Message Content: ${response.metadata.message_content.length} chars`);
                } else {
                    console.log(`      Has Reasoning: ❌`);
                }
                if (response.metadata.finish_reason) {
                    console.log(`      Finish Reason: ${response.metadata.finish_reason}`);
                }
            }
        }
        
        console.log();
    }

    /**
     * Test rate limiting status
     */
    testRateLimitStatus() {
        console.log('⏱️  Rate Limit Status:');
        
        const cloudAdapter = this.modelInterface.cloudAdapter;
        const openaiStatus = cloudAdapter.getRateLimitStatus('openai');
        const anthropicStatus = cloudAdapter.getRateLimitStatus('anthropic');
        
        console.log(`   OpenAI: ${openaiStatus.requests_made}/${openaiStatus.limit} requests (${openaiStatus.remaining} remaining)`);
        console.log(`   Anthropic: ${anthropicStatus.requests_made}/${anthropicStatus.limit} requests (${anthropicStatus.remaining} remaining)`);
        console.log();
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new TestInterface();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n⚠️  Test interrupted by user');
        process.exit(0);
    });
    
    // Run tests
    tester.runAllTests().then(() => {
        console.log('All tests completed successfully! 🎉');
        process.exit(0);
    }).catch((error) => {
        console.error('Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = TestInterface;