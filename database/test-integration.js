#!/usr/bin/env node

const DatabaseManager = require('./DatabaseManager');
const ModelInterface = require('../models/ModelInterface');

/**
 * Integration Test Suite for The Steward Database
 * Tests database functionality, performance tracking, and CLI integration
 */
class DatabaseIntegrationTester {
    constructor() {
        this.dbManager = new DatabaseManager();
        this.modelInterface = new ModelInterface();
        this.testResults = {
            passed: 0,
            failed: 0,
            errors: []
        };
    }

    /**
     * Run a test with error handling and reporting
     * @param {string} testName - Name of the test
     * @param {Function} testFunction - Test function to run
     */
    async runTest(testName, testFunction) {
        try {
            console.log(`🧪 Testing: ${testName}...`);
            await testFunction();
            console.log(`✅ PASS: ${testName}`);
            this.testResults.passed++;
        } catch (error) {
            console.error(`❌ FAIL: ${testName}`);
            console.error(`   Error: ${error.message}`);
            this.testResults.failed++;
            this.testResults.errors.push({ test: testName, error: error.message });
        }
    }

    /**
     * Test basic database connection and operations
     */
    async testDatabaseConnection() {
        // Test database initialization
        await this.dbManager.initialize();
        
        // Test basic query
        const result = await this.dbManager._queryOne('SELECT 1 as test');
        if (result.test !== 1) {
            throw new Error('Basic query failed');
        }
        
        console.log('   Database connection successful');
    }

    /**
     * Test user profile operations
     */
    async testUserProfile() {
        // Test retrieving existing profile (should exist from import)
        const profile = await this.dbManager.getUserProfile('Chip Talbert');
        
        if (!profile) {
            throw new Error('User profile not found - run import first');
        }
        
        if (!profile.name || profile.name !== 'Chip Talbert') {
            throw new Error('Profile data integrity issue');
        }
        
        // Test JSON parsing
        if (!Array.isArray(profile.roles) || profile.roles.length === 0) {
            throw new Error('Profile roles not parsed correctly');
        }
        
        if (!profile.task_type_preferences || typeof profile.task_type_preferences !== 'object') {
            throw new Error('Task type preferences not parsed correctly');
        }
        
        console.log(`   Profile loaded: ${profile.roles.length} roles, ${Object.keys(profile.task_type_preferences).length} task preferences`);
    }

    /**
     * Test performance tracking
     */
    async testPerformanceTracking() {
        // Generate test session ID
        const sessionId = this.dbManager.generateSessionId();
        
        // Log a successful performance record
        const performanceId = await this.dbManager.logPerformance({
            model_name: 'test-model',
            adapter_type: 'local',
            task_type: 'test',
            response_time_ms: 1500,
            tokens_prompt: 50,
            tokens_completion: 100,
            tokens_total: 150,
            success: true,
            error_type: null,
            error_message: null,
            prompt_length: 200,
            response_length: 400,
            temperature: 0.7,
            max_tokens: 512,
            session_id: sessionId
        });
        
        if (!performanceId || performanceId <= 0) {
            throw new Error('Failed to log performance data');
        }
        
        // Test performance retrieval
        const performance = await this.dbManager.getModelPerformance('test-model', 1);
        if (!performance || performance.total_requests < 1) {
            throw new Error('Failed to retrieve performance data');
        }
        
        console.log(`   Performance logged: ID ${performanceId}, ${performance.total_requests} total requests`);
    }

    /**
     * Test feedback storage
     */
    async testFeedbackStorage() {
        // First create a performance record
        const performanceId = await this.dbManager.logPerformance({
            model_name: 'feedback-test-model',
            adapter_type: 'cloud',
            task_type: 'test-feedback',
            response_time_ms: 2000,
            success: true,
            prompt_length: 100,
            response_length: 200,
            session_id: this.dbManager.generateSessionId()
        });
        
        // Store feedback
        const feedbackId = await this.dbManager.storeFeedback({
            performance_id: performanceId,
            satisfaction_rating: 4,
            quality_rating: 5,
            speed_rating: 3,
            feedback_text: 'Test feedback for integration testing'
        });
        
        if (!feedbackId || feedbackId <= 0) {
            throw new Error('Failed to store feedback');
        }
        
        console.log(`   Feedback stored: ID ${feedbackId} for performance ${performanceId}`);
    }

    /**
     * Test ModelInterface integration
     */
    async testModelInterfaceIntegration() {
        // Disable actual model calls for testing
        const originalTracking = this.modelInterface.trackPerformance;
        this.modelInterface.setPerformanceTracking(false);
        
        try {
            // Test that ModelInterface has database integration
            if (!this.modelInterface.dbManager) {
                throw new Error('ModelInterface missing database manager');
            }
            
            // Test performance tracking methods exist
            const methods = ['getModelPerformance', 'getTaskTypePerformance', 'getModelRecommendations', 'getUsageSummary', 'storeFeedback'];
            for (const method of methods) {
                if (typeof this.modelInterface[method] !== 'function') {
                    throw new Error(`ModelInterface missing method: ${method}`);
                }
            }
            
            console.log('   ModelInterface integration verified');
            
        } finally {
            // Restore original tracking setting
            this.modelInterface.setPerformanceTracking(originalTracking);
        }
    }

    /**
     * Test usage analytics
     */
    async testUsageAnalytics() {
        // Create some test data
        const sessionId = this.dbManager.generateSessionId();
        const models = ['test-model-1', 'test-model-2'];
        const taskTypes = ['write', 'debug', 'research'];
        
        // Generate several performance records
        for (let i = 0; i < 5; i++) {
            await this.dbManager.logPerformance({
                model_name: models[i % models.length],
                adapter_type: i % 2 === 0 ? 'local' : 'cloud',
                task_type: taskTypes[i % taskTypes.length],
                response_time_ms: 1000 + (i * 200),
                tokens_total: 100 + (i * 50),
                success: i !== 2, // One failure for testing
                error_type: i === 2 ? 'TestError' : null,
                error_message: i === 2 ? 'Test error message' : null,
                prompt_length: 150 + (i * 25),
                response_length: 300 + (i * 100),
                session_id: sessionId
            });
        }
        
        // Test usage summary
        const summary = await this.dbManager.getUsageSummary(1);
        if (!summary || summary.total_requests < 5) {
            throw new Error('Usage summary not working correctly');
        }
        
        // Test task type performance
        const taskPerformance = await this.dbManager.getTaskTypePerformance('write', 1);
        if (!Array.isArray(taskPerformance) || taskPerformance.length === 0) {
            throw new Error('Task type performance analysis failed');
        }
        
        console.log(`   Analytics working: ${summary.total_requests} requests, success rate: ${(summary.overall_success_rate * 100).toFixed(1)}%`);
    }

    /**
     * Test database views
     */
    async testDatabaseViews() {
        // Test performance summary view
        const perfSummary = await this.dbManager._query('SELECT * FROM performance_summary LIMIT 5');
        if (!Array.isArray(perfSummary)) {
            throw new Error('Performance summary view not working');
        }
        
        // Test daily usage view
        const dailyUsage = await this.dbManager._query('SELECT * FROM daily_usage LIMIT 5');
        if (!Array.isArray(dailyUsage)) {
            throw new Error('Daily usage view not working');
        }
        
        // Test model preferences view
        const modelPrefs = await this.dbManager._query('SELECT * FROM model_preferences LIMIT 5');
        if (!Array.isArray(modelPrefs)) {
            throw new Error('Model preferences view not working');
        }
        
        console.log(`   Database views working: ${perfSummary.length} performance summaries, ${dailyUsage.length} daily records`);
    }

    /**
     * Test error handling and edge cases
     */
    async testErrorHandling() {
        // Test invalid user profile
        const invalidProfile = await this.dbManager.getUserProfile('NonExistentUser');
        if (invalidProfile !== null) {
            throw new Error('Should return null for non-existent user');
        }
        
        // Test invalid performance query
        try {
            await this.dbManager.getModelPerformance('', -1);
        } catch (error) {
            // Should handle invalid parameters gracefully
        }
        
        // Test database connection handling
        const dbManager2 = new DatabaseManager();
        await dbManager2.initialize();
        await dbManager2.close();
        
        console.log('   Error handling verified');
    }

    /**
     * Test data cleanup functionality
     */
    async testDataCleanup() {
        // Test cleanup dry run (don't actually delete recent test data)
        const cleanupSummary = await this.dbManager.cleanupOldData({
            model_performance: 365, // Keep for a year (won't delete our test data)
            context_data: 365
        });
        
        if (typeof cleanupSummary !== 'object') {
            throw new Error('Cleanup summary not returned correctly');
        }
        
        console.log('   Data cleanup functionality verified');
    }

    /**
     * Show database statistics
     */
    async showDatabaseStats() {
        console.log('\n📊 DATABASE STATISTICS');
        console.log('='.repeat(50));
        
        const tables = [
            'user_profile',
            'model_performance', 
            'routing_decisions',
            'user_feedback',
            'learning_insights',
            'journal_entries',
            'context_data'
        ];
        
        for (const table of tables) {
            try {
                const count = await this.dbManager._queryOne(`SELECT COUNT(*) as count FROM ${table}`);
                console.log(`${table.padEnd(20)}: ${count.count} records`);
            } catch (error) {
                console.log(`${table.padEnd(20)}: Error - ${error.message}`);
            }
        }
        
        // Show recent performance data
        const recentPerf = await this.dbManager._query(`
            SELECT model_name, COUNT(*) as requests, AVG(response_time_ms) as avg_time
            FROM model_performance 
            WHERE timestamp > datetime('now', '-1 day')
            GROUP BY model_name
            ORDER BY requests DESC
            LIMIT 5
        `);
        
        if (recentPerf.length > 0) {
            console.log('\n📈 RECENT PERFORMANCE (Last 24h):');
            recentPerf.forEach(row => {
                console.log(`  ${row.model_name}: ${row.requests} requests, ${Math.round(row.avg_time)}ms avg`);
            });
        }
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🚀 STARTING DATABASE INTEGRATION TESTS');
        console.log('='.repeat(60));
        
        const tests = [
            ['Database Connection', () => this.testDatabaseConnection()],
            ['User Profile Operations', () => this.testUserProfile()],
            ['Performance Tracking', () => this.testPerformanceTracking()],
            ['Feedback Storage', () => this.testFeedbackStorage()],
            ['ModelInterface Integration', () => this.testModelInterfaceIntegration()],
            ['Usage Analytics', () => this.testUsageAnalytics()],
            ['Database Views', () => this.testDatabaseViews()],
            ['Error Handling', () => this.testErrorHandling()],
            ['Data Cleanup', () => this.testDataCleanup()]
        ];
        
        for (const [name, testFn] of tests) {
            await this.runTest(name, testFn);
        }
        
        // Show database statistics
        await this.showDatabaseStats();
        
        // Summary
        console.log('\n🏁 TEST SUMMARY');
        console.log('='.repeat(40));
        console.log(`✅ Passed: ${this.testResults.passed}`);
        console.log(`❌ Failed: ${this.testResults.failed}`);
        console.log(`📊 Total:  ${this.testResults.passed + this.testResults.failed}`);
        
        if (this.testResults.failed > 0) {
            console.log('\n❌ FAILURES:');
            this.testResults.errors.forEach(error => {
                console.log(`  - ${error.test}: ${error.error}`);
            });
        }
        
        const success = this.testResults.failed === 0;
        console.log(`\n${success ? '🎉 ALL TESTS PASSED!' : '💥 SOME TESTS FAILED'}`);
        
        // Cleanup
        await this.dbManager.close();
        await this.modelInterface.close();
        
        return success;
    }
}

// CLI interface
if (require.main === module) {
    const tester = new DatabaseIntegrationTester();
    
    tester.runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('❌ Test runner failed:', error);
        process.exit(1);
    });
}

module.exports = DatabaseIntegrationTester;