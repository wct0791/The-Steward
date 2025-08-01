// #region start: Enhanced Logger for The Steward
// Comprehensive logging system with routing decisions, performance metrics, and feedback tracking
// Supports the enhanced CLI architecture with detailed audit trails

const fs = require('fs');
const path = require('path');
const config = require('./env');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Core logging function with timestamp and level support
 * @param {string} level - Log level (info, warn, error, debug)
 * @param {string} category - Log category/module
 * @param {string} message - Log message
 * @param {object} metadata - Additional structured data
 */
function log(level, category, message, metadata = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    category,
    message,
    ...metadata
  };
  
  // Console output based on log level
  if (shouldLogToConsole(level)) {
    const emoji = getLogEmoji(level);
    console.log(`${emoji} [${category}] ${message}`);
    
    if (config.LOG_LEVEL === 'debug' && Object.keys(metadata).length > 0) {
      console.log('   Metadata:', JSON.stringify(metadata, null, 2));
    }
  }
  
  // File logging
  const logFile = path.join(logsDir, `${category.toLowerCase()}.jsonl`);
  try {
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  } catch (err) {
    console.error('Failed to write log:', err.message);
  }
}

/**
 * Determine if log level should be output to console
 * @param {string} level - Log level
 * @returns {boolean}
 */
function shouldLogToConsole(level) {
  const levels = { debug: 0, info: 1, warn: 2, error: 3 };
  const configLevel = levels[config.LOG_LEVEL] || 1;
  const logLevel = levels[level] || 1;
  return logLevel >= configLevel;
}

/**
 * Get emoji for log level
 * @param {string} level - Log level
 * @returns {string}
 */
function getLogEmoji(level) {
  const emojis = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌'
  };
  return emojis[level] || 'ℹ️';
}

/**
 * Log a complete routing decision with all context
 * @param {object} decision - Complete routing decision object
 * @param {object} result - Execution result
 */
function logRoutingDecision(decision, result = null) {
  const metadata = {
    taskId: generateTaskId(decision.task),
    classification: decision.classification,
    selection: decision.selection,
    loadout: decision.loadout,
    options: decision.options,
    success: result?.success || false,
    modelUsed: result?.model,
    isPrimary: result?.isPrimary,
    isDockerFallback: result?.isDockerFallback,
    attemptCount: result?.attempts?.length || 0
  };
  
  const message = `Routed "${decision.task.substring(0, 50)}..." to ${decision.selection.model}`;
  log('info', 'routing', message, metadata);
}

/**
 * Log model execution attempts with performance data
 * @param {string} model - Model name
 * @param {string} task - Task description
 * @param {boolean} success - Whether the call succeeded
 * @param {number} responseTime - Response time in milliseconds
 * @param {string} error - Error message if failed
 */
function logModelCall(model, task, success, responseTime = null, error = null) {
  const metadata = {
    model,
    taskId: generateTaskId(task),
    success,
    responseTime,
    error,
    timestamp: new Date().toISOString()
  };
  
  const message = success 
    ? `${model} succeeded${responseTime ? ` in ${responseTime}ms` : ''}`
    : `${model} failed: ${error}`;
    
  log(success ? 'info' : 'warn', 'model-calls', message, metadata);
}

/**
 * Log user feedback for routing optimization
 * @param {string} taskId - Unique task identifier
 * @param {string} feedback - User feedback (thumbs-up, thumbs-down, unsure)
 * @param {object} context - Additional context about the feedback
 */
function logFeedback(taskId, feedback, context = {}) {
  const metadata = {
    taskId,
    feedback,
    timestamp: new Date().toISOString(),
    ...context
  };
  
  log('info', 'feedback', `User feedback: ${feedback} for task ${taskId}`, metadata);
}

/**
 * Log system performance metrics
 * @param {object} metrics - Performance metrics object
 */
function logPerformanceMetrics(metrics) {
  const metadata = {
    ...metrics,
    timestamp: new Date().toISOString()
  };
  
  log('info', 'performance', 'System performance snapshot', metadata);
}

/**
 * Log error with full context and stack trace
 * @param {Error} error - Error object
 * @param {string} context - Context where error occurred
 * @param {object} metadata - Additional error context
 */
function logError(error, context, metadata = {}) {
  const errorMetadata = {
    context,
    errorMessage: error.message,
    errorStack: error.stack,
    timestamp: new Date().toISOString(),
    ...metadata
  };
  
  log('error', 'errors', `Error in ${context}: ${error.message}`, errorMetadata);
}

/**
 * Legacy task logging function for backward compatibility
 * @param {string} task - Task description
 * @param {object} route - Routing decision
 * @param {string} response - Model response
 */
function logTask(task, route, response) {
  const metadata = {
    taskId: generateTaskId(task),
    task: task.substring(0, 200), // Truncate long tasks
    model: route.model || 'unknown',
    reason: route.reason || 'no reason',
    responseLength: response ? response.length : 0,
    timestamp: new Date().toISOString()
  };
  
  log('info', 'tasks', `Task completed: ${task.substring(0, 50)}...`, metadata);
}

/**
 * Generate a consistent task ID from task content
 * @param {string} task - Task description
 * @returns {string} - Short hash ID
 */
function generateTaskId(task) {
  const crypto = require('crypto');
  return crypto.createHash('sha1').update(task).digest('hex').slice(0, 10);
}

/**
 * Get recent logs for analysis
 * @param {string} category - Log category
 * @param {number} limit - Number of recent entries
 * @returns {Array} - Array of log entries
 */
function getRecentLogs(category, limit = 50) {
  const logFile = path.join(logsDir, `${category.toLowerCase()}.jsonl`);
  
  try {
    if (!fs.existsSync(logFile)) {
      return [];
    }
    
    const content = fs.readFileSync(logFile, 'utf8');
    const lines = content.trim().split('\n').filter(line => line.length > 0);
    
    // Get the last 'limit' lines and parse them
    const recentLines = lines.slice(-limit);
    return recentLines.map(line => {
      try {
        return JSON.parse(line);
      } catch (err) {
        return null;
      }
    }).filter(entry => entry !== null);
    
  } catch (err) {
    logError(err, 'getRecentLogs', { category, limit });
    return [];
  }
}

/**
 * Analyze routing performance from logs
 * @param {number} days - Number of days to analyze
 * @returns {object} - Performance analysis
 */
function analyzeRoutingPerformance(days = 7) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const routingLogs = getRecentLogs('routing', 1000); // Get more logs for analysis
    const recentLogs = routingLogs.filter(log => 
      new Date(log.timestamp) > cutoffDate
    );
    
    const analysis = {
      totalTasks: recentLogs.length,
      successRate: 0,
      modelUsage: {},
      taskTypes: {},
      averageConfidence: 0,
      fallbackRate: 0,
      period: `${days} days`
    };
    
    if (recentLogs.length === 0) {
      return analysis;
    }
    
    let totalConfidence = 0;
    let successCount = 0;
    let fallbackCount = 0;
    
    recentLogs.forEach(log => {
      // Success rate
      if (log.success) successCount++;
      
      // Model usage
      const model = log.modelUsed || log.selection?.model;
      if (model) {
        analysis.modelUsage[model] = (analysis.modelUsage[model] || 0) + 1;
      }
      
      // Task types
      const taskType = log.classification?.type;
      if (taskType) {
        analysis.taskTypes[taskType] = (analysis.taskTypes[taskType] || 0) + 1;
      }
      
      // Confidence
      if (log.classification?.confidence) {
        totalConfidence += log.classification.confidence;
      }
      
      // Fallback usage
      if (!log.isPrimary || log.isDockerFallback) {
        fallbackCount++;
      }
    });
    
    analysis.successRate = (successCount / recentLogs.length) * 100;
    analysis.averageConfidence = totalConfidence / recentLogs.length;
    analysis.fallbackRate = (fallbackCount / recentLogs.length) * 100;
    
    return analysis;
  } catch (err) {
    logError(err, 'analyzeRoutingPerformance', { days });
    return { error: err.message };
  }
}

/**
 * Clean old log files to prevent disk space issues
 * @param {number} daysToKeep - Number of days of logs to retain
 */
function cleanOldLogs(daysToKeep = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const logFiles = fs.readdirSync(logsDir).filter(file => file.endsWith('.jsonl'));
    
    logFiles.forEach(file => {
      const filePath = path.join(logsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.trim().split('\n');
      
      const filteredLines = lines.filter(line => {
        try {
          const entry = JSON.parse(line);
          return new Date(entry.timestamp) > cutoffDate;
        } catch (err) {
          return false; // Remove malformed lines
        }
      });
      
      // Rewrite the file with filtered content
      fs.writeFileSync(filePath, filteredLines.join('\n') + '\n');
    });
    
    log('info', 'maintenance', `Cleaned logs older than ${daysToKeep} days`);
  } catch (err) {
    logError(err, 'cleanOldLogs', { daysToKeep });
  }
}

module.exports = {
  log,
  logRoutingDecision,
  logModelCall,
  logFeedback,
  logPerformanceMetrics,
  logError,
  logTask, // Legacy compatibility
  generateTaskId,
  getRecentLogs,
  analyzeRoutingPerformance,
  cleanOldLogs
};

// #endregion end: Enhanced Logger