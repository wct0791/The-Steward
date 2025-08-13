const http = require('http');

/**
 * Local Docker Adapter
 * Handles communication with AI models running in Docker containers
 * Supports HuggingFace Spaces, generic text-generation endpoints, and Open WebUI API
 */
class LocalDockerAdapter {
    constructor() {
        // Common ports for Docker-hosted models
        this.commonPorts = [7860, 8080, 3000];
        
        // Default timeout for requests (30 seconds)
        this.timeout = 30000;
        
        // Retry configuration
        this.maxRetries = 3;
        this.retryDelay = 2000; // 2 seconds between retries
    }

    /**
     * Send request to local Docker model
     * @param {string} modelName - Name of the model
     * @param {string} prompt - The prompt to send
     * @param {object} options - Request options
     * @returns {object} Response from the model
     */
    async sendRequest(modelName, prompt, options = {}) {
        // For Open WebUI models, prioritize port 3000
        const openWebUIModels = ['gpt-4o', 'lewd', 'ai/smollm3:latest'];
        let portsToTry = [...this.commonPorts];
        
        if (openWebUIModels.includes(modelName)) {
            // Move port 3000 to the front for Open WebUI models
            portsToTry = portsToTry.filter(p => p !== 3000);
            portsToTry.unshift(3000);
        }
        
        // Try each port until we find a responding service
        for (const port of portsToTry) {
            try {
                const response = await this.tryPort(port, modelName, prompt, options);
                return response;
            } catch (error) {
                // Log the attempt but continue to next port unless it's an auth error on port 3000
                if (port === 3000 && error.message.includes('authentication required')) {
                    // For auth errors on port 3000, stop trying other ports for Open WebUI models
                    if (openWebUIModels.includes(modelName)) {
                        throw error;
                    }
                }
                console.log(`Port ${port} failed for model ${modelName}: ${error.message}`);
                continue;
            }
        }
        
        throw new Error(`Could not connect to model ${modelName} on any of the common ports: ${portsToTry.join(', ')}`);
    }

    /**
     * Try to connect to a specific port
     * @param {number} port - Port to try
     * @param {string} modelName - Name of the model
     * @param {string} prompt - The prompt to send
     * @param {object} options - Request options
     * @returns {object} Response from the model
     */
    async tryPort(port, modelName, prompt, options = {}) {
        // For port 3000, prioritize Open WebUI format
        if (port === 3000) {
            try {
                return await this.sendOpenWebUIRequest(port, modelName, prompt, options);
            } catch (error) {
                // If it's an auth error, throw it immediately (don't try other formats)
                if (error.message.includes('Not authenticated') || error.message.includes('401')) {
                    throw new Error(`Open WebUI authentication required. Set OPENWEBUI_API_KEY environment variable. Original error: ${error.message}`);
                }
                console.log(`Open WebUI format failed on port ${port}: ${error.message}`);
                // Continue to try other formats
            }
        }

        // Try HuggingFace Spaces format
        try {
            return await this.sendHuggingFaceRequest(port, prompt, options);
        } catch (error) {
            console.log(`HuggingFace format failed on port ${port}: ${error.message}`);
        }

        // Fall back to generic text-generation endpoint
        try {
            return await this.sendGenericRequest(port, prompt, options);
        } catch (error) {
            console.log(`Generic format failed on port ${port}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Format messages for specific models to improve response quality
     * @param {string} modelName - Name of the model
     * @param {string} prompt - The user prompt
     * @returns {Array} Formatted messages array
     */
    formatMessagesForModel(modelName, prompt) {
        // SmolLM3 and similar models need clear instructions to avoid reasoning monologue
        const isSmallModel = modelName.includes('smollm') || modelName.includes('smol');
        
        let systemPrompt;
        if (isSmallModel) {
            systemPrompt = `You are a helpful AI assistant. Provide direct, clear answers without showing your internal reasoning process. Be concise and to-the-point. Do not include phrases like "I think", "Let me think", or show your step-by-step thinking. Just give the final answer directly.`;
        } else {
            systemPrompt = `You are a helpful AI assistant. Provide clear, accurate, and helpful responses.`;
        }
        
        return [
            {
                role: 'system',
                content: systemPrompt
            },
            {
                role: 'user',
                content: prompt
            }
        ];
    }

    /**
     * Send request using Open WebUI API format
     * @param {number} port - Port to connect to
     * @param {string} modelName - Name of the model
     * @param {string} prompt - The prompt to send
     * @param {object} options - Request options
     * @returns {object} Response from Open WebUI
     */
    async sendOpenWebUIRequest(port, modelName, prompt, options = {}) {
        const apiKey = process.env.OPENWEBUI_API_KEY;
        
        // Format messages with system prompt for better responses
        const messages = this.formatMessagesForModel(modelName, prompt);
        
        const postData = JSON.stringify({
            model: modelName,
            messages: messages,
            max_tokens: options.max_tokens || 1500,
            temperature: options.temperature || 0.7,
            top_p: options.top_p || 0.9,
            frequency_penalty: options.frequency_penalty || 0,
            presence_penalty: options.presence_penalty || 0,
            stream: false,
            ...options.openwebui_params
        });

        const headers = {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        };

        // Add Authorization header if API key is provided
        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const requestOptions = {
            hostname: 'localhost',
            port: port,
            path: '/api/chat/completions',
            method: 'POST',
            headers: headers,
            timeout: this.timeout
        };

        return await this.makeRequestWithRetry(requestOptions, postData, 'openwebui');
    }

    /**
     * Format prompt for HuggingFace models to improve response quality
     * @param {string} prompt - The user prompt
     * @returns {string} Formatted prompt
     */
    formatPromptForHuggingFace(prompt) {
        // Add clear instruction for direct answers without reasoning monologue
        const systemInstruction = "Provide a direct, clear answer to the following question without showing your reasoning process:\n\n";
        return systemInstruction + prompt + "\n\nAnswer:";
    }

    /**
     * Send request using HuggingFace Spaces format
     * @param {number} port - Port to connect to
     * @param {string} prompt - The prompt to send
     * @param {object} options - Request options
     * @returns {object} Response from the model
     */
    async sendHuggingFaceRequest(port, prompt, options = {}) {
        // Format prompt for better responses from small models
        const formattedPrompt = this.formatPromptForHuggingFace(prompt);
        
        const postData = JSON.stringify({
            inputs: formattedPrompt,
            parameters: {
                max_new_tokens: options.max_tokens || 1500,
                temperature: options.temperature || 0.7,
                top_p: options.top_p || 0.9,
                do_sample: options.do_sample !== false,
                repetition_penalty: 1.1,
                ...options.parameters
            }
        });

        const requestOptions = {
            hostname: 'localhost',
            port: port,
            path: '/api/predict', // Common HuggingFace Spaces endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            },
            timeout: this.timeout
        };

        return await this.makeRequestWithRetry(requestOptions, postData, 'huggingface');
    }

    /**
     * Send request using generic text-generation format
     * @param {number} port - Port to connect to
     * @param {string} prompt - The prompt to send
     * @param {object} options - Request options
     * @returns {object} Response from the model
     */
    async sendGenericRequest(port, prompt, options = {}) {
        const postData = JSON.stringify({
            prompt: prompt,
            max_tokens: options.max_tokens || 256,
            temperature: options.temperature || 0.7,
            top_p: options.top_p || 0.9,
            ...options
        });

        const requestOptions = {
            hostname: 'localhost',
            port: port,
            path: '/generate', // Common generic endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            },
            timeout: this.timeout
        };

        return await this.makeRequestWithRetry(requestOptions, postData, 'generic');
    }

    /**
     * Make HTTP request with retry logic
     * @param {object} requestOptions - HTTP request options
     * @param {string} postData - Data to send in POST body
     * @param {string} format - Format type for response parsing
     * @returns {object} Parsed response
     */
    async makeRequestWithRetry(requestOptions, postData, format) {
        let lastError;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const response = await this.makeHttpRequest(requestOptions, postData);
                return this.parseResponse(response, format);
            } catch (error) {
                lastError = error;
                
                // If it's a connection error, wait and retry
                if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
                    if (attempt < this.maxRetries) {
                        console.log(`Attempt ${attempt} failed, retrying in ${this.retryDelay}ms...`);
                        await this.sleep(this.retryDelay);
                        continue;
                    }
                } else {
                    // For non-connection errors, don't retry
                    throw error;
                }
            }
        }

        throw lastError;
    }

    /**
     * Make HTTP request
     * @param {object} requestOptions - HTTP request options
     * @param {string} postData - Data to send in POST body
     * @returns {Promise<string>} Response body
     */
    async makeHttpRequest(requestOptions, postData) {
        return new Promise((resolve, reject) => {
            const req = http.request(requestOptions, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(data);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${data}`));
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
     * Extract final answer from reasoning monologue or verbose responses
     * @param {string} content - Raw response content
     * @returns {string} Cleaned final answer
     */
    extractFinalAnswer(content) {
        if (!content || typeof content !== 'string') {
            return content;
        }

        // Remove the system instruction prefix if it exists
        let cleaned = content.replace(/^Provide a direct[^:]*:\s*/i, '');

        // If response starts with "Answer:" extract everything after it
        if (cleaned.includes('\nAnswer:')) {
            const parts = cleaned.split('\nAnswer:');
            if (parts.length > 1) {
                cleaned = parts[parts.length - 1].trim();
            }
        }

        // Remove common reasoning phrases at the beginning
        const reasoningPatterns = [
            /^(?:Let me think about this|I need to consider|To answer this|Looking at this question)[^.]*\.\s*/i,
            /^(?:Well|So|Now|First|Initially)[,\s]*/,
            /^(?:I think|I believe|I would say|In my opinion)[,\s]*/i,
            /^(?:The answer is|Here's the answer|My answer is)[:\s]*/i,
        ];

        for (const pattern of reasoningPatterns) {
            cleaned = cleaned.replace(pattern, '');
        }

        // Extract content after final reasoning markers
        const finalMarkers = [
            /(?:In conclusion|Finally|To summarize|In summary)[,:]?\s*/i,
            /(?:Therefore|Thus|Hence)[,:]?\s*/i,
            /(?:So the answer is|The final answer is|Ultimately)[,:]?\s*/i
        ];

        for (const marker of finalMarkers) {
            const parts = cleaned.split(marker);
            if (parts.length > 1) {
                // Take the content after the last occurrence of the marker
                cleaned = parts[parts.length - 1].trim();
            }
        }

        // Remove thinking process in parentheses or brackets
        cleaned = cleaned.replace(/\([^)]*thinking[^)]*\)/gi, '');
        cleaned = cleaned.replace(/\[[^\]]*reasoning[^\]]*\]/gi, '');

        // Trim extra whitespace and newlines
        cleaned = cleaned.trim();

        // If cleaning resulted in empty string, return original
        return cleaned || content;
    }

    /**
     * Parse response based on format
     * @param {string} responseBody - Raw response body
     * @param {string} format - Format type ('openwebui', 'huggingface', or 'generic')
     * @returns {object} Parsed response
     */
    parseResponse(responseBody, format) {
        try {
            const parsed = JSON.parse(responseBody);

            if (format === 'openwebui') {
                // Open WebUI returns OpenAI-compatible format
                if (parsed.error) {
                    throw new Error(`Open WebUI API Error: ${parsed.error.message || parsed.error}`);
                }

                // Extract content from multiple possible fields
                const messageContent = parsed.choices?.[0]?.message?.content || '';
                const reasoningContent = parsed.choices?.[0]?.message?.reasoning_content || '';
                
                // Combine content and reasoning_content if both exist
                let finalContent = messageContent;
                if (reasoningContent) {
                    finalContent = reasoningContent + (messageContent ? '\n\n' + messageContent : '');
                }
                
                // Post-process to extract final answer from reasoning monologue
                const cleanedContent = this.extractFinalAnswer(finalContent);

                return {
                    content: cleanedContent,
                    metadata: {
                        format: 'openwebui',
                        usage: parsed.usage || {},
                        model: parsed.model || '',
                        finish_reason: parsed.choices?.[0]?.finish_reason || '',
                        has_reasoning: !!reasoningContent,
                        message_content: messageContent,
                        reasoning_content: reasoningContent,
                        raw_response: parsed
                    }
                };
            } else if (format === 'huggingface') {
                // HuggingFace format typically returns array with generated_text
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const rawContent = parsed[0].generated_text || parsed[0].text || '';
                    const cleanedContent = this.extractFinalAnswer(rawContent);
                    
                    return {
                        content: cleanedContent,
                        metadata: {
                            format: 'huggingface',
                            raw_response: parsed
                        }
                    };
                } else if (parsed.generated_text) {
                    return {
                        content: this.extractFinalAnswer(parsed.generated_text),
                        metadata: {
                            format: 'huggingface',
                            raw_response: parsed
                        }
                    };
                }
            } else if (format === 'generic') {
                // Generic format might have various response structures
                const content = parsed.text || parsed.generated_text || parsed.response || parsed.output || '';
                return {
                    content: content,
                    metadata: {
                        format: 'generic',
                        raw_response: parsed
                    }
                };
            }

            // Fallback - try to extract any text content
            const content = parsed.text || parsed.content || parsed.response || JSON.stringify(parsed);
            return {
                content: content,
                metadata: {
                    format: 'unknown',
                    raw_response: parsed
                }
            };

        } catch (parseError) {
            // If JSON parsing fails, return the raw response
            return {
                content: responseBody,
                metadata: {
                    format: 'raw',
                    parse_error: parseError.message
                }
            };
        }
    }

    /**
     * Sleep utility for retry delays
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise} Promise that resolves after the delay
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Check if a port is responding
     * @param {number} port - Port to check
     * @returns {Promise<boolean>} True if port is responding
     */
    async isPortActive(port) {
        try {
            const requestOptions = {
                hostname: 'localhost',
                port: port,
                path: '/',
                method: 'GET',
                timeout: 5000
            };

            await this.makeHttpRequest(requestOptions, '');
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get list of active ports
     * @returns {Promise<number[]>} Array of active ports
     */
    async getActivePorts() {
        const activePorts = [];
        
        for (const port of this.commonPorts) {
            if (await this.isPortActive(port)) {
                activePorts.push(port);
            }
        }
        
        return activePorts;
    }
}

module.exports = LocalDockerAdapter;