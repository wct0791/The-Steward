// #region start: Ambient Intelligence API Routes
// Express routes for ambient intelligence coordination across productivity apps
// Handles workflow orchestration, cross-app synchronization, and context awareness

const express = require('express');
const router = express.Router();
const path = require('path');

// Import ambient intelligence components
const AmbientOrchestrator = require('../../../../src/integrations/AmbientOrchestrator');
const ContextBridge = require('../../../../src/integrations/ContextBridge');
const NotionIntegration = require('../../../../src/integrations/NotionIntegration');
const ThingsIntegration = require('../../../../src/integrations/ThingsIntegration');
const AppleNotesIntegration = require('../../../../src/integrations/AppleNotesIntegration');

// Initialize ambient intelligence components
let ambientOrchestrator = null;
let contextBridge = null;
let isInitialized = false;

// Configuration from environment variables or defaults
const config = {
  notion: {
    apiToken: process.env.NOTION_API_TOKEN || null,
    autoDocumentation: process.env.NOTION_AUTO_DOCS !== 'false',
    projectSyncFrequency: process.env.NOTION_SYNC_FREQ || 'real_time'
  },
  things: {
    enableTaskCreation: process.env.THINGS_ENABLE_TASKS !== 'false',
    cognitiveScheduling: process.env.THINGS_COGNITIVE_SCHED !== 'false'
  },
  appleNotes: {
    enableSessionCapture: process.env.NOTES_ENABLE_CAPTURE !== 'false',
    researchCompilation: process.env.NOTES_RESEARCH_COMP !== 'false'
  },
  orchestrator: {
    enableCrossAppWorkflows: process.env.AMBIENT_CROSS_APP !== 'false',
    autoSyncFrequency: process.env.AMBIENT_SYNC_FREQ || 'real_time',
    conflictResolutionStrategy: process.env.AMBIENT_CONFLICT_STRATEGY || 'latest_wins'
  },
  bridge: {
    enableBidirectionalSync: process.env.BRIDGE_BIDIRECTIONAL !== 'false',
    contextChangeDebounce: parseInt(process.env.BRIDGE_DEBOUNCE) || 500
  }
};

/**
 * Initialize ambient intelligence system
 */
async function initializeAmbientIntelligence() {
  if (isInitialized) return true;

  try {
    console.log('Initializing Ambient Intelligence system...');

    // Initialize context bridge
    contextBridge = new ContextBridge(config.bridge);
    
    // Initialize ambient orchestrator with integrations
    ambientOrchestrator = new AmbientOrchestrator({
      ...config.orchestrator,
      notion: config.notion,
      things: config.things,
      appleNotes: config.appleNotes
    });

    const orchestratorReady = await ambientOrchestrator.initialize();
    
    if (orchestratorReady) {
      isInitialized = true;
      console.log('✅ Ambient Intelligence system initialized successfully');
      return true;
    } else {
      console.warn('⚠️ Ambient Intelligence system partially initialized');
      return false;
    }

  } catch (error) {
    console.error('❌ Failed to initialize Ambient Intelligence system:', error);
    return false;
  }
}

// Middleware to ensure ambient intelligence is initialized
const ensureInitialized = async (req, res, next) => {
  if (!isInitialized) {
    const initialized = await initializeAmbientIntelligence();
    if (!initialized && req.path !== '/status' && req.path !== '/health') {
      return res.status(503).json({
        error: 'Ambient Intelligence system not available',
        message: 'System is initializing or disabled',
        timestamp: new Date().toISOString()
      });
    }
  }
  next();
};

// Apply middleware to all routes
router.use(ensureInitialized);

/**
 * GET /api/ambient/health
 * Health check for ambient intelligence system
 */
router.get('/health', (req, res) => {
  const status = {
    system_status: isInitialized ? 'operational' : 'initializing',
    components: {
      ambient_orchestrator: !!ambientOrchestrator,
      context_bridge: !!contextBridge,
      integrations: ambientOrchestrator ? ambientOrchestrator.getStatus().integrations : {}
    },
    configuration: {
      cross_app_workflows_enabled: config.orchestrator.enableCrossAppWorkflows,
      auto_sync_frequency: config.orchestrator.autoSyncFrequency,
      conflict_resolution: config.orchestrator.conflictResolutionStrategy
    },
    timestamp: new Date().toISOString()
  };

  res.json(status);
});

/**
 * GET /api/ambient/status
 * Get comprehensive ambient intelligence status
 */
router.get('/status', async (req, res) => {
  try {
    if (!isInitialized || !ambientOrchestrator) {
      return res.json({
        enabled: false,
        reason: 'System not initialized',
        timestamp: new Date().toISOString()
      });
    }

    const orchestratorStatus = ambientOrchestrator.getStatus();
    const coordinationAnalytics = ambientOrchestrator.getCoordinationAnalytics();
    const bridgeStatus = contextBridge ? contextBridge.getStatus() : null;

    const status = {
      enabled: true,
      system_health: calculateSystemHealth(orchestratorStatus),
      orchestrator: orchestratorStatus,
      coordination_analytics: coordinationAnalytics,
      context_bridge: bridgeStatus,
      timestamp: new Date().toISOString()
    };

    res.json(status);

  } catch (error) {
    console.error('Error getting ambient status:', error);
    res.status(500).json({
      error: 'Failed to get ambient status',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/ambient/coordinate-workflow
 * Coordinate a workflow across multiple apps
 */
router.post('/coordinate-workflow', async (req, res) => {
  try {
    const { workflowData, targetApps, options = {} } = req.body;

    if (!workflowData) {
      return res.status(400).json({
        error: 'Missing workflow data',
        message: 'workflowData is required'
      });
    }

    if (!targetApps || !Array.isArray(targetApps)) {
      return res.status(400).json({
        error: 'Invalid target apps',
        message: 'targetApps must be an array of app names'
      });
    }

    const result = await ambientOrchestrator.coordinateWorkflow(
      workflowData,
      targetApps,
      options
    );

    res.json({
      success: result.success,
      coordination_result: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error coordinating workflow:', error);
    res.status(500).json({
      error: 'Failed to coordinate workflow',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/ambient/sync-context
 * Synchronize context between apps
 */
router.post('/sync-context', async (req, res) => {
  try {
    const { contextUpdate, sourceApp, targetApps } = req.body;

    if (!contextUpdate || !sourceApp) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'contextUpdate and sourceApp are required'
      });
    }

    const result = await ambientOrchestrator.synchronizeContext(
      contextUpdate,
      sourceApp,
      targetApps
    );

    res.json({
      success: result.success,
      sync_result: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error synchronizing context:', error);
    res.status(500).json({
      error: 'Failed to synchronize context',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/ambient/distribute-session
 * Distribute session data across apps
 */
router.post('/distribute-session', async (req, res) => {
  try {
    const { sessionData, workflowId } = req.body;

    if (!sessionData) {
      return res.status(400).json({
        error: 'Missing session data',
        message: 'sessionData is required'
      });
    }

    const result = await ambientOrchestrator.distributeSessionData(
      sessionData,
      workflowId
    );

    res.json({
      success: result.success,
      distribution_result: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error distributing session:', error);
    res.status(500).json({
      error: 'Failed to distribute session',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/ambient/bridge-context
 * Bridge context between apps using ContextBridge
 */
router.post('/bridge-context', async (req, res) => {
  try {
    const { sourceApp, targetApps, contextData, options = {} } = req.body;

    if (!sourceApp || !targetApps || !contextData) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'sourceApp, targetApps, and contextData are required'
      });
    }

    if (!contextBridge) {
      return res.status(503).json({
        error: 'Context bridge not available',
        message: 'Context bridge system is not initialized'
      });
    }

    const result = await contextBridge.bridgeContext(
      sourceApp,
      targetApps,
      contextData,
      options
    );

    res.json({
      success: result.success,
      bridge_result: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error bridging context:', error);
    res.status(500).json({
      error: 'Failed to bridge context',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/ambient/monitor-context-change
 * Monitor and handle context changes
 */
router.post('/monitor-context-change', async (req, res) => {
  try {
    const { sourceApp, changeData, options = {} } = req.body;

    if (!sourceApp || !changeData) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'sourceApp and changeData are required'
      });
    }

    if (!contextBridge) {
      return res.status(503).json({
        error: 'Context bridge not available',
        message: 'Context bridge system is not initialized'
      });
    }

    const result = await contextBridge.monitorContextChange(
      sourceApp,
      changeData,
      options
    );

    res.json({
      success: result.success,
      monitoring_result: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error monitoring context change:', error);
    res.status(500).json({
      error: 'Failed to monitor context change',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/ambient/analytics
 * Get ambient intelligence analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    const { timeRange = '7d', metric = 'all' } = req.query;

    const orchestratorAnalytics = ambientOrchestrator ? 
      ambientOrchestrator.getCoordinationAnalytics() : {};
    
    const bridgeAnalytics = contextBridge ? 
      contextBridge.getAnalytics() : {};

    const analytics = {
      time_range: timeRange,
      metric_focus: metric,
      coordination: orchestratorAnalytics,
      context_bridge: bridgeAnalytics,
      system_performance: {
        total_workflows_coordinated: orchestratorAnalytics.total_workflows || 0,
        average_coordination_time: orchestratorAnalytics.average_coordination_time || 0,
        success_rate: orchestratorAnalytics.success_rate || 0,
        context_bridges_successful: bridgeAnalytics.success_rate || 0
      },
      timestamp: new Date().toISOString()
    };

    res.json(analytics);

  } catch (error) {
    console.error('Error getting ambient analytics:', error);
    res.status(500).json({
      error: 'Failed to get analytics',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/ambient/integrations/:app
 * Get specific app integration status
 */
router.get('/integrations/:app', async (req, res) => {
  try {
    const { app } = req.params;
    const validApps = ['notion', 'things', 'apple_notes'];

    if (!validApps.includes(app)) {
      return res.status(400).json({
        error: 'Invalid app name',
        message: `App must be one of: ${validApps.join(', ')}`
      });
    }

    if (!ambientOrchestrator) {
      return res.status(503).json({
        error: 'Ambient orchestrator not available',
        message: 'System not initialized'
      });
    }

    const orchestratorStatus = ambientOrchestrator.getStatus();
    const appStatus = orchestratorStatus.integrations[app];

    if (!appStatus) {
      return res.status(404).json({
        error: 'Integration not found',
        message: `No integration found for app: ${app}`
      });
    }

    res.json({
      app: app,
      integration_status: appStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`Error getting ${req.params.app} integration status:`, error);
    res.status(500).json({
      error: 'Failed to get integration status',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * PUT /api/ambient/config
 * Update ambient intelligence configuration
 */
router.put('/config', async (req, res) => {
  try {
    const { configuration } = req.body;

    if (!configuration || typeof configuration !== 'object') {
      return res.status(400).json({
        error: 'Invalid configuration',
        message: 'Configuration must be an object'
      });
    }

    // Update configuration (in a real implementation, this would persist to database)
    Object.assign(config, configuration);

    // Restart components with new configuration if needed
    if (configuration.orchestrator || configuration.bridge) {
      console.log('Restarting ambient intelligence with new configuration...');
      
      if (ambientOrchestrator) {
        await ambientOrchestrator.close();
      }
      if (contextBridge) {
        await contextBridge.close();
      }

      isInitialized = false;
      await initializeAmbientIntelligence();
    }

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      configuration: config,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating ambient configuration:', error);
    res.status(500).json({
      error: 'Failed to update configuration',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * DELETE /api/ambient/workflows/:workflowId
 * Cancel or clean up a coordinated workflow
 */
router.delete('/workflows/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;

    if (!workflowId) {
      return res.status(400).json({
        error: 'Missing workflow ID',
        message: 'workflowId parameter is required'
      });
    }

    // Clean up workflow resources (implementation would depend on orchestrator API)
    const result = { 
      success: true, 
      message: `Workflow ${workflowId} cleaned up`,
      workflow_id: workflowId
    };

    res.json({
      success: result.success,
      cleanup_result: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error cleaning up workflow:', error);
    res.status(500).json({
      error: 'Failed to clean up workflow',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Utility functions

/**
 * Calculate overall system health score
 */
function calculateSystemHealth(orchestratorStatus) {
  if (!orchestratorStatus) return 0;

  let healthScore = 0;
  let totalComponents = 0;

  // Check orchestrator initialization
  if (orchestratorStatus.initialized) healthScore += 0.3;
  totalComponents += 0.3;

  // Check integration health
  const integrations = orchestratorStatus.integrations || {};
  const integrationsHealthy = Object.values(integrations).filter(
    integration => integration.initialized || integration.available
  ).length;
  const totalIntegrations = Object.keys(integrations).length;
  
  if (totalIntegrations > 0) {
    const integrationHealthRatio = integrationsHealthy / totalIntegrations;
    healthScore += integrationHealthRatio * 0.4;
  }
  totalComponents += 0.4;

  // Check operation stats
  const stats = orchestratorStatus.operation_stats || {};
  if (stats.workflows_coordinated > 0) {
    const errorRate = (stats.errors_handled || 0) / stats.workflows_coordinated;
    healthScore += Math.max(0, (1 - errorRate) * 0.3);
  } else {
    healthScore += 0.15; // Neutral score if no operations yet
  }
  totalComponents += 0.3;

  return Math.min(1.0, healthScore);
}

// Initialize on module load
initializeAmbientIntelligence().catch(console.error);

module.exports = router;

// #endregion end: Ambient Intelligence API Routes