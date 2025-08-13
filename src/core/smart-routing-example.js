#!/usr/bin/env node

// #region start: Smart Routing Engine Example
// Demonstrates the complete smart routing system with real scenarios
// Shows time-aware, cognitive-aware, and local-first routing in action

const SmartRoutingEngine = require('./smart-routing-engine');

/**
 * Example usage of the Smart Routing Engine
 */
async function demonstrateSmartRouting() {
    console.log('🧠 Smart Routing Engine Demo');
    console.log('===============================\n');
    
    const smartRouter = new SmartRoutingEngine();
    
    // Wait for initialization
    console.log('⚙️  Initializing smart routing engine...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const config = smartRouter.getConfiguration();
    console.log('📊 Configuration:', JSON.stringify(config, null, 2));
    console.log('');
    
    // Test scenarios
    const scenarios = [
        {
            name: '🐛 Debug Task (Technical)',
            task: 'This React component is re-rendering infinitely. The useEffect hook seems to be causing the issue. Can you help me debug it?',
            expectedType: 'debug'
        },
        {
            name: '🔍 Research Task (Knowledge)',
            task: 'Research the latest developments in AI model compression techniques for 2024',
            expectedType: 'research'
        },
        {
            name: '✍️  Creative Writing Task',
            task: 'Write a compelling technical blog post about the benefits of using TypeScript in React applications',
            expectedType: 'write'
        },
        {
            name: '🔒 Privacy-Sensitive Task',
            task: 'Help me configure these API credentials and authentication tokens for my private project',
            expectedType: 'sensitive'
        },
        {
            name: '❓ Quick Question',
            task: 'What is the syntax for array destructuring in JavaScript?',
            expectedType: 'quick_query'
        },
        {
            name: '📝 Explanation Task',
            task: 'Explain how React Context API works and when I should use it instead of props drilling',
            expectedType: 'explain'
        }
    ];
    
    for (const scenario of scenarios) {
        console.log(`\n${scenario.name}`);
        console.log('─'.repeat(50));
        
        try {
            const decision = await smartRouter.makeSmartRoutingDecision(scenario.task);
            
            // Display key routing information
            console.log(`📝 Task: "${scenario.task.substring(0, 80)}${scenario.task.length > 80 ? '...' : ''}"`);
            console.log(`🏷️  Classification: ${decision.classification.type} (confidence: ${(decision.classification.confidence * 100).toFixed(1)}%)`);
            console.log(`🤖 Selected Model: ${decision.selection.model}`);
            console.log(`📊 Confidence: ${(decision.selection.confidence * 100).toFixed(1)}%`);
            console.log(`⚡ Routing Strategy: ${decision.selection.routing_strategy || 'standard'}`);
            
            // Show time context
            const timeContext = decision.contexts.time_context;
            console.log(`⏰ Time Context: ${timeContext.time_period} (energy: ${timeContext.energy_level})`);
            
            // Show cognitive state
            const cognitiveState = decision.contexts.cognitive_state;
            console.log(`🧠 Cognitive Capacity: ${cognitiveState.cognitive_capacity.level} (score: ${(cognitiveState.cognitive_capacity.score * 100).toFixed(1)}%)`);
            
            // Show local-first analysis if available
            if (decision.selection.local_first_analysis) {
                const localAnalysis = decision.selection.local_first_analysis;
                console.log(`🏠 Privacy Level: ${localAnalysis.privacy_analysis.privacy_level}`);
                console.log(`🔒 Requires Local: ${localAnalysis.privacy_analysis.requires_local ? 'Yes' : 'No'}`);
            }
            
            // Show reasoning
            console.log(`💭 Reasoning: ${decision.selection.reason}`);
            
            // Show fallbacks
            if (decision.selection.fallbacks && decision.selection.fallbacks.length > 0) {
                console.log(`🔄 Fallbacks: ${decision.selection.fallbacks.slice(0, 3).join(', ')}`);
            }
            
            // Show any recommendations
            if (decision.contexts.cognitive_state.recommendations && decision.contexts.cognitive_state.recommendations.length > 0) {
                console.log('💡 Recommendations:');
                for (const rec of decision.contexts.cognitive_state.recommendations.slice(0, 2)) {
                    console.log(`   - ${rec.message} (${rec.priority} priority)`);
                }
            }
            
        } catch (error) {
            console.error(`❌ Error processing scenario: ${error.message}`);
        }
    }
    
    console.log('\n🎯 Time-based Routing Demo');
    console.log('─'.repeat(30));
    
    // Demonstrate time-based differences
    const timeScenarios = [
        { hour: 9, period: 'Morning' },
        { hour: 14, period: 'Afternoon' },
        { hour: 20, period: 'Evening' },
        { hour: 2, period: 'Late Night' }
    ];
    
    const testTask = 'Help me review and improve this JavaScript function';
    
    for (const timeScenario of timeScenarios) {
        try {
            const decision = await smartRouter.makeSmartRoutingDecision(testTask, {
                current_hour_override: timeScenario.hour
            });
            
            console.log(`${timeScenario.period} (${timeScenario.hour}:00): ${decision.selection.model} (${decision.contexts.time_context.energy_level} energy)`);
        } catch (error) {
            console.log(`${timeScenario.period}: Error - ${error.message}`);
        }
    }
    
    console.log('\n📈 Performance Insights Demo');
    console.log('─'.repeat(35));
    
    try {
        const insights = await smartRouter.getPerformanceInsights('debug', 48);
        console.log(`Debug task insights (${insights.sample_size} samples):`);
        console.log(`- Best performing model: ${insights.best_performing_model || 'No data'}`);
        console.log(`- Confidence in insights: ${(insights.confidence * 100).toFixed(1)}%`);
        if (insights.recommendations.length > 0) {
            console.log('- Top recommendation:', insights.recommendations[0].message);
        }
    } catch (error) {
        console.log('No performance data available yet');
    }
    
    console.log('\n✅ Smart routing demonstration complete!');
    
    // Clean up
    await smartRouter.close();
}

/**
 * Interactive demo mode
 */
async function interactiveDemo() {
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    const smartRouter = new SmartRoutingEngine();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('🧠 Smart Routing Engine - Interactive Mode');
    console.log('Type your tasks and see how they get routed!');
    console.log('Type "exit" to quit, "config" to see configuration\n');
    
    const askQuestion = () => {
        rl.question('Enter your task: ', async (input) => {
            if (input.toLowerCase() === 'exit') {
                await smartRouter.close();
                rl.close();
                return;
            }
            
            if (input.toLowerCase() === 'config') {
                console.log(JSON.stringify(smartRouter.getConfiguration(), null, 2));
                askQuestion();
                return;
            }
            
            if (input.trim() === '') {
                askQuestion();
                return;
            }
            
            try {
                const decision = await smartRouter.makeSmartRoutingDecision(input);
                
                console.log('\n🎯 Routing Decision:');
                console.log(`   Type: ${decision.classification.type} (${(decision.classification.confidence * 100).toFixed(1)}% confidence)`);
                console.log(`   Model: ${decision.selection.model}`);
                console.log(`   Strategy: ${decision.selection.routing_strategy || 'standard'}`);
                console.log(`   Reason: ${decision.selection.reason}`);
                
                if (decision.selection.local_first_analysis?.privacy_analysis?.requires_local) {
                    console.log('   🔒 Privacy protection: Local processing required');
                }
                
                console.log('');
            } catch (error) {
                console.log(`❌ Error: ${error.message}\n`);
            }
            
            askQuestion();
        });
    };
    
    askQuestion();
}

// Main execution
if (require.main === module) {
    const mode = process.argv[2];
    
    if (mode === 'interactive' || mode === '-i') {
        interactiveDemo().catch(console.error);
    } else {
        demonstrateSmartRouting().catch(console.error);
    }
}

module.exports = { demonstrateSmartRouting, interactiveDemo };

// #endregion end: Smart Routing Engine Example