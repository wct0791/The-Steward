// The Steward Backend API Server
// Express server wrapping the smart routing engine for web interface with enhanced analytics

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
require('dotenv').config();

// Import The Steward components
const SmartRoutingEngine = require('../../../src/core/smart-routing-engine.js');
const ModelInterface = require('../../../models/ModelInterface.js');

// Import route handlers
const analyticsRoutes = require('./routes/analytics');
const ambientRoutes = require('./routes/ambient');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Configuration
const PORT = process.env.PORT || 3002;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

// Initialize The Steward components
const smartRouter = new SmartRoutingEngine();
const modelInterface = new ModelInterface();

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Allow embedding for PWA
}));
app.use(compression());
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3001'],
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      smartRouter: 'available',
      modelInterface: 'available',
      analytics: 'available',
      ambientIntelligence: 'available'
    }
  });
});

// Mount analytics routes
app.use('/api/analytics', analyticsRoutes);

// Mount ambient intelligence routes
app.use('/api/ambient', ambientRoutes);

// API Routes

/**
 * POST /api/prompt
 * Process a prompt with smart routing
 */
app.post('/api/prompt', async (req, res) => {
  try {
    const { prompt, options = {} } = req.body;
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        error: 'Invalid prompt',
        message: 'Prompt must be a non-empty string'
      });
    }

    const startTime = Date.now();
    
    // Make smart routing decision
    const routingDecision = await smartRouter.makeSmartRoutingDecision(prompt, options);
    
    // Map model name for ModelInterface
    const selectedModel = mapModelName(routingDecision.selection?.model);
    
    // Send request to model
    const response = await modelInterface.sendRequest(
      selectedModel,
      prompt,
      {
        max_tokens: options.max_tokens || 1500,
        temperature: options.temperature || 0.7,
        top_p: options.top_p || 0.9
      },
      routingDecision.classification?.type || 'general',
      options.session_id || generateSessionId()
    );

    const totalTime = Date.now() - startTime;

    // Log performance data for analytics
    try {
      await logPerformanceData({
        routingDecision,
        response,
        totalTime,
        selectedModel,
        prompt,
        options
      });
    } catch (logError) {
      console.warn('Failed to log performance data:', logError.message);
    }

    // Broadcast to WebSocket clients if available
    broadcastToClients({
      type: 'prompt_processed',
      data: {
        routingDecision,
        response,
        totalTime,
        timestamp: new Date().toISOString()
      }
    });

    res.json({
      success: !response.error,
      routingDecision,
      response,
      metadata: {
        totalTime,
        selectedModel,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error processing prompt:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/models
 * Get available models and their status
 */
app.get('/api/models', async (req, res) => {
  try {
    const availableModels = modelInterface.getAvailableModels();
    
    // Add model metadata
    const modelsWithStatus = {
      local: availableModels.local.map(model => ({
        name: model,
        type: 'local',
        status: 'available', // Could check actual availability
        description: getModelDescription(model)
      })),
      cloud: availableModels.cloud.map(model => ({
        name: model,
        type: 'cloud',
        status: 'available',
        description: getModelDescription(model)
      }))
    };

    res.json({
      models: modelsWithStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting models:', error);
    res.status(500).json({
      error: 'Failed to get models',
      message: error.message
    });
  }
});

/**
 * GET /api/character-sheet
 * Get character sheet preferences
 */
app.get('/api/character-sheet', async (req, res) => {
  try {
    const characterSheet = await smartRouter.characterSheet || {};
    
    res.json({
      characterSheet: sanitizeCharacterSheet(characterSheet),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting character sheet:', error);
    res.status(500).json({
      error: 'Failed to get character sheet',
      message: error.message
    });
  }
});

/**
 * PUT /api/character-sheet
 * Update character sheet preferences
 */
app.put('/api/character-sheet', async (req, res) => {
  try {
    const { preferences } = req.body;
    
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({
        error: 'Invalid preferences',
        message: 'Preferences must be an object'
      });
    }

    // Update character sheet (this would normally save to database)
    // For now, we'll just acknowledge the update
    console.log('Character sheet update requested:', preferences);

    res.json({
      success: true,
      message: 'Character sheet preferences updated',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating character sheet:', error);
    res.status(500).json({
      error: 'Failed to update character sheet',
      message: error.message
    });
  }
});

/**
 * GET /api/performance (Legacy endpoint for backward compatibility)
 * Get performance metrics and insights
 */
app.get('/api/performance', async (req, res) => {
  try {
    const { timeframe = '24h', task_type } = req.query;
    
    // Get performance insights from smart router
    const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 24;
    const insights = await smartRouter.performanceLogger.getPerformanceInsights(
      task_type || 'all',
      hours
    );

    res.json({
      insights,
      timeframe,
      task_type: task_type || 'all',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting performance metrics:', error);
    res.status(500).json({
      error: 'Failed to get performance metrics',
      message: error.message
    });
  }
});

// WebSocket handling for real-time updates
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('WebSocket message received:', data);
      
      // Handle different message types
      switch (data.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;
        case 'subscribe':
          ws.subscriptions = data.channels || [];
          break;
        default:
          console.log('Unknown WebSocket message type:', data.type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Connected to The Steward API',
    timestamp: new Date().toISOString()
  }));
});

// Utility functions

/**
 * Log performance data for analytics
 */
async function logPerformanceData(data) {
  try {
    const { routingDecision, response, totalTime, selectedModel, prompt, options } = data;
    
    // Log to smart router's performance logger
    await smartRouter.logPerformance(routingDecision, {
      response_time: totalTime,
      success: !response.error,
      model_used: selectedModel,
      tokens_used: response.metadata?.tokens || 0,
      error_type: response.error ? 'model_error' : null,
      error_message: response.error || null
    });
    
  } catch (error) {
    console.warn('Performance logging failed:', error.message);
  }
}

/**
 * Map smart routing model name to ModelInterface model name
 */
function mapModelName(smartRoutingModel) {
  const modelNameMapping = {
    'smollm3': 'ai/smollm3:latest',
    'smollm3-1.7b': 'ai/smollm3:latest',
    'smollm3-8b': 'ai/smollm3:latest',
    'llama': 'llama',
    'mistral': 'mistral',
    'codellama': 'codellama',
    'gpt-4': 'gpt-4',
    'gpt-4o': 'gpt-4o',
    'claude-3.5-sonnet': 'claude-3.5-sonnet'
  };
  
  return modelNameMapping[smartRoutingModel] || smartRoutingModel || 'ai/smollm3:latest';
}

/**
 * Get user-friendly model description
 */
function getModelDescription(modelName) {
  const descriptions = {
    'ai/smollm3:latest': 'Fast local model for general tasks',
    'llama': 'General purpose local model',
    'mistral': 'Efficient local model',
    'codellama': 'Code-specialized model',
    'gpt-4': 'Advanced cloud model',
    'gpt-4o': 'Optimized GPT-4 model',
    'claude-3.5-sonnet': 'Advanced reasoning model'
  };
  
  return descriptions[modelName] || 'AI model';
}

/**
 * Generate session ID
 */
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sanitize character sheet for frontend consumption
 */
function sanitizeCharacterSheet(characterSheet) {
  // Remove sensitive information if any
  const sanitized = { ...characterSheet };
  delete sanitized.api_keys;
  delete sanitized.private_settings;
  return sanitized;
}

/**
 * Broadcast message to all connected WebSocket clients
 */
function broadcastToClients(message) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Error handling
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 The Steward Backend API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 Analytics: http://localhost:${PORT}/api/analytics/*`);
  console.log(`🤖 Ambient Intelligence: http://localhost:${PORT}/api/ambient/*`);
  console.log(`🌐 CORS enabled for: ${FRONTEND_URL}`);
  console.log(`⚡ WebSocket server ready for real-time updates`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = { app, server };