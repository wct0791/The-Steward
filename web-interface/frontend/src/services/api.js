// API Service for The Steward web interface
// Handles all HTTP requests to the backend API

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

// Configure axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
    return Promise.reject(error);
  }
);

export class ApiService {
  /**
   * Check API health status
   */
  static async checkHealth() {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  }

  /**
   * Process a prompt with smart routing
   * @param {string} prompt - The user prompt
   * @param {object} options - Options for processing
   */
  static async processPrompt(prompt, options = {}) {
    try {
      const response = await api.post('/api/prompt', {
        prompt,
        options: {
          max_tokens: options.maxTokens || 512,
          temperature: options.temperature || 0.7,
          top_p: options.topP || 0.9,
          session_id: options.sessionId,
          task_type: options.taskType,
          local_only: options.localOnly || false,
          ...options,
        },
      });
      
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Failed to process prompt: ${errorMessage}`);
    }
  }

  /**
   * Get available models and their status
   */
  static async getModels() {
    try {
      const response = await api.get('/api/models');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Failed to get models: ${errorMessage}`);
    }
  }

  /**
   * Get character sheet preferences
   */
  static async getCharacterSheet() {
    try {
      const response = await api.get('/api/character-sheet');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Failed to get character sheet: ${errorMessage}`);
    }
  }

  /**
   * Update character sheet preferences
   * @param {object} preferences - Character sheet preferences to update
   */
  static async updateCharacterSheet(preferences) {
    try {
      const response = await api.put('/api/character-sheet', { preferences });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Failed to update character sheet: ${errorMessage}`);
    }
  }

  /**
   * Get performance metrics and insights
   * @param {string} timeframe - Timeframe for metrics ('24h', '7d', etc.)
   * @param {string} taskType - Filter by task type (optional)
   */
  static async getPerformanceMetrics(timeframe = '24h', taskType = null) {
    try {
      const params = new URLSearchParams({ timeframe });
      if (taskType) params.append('task_type', taskType);
      
      const response = await api.get(`/api/performance?${params}`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Failed to get performance metrics: ${errorMessage}`);
    }
  }

  /**
   * Generic request method for custom endpoints
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request data (optional)
   */
  static async request(method, endpoint, data = null) {
    try {
      const config = {
        method: method.toLowerCase(),
        url: endpoint,
      };
      
      if (data) {
        config.data = data;
      }
      
      const response = await api(config);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`API request failed: ${errorMessage}`);
    }
  }
}

// Export the axios instance for direct use if needed
export { api };
export default ApiService;