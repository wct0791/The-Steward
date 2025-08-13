const LocalDockerAdapter = require('./adapters/LocalDockerAdapter');
const CloudAPIAdapter = require('./adapters/CloudAPIAdapter');
const DatabaseManager = require('../database/DatabaseManager');

/**
 * Main Model Interface Class
 * Provides unified interface for communicating with AI models
 * Routes requests to appropriate adapters based on model name
 */
class ModelInterface {
    constructor() {
        this.localAdapter = new LocalDockerAdapter();
        this.cloudAdapter = new CloudAPIAdapter();
        this.dbManager = new DatabaseManager();
        this.trackPerformance = true; // Can be disabled for testing
        
        // Define model routing - determines which adapter to use for each model
        this.modelRouting = {
            // Local Docker models (common HuggingFace and custom deployments)
            'llama': 'local',
            'mistral': 'local',
            'codellama': 'local',
            'vicuna': 'local',
            'alpaca': 'local',
            'local': 'local', // Generic local model
            
            // Open WebUI models (served locally on port 3000)
            'gpt-4o': 'local',
            'lewd': 'local',
            'ai/smollm3:latest': 'local',
            
            // Cloud API models
            'gpt-3.5-turbo': 'cloud',
            'gpt-4': 'cloud',
            'gpt-4-turbo': 'cloud',
            'claude-3-haiku': 'cloud',
            'claude-3-sonnet': 'cloud',
            'claude-3-opus': 'cloud',
            'claude-3.5-sonnet': 'cloud'
        };
    }

    /**
     * Main method to send requests to AI models
     * @param {string} modelName - Name of the model to use
     * @param {string} prompt - The prompt/message to send
     * @param {object} options - Additional options (temperature, max_tokens, etc.)
     * @param {string} taskType - Type of task for performance tracking (optional)
     * @param {string} sessionId - Session ID for grouping requests (optional)
     * @returns {object} Standardized response object
     */
    async sendRequest(modelName, prompt, options = {}, taskType = null, sessionId = null) {
        const startTime = Date.now();
        let performanceId = null;
        
        // Generate session ID if not provided
        if (this.trackPerformance && !sessionId) {
            sessionId = this.dbManager.generateSessionId();
        }
        
        try {
            // Validate inputs
            if (!modelName || typeof modelName !== 'string') {
                throw new Error('Model name is required and must be a string');
            }
            
            if (!prompt || typeof prompt !== 'string') {
                throw new Error('Prompt is required and must be a string');
            }

            // Determine which adapter to use
            const adapterType = this.modelRouting[modelName];
            if (!adapterType) {
                throw new Error(`Unknown model: ${modelName}. Available models: ${Object.keys(this.modelRouting).join(', ')}`);
            }

            let response;
            
            // Route to appropriate adapter
            if (adapterType === 'local') {
                response = await this.localAdapter.sendRequest(modelName, prompt, options);
            } else if (adapterType === 'cloud') {
                response = await this.cloudAdapter.sendRequest(modelName, prompt, options);
            } else {
                throw new Error(`Invalid adapter type: ${adapterType}`);
            }

            // Calculate timing
            const endTime = Date.now();
            const duration = endTime - startTime;

            // Log successful performance data
            if (this.trackPerformance) {
                try {
                    performanceId = await this.dbManager.logPerformance({
                        model_name: modelName,
                        adapter_type: adapterType,
                        task_type: taskType,
                        response_time_ms: duration,
                        tokens_prompt: response.metadata?.usage?.prompt_tokens || null,
                        tokens_completion: response.metadata?.usage?.completion_tokens || null,
                        tokens_total: response.metadata?.usage?.total_tokens || null,
                        success: true,
                        error_type: null,
                        error_message: null,
                        prompt_length: prompt.length,
                        response_length: (response.content || '').length,
                        temperature: options.temperature || null,
                        max_tokens: options.max_tokens || null,
                        session_id: sessionId,
                        user_context: null // Future enhancement
                    });
                } catch (dbError) {
                    console.warn('Failed to log performance data:', dbError.message);
                }
            }

            // Return standardized response
            return {
                content: response.content || '',
                metadata: {
                    ...(response.metadata || {}),
                    adapter_type: adapterType,
                    request_options: options,
                    performance_id: performanceId,
                    session_id: sessionId
                },
                timing: {
                    start_time: startTime,
                    end_time: endTime,
                    duration_ms: duration
                },
                model_used: modelName,
                error: null
            };

        } catch (error) {
            const endTime = Date.now();
            const duration = endTime - startTime;

            // Log failed performance data
            if (this.trackPerformance) {
                try {
                    performanceId = await this.dbManager.logPerformance({
                        model_name: modelName,
                        adapter_type: this.modelRouting[modelName] || 'unknown',
                        task_type: taskType,
                        response_time_ms: duration,
                        tokens_prompt: null,
                        tokens_completion: null,
                        tokens_total: null,
                        success: false,
                        error_type: error.name || 'Error',
                        error_message: error.message,
                        prompt_length: prompt.length,
                        response_length: 0,
                        temperature: options.temperature || null,
                        max_tokens: options.max_tokens || null,
                        session_id: sessionId,
                        user_context: null
                    });
                } catch (dbError) {
                    console.warn('Failed to log error performance data:', dbError.message);
                }
            }

            // Return standardized error response
            return {
                content: '',
                metadata: {
                    request_options: options,
                    performance_id: performanceId,
                    session_id: sessionId
                },
                timing: {
                    start_time: startTime,
                    end_time: endTime,
                    duration_ms: duration
                },
                model_used: modelName,
                error: {
                    message: error.message,
                    type: error.name || 'Error',
                    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
                }
            };
        }
    }

    /**
     * Get list of available models
     * @returns {object} Object with local and cloud model lists
     */
    getAvailableModels() {
        const local = Object.keys(this.modelRouting).filter(model => this.modelRouting[model] === 'local');
        const cloud = Object.keys(this.modelRouting).filter(model => this.modelRouting[model] === 'cloud');
        
        return { local, cloud };
    }

    /**
     * Check if a model is available
     * @param {string} modelName - Name of the model to check
     * @returns {boolean} True if model is available
     */
    isModelAvailable(modelName) {
        return this.modelRouting.hasOwnProperty(modelName);
    }

    /**
     * Add a new model to the routing table
     * @param {string} modelName - Name of the model
     * @param {string} adapterType - Type of adapter ('local' or 'cloud')
     */
    addModel(modelName, adapterType) {
        if (!['local', 'cloud'].includes(adapterType)) {
            throw new Error('Adapter type must be either "local" or "cloud"');
        }
        
        this.modelRouting[modelName] = adapterType;
    }

    /**
     * Remove a model from the routing table
     * @param {string} modelName - Name of the model to remove
     */
    removeModel(modelName) {
        delete this.modelRouting[modelName];
    }

    /**
     * Enable or disable performance tracking
     * @param {boolean} enabled - Whether to track performance
     */
    setPerformanceTracking(enabled) {
        this.trackPerformance = enabled;
    }

    /**
     * Get performance statistics for a model
     * @param {string} modelName - Model name
     * @param {number} days - Days to look back (default: 30)
     * @returns {Promise<object>} Performance statistics
     */
    async getModelPerformance(modelName, days = 30) {
        if (!this.trackPerformance) {
            throw new Error('Performance tracking is disabled');
        }
        return await this.dbManager.getModelPerformance(modelName, days);
    }

    /**
     * Get task type performance across models
     * @param {string} taskType - Task type
     * @param {number} days - Days to look back (default: 30)
     * @returns {Promise<Array>} Performance by model
     */
    async getTaskTypePerformance(taskType, days = 30) {
        if (!this.trackPerformance) {
            throw new Error('Performance tracking is disabled');
        }
        return await this.dbManager.getTaskTypePerformance(taskType, days);
    }

    /**
     * Get model recommendations for a task type
     * @param {string} taskType - Task type
     * @returns {Promise<Array>} Recommended models
     */
    async getModelRecommendations(taskType) {
        if (!this.trackPerformance) {
            throw new Error('Performance tracking is disabled');
        }
        return await this.dbManager.getModelRecommendations(taskType);
    }

    /**
     * Get usage summary
     * @param {number} days - Days to analyze (default: 7)
     * @returns {Promise<object>} Usage summary
     */
    async getUsageSummary(days = 7) {
        if (!this.trackPerformance) {
            throw new Error('Performance tracking is disabled');
        }
        return await this.dbManager.getUsageSummary(days);
    }

    /**
     * Store user feedback for a request
     * @param {number} performanceId - Performance record ID
     * @param {object} feedbackData - Feedback data
     * @returns {Promise<number>} Feedback ID
     */
    async storeFeedback(performanceId, feedbackData) {
        if (!this.trackPerformance) {
            throw new Error('Performance tracking is disabled');
        }
        return await this.dbManager.storeFeedback({
            performance_id: performanceId,
            ...feedbackData
        });
    }

    /**
     * Close database connections gracefully
     * @returns {Promise<void>}
     */
    async close() {
        if (this.dbManager) {
            await this.dbManager.close();
        }
    }
}

module.exports = ModelInterface;