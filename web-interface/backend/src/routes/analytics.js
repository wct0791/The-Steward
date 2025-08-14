// The Steward Analytics API Routes
// Enhanced analytics endpoints for performance monitoring and learning insights (Mock Data Version)

const express = require('express');
const router = express.Router();
const { getMemoryInsights, recordRoutingFeedback } = require('../../../src/core/routing-engine');
const SemanticMemoryImporter = require('../../../src/memory/SemanticMemoryImporter');
const ProjectMemoryManager = require('../../../src/memory/ProjectMemoryManager');

// Mock data generator for testing the analytics dashboard
const generateMockData = () => {
  const now = new Date();
  return {
    real_time_feed: Array.from({length: 15}, (_, i) => ({
      id: i + 1,
      timestamp: new Date(now - i * 60000).toISOString(),
      task_type: ['reasoning', 'creative', 'coding', 'analysis'][i % 4],
      chosen_model: ['gpt-4o', 'claude-3-5-sonnet', 'smollm3', 'uncensored'][i % 4],
      routing_reason: 'Optimal for task complexity and current cognitive load',
      confidence_score: 0.75 + Math.random() * 0.25,
      response_time_ms: 800 + Math.random() * 2400,
      success: Math.random() > 0.1,
      uncensored: i % 4 === 0,
      satisfaction_rating: 3 + Math.random() * 2,
      quality_score: 0.8 + Math.random() * 0.2
    })),
    performance_trends: Array.from({length: 30}, (_, i) => ({
      date: new Date(now - i * 24 * 60 * 60 * 1000).toISOString(),
      routing_accuracy: 0.82 + Math.random() * 0.15,
      user_satisfaction: 0.88 + Math.random() * 0.12,
      avg_response_time: 1200 + Math.random() * 800,
      cognitive_load: 2.2 + Math.random() * 1.6,
      context_switches: Math.floor(Math.random() * 6),
      accuracy_upper: 0.95 + Math.random() * 0.05,
      accuracy_lower: 0.70 + Math.random() * 0.10
    })),
    cognitive_patterns: Array.from({length: 24}, (_, hour) => ({
      hour,
      cognitive_load: 2 + Math.sin((hour - 6) * Math.PI / 12) + Math.random() * 0.8,
      context_switches: Math.floor(1 + Math.random() * 4),
      hyperfocus_detected: (hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16),
      request_count: Math.floor(3 + Math.random() * 12),
      task_complexity: 2 + Math.random() * 2
    })),
    adhd_accommodations: [
      {
        type: 'Fast Local Routing',
        description: 'Prefers local models during high distraction periods',
        effectiveness: 0.89,
        trend: 'improving',
        usage_count: 45
      },
      {
        type: 'Hyperfocus Detection',
        description: 'Routes complex tasks during detected hyperfocus sessions',
        effectiveness: 0.94,
        trend: 'improving',
        usage_count: 23
      },
      {
        type: 'Context Switch Management',
        description: 'Limits concurrent tasks to optimal 3-4 items',
        effectiveness: 0.82,
        trend: 'stable',
        usage_count: 67
      },
      {
        type: 'Distraction Mitigation',
        description: 'Switches to faster models during high cognitive load',
        effectiveness: 0.76,
        trend: 'improving',
        usage_count: 34
      }
    ],
    model_comparison: [
      {
        model: 'claude-3-5-sonnet',
        avg_response_time: 2100,
        user_satisfaction: 0.93,
        usage_count: 156,
        success_rate: 0.96
      },
      {
        model: 'gpt-4o',
        avg_response_time: 1800,
        user_satisfaction: 0.91,
        usage_count: 142,
        success_rate: 0.94
      },
      {
        model: 'smollm3',
        avg_response_time: 450,
        user_satisfaction: 0.78,
        usage_count: 89,
        success_rate: 0.88
      },
      {
        model: 'uncensored',
        avg_response_time: 2300,
        user_satisfaction: 0.85,
        usage_count: 67,
        success_rate: 0.91
      }
    ],
    insights: [
      {
        type: 'routing_optimization',
        message: 'You perform 18% better with Claude models during morning hours (9-11 AM)',
        actionable: true,
        confidence: 0.87
      },
      {
        type: 'cognitive_pattern',
        message: 'Your hyperfocus sessions average 2.3 hours with 94% higher task completion',
        actionable: false,
        confidence: 0.92
      },
      {
        type: 'model_preference',
        message: 'SmolLM3 shows optimal performance for your coding tasks under 500 tokens',
        actionable: true,
        confidence: 0.81
      }
    ],
    optimization_insights: [
      {
        title: 'Morning Cognitive Peak Optimization',
        description: 'Route complex reasoning tasks to Claude-3.5-Sonnet between 9-11 AM for 18% performance boost',
        priority: 'high',
        impact_estimate: 18,
        confidence: 87,
        actionable: true,
        affected_models: ['claude-3-5-sonnet']
      },
      {
        title: 'Fast Local Model Preference',
        description: 'Use SmolLM3 for simple tasks when cognitive load > 3.5 to reduce decision fatigue',
        priority: 'medium',
        impact_estimate: 12,
        confidence: 74,
        actionable: true,
        affected_models: ['smollm3']
      }
    ]
  };
};

// Real-time feed endpoint
router.get('/real-time-feed', (req, res) => {
  try {
    const { limit = 20, filter_uncensored } = req.query;
    const mockData = generateMockData();
    
    let decisions = [...mockData.real_time_feed];
    
    // Apply filtering
    if (filter_uncensored === 'true') {
      decisions = decisions.filter(d => d.uncensored);
    } else if (filter_uncensored === 'false') {
      decisions = decisions.filter(d => !d.uncensored);
    }
    
    // Apply limit
    decisions = decisions.slice(0, parseInt(limit));
    
    // Calculate summary
    const totalDecisions = decisions.length;
    const avgConfidence = totalDecisions > 0 
      ? decisions.reduce((sum, d) => sum + d.confidence_score, 0) / totalDecisions 
      : 0;
    const uncensoredRatio = totalDecisions > 0 
      ? decisions.filter(d => d.uncensored).length / totalDecisions 
      : 0;
    const avgResponseTime = totalDecisions > 0 
      ? decisions.reduce((sum, d) => sum + d.response_time_ms, 0) / totalDecisions 
      : 0;
        
    res.json({
      success: true,
      data: decisions,
      summary: {
        total_decisions: totalDecisions,
        avg_confidence: avgConfidence,
        uncensored_ratio: uncensoredRatio,
        avg_response_time: avgResponseTime
      }
    });
  } catch (error) {
    console.error('Error fetching real-time feed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch real-time analytics feed'
    });
  }
});

// Performance trends endpoint
router.get('/performance-trends', (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    const mockData = generateMockData();
    
    res.json({
      success: true,
      trends: mockData.performance_trends,
      optimization_insights: mockData.optimization_insights
    });
  } catch (error) {
    console.error('Error fetching performance trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance trends'
    });
  }
});

// Model comparison endpoint
router.get('/model-comparison', (req, res) => {
  try {
    const { timeframe = '7d', models } = req.query;
    const mockData = generateMockData();
    
    let modelData = mockData.model_comparison;
    
    // Filter by specific models if requested
    if (models && Array.isArray(models)) {
      modelData = modelData.filter(m => models.includes(m.model));
    }
    
    res.json({
      success: true,
      models: modelData
    });
  } catch (error) {
    console.error('Error fetching model comparison:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch model comparison data'
    });
  }
});

// Enhanced cognitive patterns endpoint
router.get('/cognitive-patterns-enhanced', (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    const mockData = generateMockData();
    
    res.json({
      success: true,
      cognitive_patterns: mockData.cognitive_patterns,
      adhd_accommodations: mockData.adhd_accommodations,
      insights: mockData.insights
    });
  } catch (error) {
    console.error('Error fetching cognitive patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cognitive patterns'
    });
  }
});

// ADHD accommodations endpoint
router.get('/adhd-accommodations', (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    const mockData = generateMockData();
    
    res.json({
      success: true,
      accommodations: mockData.adhd_accommodations
    });
  } catch (error) {
    console.error('Error fetching ADHD accommodations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ADHD accommodations'
    });
  }
});

// Cognitive load reporting endpoint
router.post('/cognitive-load-report', (req, res) => {
  try {
    const { performance_id, cognitive_load, timestamp } = req.body;
    
    console.log(`Cognitive load reported: ${cognitive_load}/5 for session ${performance_id} at ${timestamp}`);
    
    res.json({
      success: true,
      message: 'Cognitive load report received and will be used to optimize future routing decisions'
    });
  } catch (error) {
    console.error('Error processing cognitive load report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process cognitive load report'
    });
  }
});

// Learning insights endpoints
router.get('/learning/character-sheet-suggestions', (req, res) => {
  try {
    const suggestions = [
      {
        id: 'suggest_1',
        current: 'Prefers detailed explanations',
        suggested: 'Prefers concise, actionable summaries',
        reasoning: 'You consistently rate shorter responses higher and request "summarize" 23% more often',
        confidence: 0.84
      },
      {
        id: 'suggest_2', 
        current: 'Works best in afternoon',
        suggested: 'Peak performance 9-11 AM, secondary peak 2-4 PM',
        reasoning: 'Your task completion rate is 31% higher during morning hyperfocus sessions',
        confidence: 0.91
      }
    ];
    
    res.json({
      success: true,
      data: { suggestions }
    });
  } catch (error) {
    console.error('Error fetching learning suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch learning suggestions'
    });
  }
});

router.post('/learning/accept-suggestion', (req, res) => {
  try {
    const { suggestionId } = req.body;
    console.log(`Suggestion ${suggestionId} accepted by user`);
    
    res.json({
      success: true,
      message: 'Suggestion accepted and character sheet updated'
    });
  } catch (error) {
    console.error('Error accepting suggestion:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept suggestion'
    });
  }
});

router.post('/learning/reject-suggestion', (req, res) => {
  try {
    const { suggestionId, reason } = req.body;
    console.log(`Suggestion ${suggestionId} rejected: ${reason}`);
    
    res.json({
      success: true,
      message: 'Suggestion rejected and feedback recorded'
    });
  } catch (error) {
    console.error('Error rejecting suggestion:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject suggestion'
    });
  }
});

// Feedback submission endpoint
router.post('/feedback', (req, res) => {
  try {
    const feedback = req.body;
    console.log('Feedback received:', feedback);
    
    res.json({
      success: true,
      message: 'Feedback submitted successfully and will improve future routing decisions'
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback'
    });
  }
});

// Memory System API Endpoints

// Get project context from current task input
router.post('/memory/project-context', async (req, res) => {
  try {
    const { taskInput } = req.body;
    
    if (!taskInput) {
      return res.status(400).json({
        success: false,
        error: 'Task input is required'
      });
    }

    const memoryInsights = await getMemoryInsights();
    
    // Mock project context detection (would be replaced with actual implementation)
    const projectContext = {
      project: 'steward-development',
      confidence: 0.85,
      context_type: 'technical-development',
      keywords_matched: 3
    };

    res.json({
      success: true,
      data: {
        project_context: projectContext,
        memory_available: memoryInsights?.available || false,
        recommendations: memoryInsights?.available ? 
          memoryInsights.project_insights?.[projectContext.project] : null
      }
    });
  } catch (error) {
    console.error('Error detecting project context:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect project context'
    });
  }
});

// Get routing history for current context
router.get('/memory/routing-history/:projectContext', async (req, res) => {
  try {
    const { projectContext } = req.params;
    const { limit = 20 } = req.query;

    const memoryManager = new ProjectMemoryManager();
    await memoryManager.initialize();

    const recommendations = await memoryManager.getRoutingRecommendations(projectContext, 'general');
    const projectInsights = await memoryManager.getProjectInsights(projectContext);

    await memoryManager.close();

    res.json({
      success: true,
      data: {
        project_context: projectContext,
        recommendations: recommendations.slice(0, parseInt(limit)),
        project_insights: projectInsights,
        historical_patterns: true
      }
    });
  } catch (error) {
    console.error('Error fetching routing history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch routing history',
      details: error.message
    });
  }
});

// Get pattern analysis for memory system
router.get('/memory/pattern-analysis', async (req, res) => {
  try {
    const memoryInsights = await getMemoryInsights();

    if (!memoryInsights.available) {
      return res.json({
        success: true,
        data: {
          available: false,
          reason: memoryInsights.reason
        }
      });
    }

    res.json({
      success: true,
      data: {
        available: true,
        context_switching: memoryInsights.context_switching,
        cross_session_learning: memoryInsights.cross_session_learning,
        project_insights: memoryInsights.project_insights,
        memory_status: memoryInsights.memory_status
      }
    });
  } catch (error) {
    console.error('Error fetching pattern analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pattern analysis',
      details: error.message
    });
  }
});

// Get memory-informed routing suggestions
router.post('/memory/context-suggestions', async (req, res) => {
  try {
    const { taskInput, projectContext, cognitiveCapacity = 'medium' } = req.body;

    if (!taskInput) {
      return res.status(400).json({
        success: false,
        error: 'Task input is required'
      });
    }

    const memoryInsights = await getMemoryInsights();

    if (!memoryInsights.available) {
      return res.json({
        success: true,
        data: {
          memory_available: false,
          fallback_suggestions: [
            { model: 'smollm3', confidence: 0.6, reason: 'Fallback - fast local model' }
          ]
        }
      });
    }

    // Mock context-aware suggestions (would use ContextEngine in real implementation)
    const suggestions = [
      {
        model: 'claude',
        confidence: 0.9,
        reason: 'Historical success pattern for Steward development tasks',
        source: 'project_pattern',
        historical_uses: 45,
        success_rate: 0.87
      },
      {
        model: 'smollm3',
        confidence: 0.7,
        reason: 'ADHD accommodation - simplified routing detected',
        source: 'context_switching',
        accommodation_type: 'simplified_routing'
      }
    ];

    res.json({
      success: true,
      data: {
        memory_available: true,
        project_context: projectContext || 'steward-development',
        cognitive_capacity: cognitiveCapacity,
        suggestions: suggestions,
        context_analysis: memoryInsights.context_switching
      }
    });
  } catch (error) {
    console.error('Error generating context suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate context suggestions',
      details: error.message
    });
  }
});

// Record routing decision for learning
router.post('/memory/record-decision', async (req, res) => {
  try {
    const { 
      projectContext, 
      taskInput, 
      taskType, 
      selectedModel, 
      confidence, 
      userFeedback 
    } = req.body;

    if (!projectContext || !selectedModel) {
      return res.status(400).json({
        success: false,
        error: 'Project context and selected model are required'
      });
    }

    const memoryManager = new ProjectMemoryManager();
    await memoryManager.initialize();

    await memoryManager.recordRoutingDecision(
      projectContext,
      taskInput || 'Unknown task',
      taskType || 'general',
      selectedModel,
      confidence || 0.5,
      userFeedback
    );

    await memoryManager.close();

    res.json({
      success: true,
      message: 'Routing decision recorded for future learning'
    });
  } catch (error) {
    console.error('Error recording routing decision:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record routing decision',
      details: error.message
    });
  }
});

// Update routing pattern with feedback
router.post('/memory/update-pattern', async (req, res) => {
  try {
    const { projectContext, model, success, performanceScore, feedback } = req.body;

    if (!projectContext || !model || typeof success !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Project context, model, and success flag are required'
      });
    }

    const memoryManager = new ProjectMemoryManager();
    await memoryManager.initialize();

    await memoryManager.updateRoutingPattern(
      projectContext,
      model,
      success,
      performanceScore
    );

    await memoryManager.close();

    res.json({
      success: true,
      message: `Routing pattern updated: ${model} in ${projectContext} - ${success ? 'success' : 'failure'}`
    });
  } catch (error) {
    console.error('Error updating routing pattern:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update routing pattern',
      details: error.message
    });
  }
});

// Import semantic memory (one-time or refresh operation)
router.post('/memory/import-semantic', async (req, res) => {
  try {
    const { force_refresh = false } = req.body;

    const importer = new SemanticMemoryImporter();
    await importer.initialize();

    const importResults = await importer.importSemanticMemory();
    const statistics = await importer.getImportStatistics();

    await importer.close();

    res.json({
      success: true,
      message: 'Semantic memory import completed',
      data: {
        import_results: importResults,
        statistics: statistics,
        force_refresh: force_refresh
      }
    });
  } catch (error) {
    console.error('Error importing semantic memory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import semantic memory',
      details: error.message
    });
  }
});

// Search semantic memory
router.post('/memory/search', async (req, res) => {
  try {
    const { keywords, projectContext = null, limit = 10 } = req.body;

    if (!keywords) {
      return res.status(400).json({
        success: false,
        error: 'Search keywords are required'
      });
    }

    const importer = new SemanticMemoryImporter();
    await importer.initialize();

    const searchResults = await importer.searchMemory(keywords, projectContext, limit);

    await importer.close();

    res.json({
      success: true,
      data: {
        query: keywords,
        project_context: projectContext,
        results: searchResults,
        result_count: searchResults.length
      }
    });
  } catch (error) {
    console.error('Error searching semantic memory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search semantic memory',
      details: error.message
    });
  }
});

// Get memory system statistics
router.get('/memory/statistics', async (req, res) => {
  try {
    const memoryInsights = await getMemoryInsights();
    
    if (!memoryInsights.available) {
      return res.json({
        success: true,
        data: {
          available: false,
          reason: memoryInsights.reason
        }
      });
    }

    const importer = new SemanticMemoryImporter();
    await importer.initialize();
    const statistics = await importer.getImportStatistics();
    await importer.close();

    res.json({
      success: true,
      data: {
        available: true,
        memory_insights: memoryInsights,
        import_statistics: statistics,
        system_status: 'operational'
      }
    });
  } catch (error) {
    console.error('Error fetching memory statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch memory statistics',
      details: error.message
    });
  }
});

// Predictive Workflows API Endpoints

// Get workflow suggestions
router.post('/workflows/suggestions', async (req, res) => {
  try {
    const { taskInput, projectContext, currentProgress = [] } = req.body;

    if (!taskInput) {
      return res.status(400).json({
        success: false,
        error: 'Task input is required'
      });
    }

    // Mock workflow suggestions (would use TaskSequencePredictor in real implementation)
    const workflowSuggestions = [
      {
        workflow_id: `wf_${Date.now()}_1`,
        name: `${projectContext || 'Development'} Workflow`,
        project_context: projectContext || 'steward-development',
        completion_probability: 0.87,
        total_estimated_duration: 135, // minutes
        steps: [
          {
            phase: 'Planning',
            task_type: 'planning',
            estimated_duration: 25,
            cognitive_load: 'medium',
            confidence: 0.9,
            dependencies: [],
            optimal_timing: ['morning', 'early afternoon'],
            parallel_possible: false
          },
          {
            phase: 'Implementation',
            task_type: 'implementation',
            estimated_duration: 75,
            cognitive_load: 'high',
            confidence: 0.85,
            dependencies: ['planning'],
            optimal_timing: ['hyperfocus window'],
            parallel_possible: false
          },
          {
            phase: 'Testing',
            task_type: 'testing',
            estimated_duration: 20,
            cognitive_load: 'medium',
            confidence: 0.8,
            dependencies: ['implementation'],
            optimal_timing: ['afternoon'],
            parallel_possible: true
          },
          {
            phase: 'Documentation',
            task_type: 'documentation',
            estimated_duration: 15,
            cognitive_load: 'low',
            confidence: 0.75,
            dependencies: ['testing'],
            optimal_timing: ['any'],
            parallel_possible: true
          }
        ],
        cognitive_load_distribution: {
          high_load_percentage: 55,
          medium_load_percentage: 35,
          low_load_percentage: 10,
          cognitive_balance: 'Balanced'
        }
      },
      {
        workflow_id: `wf_${Date.now()}_2`,
        name: 'Rapid Prototype Workflow',
        project_context: projectContext || 'steward-development',
        completion_probability: 0.78,
        total_estimated_duration: 90, // minutes
        steps: [
          {
            phase: 'Quick Planning',
            task_type: 'planning',
            estimated_duration: 10,
            cognitive_load: 'low',
            confidence: 0.85,
            dependencies: [],
            optimal_timing: ['any'],
            parallel_possible: false
          },
          {
            phase: 'Implementation',
            task_type: 'implementation', 
            estimated_duration: 60,
            cognitive_load: 'high',
            confidence: 0.8,
            dependencies: ['planning'],
            optimal_timing: ['hyperfocus window'],
            parallel_possible: false
          },
          {
            phase: 'Quick Test',
            task_type: 'testing',
            estimated_duration: 20,
            cognitive_load: 'medium',
            confidence: 0.75,
            dependencies: ['implementation'],
            optimal_timing: ['afternoon'],
            parallel_possible: false
          }
        ],
        cognitive_load_distribution: {
          high_load_percentage: 67,
          medium_load_percentage: 22,
          low_load_percentage: 11,
          cognitive_balance: 'High Load'
        }
      }
    ];

    res.json({
      success: true,
      data: {
        task_input: taskInput,
        project_context: projectContext,
        suggestions: workflowSuggestions,
        suggestion_count: workflowSuggestions.length
      }
    });
  } catch (error) {
    console.error('Error generating workflow suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate workflow suggestions',
      details: error.message
    });
  }
});

// Create workflow from suggestion
router.post('/workflows/create', async (req, res) => {
  try {
    const { 
      taskInput, 
      projectContext, 
      workflowSuggestion,
      userModifications = {},
      executionStrategy = 'adaptive'
    } = req.body;

    if (!taskInput || !workflowSuggestion) {
      return res.status(400).json({
        success: false,
        error: 'Task input and workflow suggestion are required'
      });
    }

    const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Mock workflow creation (would use WorkflowOrchestrator in real implementation)
    const createdWorkflow = {
      id: workflowId,
      name: userModifications.name || workflowSuggestion.name,
      project_context: projectContext,
      original_task: taskInput,
      state: 'created',
      execution_strategy: executionStrategy,
      steps: workflowSuggestion.steps,
      created_at: new Date().toISOString(),
      estimated_duration: workflowSuggestion.total_estimated_duration,
      completion_probability: workflowSuggestion.completion_probability,
      cognitive_load_distribution: workflowSuggestion.cognitive_load_distribution
    };

    res.json({
      success: true,
      data: {
        workflow_id: workflowId,
        workflow: createdWorkflow,
        next_action: 'schedule_workflow'
      }
    });
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create workflow',
      details: error.message
    });
  }
});

// Schedule workflow execution
router.post('/workflows/schedule/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { startTime, schedulingOptions = {} } = req.body;

    // Mock workflow scheduling
    const scheduledWorkflow = {
      workflow_id: workflowId,
      scheduled_start: startTime || new Date().toISOString(),
      estimated_completion: new Date(Date.now() + (135 * 60 * 1000)).toISOString(), // 135 minutes from now
      scheduled_breaks: 2,
      state: 'scheduled'
    };

    res.json({
      success: true,
      data: scheduledWorkflow
    });
  } catch (error) {
    console.error('Error scheduling workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to schedule workflow',
      details: error.message
    });
  }
});

// Execute workflow
router.post('/workflows/execute/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { executionOptions = {} } = req.body;

    // Mock workflow execution
    const executionResult = {
      workflow_id: workflowId,
      execution_started: new Date().toISOString(),
      state: 'in_progress',
      current_step: 0,
      steps_completed: 0,
      estimated_remaining: 135 // minutes
    };

    res.json({
      success: true,
      data: executionResult
    });
  } catch (error) {
    console.error('Error executing workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute workflow',
      details: error.message
    });
  }
});

// Get workflow status
router.get('/workflows/status/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;

    // Mock workflow status
    const workflowStatus = {
      found: true,
      workflow_id: workflowId,
      state: 'in_progress',
      progress_percentage: 35,
      current_step: 1,
      total_steps: 4,
      completed_steps: 1,
      failed_steps: 0,
      estimated_remaining: 85,
      next_step: {
        phase: 'Implementation',
        estimated_duration: 75,
        cognitive_load: 'high'
      }
    };

    res.json({
      success: true,
      data: workflowStatus
    });
  } catch (error) {
    console.error('Error fetching workflow status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workflow status',
      details: error.message
    });
  }
});

// Get active workflows
router.get('/workflows/active', async (req, res) => {
  try {
    const activeWorkflows = {
      total_active: 2,
      by_state: {
        created: 0,
        scheduled: 1,
        in_progress: 1,
        paused: 0,
        completed: 0,
        cancelled: 0,
        failed: 0
      },
      by_project: {
        'steward-development': 2
      },
      execution_statistics: {
        average_success_rate: 0.87,
        average_duration_variance: 12, // minutes
        autonomous_routing_adoption: 0.45,
        total_workflows_completed: 23
      }
    };

    res.json({
      success: true,
      data: activeWorkflows
    });
  } catch (error) {
    console.error('Error fetching active workflows:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active workflows',
      details: error.message
    });
  }
});

// Cognitive load prediction endpoint
router.post('/cognitive/predict-capacity', async (req, res) => {
  try {
    const { targetTime, taskComplexity, currentContext = {} } = req.body;

    if (!targetTime || !taskComplexity) {
      return res.status(400).json({
        success: false,
        error: 'Target time and task complexity are required'
      });
    }

    // Mock cognitive capacity prediction
    const prediction = {
      predicted_capacity: 0.75,
      base_capacity: 0.8,
      time_of_day_factor: 1.1,
      complexity_factor: 0.9,
      switching_penalty: 0.15,
      adhd_adjustments: {
        capacity_modifier: 1.0,
        adjustments: [],
        adhd_accommodations_active: false
      },
      confidence: 0.82,
      recommendations: [
        {
          type: 'task_selection',
          message: 'Good capacity window - suitable for moderate to complex tasks',
          priority: 'medium'
        }
      ],
      optimal_window: [
        {
          start_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
          predicted_capacity: 0.85,
          capacity_match: 1.1,
          confidence: 0.88
        }
      ],
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    console.error('Error predicting cognitive capacity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to predict cognitive capacity',
      details: error.message
    });
  }
});

// Hyperfocus cycle prediction
router.post('/cognitive/predict-hyperfocus', async (req, res) => {
  try {
    const { currentTime, historicalData = [] } = req.body;

    const hyperfocusPrediction = {
      next_hyperfocus_window: {
        start_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
        estimated_duration: 120,
        probability: 0.78
      },
      typical_duration: 120,
      confidence: 0.82,
      preparation_time: 15,
      recommendations: [
        {
          type: 'preparation',
          message: 'Clear schedule and minimize interruptions during predicted hyperfocus window',
          timing: 'before'
        },
        {
          type: 'task_alignment',
          message: 'Schedule most challenging or creative tasks during hyperfocus period',
          timing: 'during'
        }
      ],
      historical_pattern: 'morning_peak'
    };

    res.json({
      success: true,
      data: hyperfocusPrediction
    });
  } catch (error) {
    console.error('Error predicting hyperfocus cycle:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to predict hyperfocus cycle',
      details: error.message
    });
  }
});

// Context switching cost analysis
router.post('/cognitive/context-switching-cost', async (req, res) => {
  try {
    const { fromContext, toContext, userProfile = {} } = req.body;

    if (!fromContext || !toContext) {
      return res.status(400).json({
        success: false,
        error: 'From and to contexts are required'
      });
    }

    const contextSwitchingAnalysis = {
      switching_cost: 0.22,
      recovery_time_minutes: 12,
      context_distance: 0.6,
      mitigation_strategies: [
        'Take 5-minute mental break before switching',
        'Use transition ritual (close tabs, organize workspace)',
        'Batch similar context tasks together'
      ],
      severity: 'moderate'
    };

    res.json({
      success: true,
      data: contextSwitchingAnalysis
    });
  } catch (error) {
    console.error('Error analyzing context switching cost:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze context switching cost',
      details: error.message
    });
  }
});

// Autonomous routing control endpoints
router.get('/autonomous/status', async (req, res) => {
  try {
    const autonomousStatus = {
      autopilot_enabled: false,
      confidence_threshold: 0.9,
      total_autonomous_decisions: 47,
      high_confidence_patterns: 12,
      recent_decisions: 8,
      override_rate: 0.15,
      success_rate: 0.89,
      patterns_by_project: {
        'steward-development': [
          {
            model: 'claude',
            confidence: 0.92,
            usage_count: 23,
            autonomous_enabled: true
          }
        ]
      },
      escalation_reasons: {
        low_confidence: 5,
        new_project_type: 2,
        context_switching_high: 3,
        user_disabled: 1
      }
    };

    res.json({
      success: true,
      data: autonomousStatus
    });
  } catch (error) {
    console.error('Error fetching autonomous status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch autonomous status',
      details: error.message
    });
  }
});

router.post('/autonomous/toggle', async (req, res) => {
  try {
    const { enabled, userPreferences = {} } = req.body;

    const result = {
      autopilot_enabled: enabled,
      confidence_threshold: 0.9,
      high_confidence_patterns: 12,
      message: enabled ? 
        'Autopilot mode enabled for high-confidence routing decisions' :
        'Autopilot mode disabled - all decisions require manual confirmation'
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error toggling autonomous routing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle autonomous routing',
      details: error.message
    });
  }
});

router.get('/autonomous/decision-history', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const mockDecisions = Array.from({ length: parseInt(limit) }, (_, i) => ({
      id: `auto_${Date.now()}_${i}`,
      timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
      project_context: 'steward-development',
      selected_model: ['claude', 'gpt-4', 'smollm3'][i % 3],
      autonomous_confidence: 0.85 + Math.random() * 0.1,
      user_reviewed: i > 5,
      user_feedback: i > 5 ? { success: true, rating: 4 } : null
    }));

    const history = {
      decisions: mockDecisions,
      total_autonomous_decisions: 47,
      autopilot_enabled: false,
      confidence_threshold: 0.9,
      high_confidence_patterns: 12,
      success_rate: 0.89
    };

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error fetching autonomous decision history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch autonomous decision history',
      details: error.message
    });
  }
});

router.post('/autonomous/feedback', async (req, res) => {
  try {
    const { decisionId, feedback } = req.body;

    if (!decisionId || !feedback) {
      return res.status(400).json({
        success: false,
        error: 'Decision ID and feedback are required'
      });
    }

    const result = {
      success: true,
      message: 'Autonomous routing feedback recorded',
      updated_pattern: true
    };

    res.json(result);
  } catch (error) {
    console.error('Error recording autonomous feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record autonomous feedback',
      details: error.message
    });
  }
});

router.post('/autonomous/override', async (req, res) => {
  try {
    const { decisionId, manualSelection } = req.body;

    if (!decisionId || !manualSelection) {
      return res.status(400).json({
        success: false,
        error: 'Decision ID and manual selection are required'
      });
    }

    const result = {
      success: true,
      message: 'Autonomous decision overridden',
      original_model: 'claude',
      new_model: manualSelection.model
    };

    res.json(result);
  } catch (error) {
    console.error('Error overriding autonomous decision:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to override autonomous decision',
      details: error.message
    });
  }
});

module.exports = router;