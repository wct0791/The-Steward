const https = require('https');

/**
 * Cloud API Adapter
 * Handles communication with cloud-based AI models (OpenAI, Anthropic, etc.)
 * Supports different API formats and provides rate limiting awareness
 */
class CloudAPIAdapter {
    constructor() {
        // Default timeout for requests (60 seconds for cloud APIs)
        this.timeout = 60000;
        
        // Rate limiting - simple request tracking
        this.requestCounts = {
            openai: [],
            anthropic: []
        };
        
        // Rate limits per minute (conservative defaults)
        this.rateLimits = {
            openai: 20,
            anthropic: 10
        };
        
        // API endpoints
        this.endpoints = {
            openai: 'api.openai.com',
            anthropic: 'api.anthropic.com'
        };
    }

    /**
     * Send request to cloud API model
     * @param {string} modelName - Name of the model
     * @param {string} prompt - The prompt to send
     * @param {object} options - Request options
     * @returns {object} Response from the model
     */
    async sendRequest(modelName, prompt, options = {}) {
        // Determine API provider based on model name
        const provider = this.getProviderFromModel(modelName);
        
        // Check rate limits
        if (!this.checkRateLimit(provider)) {
            throw new Error(`Rate limit exceeded for ${provider}. Please wait before making more requests.`);
        }

        // Send request based on provider
        let response;
        if (provider === 'openai') {
            response = await this.sendOpenAIRequest(modelName, prompt, options);
        } else if (provider === 'anthropic') {
            response = await this.sendAnthropicRequest(modelName, prompt, options);
        } else {
            throw new Error(`Unsupported provider: ${provider}`);
        }

        // Update rate limit tracking
        this.updateRateLimit(provider);

        return response;
    }

    /**
     * Determine API provider from model name
     * @param {string} modelName - Name of the model
     * @returns {string} Provider name
     */
    getProviderFromModel(modelName) {
        if (modelName.startsWith('gpt-')) {
            return 'openai';
        } else if (modelName.startsWith('claude-')) {
            return 'anthropic';
        } else {
            throw new Error(`Cannot determine provider for model: ${modelName}`);
        }
    }

    /**
     * Send request to OpenAI API
     * @param {string} modelName - Name of the model
     * @param {string} prompt - The prompt to send
     * @param {object} options - Request options
     * @returns {object} Response from OpenAI
     */
    async sendOpenAIRequest(modelName, prompt, options = {}) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY environment variable is required');
        }

        const postData = JSON.stringify({
            model: modelName,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: options.max_tokens || 256,
            temperature: options.temperature || 0.7,
            top_p: options.top_p || 1,
            frequency_penalty: options.frequency_penalty || 0,
            presence_penalty: options.presence_penalty || 0,
            ...options.openai_params
        });

        const requestOptions = {
            hostname: this.endpoints.openai,
            port: 443,
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'Content-Length': Buffer.byteLength(postData)
            },
            timeout: this.timeout
        };

        const responseBody = await this.makeHttpsRequest(requestOptions, postData);
        return this.parseOpenAIResponse(responseBody);
    }

    /**
     * Send request to Anthropic API
     * @param {string} modelName - Name of the model
     * @param {string} prompt - The prompt to send
     * @param {object} options - Request options
     * @returns {object} Response from Anthropic
     */
    async sendAnthropicRequest(modelName, prompt, options = {}) {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            throw new Error('ANTHROPIC_API_KEY environment variable is required');
        }

        const postData = JSON.stringify({
            model: modelName,
            max_tokens: options.max_tokens || 256,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: options.temperature || 0.7,
            top_p: options.top_p || 1,
            ...options.anthropic_params
        });

        const requestOptions = {
            hostname: this.endpoints.anthropic,
            port: 443,
            path: '/v1/messages',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Length': Buffer.byteLength(postData)
            },
            timeout: this.timeout
        };

        const responseBody = await this.makeHttpsRequest(requestOptions, postData);
        return this.parseAnthropicResponse(responseBody);
    }

    /**
     * Make HTTPS request
     * @param {object} requestOptions - HTTPS request options
     * @param {string} postData - Data to send in POST body
     * @returns {Promise<string>} Response body
     */
    async makeHttpsRequest(requestOptions, postData) {
        return new Promise((resolve, reject) => {
            const req = https.request(requestOptions, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(data);
                    } else {
                        const errorMessage = `HTTP ${res.statusCode}: ${data}`;
                        reject(new Error(errorMessage));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            // Set timeout
            req.setTimeout(this.timeout);

            // Send the data
            req.write(postData);
            req.end();
        });
    }

    /**
     * Parse OpenAI API response
     * @param {string} responseBody - Raw response body
     * @returns {object} Parsed response
     */
    parseOpenAIResponse(responseBody) {
        try {
            const parsed = JSON.parse(responseBody);

            if (parsed.error) {
                throw new Error(`OpenAI API Error: ${parsed.error.message}`);
            }

            const content = parsed.choices?.[0]?.message?.content || '';
            
            return {
                content: content,
                metadata: {
                    provider: 'openai',
                    usage: parsed.usage || {},
                    model: parsed.model || '',
                    finish_reason: parsed.choices?.[0]?.finish_reason || '',
                    raw_response: parsed
                }
            };

        } catch (parseError) {
            throw new Error(`Failed to parse OpenAI response: ${parseError.message}`);
        }
    }

    /**
     * Parse Anthropic API response
     * @param {string} responseBody - Raw response body
     * @returns {object} Parsed response
     */
    parseAnthropicResponse(responseBody) {
        try {
            const parsed = JSON.parse(responseBody);

            if (parsed.error) {
                throw new Error(`Anthropic API Error: ${parsed.error.message}`);
            }

            const content = parsed.content?.[0]?.text || '';
            
            return {
                content: content,
                metadata: {
                    provider: 'anthropic',
                    usage: parsed.usage || {},
                    model: parsed.model || '',
                    stop_reason: parsed.stop_reason || '',
                    raw_response: parsed
                }
            };

        } catch (parseError) {
            throw new Error(`Failed to parse Anthropic response: ${parseError.message}`);
        }
    }

    /**
     * Check if request is within rate limits
     * @param {string} provider - Provider name
     * @returns {boolean} True if within rate limits
     */
    checkRateLimit(provider) {
        if (!this.requestCounts[provider]) {
            return true;
        }

        // Clean old requests (older than 1 minute)
        const oneMinuteAgo = Date.now() - 60000;
        this.requestCounts[provider] = this.requestCounts[provider].filter(
            timestamp => timestamp > oneMinuteAgo
        );

        // Check if we're under the limit
        return this.requestCounts[provider].length < this.rateLimits[provider];
    }

    /**
     * Update rate limit tracking
     * @param {string} provider - Provider name
     */
    updateRateLimit(provider) {
        if (!this.requestCounts[provider]) {
            this.requestCounts[provider] = [];
        }
        
        this.requestCounts[provider].push(Date.now());
    }

    /**
     * Get rate limit status
     * @param {string} provider - Provider name
     * @returns {object} Rate limit status
     */
    getRateLimitStatus(provider) {
        if (!this.requestCounts[provider]) {
            return {
                requests_made: 0,
                limit: this.rateLimits[provider],
                remaining: this.rateLimits[provider],
                reset_in_ms: 0
            };
        }

        // Clean old requests
        const oneMinuteAgo = Date.now() - 60000;
        this.requestCounts[provider] = this.requestCounts[provider].filter(
            timestamp => timestamp > oneMinuteAgo
        );

        const requestsMade = this.requestCounts[provider].length;
        const limit = this.rateLimits[provider];
        const remaining = Math.max(0, limit - requestsMade);
        
        // Calculate reset time (when oldest request will be 1 minute old)
        let resetInMs = 0;
        if (this.requestCounts[provider].length > 0) {
            const oldestRequest = Math.min(...this.requestCounts[provider]);
            resetInMs = Math.max(0, 60000 - (Date.now() - oldestRequest));
        }

        return {
            requests_made: requestsMade,
            limit: limit,
            remaining: remaining,
            reset_in_ms: resetInMs
        };
    }

    /**
     * Set custom rate limits
     * @param {string} provider - Provider name
     * @param {number} limit - Requests per minute limit
     */
    setRateLimit(provider, limit) {
        this.rateLimits[provider] = limit;
    }

    /**
     * Reset rate limit tracking for a provider
     * @param {string} provider - Provider name
     */
    resetRateLimit(provider) {
        this.requestCounts[provider] = [];
    }

    /**
     * Check if API keys are configured
     * @returns {object} Status of API key configuration
     */
    getApiKeyStatus() {
        return {
            openai: !!process.env.OPENAI_API_KEY,
            anthropic: !!process.env.ANTHROPIC_API_KEY
        };
    }
}

module.exports = CloudAPIAdapter;