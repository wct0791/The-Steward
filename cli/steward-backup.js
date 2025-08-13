#!/usr/bin/env node

const path = require('path');
const ModelInterface = require('../models/ModelInterface');

/**
 * The Steward CLI Interface
 * Simple command-line interface for interacting with AI models
 */
class StewardCLI {
    constructor() {
        this.modelInterface = new ModelInterface();
        this.defaultModel = 'ai/smollm3:latest';
        this.defaultOptions = {
            max_tokens: 512,
            temperature: 0.7,
            top_p: 0.9
        };
    }

    /**
     * Display help information
     */
    showHelp() {
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║                     THE STEWARD CLI                          ║
║                  AI Model Interface                          ║
╚══════════════════════════════════════════════════════════════╝

USAGE:
  node cli/steward.js "your prompt here"
  node cli/steward.js --model gpt-4o "your prompt here"
  node cli/steward.js --help

EXAMPLES:
  node cli/steward.js "What is JavaScript?"
  node cli/steward.js "Explain quantum computing in simple terms"
  node cli/steward.js --model lewd "Write a creative story"

OPTIONS:
  --model <name>     Choose AI model (default: ai/smollm3:latest)
  --temperature <n>  Set randomness 0.0-2.0 (default: 0.7)
  --max-tokens <n>   Set max response length (default: 512)
  --task <type>      Specify task type for performance tracking
  --rate             Collect feedback after response
  --help            Show this help message

AVAILABLE MODELS:
  Local Models:  ai/smollm3:latest, gpt-4o, lewd, llama, mistral
  Cloud Models:  gpt-3.5-turbo, gpt-4, claude-3-haiku, claude-3-sonnet

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
            model: this.defaultModel,
            temperature: this.defaultOptions.temperature,
            max_tokens: this.defaultOptions.max_tokens,
            task_type: null,
            collect_feedback: false,
            help: false
        };

        for (let i = 0; i < args.length; i++) {
            const arg = args[i];

            if (arg === '--help' || arg === '-h') {
                parsed.help = true;
            } else if (arg === '--model' || arg === '-m') {
                parsed.model = args[++i];
            } else if (arg === '--temperature' || arg === '-t') {
                parsed.temperature = parseFloat(args[++i]);
            } else if (arg === '--max-tokens') {
                parsed.max_tokens = parseInt(args[++i]);
            } else if (arg === '--task') {
                parsed.task_type = args[++i];
            } else if (arg === '--rate') {
                parsed.collect_feedback = true;
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

        if (!this.modelInterface.isModelAvailable(args.model)) {
            const available = this.modelInterface.getAvailableModels();
            errors.push(`Unknown model: ${args.model}. Available models: ${[...available.local, ...available.cloud].join(', ')}`);
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Format and display the response
     * @param {object} response - Response from ModelInterface
     * @param {number} startTime - Request start time
     */
    displayResponse(response, startTime) {
        const totalTime = Date.now() - startTime;

        console.log('\n' + '═'.repeat(60));
        console.log('🤖 THE STEWARD RESPONSE');
        console.log('═'.repeat(60));

        if (response.error) {
            console.log('❌ ERROR:', response.error.message);
            console.log('💡 SUGGESTION: Check that your model is running and accessible');
            
            if (response.error.message.includes('authentication required')) {
                console.log('🔑 HINT: Set OPENWEBUI_API_KEY environment variable for Open WebUI');
            }
            
            return;
        }

        // Display main content
        console.log(response.content);

        // Display metadata
        console.log('\n' + '-'.repeat(40));
        console.log('📊 RESPONSE DETAILS');
        console.log('-'.repeat(40));
        console.log(`Model:        ${response.model_used}`);
        console.log(`Duration:     ${totalTime}ms`);
        console.log(`Content:      ${response.content.length} characters`);

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

            // Start loading animation
            const stopLoading = this.showLoading(args.model);

            // Send request
            const startTime = Date.now();
            const response = await this.modelInterface.sendRequest(
                args.model,
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

            // Display response
            this.displayResponse(response, startTime);

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