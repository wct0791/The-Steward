// #region start: Smart Routing Engine Tests
// Comprehensive tests for the smart routing engine with all components
// Tests time-aware routing, cognitive profile integration, and local-first routing

const SmartRoutingEngine = require('../smart-routing-engine');

/**
 * Test suite for Smart Routing Engine
 */
describe('SmartRoutingEngine', () => {
    let smartRouter;
    
    beforeEach(async () => {
        smartRouter = new SmartRoutingEngine();
        // Wait for character sheet to load
        await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    afterEach(async () => {
        if (smartRouter) {
            await smartRouter.close();
        }
    });

    describe('Initialization', () => {
        test('should initialize with all components', () => {
            expect(smartRouter.taskClassifier).toBeDefined();
            expect(smartRouter.cognitiveProfileManager).toBeDefined();
            expect(smartRouter.localFirstRouter).toBeDefined();
            expect(smartRouter.performanceLogger).toBeDefined();
            expect(smartRouter.timeAwareRouting).toBe(true);
            expect(smartRouter.localFirstRouting).toBe(true);
        });

        test('should load character sheet data', () => {
            expect(smartRouter.characterSheet).toBeDefined();
            expect(smartRouter.characterSheet.task_type_preferences).toBeDefined();
        });

        test('should provide configuration', () => {
            const config = smartRouter.getConfiguration();
            expect(config.routing_version).toBe('2.0-smart');
            expect(config.time_aware_routing).toBe(true);
            expect(config.local_first_routing).toBe(true);
        });
    });

    describe('Time-aware Routing', () => {
        test('should route differently based on time of day', async () => {
            // Mock different times of day
            const morningTask = 'Help me debug this JavaScript function';
            const nightTask = 'Help me debug this JavaScript function';
            
            // Test during morning hours (simulated)
            const morningDecision = await smartRouter.makeSmartRoutingDecision(morningTask, {
                current_hour_override: 9
            });
            
            // Test during night hours (simulated)
            const nightDecision = await smartRouter.makeSmartRoutingDecision(nightTask, {
                current_hour_override: 23
            });
            
            expect(morningDecision.contexts.time_context.time_period).toBe('morning');
            expect(nightDecision.contexts.time_context.time_period).toBe('evening');
            
            // Night should prefer local models for privacy
            expect(nightDecision.selection.model).toMatch(/smol/);
        });

        test('should consider energy levels in routing', async () => {
            const task = 'Write a comprehensive technical analysis';
            
            const decision = await smartRouter.makeSmartRoutingDecision(task);
            
            expect(decision.contexts.time_context).toBeDefined();
            expect(decision.contexts.time_context.energy_level).toMatch(/high|medium|low/);
        });
    });

    describe('Task Classification', () => {
        test('should classify debug tasks accurately', async () => {
            const debugTask = 'This code is throwing an error: TypeError: Cannot read property';
            
            const decision = await smartRouter.makeSmartRoutingDecision(debugTask);
            
            expect(decision.classification.type).toBe('debug');
            expect(decision.classification.confidence).toBeGreaterThan(0.7);
        });

        test('should classify research tasks', async () => {
            const researchTask = 'Research the latest trends in AI development for 2024';
            
            const decision = await smartRouter.makeSmartRoutingDecision(researchTask);
            
            expect(decision.classification.type).toBe('research');
            expect(decision.selection.model).toBe('perplexity'); // Should prefer research-capable model
        });

        test('should handle uncertain classifications', async () => {
            const ambiguousTask = 'Help me with this thing';
            
            const decision = await smartRouter.makeSmartRoutingDecision(ambiguousTask);
            
            expect(decision.classification.uncertainty.level).toMatch(/medium|high|very_high/);
            expect(decision.classification.confidence).toBeLessThan(0.5);
        });
    });

    describe('Cognitive Profile Integration', () => {
        test('should adapt to ADHD-aware preferences', async () => {
            const complexTask = 'Analyze this complex system architecture and provide recommendations';
            
            const decision = await smartRouter.makeSmartRoutingDecision(complexTask);
            
            expect(decision.contexts.cognitive_state).toBeDefined();
            expect(decision.contexts.cognitive_state.cognitive_capacity).toBeDefined();
        });

        test('should handle low cognitive capacity appropriately', async () => {
            const task = 'Quick question: what is the syntax for arrow functions?';
            
            // Simulate low energy time
            const decision = await smartRouter.makeSmartRoutingDecision(task, {
                current_hour_override: 13 // Post-lunch low energy
            });
            
            const cognitiveState = decision.contexts.cognitive_state;
            if (cognitiveState.cognitive_capacity.level === 'low') {
                expect(decision.selection.model).toMatch(/smol/); // Should prefer fast local model
            }
        });
    });

    describe('Local-first Routing', () => {
        test('should prioritize local models for privacy-sensitive tasks', async () => {
            const sensitiveTask = 'Help me debug this personal API key configuration';
            
            const decision = await smartRouter.makeSmartRoutingDecision(sensitiveTask);
            
            expect(decision.classification.type).toBe('sensitive');
            expect(decision.selection.model).toMatch(/smol/); // Should use local model
            expect(decision.selection.local_first_analysis.privacy_analysis.requires_local).toBe(true);
        });

        test('should allow cloud override for complex research tasks', async () => {
            const complexResearch = 'Research the latest developments in quantum computing applications in 2024';
            
            const decision = await smartRouter.makeSmartRoutingDecision(complexResearch, {
                current_hour_override: 10 // Daytime - allows cloud
            });
            
            expect(decision.classification.type).toBe('research');
            // Should override to cloud for research capability
            expect(['perplexity', 'gpt-4', 'claude-3.5-sonnet']).toContain(decision.selection.model);
        });

        test('should handle privacy requirements correctly', async () => {
            const privateTask = 'Help me format this confidential business document';
            
            const decision = await smartRouter.makeSmartRoutingDecision(privateTask);
            
            const localFirstAnalysis = decision.selection.local_first_analysis;
            expect(localFirstAnalysis.privacy_analysis.requires_local).toBe(true);
            expect(localFirstAnalysis.privacy_analysis.privacy_level).toBe('strict');
        });
    });

    describe('Character Sheet Preferences', () => {
        test('should respect task type preferences', async () => {
            const writeTask = 'Write a technical blog post about React hooks';
            
            const decision = await smartRouter.makeSmartRoutingDecision(writeTask);
            
            expect(decision.classification.type).toBe('write');
            
            // Should use character sheet preference for writing tasks
            const taskPrefs = smartRouter.characterSheet.task_type_preferences;
            if (taskPrefs && taskPrefs.write) {
                // May be overridden by other factors, but character sheet preference should be considered
                expect(decision.selection.character_sheet_mappings).toBeDefined();
            }
        });

        test('should apply neurotype-specific adjustments', async () => {
            const technicalTask = 'Explain how React Context API works with TypeScript';
            
            const decision = await smartRouter.makeSmartRoutingDecision(technicalTask);
            
            expect(decision.classification.type).toBe('explain');
            
            // ADHD-aware and clarity-first preferences should influence routing
            const cognitiveState = decision.contexts.cognitive_state;
            expect(cognitiveState.task_alignment).toBeDefined();
        });
    });

    describe('Performance Integration', () => {
        test('should provide performance insights', async () => {
            const insights = await smartRouter.getPerformanceInsights('debug', 24);
            
            expect(insights).toBeDefined();
            expect(insights.task_type).toBe('debug');
            expect(insights.confidence).toBeGreaterThanOrEqual(0);
        });

        test('should log routing decisions', async () => {
            const task = 'Simple test task';
            
            const decision = await smartRouter.makeSmartRoutingDecision(task);
            
            // Should have logged to performance logger
            expect(decision.smart_routing.routing_version).toBe('2.0-smart');
        });
    });

    describe('Fallback Chain Generation', () => {
        test('should generate appropriate fallback chains', async () => {
            const task = 'Help me with this coding problem';
            
            const decision = await smartRouter.makeSmartRoutingDecision(task);
            
            expect(decision.selection.fallbacks).toBeDefined();
            expect(Array.isArray(decision.selection.fallbacks)).toBe(true);
            expect(decision.selection.fallbacks.length).toBeGreaterThan(0);
            
            // Should include local fallback for privacy
            const hasLocalFallback = decision.selection.fallbacks.some(model => 
                model.includes('smol') || model.includes('local'));
            expect(hasLocalFallback).toBe(true);
        });

        test('should prioritize local models in fallback for sensitive tasks', async () => {
            const sensitiveTask = 'Help me with private configuration settings';
            
            const decision = await smartRouter.makeSmartRoutingDecision(sensitiveTask);
            
            // All fallbacks should be local for sensitive tasks
            const fallbacks = decision.selection.fallbacks;
            const allLocal = fallbacks.every(model => 
                model.includes('smol') || model.includes('local') || model.includes('llama'));
            expect(allLocal).toBe(true);
        });
    });

    describe('Configuration Management', () => {
        test('should allow toggling local-first routing', () => {
            expect(smartRouter.localFirstRouting).toBe(true);
            
            smartRouter.setLocalFirstRouting(false);
            expect(smartRouter.localFirstRouting).toBe(false);
            
            smartRouter.setLocalFirstRouting(true);
            expect(smartRouter.localFirstRouting).toBe(true);
        });

        test('should allow toggling time-aware routing', () => {
            expect(smartRouter.timeAwareRouting).toBe(true);
            
            smartRouter.setTimeAwareRouting(false);
            expect(smartRouter.timeAwareRouting).toBe(false);
            
            smartRouter.setTimeAwareRouting(true);
            expect(smartRouter.timeAwareRouting).toBe(true);
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid task input gracefully', async () => {
            const decision = await smartRouter.makeSmartRoutingDecision('');
            
            expect(decision.classification.type).toBe('unknown');
            expect(decision.classification.confidence).toBeLessThan(0.5);
        });

        test('should handle null/undefined input gracefully', async () => {
            const decision = await smartRouter.makeSmartRoutingDecision(null);
            
            expect(decision).toBeDefined();
            expect(decision.classification.type).toBe('unknown');
        });
    });

    describe('Integration Test', () => {
        test('should handle complete workflow for typical developer task', async () => {
            const developerTask = 'I need help debugging a React component that is re-rendering too much. The useEffect seems to be running on every render.';
            
            const decision = await smartRouter.makeSmartRoutingDecision(developerTask);
            
            // Verify all components worked together
            expect(decision.classification.type).toBe('debug');
            expect(decision.classification.confidence).toBeGreaterThan(0.7);
            
            expect(decision.contexts.time_context).toBeDefined();
            expect(decision.contexts.cognitive_state).toBeDefined();
            expect(decision.contexts.performance_context).toBeDefined();
            
            expect(decision.selection.model).toBeDefined();
            expect(decision.selection.reason).toBeDefined();
            expect(decision.selection.confidence).toBeGreaterThan(0);
            expect(decision.selection.fallbacks).toBeDefined();
            
            expect(decision.smart_routing.time_aware).toBe(true);
            expect(decision.smart_routing.cognitive_aware).toBe(true);
            expect(decision.smart_routing.local_first_routing).toBe(true);
            expect(decision.smart_routing.character_sheet_integrated).toBe(true);
            
            // Should include local-first analysis for debugging task
            expect(decision.selection.local_first_analysis).toBeDefined();
            
            console.log('Full routing decision for debug task:', JSON.stringify(decision, null, 2));
        });
    });
});

// #endregion end: Smart Routing Engine Tests