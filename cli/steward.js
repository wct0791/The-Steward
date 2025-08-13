#!/usr/bin/env node

const path = require('path');
const ModelInterface = require('../models/ModelInterface');
const SmartRoutingEngine = require('../src/core/smart-routing-engine');

/**
 * The Steward CLI Interface
 * Enhanced with smart routing and intelligent model selection
 */
class StewardCLI {
    constructor() {
        this.modelInterface = new ModelInterface(); // Keep for backward compatibility
        this.smartRouter = new SmartRoutingEngine(); // Smart routing engine
        this.useSmartRouting = true; // Enable smart routing by default
        this.defaultModel = 'ai/smollm3:latest'; // Updated default for smart routing
        this.defaultOptions = {
            max_tokens: 512,
            temperature: 0.7,
            top_p: 0.9
        };
        
        // Smart routing to ModelInterface model name mapping
        this.modelNameMapping = {
            // SmolLM variants - all map to the available model in ModelInterface
            'smollm3': 'ai/smollm3:latest',
            'smollm3-1.7b': 'ai/smollm3:latest',
            'smollm3-8b': 'ai/smollm3:latest',
            
            // Local models - direct mapping
            'llama': 'llama',
            'mistral': 'mistral', 
            'codellama': 'codellama',
            'vicuna': 'vicuna',
            'alpaca': 'alpaca',
            'local': 'local',
            
            // Open WebUI models
            'gpt-4o': 'gpt-4o',
            'lewd': 'lewd',
            
            // Cloud models - direct mapping
            'gpt-3.5-turbo': 'gpt-3.5-turbo',
            'gpt-4': 'gpt-4',
            'gpt-4-turbo': 'gpt-4-turbo',
            'claude-3-haiku': 'claude-3-haiku',
            'claude-3-sonnet': 'claude-3-sonnet',
            'claude-3-opus': 'claude-3-opus',
            'claude-3.5-sonnet': 'claude-3.5-sonnet',
            'claude': 'claude-3.5-sonnet', // Smart routing sometimes uses 'claude' as shorthand
            'perplexity': 'gpt-4', // Map to available cloud model if perplexity not available
            
            // HuggingFace models - map to available local models
            'deepseek-r1-distill': 'ai/smollm3:latest',
            'deepcoder-preview': 'ai/smollm3:latest',
            'hf-spaces-framework': 'local',
            'hf-clip-analysis': 'local',
            'hf-whisper-transcription': 'local',
            'hf-pro-llama3-70b': 'gpt-4',
            'hf-pro-mixtral-8x22b': 'gpt-4',
            
            // Legacy model mappings for backward compatibility
            'devstral': 'codellama'
        };
    }

    /**
     * Display help information
     */
    showHelp() {
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║                     THE STEWARD CLI                          ║
║          🧠 Smart AI Model Interface v2.0                   ║
╚══════════════════════════════════════════════════════════════╝

USAGE:
  node cli/steward.js "your prompt here"
  node cli/steward.js --model gpt-4 "your prompt here"
  node cli/steward.js --help

EXAMPLES:
  node cli/steward.js "Debug this React component error"
  node cli/steward.js "Research latest AI developments"
  node cli/steward.js --no-smart "Write a creative story"
  node cli/steward.js --verbose "Explain quantum computing"

SMART ROUTING OPTIONS (NEW):
  --no-smart         Disable smart routing (use basic model interface)
  --verbose         Show detailed routing decisions and reasoning
  --show-reasoning  Display cognitive analysis and recommendations
  --local-only      Force local-first processing (privacy mode)
  --task <type>     Specify task type (debug, write, research, etc.)

TRADITIONAL OPTIONS:
  --model <name>     Override model selection (bypasses smart routing)
  --temperature <n>  Set randomness 0.0-2.0 (default: 0.7)
  --max-tokens <n>   Set max response length (default: 512)
  --rate             Collect feedback after response
  --help            Show this help message

SMART FEATURES:
  🕐 Time-aware routing    Adapts to your energy levels throughout the day
  🧠 Cognitive matching    ADHD-aware task-cognitive capacity alignment
  🏠 Local-first privacy   Automatic local processing for sensitive content
  📊 Performance learning  Learns from usage patterns to improve routing
  🎯 Character sheet       Uses your preferences from character-sheet.yaml

AVAILABLE MODELS:
  Local Models:  smollm3, gpt-4o, lewd, llama, mistral, codellama
  Cloud Models:  gpt-4, claude-3.5-sonnet, claude-3-haiku, perplexity

ENVIRONMENT VARIABLES:
  OPENWEBUI_API_KEY    API key for Open WebUI (port 3000)
  OPENAI_API_KEY      API key for OpenAI models
  ANTHROPIC_API_KEY   API key for Anthropic models
        `);
    }

    /**
     * Parse command line arguments
     * @param {string[]} args - Command line arguments
     * @returns {object} Parsed arguments
     */
    parseArgs(args) {
        const parsed = {
            prompt: '',
            model: null, // Will be determined by smart routing if not specified
            temperature: this.defaultOptions.temperature,
            max_tokens: this.defaultOptions.max_tokens,
            task_type: null,
            collect_feedback: false,
            help: false,
            // Smart routing options
            use_smart_routing: this.useSmartRouting,
            verbose: false,
            show_reasoning: false,
            local_only: false,
            explicit_model_override: false
        };

        for (let i = 0; i < args.length; i++) {
            const arg = args[i];

            if (arg === '--help' || arg === '-h') {
                parsed.help = true;
            } else if (arg === '--model' || arg === '-m') {
                parsed.model = args[++i];
                parsed.explicit_model_override = true; // User explicitly chose model
                parsed.use_smart_routing = false; // Disable smart routing when model is explicit
            } else if (arg === '--temperature' || arg === '-t') {
                parsed.temperature = parseFloat(args[++i]);
            } else if (arg === '--max-tokens') {
                parsed.max_tokens = parseInt(args[++i]);
            } else if (arg === '--task') {
                parsed.task_type = args[++i];
            } else if (arg === '--rate') {
                parsed.collect_feedback = true;
            } else if (arg === '--no-smart') {
                parsed.use_smart_routing = false;
                parsed.model = parsed.model || this.defaultModel; // Use default model
            } else if (arg === '--verbose' || arg === '-v') {
                parsed.verbose = true;
                parsed.show_reasoning = true; // Verbose implies showing reasoning
            } else if (arg === '--show-reasoning') {
                parsed.show_reasoning = true;
            } else if (arg === '--local-only') {
                parsed.local_only = true;
            } else if (!arg.startsWith('--')) {
                // Assume it's the prompt
                parsed.prompt = arg;
            }
        }

        return parsed;
    }

    /**
     * Validate parsed arguments
     * @param {object} args - Parsed arguments
     * @returns {object} Validation result
     */
    validateArgs(args) {
        const errors = [];

        if (!args.prompt && !args.help) {
            errors.push('Prompt is required. Use --help for usage information.');
        }

        if (args.temperature < 0 || args.temperature > 2) {
            errors.push('Temperature must be between 0.0 and 2.0');
        }

        if (args.max_tokens < 1 || args.max_tokens > 4000) {
            errors.push('Max tokens must be between 1 and 4000');
        }

        if (args.model && !this.modelInterface.isModelAvailable(args.model)) {
            const available = this.modelInterface.getAvailableModels();
            errors.push(`Unknown model: ${args.model}. Available models: ${[...available.local, ...available.cloud].join(', ')}`);
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Format and display the response with smart routing information
     * @param {object} response - Response from ModelInterface
     * @param {number} startTime - Request start time
     * @param {object} routingDecision - Smart routing decision (optional)
     * @param {object} args - Parsed CLI arguments
     */
    displayResponse(response, startTime, routingDecision = null, args = {}) {
        const totalTime = Date.now() - startTime;

        console.log('\n' + '═'.repeat(60));
        console.log('🤖 THE STEWARD RESPONSE');
        if (routingDecision) {
            console.log('🧠 Enhanced with Smart Routing');
        }
        console.log('═'.repeat(60));

        if (response.error) {
            console.log('❌ ERROR:', response.error.message);
            console.log('💡 SUGGESTION: Check that your model is running and accessible');
            
            if (response.error.message.includes('authentication required')) {
                console.log('🔑 HINT: Set OPENWEBUI_API_KEY environment variable for Open WebUI');
            }
            
            // Show routing fallbacks if available
            if (routingDecision?.selection?.fallbacks && routingDecision.selection.fallbacks.length > 0) {
                console.log('\n🔄 ALTERNATIVE MODELS TO TRY:');
                routingDecision.selection.fallbacks.slice(0, 3).forEach((fallback, index) => {
                    // Handle both string fallbacks and object fallbacks
                    const fallbackModel = typeof fallback === 'string' ? fallback : (fallback.model || fallback);
                    const fallbackReason = typeof fallback === 'object' ? fallback.reason : this.getModelDescription(fallbackModel);
                    const mappedModel = this.mapModelName(fallbackModel);
                    
                    console.log(`   ${index + 1}. ${mappedModel} (${fallbackReason || 'Alternative model'})`);
                });
            }
            
            return;
        }

        // Display main content
        console.log(response.content);

        // Display smart routing insights if enabled and available
        if (args.show_reasoning && routingDecision) {
            this.displaySmartRoutingInsights(routingDecision);
        }

        // Display metadata
        console.log('\n' + '-'.repeat(40));
        console.log('📊 RESPONSE DETAILS');
        console.log('-'.repeat(40));
        console.log(`Model:        ${response.model_used}`);
        console.log(`Duration:     ${totalTime}ms`);
        console.log(`Content:      ${response.content.length} characters`);

        // Show smart routing decision summary if available
        if (routingDecision) {
            const classification = routingDecision.classification;
            const selection = routingDecision.selection;
            
            console.log(`Task Type:    ${classification?.type || 'unknown'} (${Math.round((classification?.confidence || 0) * 100)}% confidence)`);
            
            if (selection?.reason) {
                console.log(`Routing:      ${selection.reason}`);
            }
            
            if (selection?.confidence) {
                console.log(`Selection:    ${Math.round(selection.confidence * 100)}% confidence`);
            }
        }

        // Show usage statistics if available
        if (response.metadata && response.metadata.usage) {
            const usage = response.metadata.usage;
            console.log(`Tokens Used:  ${usage.total_tokens || 'N/A'} (prompt: ${usage.prompt_tokens || 'N/A'}, completion: ${usage.completion_tokens || 'N/A'})`);
        }

        // Show Open WebUI specific info
        if (response.metadata && response.metadata.format === 'openwebui') {
            console.log(`Format:       Open WebUI (OpenAI-compatible)`);
            if (response.metadata.has_reasoning) {
                console.log(`Reasoning:    ✅ (${response.metadata.reasoning_content?.length || 0} characters)`);
            }
            if (response.metadata.finish_reason) {
                console.log(`Finish:       ${response.metadata.finish_reason}`);
            }
        }

        console.log('═'.repeat(60));
    }

    /**
     * Map smart routing model name to ModelInterface model name
     * @param {string} smartRoutingModel - Model name from smart routing engine
     * @returns {string} - ModelInterface compatible model name
     */
    mapModelName(smartRoutingModel) {
        if (!smartRoutingModel) return this.defaultModel;
        return this.modelNameMapping[smartRoutingModel] || smartRoutingModel;
    }

    /**
     * Get a user-friendly description for a model
     * @param {string} modelName - Model name
     * @returns {string} - Model description
     */
    getModelDescription(modelName) {
        const descriptions = {
            'smollm3': 'Fast local model',
            'smollm3-1.7b': 'Lightweight local model',
            'smollm3-8b': 'Balanced local model',
            'codellama': 'Code-specialized model',
            'llama': 'General purpose local model',
            'mistral': 'Efficient local model',
            'gpt-4': 'Advanced cloud model',
            'gpt-4o': 'Optimized GPT-4 model',
            'claude-3.5-sonnet': 'Advanced reasoning model',
            'claude-3-haiku': 'Fast cloud model',
            'vicuna': 'Conversational model',
            'alpaca': 'Instruction-following model',
            'lewd': 'Creative writing model'
        };
        
        return descriptions[modelName] || 'Alternative model';
    }

    /**
     * Display routing decision details (verbose mode)
     * @param {object} routingDecision - Smart routing decision
     */
    displayRoutingDecision(routingDecision) {
        console.log('\n' + '─'.repeat(50));
        console.log('🧠 SMART ROUTING DECISION');
        console.log('─'.repeat(50));
        
        const classification = routingDecision.classification || {};
        const selection = routingDecision.selection || {};
        const contexts = routingDecision.contexts || {};
        
        // Task classification
        console.log(`🏷️  Task Type: ${classification.type || 'unknown'} (${Math.round((classification.confidence || 0) * 100)}%)`);
        if (classification.characteristics && classification.characteristics.length > 0) {
            console.log(`📋 Characteristics: ${classification.characteristics.join(', ')}`);
        }
        
        // Time context
        if (contexts.time_context) {
            const timeCtx = contexts.time_context;
            console.log(`🕐 Time Context: ${timeCtx.time_period} (energy: ${timeCtx.energy_level})`);
        }
        
        // Cognitive state
        if (contexts.cognitive_state) {
            const cogState = contexts.cognitive_state;
            console.log(`🧠 Cognitive: ${cogState.cognitive_capacity?.level} capacity, ${cogState.task_alignment?.level} alignment`);
        }
        
        // Model selection
        console.log(`🤖 Selected: ${selection.model} (${Math.round((selection.confidence || 0) * 100)}% confidence)`);
        console.log(`💡 Reason: ${selection.reason}`);
        
        // Fallbacks
        if (selection.fallbacks && selection.fallbacks.length > 0) {
            console.log(`🔄 Alternatives: ${selection.fallbacks.slice(0, 2).map(f => f.model).join(', ')}`);
        }
        
        console.log('─'.repeat(50));
    }

    /**
     * Display smart routing insights (reasoning mode)
     * @param {object} routingDecision - Smart routing decision
     */
    displaySmartRoutingInsights(routingDecision) {
        console.log('\n' + '┌'.padEnd(39, '─') + '┐');
        console.log('│ 🧠 SMART ROUTING INSIGHTS          │');
        console.log('└'.padEnd(39, '─') + '┘');
        
        const classification = routingDecision.classification || {};
        const selection = routingDecision.selection || {};
        const contexts = routingDecision.contexts || {};
        
        // Why this model was chosen
        if (selection.reasoning && selection.reasoning.length > 0) {
            console.log('\n🎯 Why this model:');
            selection.reasoning.forEach(reason => {
                console.log(`   • ${reason}`);
            });
        }
        
        // Character sheet influences
        if (selection.character_sheet_mappings && Object.keys(selection.character_sheet_mappings).length > 0) {
            console.log('\n📋 Character sheet preferences:');
            Object.entries(selection.character_sheet_mappings).forEach(([key, value]) => {
                console.log(`   • ${key}: ${value}`);
            });
        }
        
        // Performance insights
        if (contexts.performance_insights) {
            const insights = contexts.performance_insights;
            if (insights.recommendations && insights.recommendations.length > 0) {
                console.log('\n📊 Performance recommendations:');
                insights.recommendations.slice(0, 2).forEach(rec => {
                    console.log(`   • ${rec.message} (${Math.round(rec.confidence * 100)}% confidence)`);
                });
            }
        }
        
        // Local-first routing decisions
        if (selection.privacy_analysis) {
            const privacy = selection.privacy_analysis;
            if (privacy.contains_sensitive || privacy.local_processing_recommended) {
                console.log('\n🔒 Privacy considerations:');
                if (privacy.contains_sensitive) {
                    console.log('   • Sensitive content detected - using local processing');
                }
                if (privacy.local_processing_recommended) {
                    console.log('   • Local-first routing applied for privacy');
                }
            }
        }
        
        console.log();
    }

    /**
     * Display loading animation while waiting for response
     * @param {string} model - Model being used
     */
    showLoading(model) {
        const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let frameIndex = 0;

        console.log(`\n🔄 Sending request to ${model}...`);
        
        const interval = setInterval(() => {
            process.stdout.write(`\r${frames[frameIndex]} Processing request...`);
            frameIndex = (frameIndex + 1) % frames.length;
        }, 100);

        return () => {
            clearInterval(interval);
            process.stdout.write('\r' + ' '.repeat(30) + '\r'); // Clear loading line
        };
    }

    /**
     * Collect user feedback for a request
     * @param {number} performanceId - Performance record ID
     */
    async collectFeedback(performanceId) {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        try {
            console.log('\n📝 FEEDBACK COLLECTION');
            console.log('='.repeat(40));

            // Helper function to ask questions
            const ask = (question) => new Promise(resolve => {
                rl.question(question, resolve);
            });

            // Collect ratings
            const satisfaction = await ask('Rate satisfaction (1-5): ');
            const quality = await ask('Rate quality (1-5): ');
            const speed = await ask('Rate speed (1-5): ');
            
            // Collect optional feedback
            const feedback_text = await ask('Additional comments (optional): ');

            // Parse ratings
            const feedbackData = {
                satisfaction_rating: parseInt(satisfaction) || null,
                quality_rating: parseInt(quality) || null,
                speed_rating: parseInt(speed) || null,
                feedback_text: feedback_text.trim() || null
            };

            // Validate ratings
            const isValidRating = (rating) => rating >= 1 && rating <= 5;
            
            if (feedbackData.satisfaction_rating && !isValidRating(feedbackData.satisfaction_rating)) {
                console.warn('⚠️  Invalid satisfaction rating, skipping');
                feedbackData.satisfaction_rating = null;
            }
            
            if (feedbackData.quality_rating && !isValidRating(feedbackData.quality_rating)) {
                console.warn('⚠️  Invalid quality rating, skipping');
                feedbackData.quality_rating = null;
            }
            
            if (feedbackData.speed_rating && !isValidRating(feedbackData.speed_rating)) {
                console.warn('⚠️  Invalid speed rating, skipping');
                feedbackData.speed_rating = null;
            }

            // Store feedback
            const feedbackId = await this.modelInterface.storeFeedback(performanceId, feedbackData);
            
            console.log(`✅ Feedback saved (ID: ${feedbackId})`);
            console.log('Thank you for helping improve The Steward!');

        } catch (error) {
            console.error('❌ Failed to collect feedback:', error.message);
        } finally {
            rl.close();
        }
    }

    /**
     * Main CLI execution method
     * @param {string[]} argv - Command line arguments
     */
    async run(argv) {
        try {
            // Parse arguments (skip node and script name)
            const args = this.parseArgs(argv.slice(2));

            // Show help if requested
            if (args.help) {
                this.showHelp();
                return;
            }

            // Validate arguments
            const validation = this.validateArgs(args);
            if (!validation.valid) {
                console.error('❌ Error:');
                validation.errors.forEach(error => console.error(`   ${error}`));
                console.error('\nUse --help for usage information.');
                process.exit(1);
            }

            let routingDecision = null;
            let selectedModel = args.model;
            const startTime = Date.now();

            // Use smart routing or fallback to simple interface
            if (args.use_smart_routing) {
                try {
                    // Make smart routing decision
                    const routingOptions = {
                        task_type: args.task_type,
                        local_only: args.local_only,
                        explicit_model: args.explicit_model_override ? args.model : null,
                        user_preferences: {
                            temperature: args.temperature,
                            max_tokens: args.max_tokens
                        }
                    };
                    
                    if (args.verbose) {
                        console.log('\n🧠 Smart Routing Analysis...');
                    }
                    
                    routingDecision = await this.smartRouter.makeSmartRoutingDecision(args.prompt, routingOptions);
                    selectedModel = this.mapModelName(routingDecision.selection?.model);
                    
                    if (args.verbose && routingDecision) {
                        this.displayRoutingDecision(routingDecision);
                    }
                } catch (routingError) {
                    console.warn(`⚠️  Smart routing failed: ${routingError.message}`);
                    console.log('🔄 Falling back to basic model interface...');
                    args.use_smart_routing = false;
                    selectedModel = args.model || this.defaultModel;
                }
            } else {
                selectedModel = args.model || this.defaultModel;
            }

            // Start loading animation
            const stopLoading = this.showLoading(selectedModel);

            // Send request using ModelInterface
            const response = await this.modelInterface.sendRequest(
                selectedModel,
                args.prompt,
                {
                    max_tokens: args.max_tokens,
                    temperature: args.temperature,
                    top_p: this.defaultOptions.top_p
                },
                args.task_type, // Task type for performance tracking
                null // Session ID (auto-generated)
            );

            // Stop loading animation
            stopLoading();

            // Log smart routing performance if available
            if (routingDecision && this.smartRouter.performanceLogger) {
                try {
                    const performanceData = {
                        response_time_ms: Date.now() - startTime,
                        success: !response.error,
                        error_type: response.error?.type || null,
                        error_message: response.error?.message || null,
                        response_length: response.content?.length || 0,
                        temperature: args.temperature,
                        max_tokens: args.max_tokens,
                        tokens_prompt: response.metadata?.usage?.prompt_tokens || null,
                        tokens_completion: response.metadata?.usage?.completion_tokens || null,
                        tokens_total: response.metadata?.usage?.total_tokens || null
                    };
                    
                    await this.smartRouter.performanceLogger.logRoutingPerformance(routingDecision, performanceData);
                } catch (logError) {
                    console.warn(`⚠️  Performance logging failed: ${logError.message}`);
                }
            }

            // Display enhanced response with smart routing information
            this.displayResponse(response, startTime, routingDecision, args);

            // Collect feedback if requested
            if (args.collect_feedback && !response.error && response.metadata?.performance_id) {
                await this.collectFeedback(response.metadata.performance_id);
            }

        } catch (error) {
            console.error('\n❌ Unexpected Error:', error.message);
            
            // Show stack trace in development
            if (process.env.NODE_ENV === 'development') {
                console.error('\nStack trace:', error.stack);
            }
            
            process.exit(1);
        }
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Thanks for using The Steward!');
    process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('\n❌ Unhandled Promise Rejection:', reason);
    process.exit(1);
});

// Run CLI if this file is executed directly
if (require.main === module) {
    const cli = new StewardCLI();
    cli.run(process.argv);
}

module.exports = StewardCLI;