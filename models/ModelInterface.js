const LocalDockerAdapter = require('./adapters/LocalDockerAdapter');
const CloudAPIAdapter = require('./adapters/CloudAPIAdapter');

/**
 * Main Model Interface Class
 * Provides unified interface for communicating with AI models
 * Routes requests to appropriate adapters based on model name
 */
class ModelInterface {
    constructor() {
        this.localAdapter = new LocalDockerAdapter();
        this.cloudAdapter = new CloudAPIAdapter();
        
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
     * @returns {object} Standardized response object
     */
    async sendRequest(modelName, prompt, options = {}) {
        const startTime = Date.now();
        
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

            // Return standardized response
            return {
                content: response.content || '',
                metadata: {
                    ...(response.metadata || {}),
                    adapter_type: adapterType,
                    request_options: options
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

            // Return standardized error response
            return {
                content: '',
                metadata: {
                    request_options: options
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
}

module.exports = ModelInterface;