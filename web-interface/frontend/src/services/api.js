// API Service for The Steward web interface
// Handles all HTTP requests to the backend API with enhanced analytics support

import axios from 'axios';

// Dynamic API base URL - use network IP when accessed from network
const getApiBaseUrl = () => {
  // If REACT_APP_API_URL is set, use it
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // If accessed via network IP, use network IP for API
  if (window.location.hostname === '192.168.1.18') {
    return 'http://192.168.1.18:3002';
  }
  
  // Default to localhost
  return 'http://localhost:3002';
};

const API_BASE_URL = getApiBaseUrl();

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
          max_tokens: options.maxTokens || 1500,
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
   * @param {string} timeframe - Timeframe for metrics ('1h', '24h', '7d', '30d')
   * @param {string} taskType - Filter by task type (optional)
   */
  static async getPerformanceMetrics(timeframe = '24h', taskType = null) {
    try {
      const params = new URLSearchParams({ timeframe });
      if (taskType) params.append('task_type', taskType);
      
      const response = await api.get(`/api/analytics/performance?${params}`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Failed to get performance metrics: ${errorMessage}`);
    }
  }

  /**
   * Get routing trends data
   * @param {string} timeframe - Timeframe for trends ('1h', '24h', '7d', '30d')
   */
  static async getRoutingTrends(timeframe = '24h') {
    try {
      const response = await api.get(`/api/analytics/routing-trends?timeframe=${timeframe}`);
      return response.data.trends || [];
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Failed to get routing trends: ${errorMessage}`);
    }
  }

  /**
   * Get cognitive patterns data
   * @param {string} timeframe - Timeframe for patterns ('1h', '24h', '7d', '30d')
   */
  static async getCognitivePatterns(timeframe = '24h') {
    try {
      const response = await api.get(`/api/analytics/cognitive-patterns?timeframe=${timeframe}`);
      return response.data.patterns || [];
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Failed to get cognitive patterns: ${errorMessage}`);
    }
  }

  /**
   * Submit user feedback for a routing decision or response
   * @param {object} feedback - Feedback data
   */
  static async submitFeedback(feedback) {
    try {
      const response = await api.post('/api/analytics/feedback', feedback);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Failed to submit feedback: ${errorMessage}`);
    }
  }

  /**
   * Get learning insights and recommendations
   * @param {string} timeframe - Timeframe for insights
   */
  static async getLearningInsights(timeframe = '7d') {
    try {
      const response = await api.get(`/api/analytics/insights?timeframe=${timeframe}`);
      return response.data.insights || [];
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Failed to get learning insights: ${errorMessage}`);
    }
  }

  /**
   * Get model comparison data
   * @param {Array} models - Models to compare (optional)
   * @param {string} timeframe - Timeframe for comparison
   */
  static async getModelComparison(models = null, timeframe = '7d') {
    try {
      const params = new URLSearchParams({ timeframe });
      if (models && models.length > 0) {
        models.forEach(model => params.append('models', model));
      }
      
      const response = await api.get(`/api/analytics/model-comparison?${params}`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Failed to get model comparison: ${errorMessage}`);
    }
  }

  /**
   * Get ADHD accommodation effectiveness data
   * @param {string} timeframe - Timeframe for data
   */
  static async getAdhdAccommodations(timeframe = '7d') {
    try {
      const response = await api.get(`/api/analytics/adhd-accommodations?timeframe=${timeframe}`);
      return response.data.accommodations || [];
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Failed to get ADHD accommodations: ${errorMessage}`);
    }
  }

  /**
   * Get context switching analysis
   * @param {string} timeframe - Timeframe for analysis
   */
  static async getContextSwitchingAnalysis(timeframe = '7d') {
    try {
      const response = await api.get(`/api/analytics/context-switching?timeframe=${timeframe}`);
      return response.data.analysis || [];
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Failed to get context switching analysis: ${errorMessage}`);
    }
  }

  /**
   * Update preference based on learning insight
   * @param {string} insightId - ID of the insight to apply
   * @param {boolean} apply - Whether to apply or reject the insight
   */
  static async updatePreferenceFromInsight(insightId, apply = true) {
    try {
      const response = await api.post('/api/analytics/apply-insight', {
        insight_id: insightId,
        apply: apply
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Failed to update preference: ${errorMessage}`);
    }
  }

  /**
   * Get system performance summary
   */
  static async getSystemSummary() {
    try {
      const response = await api.get('/api/analytics/system-summary');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Failed to get system summary: ${errorMessage}`);
    }
  }

  /**
   * Export analytics data
   * @param {string} format - Export format ('json', 'csv')
   * @param {string} timeframe - Timeframe for export
   */
  static async exportAnalytics(format = 'json', timeframe = '30d') {
    try {
      const response = await api.get(`/api/analytics/export?format=${format}&timeframe=${timeframe}`, {
        responseType: format === 'csv' ? 'blob' : 'json'
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Failed to export analytics: ${errorMessage}`);
    }
  }

  /**
   * Legacy performance endpoint for backward compatibility
   */
  static async getPerformance(timeframe = '24h', taskType = null) {
    return this.getPerformanceMetrics(timeframe, taskType);
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