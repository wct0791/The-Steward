// #region start: Context Bridge for Ambient Intelligence
// Handles context synchronization and data transformation between different productivity apps
// Ensures seamless data flow and consistency across Notion, Things, and Apple Notes

const EventEmitter = require('events');
const crypto = require('crypto');

/**
 * ContextBridge - Context synchronization and data transformation layer
 * 
 * Key Features:
 * - Transform data between different app formats and schemas
 * - Handle context propagation with conflict resolution
 * - Track context changes and maintain synchronization state
 * - Provide context history and rollback capabilities
 * - Monitor context consistency across apps
 * - Handle real-time bidirectional synchronization
 */
class ContextBridge extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Configuration
    this.config = {
      enable_bidirectional_sync: options.enableBidirectionalSync !== false,
      conflict_resolution_strategy: options.conflictResolutionStrategy || 'timestamp_wins', // timestamp_wins, source_priority, manual_resolution
      context_change_debounce: options.contextChangeDebounce || 500, // milliseconds
      max_context_history: options.maxContextHistory || 100,
      enable_context_validation: options.enableContextValidation !== false,
      sync_timeout: options.syncTimeout || 15000,
      enable_rollback: options.enableRollback !== false,
      compression_threshold: options.compressionThreshold || 1000 // bytes
    };

    // App priority for conflict resolution
    this.appPriority = options.appPriority || {
      notion: 3,    // Highest priority for project context
      things: 2,    // Medium priority for task data
      appleNotes: 1 // Lower priority for session data
    };

    // Context tracking
    this.contextStore = new Map();
    this.contextHistory = [];
    this.pendingSyncs = new Map();
    this.conflictQueue = [];
    this.syncState = new Map();
    
    // Data transformers for different apps
    this.transformers = {
      notion: new NotionTransformer(),
      things: new ThingsTransformer(), 
      appleNotes: new AppleNotesTransformer()
    };

    // Context validation rules
    this.validators = {
      project_context: this.validateProjectContext.bind(this),
      task_data: this.validateTaskData.bind(this),
      session_data: this.validateSessionData.bind(this),
      workflow_data: this.validateWorkflowData.bind(this)
    };

    // Debounced sync handler
    this.debouncedSync = this.debounce(this.performSync.bind(this), this.config.context_change_debounce);

    console.log('ContextBridge initialized with config:', this.config);
  }

  /**
   * Bridge context between source and target apps
   */
  async bridgeContext(sourceApp, targetApps, contextData, options = {}) {
    try {
      const bridgeId = this.generateBridgeId();
      const timestamp = new Date().toISOString();

      // Validate context data
      if (this.config.enable_context_validation) {
        const validationResult = this.validateContext(contextData);
        if (!validationResult.valid) {
          return {
            success: false,
            error: 'Context validation failed',
            validation_errors: validationResult.errors
          };
        }
      }

      // Store original context
      const contextRecord = {
        bridge_id: bridgeId,
        source_app: sourceApp,
        target_apps: targetApps,
        original_data: contextData,
        timestamp: timestamp,
        transformations: {},
        sync_results: {},
        conflicts: [],
        status: 'processing'
      };

      this.contextStore.set(bridgeId, contextRecord);

      // Transform context for each target app
      const transformationPromises = targetApps.map(async (targetApp) => {
        try {
          const transformer = this.transformers[targetApp];
          if (!transformer) {
            return { targetApp, error: `No transformer available for ${targetApp}` };
          }

          const transformedData = await transformer.transform(sourceApp, contextData, options);
          return { targetApp, data: transformedData };
        } catch (error) {
          return { targetApp, error: error.message };
        }
      });

      const transformationResults = await Promise.allSettled(transformationPromises);
      
      // Process transformation results
      for (const result of transformationResults) {
        if (result.status === 'fulfilled') {
          const { targetApp, data, error } = result.value;
          if (error) {
            contextRecord.transformations[targetApp] = { success: false, error };
          } else {
            contextRecord.transformations[targetApp] = { success: true, data };
          }
        } else {
          console.error('Transformation failed:', result.reason);
        }
      }

      // Sync transformed data to target apps
      const syncPromises = [];
      for (const [targetApp, transformation] of Object.entries(contextRecord.transformations)) {
        if (transformation.success) {
          syncPromises.push(
            this.syncToApp(targetApp, transformation.data, options)
              .then(result => ({ targetApp, result }))
              .catch(error => ({ targetApp, error: error.message }))
          );
        }
      }

      const syncResults = await Promise.allSettled(syncPromises);
      
      // Process sync results
      for (const result of syncResults) {
        if (result.status === 'fulfilled') {
          const { targetApp, result: syncResult, error } = result.value;
          contextRecord.sync_results[targetApp] = syncResult || { success: false, error };
        }
      }

      // Check for conflicts
      const conflicts = await this.detectConflicts(bridgeId, contextRecord);
      contextRecord.conflicts = conflicts;

      // Handle conflicts if any
      if (conflicts.length > 0) {
        await this.handleConflicts(bridgeId, conflicts, options);
      }

      contextRecord.status = 'completed';
      
      // Add to history
      this.addToHistory(contextRecord);

      // Emit bridge completion event
      this.emit('context_bridged', {
        bridge_id: bridgeId,
        source_app: sourceApp,
        target_apps: targetApps,
        success_count: Object.values(contextRecord.sync_results).filter(r => r.success).length,
        conflicts: conflicts.length
      });

      return {
        success: true,
        bridge_id: bridgeId,
        transformations: contextRecord.transformations,
        sync_results: contextRecord.sync_results,
        conflicts: contextRecord.conflicts,
        processed_at: timestamp
      };

    } catch (error) {
      console.error('Error bridging context:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Monitor context changes and handle automatic synchronization
   */
  async monitorContextChange(sourceApp, changeData, options = {}) {
    try {
      // Detect change type
      const changeType = this.detectChangeType(changeData);
      
      // Determine affected apps based on change type
      const affectedApps = this.getAffectedApps(sourceApp, changeType);
      
      if (affectedApps.length === 0) {
        return { success: true, reason: 'No apps affected by change' };
      }

      // Queue the change for debounced processing
      const changeId = this.generateBridgeId();
      this.pendingSyncs.set(changeId, {
        source_app: sourceApp,
        affected_apps: affectedApps,
        change_data: changeData,
        change_type: changeType,
        timestamp: new Date().toISOString(),
        options: options
      });

      // Trigger debounced sync
      this.debouncedSync(changeId);

      return {
        success: true,
        change_id: changeId,
        change_type: changeType,
        affected_apps: affectedApps
      };

    } catch (error) {
      console.error('Error monitoring context change:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Perform synchronized context update
   */
  async performSync(changeId) {
    try {
      const pendingSync = this.pendingSyncs.get(changeId);
      if (!pendingSync) return;

      const { source_app, affected_apps, change_data, options } = pendingSync;

      // Remove from pending and process
      this.pendingSyncs.delete(changeId);

      // Bridge the context to affected apps
      const bridgeResult = await this.bridgeContext(
        source_app,
        affected_apps,
        change_data,
        options
      );

      // Update sync state
      this.syncState.set(changeId, {
        ...pendingSync,
        bridge_result: bridgeResult,
        processed_at: new Date().toISOString()
      });

      return bridgeResult;

    } catch (error) {
      console.error('Error performing sync:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync transformed data to target app
   */
  async syncToApp(targetApp, transformedData, options) {
    try {
      // This would integrate with actual app APIs
      // For now, simulate the sync operation
      
      const syncOperation = {
        app: targetApp,
        data: transformedData,
        timestamp: new Date().toISOString(),
        options: options
      };

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));

      // Simulate success/failure based on data size and complexity
      const dataSize = JSON.stringify(transformedData).length;
      const successProbability = Math.max(0.8, 1 - (dataSize / 10000)); // Lower probability for larger data
      
      if (Math.random() < successProbability) {
        return {
          success: true,
          app: targetApp,
          synced_at: new Date().toISOString(),
          data_size: dataSize
        };
      } else {
        return {
          success: false,
          app: targetApp,
          error: 'Simulated sync failure',
          retry_recommended: true
        };
      }

    } catch (error) {
      console.error(`Error syncing to ${targetApp}:`, error);
      return {
        success: false,
        app: targetApp,
        error: error.message
      };
    }
  }

  /**
   * Detect conflicts in context synchronization
   */
  async detectConflicts(bridgeId, contextRecord) {
    const conflicts = [];

    try {
      // Check for timestamp conflicts (simultaneous updates)
      const recentBridges = this.contextHistory
        .filter(record => record.timestamp > new Date(Date.now() - 5000).toISOString())
        .filter(record => record.bridge_id !== bridgeId);

      for (const recentBridge of recentBridges) {
        const overlapApps = contextRecord.target_apps.filter(app => 
          recentBridge.target_apps.includes(app)
        );
        
        if (overlapApps.length > 0) {
          conflicts.push({
            type: 'timestamp_conflict',
            conflicting_bridge: recentBridge.bridge_id,
            overlapping_apps: overlapApps,
            time_diff: new Date(contextRecord.timestamp) - new Date(recentBridge.timestamp)
          });
        }
      }

      // Check for data consistency conflicts
      const dataConflicts = this.detectDataConflicts(contextRecord);
      conflicts.push(...dataConflicts);

      return conflicts;

    } catch (error) {
      console.error('Error detecting conflicts:', error);
      return [];
    }
  }

  /**
   * Detect data consistency conflicts
   */
  detectDataConflicts(contextRecord) {
    const conflicts = [];

    try {
      // Check for conflicting project contexts
      const projectContexts = Object.values(contextRecord.transformations)
        .filter(t => t.success && t.data.project_context)
        .map(t => t.data.project_context);

      const uniqueContexts = [...new Set(projectContexts)];
      if (uniqueContexts.length > 1) {
        conflicts.push({
          type: 'project_context_mismatch',
          contexts: uniqueContexts,
          severity: 'medium'
        });
      }

      // Check for conflicting task priorities
      const taskPriorities = Object.values(contextRecord.transformations)
        .filter(t => t.success && t.data.priority)
        .map(t => t.data.priority);

      const uniquePriorities = [...new Set(taskPriorities)];
      if (uniquePriorities.length > 1) {
        conflicts.push({
          type: 'priority_conflict',
          priorities: uniquePriorities,
          severity: 'low'
        });
      }

      return conflicts;

    } catch (error) {
      console.error('Error detecting data conflicts:', error);
      return [];
    }
  }

  /**
   * Handle detected conflicts
   */
  async handleConflicts(bridgeId, conflicts, options) {
    try {
      for (const conflict of conflicts) {
        switch (this.config.conflict_resolution_strategy) {
          case 'timestamp_wins':
            await this.resolveByTimestamp(conflict);
            break;
          
          case 'source_priority':
            await this.resolveBySourcePriority(conflict);
            break;
          
          case 'manual_resolution':
            this.queueForManualResolution(conflict);
            break;
          
          default:
            console.warn('Unknown conflict resolution strategy:', this.config.conflict_resolution_strategy);
        }
      }

      this.emit('conflicts_resolved', {
        bridge_id: bridgeId,
        conflicts_handled: conflicts.length,
        resolution_strategy: this.config.conflict_resolution_strategy
      });

    } catch (error) {
      console.error('Error handling conflicts:', error);
    }
  }

  /**
   * Resolve conflict by timestamp (latest wins)
   */
  async resolveByTimestamp(conflict) {
    // Implementation would depend on specific conflict type
    console.log(`Resolving conflict by timestamp:`, conflict.type);
  }

  /**
   * Resolve conflict by source app priority
   */
  async resolveBySourcePriority(conflict) {
    // Implementation would prioritize based on app priority settings
    console.log(`Resolving conflict by source priority:`, conflict.type);
  }

  /**
   * Queue conflict for manual resolution
   */
  queueForManualResolution(conflict) {
    this.conflictQueue.push({
      ...conflict,
      queued_at: new Date().toISOString(),
      status: 'pending_manual_resolution'
    });

    this.emit('manual_resolution_required', conflict);
  }

  /**
   * Validate context data
   */
  validateContext(contextData) {
    try {
      const errors = [];

      // Detect context type
      const contextType = this.detectContextType(contextData);
      
      // Apply appropriate validation
      const validator = this.validators[contextType];
      if (validator) {
        const validationResult = validator(contextData);
        if (!validationResult.valid) {
          errors.push(...validationResult.errors);
        }
      }

      // General validation rules
      if (!contextData || typeof contextData !== 'object') {
        errors.push('Context data must be a valid object');
      }

      if (contextData.timestamp && !this.isValidTimestamp(contextData.timestamp)) {
        errors.push('Invalid timestamp format');
      }

      return {
        valid: errors.length === 0,
        errors: errors,
        context_type: contextType
      };

    } catch (error) {
      return {
        valid: false,
        errors: [`Validation error: ${error.message}`],
        context_type: 'unknown'
      };
    }
  }

  /**
   * Validate project context data
   */
  validateProjectContext(data) {
    const errors = [];
    
    if (!data.project_name && !data.title) {
      errors.push('Project context must have a name or title');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate task data
   */
  validateTaskData(data) {
    const errors = [];
    
    if (!data.title && !data.name) {
      errors.push('Task data must have a title or name');
    }

    if (data.estimated_duration && (typeof data.estimated_duration !== 'number' || data.estimated_duration <= 0)) {
      errors.push('Estimated duration must be a positive number');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate session data
   */
  validateSessionData(data) {
    const errors = [];
    
    if (!data.session_id) {
      errors.push('Session data must have a session_id');
    }

    if (!data.timestamp && !data.start_time) {
      errors.push('Session data must have a timestamp or start_time');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate workflow data
   */
  validateWorkflowData(data) {
    const errors = [];
    
    if (!data.workflow_id) {
      errors.push('Workflow data must have a workflow_id');
    }

    if (!Array.isArray(data.steps)) {
      errors.push('Workflow data must have a steps array');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Detect context type from data structure
   */
  detectContextType(data) {
    if (data.workflow_id || data.steps) return 'workflow_data';
    if (data.session_id || data.task_input) return 'session_data';
    if (data.title || data.name || data.estimated_duration) return 'task_data';
    if (data.project_name || data.project_context) return 'project_context';
    return 'generic';
  }

  /**
   * Detect type of context change
   */
  detectChangeType(changeData) {
    if (changeData.type) return changeData.type;
    
    // Infer from data structure
    if (changeData.project_context_changed) return 'project_context_update';
    if (changeData.task_completed) return 'task_completion';
    if (changeData.session_started) return 'session_start';
    if (changeData.workflow_created) return 'workflow_creation';
    
    return 'generic_update';
  }

  /**
   * Get apps affected by a context change
   */
  getAffectedApps(sourceApp, changeType) {
    const appMap = {
      project_context_update: {
        notion: ['things', 'appleNotes'],
        things: ['notion', 'appleNotes'],
        appleNotes: ['notion']
      },
      task_completion: {
        things: ['appleNotes', 'notion'],
        notion: ['things'],
        appleNotes: []
      },
      session_start: {
        appleNotes: ['notion'],
        notion: ['appleNotes'],
        things: []
      },
      workflow_creation: {
        notion: ['things', 'appleNotes'],
        things: ['appleNotes'],
        appleNotes: []
      },
      generic_update: {
        notion: ['things', 'appleNotes'],
        things: ['notion', 'appleNotes'],
        appleNotes: ['notion']
      }
    };

    return appMap[changeType]?.[sourceApp] || [];
  }

  /**
   * Add context record to history
   */
  addToHistory(contextRecord) {
    this.contextHistory.push({
      ...contextRecord,
      stored_at: new Date().toISOString()
    });

    // Maintain history size limit
    if (this.contextHistory.length > this.config.max_context_history) {
      this.contextHistory = this.contextHistory.slice(-this.config.max_context_history);
    }
  }

  /**
   * Generate unique bridge ID
   */
  generateBridgeId() {
    return `bridge_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Check if timestamp is valid
   */
  isValidTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Debounce utility function
   */
  debounce(func, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * Get context bridge status
   */
  getStatus() {
    return {
      configuration: this.config,
      active_contexts: this.contextStore.size,
      pending_syncs: this.pendingSyncs.size,
      history_entries: this.contextHistory.length,
      conflicts_queued: this.conflictQueue.length,
      sync_states: this.syncState.size
    };
  }

  /**
   * Get context bridge analytics
   */
  getAnalytics() {
    const analytics = {
      total_bridges: this.contextHistory.length,
      success_rate: 0,
      by_source_app: {},
      by_change_type: {},
      conflicts_by_type: {},
      average_processing_time: 0
    };

    let totalProcessingTime = 0;
    let successfulBridges = 0;

    this.contextHistory.forEach(record => {
      // Count by source app
      analytics.by_source_app[record.source_app] = (analytics.by_source_app[record.source_app] || 0) + 1;
      
      // Calculate success rate
      const successCount = Object.values(record.sync_results).filter(r => r.success).length;
      if (successCount > 0) successfulBridges++;
      
      // Count conflicts by type
      record.conflicts.forEach(conflict => {
        analytics.conflicts_by_type[conflict.type] = (analytics.conflicts_by_type[conflict.type] || 0) + 1;
      });
    });

    analytics.success_rate = this.contextHistory.length > 0 ? 
      Math.round((successfulBridges / this.contextHistory.length) * 100) / 100 : 0;

    return analytics;
  }

  /**
   * Close context bridge and cleanup
   */
  async close() {
    this.contextStore.clear();
    this.contextHistory = [];
    this.pendingSyncs.clear();
    this.conflictQueue = [];
    this.syncState.clear();
    this.removeAllListeners();
    
    console.log('ContextBridge closed');
  }
}

/**
 * Data transformers for different apps
 */
class NotionTransformer {
  async transform(sourceApp, data, options = {}) {
    // Transform data to Notion format
    const transformed = {
      page_properties: {},
      blocks: [],
      database_entries: []
    };

    // Transform based on source app
    switch (sourceApp) {
      case 'things':
        return this.fromThings(data, options);
      case 'appleNotes':
        return this.fromAppleNotes(data, options);
      default:
        return data;
    }
  }

  fromThings(data, options) {
    return {
      type: 'task_sync',
      page_properties: {
        title: data.title || data.name,
        status: data.status || 'Not started',
        project: data.project,
        due_date: data.due_date
      },
      source: 'things'
    };
  }

  fromAppleNotes(data, options) {
    return {
      type: 'session_documentation',
      blocks: [{
        type: 'paragraph',
        content: data.content || data.body
      }],
      source: 'appleNotes'
    };
  }
}

class ThingsTransformer {
  async transform(sourceApp, data, options = {}) {
    const transformed = {
      tasks: [],
      projects: []
    };

    switch (sourceApp) {
      case 'notion':
        return this.fromNotion(data, options);
      case 'appleNotes':
        return this.fromAppleNotes(data, options);
      default:
        return data;
    }
  }

  fromNotion(data, options) {
    return {
      type: 'project_sync',
      task: {
        title: data.title || data.name,
        notes: data.description,
        project: data.project_context,
        tags: data.tags || []
      },
      source: 'notion'
    };
  }

  fromAppleNotes(data, options) {
    return {
      type: 'notes_reference',
      task: {
        title: 'Review Notes',
        notes: `See Apple Notes: ${data.note_title || 'Untitled'}`,
        tags: ['notes-reference']
      },
      source: 'appleNotes'
    };
  }
}

class AppleNotesTransformer {
  async transform(sourceApp, data, options = {}) {
    const transformed = {
      notes: [],
      folders: []
    };

    switch (sourceApp) {
      case 'notion':
        return this.fromNotion(data, options);
      case 'things':
        return this.fromThings(data, options);
      default:
        return data;
    }
  }

  fromNotion(data, options) {
    return {
      type: 'project_documentation',
      note: {
        title: `${data.title || data.name} - Project Notes`,
        content: data.description || data.content,
        folder: 'Project Notes'
      },
      source: 'notion'
    };
  }

  fromThings(data, options) {
    return {
      type: 'task_completion',
      note: {
        title: 'Task Completed',
        content: `Completed: ${data.title}\nProject: ${data.project}\nCompleted at: ${new Date().toISOString()}`,
        folder: 'Task History'
      },
      source: 'things'
    };
  }
}

module.exports = ContextBridge;

// #endregion end: Context Bridge