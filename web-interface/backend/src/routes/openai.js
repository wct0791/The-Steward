// OpenAI-Compatible API Routes for The Steward
// Allows Open WebUI and other OpenAI-compatible clients to connect to The Steward

const express = require('express');
const router = express.Router();

// We'll need these from the main server
let smartRouter, modelInterface;

// Initialize with references from main server
function initializeOpenAIRoutes(sr, mi) {
  smartRouter = sr;
  modelInterface = mi;
}

/**
 * OpenAI Models List Endpoint
 * GET /v1/models
 */
router.get('/models', async (req, res) => {
  try {
    // Return The Steward as a single "model" that handles all routing
    const models = {
      object: 'list',
      data: [
        {
          id: 'the-steward',
          object: 'model',
          created: Date.now(),
          owned_by: 'the-steward',
          permission: [],
          root: 'the-steward',
          parent: null
        },
        {
          id: 'the-steward-fast',
          object: 'model', 
          created: Date.now(),
          owned_by: 'the-steward',
          permission: [],
          root: 'the-steward-fast',
          parent: null
        },
        {
          id: 'the-steward-creative',
          object: 'model',
          created: Date.now(),
          owned_by: 'the-steward', 
          permission: [],
          root: 'the-steward-creative',
          parent: null
        },
        {
          id: 'the-steward-analytical',
          object: 'model',
          created: Date.now(),
          owned_by: 'the-steward',
          permission: [],
          root: 'the-steward-analytical', 
          parent: null
        }
      ]
    };
    
    res.json(models);
  } catch (error) {
    console.error('Error in /v1/models:', error);
    res.status(500).json({
      error: {
        message: 'Failed to retrieve models',
        type: 'internal_error',
        code: 'models_error'
      }
    });
  }
});

/**
 * OpenAI Chat Completions Endpoint  
 * POST /v1/chat/completions
 */
router.post('/chat/completions', async (req, res) => {
  try {
    const { 
      model = 'the-steward',
      messages = [],
      temperature = 0.7,
      max_tokens = 1500,
      top_p = 0.9,
      stream = false,
      ...otherParams 
    } = req.body;

    // Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: {
          message: 'Messages array is required and must not be empty',
          type: 'invalid_request_error',
          code: 'missing_messages'
        }
      });
    }

    // Extract the user's prompt from messages
    const prompt = extractPromptFromMessages(messages);
    
    // Determine routing preferences based on selected "model"
    const routingHints = getRoutingHints(model);
    
    const startTime = Date.now();
    
    // Make smart routing decision with hints
    let routingDecision;
    try {
      if (!smartRouter) {
        throw new Error('Smart router not initialized');
      }
      routingDecision = await smartRouter.makeSmartRoutingDecision(prompt, {
        ...routingHints,
        temperature,
        max_tokens,
        top_p,
        session_id: generateSessionId(),
        openai_compatible: true,
        original_model_request: model
      });
    } catch (routingError) {
      console.warn('Smart routing failed, using fallback:', routingError.message);
      console.warn('Full routing error:', routingError);
      // Fallback routing decision
      routingDecision = {
        selection: { model: 'ai/smollm3:latest', confidence: 0.5 },
        classification: { type: 'general' },
        reasoning: 'Fallback due to routing error'
      };
    }
    
    // Validate routing decision structure
    if (!routingDecision || !routingDecision.selection || !routingDecision.selection.model) {
      console.error('Invalid routing decision structure:', routingDecision);
      routingDecision = {
        selection: { 
          model: 'ai/smollm3:latest', 
          confidence: 0.3,
          reason: 'Emergency fallback - invalid routing decision structure'
        },
        classification: { type: 'general' },
        reasoning: 'Emergency fallback due to malformed routing decision'
      };
    }
    
    // Map model name for ModelInterface
    const selectedModel = mapModelName(routingDecision.selection.model);
    
    // Send request to model
    let response;
    try {
      if (!modelInterface) {
        throw new Error('Model interface not initialized');
      }
      response = await modelInterface.sendRequest(
        selectedModel,
        prompt,
        {
          max_tokens,
          temperature,
          top_p,
          ...otherParams
        },
        routingDecision.classification?.type || 'general',
        generateSessionId()
      );
    } catch (modelError) {
      console.warn('Model request failed, using fallback response:', modelError.message);
      // Fallback response
      response = {
        content: `I apologize, but I'm experiencing technical difficulties. The Steward's routing system is temporarily unavailable. Please try again in a moment.`,
        error: false,
        metadata: {
          model: selectedModel,
          fallback: true,
          error_reason: modelError.message
        }
      };
    }

    const totalTime = Date.now() - startTime;

    // Log performance data
    try {
      await logPerformanceData({
        routingDecision,
        response,
        totalTime,
        selectedModel,
        prompt,
        options: { temperature, max_tokens, top_p }
      });
    } catch (logError) {
      console.warn('Failed to log performance data:', logError.message);
    }

    // Handle streaming vs non-streaming response
    if (stream) {
      return handleStreamingResponse(res, response, routingDecision);
    } else {
      return handleNonStreamingResponse(res, response, routingDecision, model);
    }

  } catch (error) {
    console.error('Error in /v1/chat/completions:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Internal server error',
        type: 'internal_error',
        code: 'completion_error'
      }
    });
  }
});

/**
 * OpenAI-style Feedback Endpoint (Custom)
 * POST /v1/feedback
 * Receives ratings from Open WebUI to improve routing
 */
router.post('/feedback', async (req, res) => {
  try {
    const {
      message_id,
      rating,
      feedback_type = 'rating', // 'rating', 'thumbs', 'detailed'
      response_id,
      conversation_id,
      user_feedback,
      ...metadata
    } = req.body;

    console.log('📊 Feedback received from Open WebUI:', {
      message_id,
      rating,
      feedback_type,
      timestamp: new Date().toISOString()
    });

    // Extract The Steward metadata from the original response
    // This would contain routing decision info
    const stewardMetadata = metadata.steward_metadata;
    
    if (stewardMetadata) {
      // Create feedback entry for analytics
      const feedbackData = {
        timestamp: new Date().toISOString(),
        message_id,
        conversation_id,
        rating,
        feedback_type,
        user_feedback,
        
        // The Steward routing information
        routing_decision: stewardMetadata.routing_decision,
        selected_model: stewardMetadata.selected_model,
        task_classification: stewardMetadata.task_classification,
        confidence: stewardMetadata.confidence,
        response_time: stewardMetadata.response_time,
        
        // Analysis for learning
        routing_successful: rating >= 3, // Assuming 1-5 scale
        needs_route_adjustment: rating <= 2,
        preferred_model_hint: extractModelPreference(rating, stewardMetadata)
      };
      
      // Log to The Steward's performance analytics
      if (smartRouter && smartRouter.logFeedback) {
        await smartRouter.logFeedback(feedbackData);
      }
      
      // Also log to dedicated feedback file
      logFeedbackToFile(feedbackData);
      
      console.log('✅ Feedback processed and logged for routing improvement');
    } else {
      console.log('⚠️  No Steward metadata found in feedback - may be from different model');
    }

    // Standard OpenAI-style success response
    res.json({
      success: true,
      message: 'Feedback received',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing feedback:', error);
    res.status(500).json({
      error: {
        message: 'Failed to process feedback',
        type: 'feedback_error',
        code: 'processing_failed'
      }
    });
  }
});
router.post('/completions', async (req, res) => {
  try {
    const { 
      model = 'the-steward',
      prompt = '',
      temperature = 0.7,
      max_tokens = 1500,
      top_p = 0.9,
      stream = false
    } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: {
          message: 'Prompt is required',
          type: 'invalid_request_error',
          code: 'missing_prompt'
        }
      });
    }

    // Convert to chat completion format internally
    const messages = [{ role: 'user', content: prompt }];
    
    // Reuse chat completions logic
    req.body.messages = messages;
    return router.handle({ ...req, url: '/chat/completions', path: '/chat/completions' }, res);

  } catch (error) {
    console.error('Error in /v1/completions:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Internal server error',
        type: 'internal_error',
        code: 'completion_error'
      }
    });
  }
});

// Utility Functions

/**
 * Extract prompt from OpenAI messages format
 */
function extractPromptFromMessages(messages) {
  // Simple approach: concatenate all user messages
  const userMessages = messages
    .filter(msg => msg.role === 'user')
    .map(msg => msg.content)
    .join('\n\n');
  
  // Include system messages as context
  const systemMessages = messages
    .filter(msg => msg.role === 'system')
    .map(msg => msg.content)
    .join('\n\n');
    
  if (systemMessages) {
    return `${systemMessages}\n\n${userMessages}`;
  }
  
  return userMessages;
}

/**
 * Get routing hints based on the selected "model"
 */
function getRoutingHints(model) {
  const hints = {
    'the-steward': {
      // Default smart routing, no specific hints
    },
    'the-steward-fast': {
      preference_hint: 'speed',
      max_response_time: 5000,
      model_preference: 'local'
    },
    'the-steward-creative': {
      preference_hint: 'creativity',
      task_type_hint: 'creative',
      temperature_boost: 0.2
    },
    'the-steward-analytical': {
      preference_hint: 'analysis', 
      task_type_hint: 'analytical',
      reasoning_preference: true
    }
  };
  
  return hints[model] || hints['the-steward'];
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
 * Handle non-streaming response
 */
function handleNonStreamingResponse(res, response, routingDecision, requestedModel) {
  const openaiResponse = {
    id: `chatcmpl-${generateId()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: requestedModel,
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: response.content || response.text || 'No response generated'
        },
        finish_reason: response.error ? 'stop' : 'stop'
      }
    ],
    usage: {
      prompt_tokens: response.metadata?.prompt_tokens || estimateTokens(routingDecision.originalPrompt || ''),
      completion_tokens: response.metadata?.completion_tokens || estimateTokens(response.content || ''),
      total_tokens: (response.metadata?.prompt_tokens || 0) + (response.metadata?.completion_tokens || 0)
    },
    // The Steward specific metadata (for debugging)
    steward_metadata: {
      routing_decision: routingDecision,
      selected_model: response.metadata?.model || 'unknown',
      response_time: response.metadata?.response_time || 0,
      task_classification: routingDecision.classification?.type,
      confidence: routingDecision.selection?.confidence
    }
  };

  res.json(openaiResponse);
}

/**
 * Handle streaming response (simplified for now)
 */
function handleStreamingResponse(res, response, routingDecision) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // For now, send the complete response as a single chunk
  // TODO: Implement proper streaming when underlying models support it
  const streamChunk = {
    id: `chatcmpl-${generateId()}`,
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model: 'the-steward',
    choices: [
      {
        index: 0,
        delta: {
          content: response.content || response.text || ''
        },
        finish_reason: 'stop'
      }
    ]
  };

  res.write(`data: ${JSON.stringify(streamChunk)}\n\n`);
  res.write('data: [DONE]\n\n');
  res.end();
}

/**
 * Generate unique ID for responses
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Generate session ID
 */
function generateSessionId() {
  return `openai_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Estimate token count (rough approximation)
 */
function estimateTokens(text) {
  if (!text) return 0;
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

/**
 * Log performance data for analytics
 */
async function logPerformanceData(data) {
  try {
    const { routingDecision, response, totalTime, selectedModel, prompt, options } = data;
    
    // Log to smart router's performance logger if available
    if (smartRouter && smartRouter.logPerformance) {
      await smartRouter.logPerformance(routingDecision, {
        response_time: totalTime,
        success: !response.error,
        model_used: selectedModel,
        tokens_used: response.metadata?.tokens || 0,
        error_type: response.error ? 'model_error' : null,
        error_message: response.error || null,
        interface: 'openai_compatible'
      });
    }
    
  } catch (error) {
    console.warn('Performance logging failed:', error.message);
  }
}

/**
 * Log feedback data for routing improvement
 */
function logFeedbackToFile(feedbackData) {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Create feedback log file path
    const feedbackLogPath = path.join(__dirname, '../../../logs/feedback.jsonl');
    
    // Ensure logs directory exists
    const logsDir = path.dirname(feedbackLogPath);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Append feedback as JSONL
    fs.appendFileSync(feedbackLogPath, JSON.stringify(feedbackData) + '\n');
    
  } catch (error) {
    console.warn('Failed to log feedback to file:', error.message);
  }
}

/**
 * Extract model preference hints from rating and metadata
 */
function extractModelPreference(rating, stewardMetadata) {
  const { selected_model, task_classification, confidence } = stewardMetadata;
  
  if (rating >= 4) {
    // High rating - this routing worked well
    return {
      preference: 'positive',
      successful_pairing: {
        task_type: task_classification,
        model: selected_model,
        confidence_threshold: confidence
      }
    };
  } else if (rating <= 2) {
    // Low rating - this routing needs improvement
    return {
      preference: 'negative',
      failed_pairing: {
        task_type: task_classification,
        model: selected_model,
        suggest_alternative: true
      }
    };
  } else {
    // Neutral rating
    return {
      preference: 'neutral',
      acceptable_pairing: {
        task_type: task_classification,
        model: selected_model
      }
    };
  }
}

module.exports = { router, initializeOpenAIRoutes };
