// The Steward Analytics API Routes
// Enhanced analytics endpoints for performance monitoring and learning insights

const express = require('express');
const router = express.Router();
const DatabaseManager = require('../../../database/DatabaseManager');

// Initialize database manager
const dbManager = new DatabaseManager();

/**
 * Helper function to parse timeframe to hours
 * @param {string} timeframe - Timeframe string ('1h', '24h', '7d', '30d')
 * @returns {number} - Number of hours
 */
function parseTimeframe(timeframe) {
  const timeframeMap = {
    '1h': 1,
    '24h': 24,
    '7d': 24 * 7,
    '30d': 24 * 30
  };
  return timeframeMap[timeframe] || 24;
}

/**
 * Helper function to get datetime filter for SQL queries
 * @param {number} hours - Hours to look back
 * @returns {string} - ISO datetime string
 */
function getDateTimeFilter(hours) {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString();
}

/**
 * Calculate performance score based on multiple metrics
 * @param {object} metrics - Performance metrics
 * @returns {number} - Performance score (0-100)
 */
function calculatePerformanceScore(metrics) {
  const {
    avg_rating = 0,
    success_rate = 0,
    avg_response_time = 5000,
    total_requests = 0
  } = metrics;

  // Normalize metrics to 0-1 scale
  const ratingScore = (avg_rating / 5.0); // 1-5 scale to 0-1
  const successScore = success_rate; // Already 0-1
  const speedScore = Math.max(0, 1 - (avg_response_time / 10000)); // Faster = better
  const popularityScore = Math.min(1, total_requests / 10); // More usage = better (up to 10)

  // Weighted combination
  const performanceScore = (
    ratingScore * 0.4 +
    successScore * 0.3 +
    speedScore * 0.2 +
    popularityScore * 0.1
  ) * 100;

  return Math.round(performanceScore);
}

/**
 * GET /api/analytics/performance
 * Get comprehensive performance metrics
 */
router.get('/performance', async (req, res) => {
  try {
    const { timeframe = '24h', task_type } = req.query;
    const hours = parseTimeframe(timeframe);
    const dateFilter = getDateTimeFilter(hours);

    // Build WHERE clause
    let whereClause = `WHERE mp.timestamp >= ?`;
    const params = [dateFilter];
    
    if (task_type && task_type !== 'all') {
      whereClause += ` AND mp.task_type = ?`;
      params.push(task_type);
    }

    // Get overall summary metrics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_requests,
        AVG(response_time_ms) as avg_response_time,
        AVG(CASE WHEN success THEN 1.0 ELSE 0.0 END) as success_rate,
        AVG(tokens_total) as avg_tokens,
        AVG(user_rating) as avg_rating,
        AVG(rd.confidence_score) as routing_confidence
      FROM model_performance mp
      LEFT JOIN routing_decisions rd ON mp.id = rd.performance_id
      ${whereClause}
    `;

    const summaryResult = await dbManager.query(summaryQuery, params);
    const summary = summaryResult[0] || {};

    // Get model performance breakdown
    const modelQuery = `
      SELECT 
        mp.model_name,
        mp.adapter_type,
        mp.task_type,
        COUNT(*) as request_count,
        AVG(mp.response_time_ms) as avg_response_time,
        AVG(CASE WHEN mp.success THEN 1.0 ELSE 0.0 END) as success_rate,
        AVG(mp.tokens_total) as avg_tokens,
        AVG(mp.user_rating) as avg_rating,
        AVG(rd.confidence_score) as avg_confidence
      FROM model_performance mp
      LEFT JOIN routing_decisions rd ON mp.id = rd.performance_id
      ${whereClause}
      GROUP BY mp.model_name, mp.adapter_type, mp.task_type
      ORDER BY request_count DESC
    `;

    const modelResults = await dbManager.query(modelQuery, params);

    // Process model performance data
    const modelPerformance = {};
    modelResults.forEach(row => {
      const key = row.model_name;
      if (!modelPerformance[key]) {
        modelPerformance[key] = {
          model_name: row.model_name,
          adapter_type: row.adapter_type,
          request_count: 0,
          avg_response_time: 0,
          success_rate: 0,
          avg_tokens: 0,
          avg_rating: 0,
          avg_confidence: 0,
          task_breakdown: {}
        };
      }

      // Aggregate across task types
      modelPerformance[key].request_count += row.request_count;
      modelPerformance[key].avg_response_time = 
        (modelPerformance[key].avg_response_time + row.avg_response_time) / 2;
      modelPerformance[key].success_rate = 
        (modelPerformance[key].success_rate + row.success_rate) / 2;
      modelPerformance[key].avg_rating = 
        (modelPerformance[key].avg_rating + (row.avg_rating || 0)) / 2;
      modelPerformance[key].avg_confidence = 
        (modelPerformance[key].avg_confidence + (row.avg_confidence || 0)) / 2;

      // Store task-specific data
      modelPerformance[key].task_breakdown[row.task_type] = {
        request_count: row.request_count,
        avg_response_time: row.avg_response_time,
        success_rate: row.success_rate,
        avg_rating: row.avg_rating || 0
      };
    });

    // Get task type distribution
    const taskDistributionQuery = `
      SELECT 
        task_type,
        COUNT(*) as count
      FROM model_performance mp
      ${whereClause}
      GROUP BY task_type
      ORDER BY count DESC
    `;

    const taskResults = await dbManager.query(taskDistributionQuery, params);
    const totalTasks = taskResults.reduce((sum, row) => sum + row.count, 0);
    const taskDistribution = taskResults.map(row => ({
      name: row.task_type || 'unknown',
      value: row.count,
      percent: totalTasks > 0 ? row.count / totalTasks : 0
    }));

    // Get ADHD accommodations (if available)
    const adhdAccommodations = await getAdhdAccommodationData(hours);

    // Get context switching data
    const contextSwitching = await getContextSwitchingData(hours);

    // Get learning insights
    const learningInsights = await getLearningInsightsData(hours);

    res.json({
      success: true,
      timeframe,
      summary: {
        ...summary,
        performance_score: calculatePerformanceScore(summary)
      },
      model_performance: modelPerformance,
      task_distribution: taskDistribution,
      adhd_accommodations: adhdAccommodations,
      context_switching: contextSwitching,
      learning_insights: learningInsights,
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

/**
 * GET /api/analytics/routing-trends
 * Get routing confidence and decision trends over time
 */
router.get('/routing-trends', async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    const hours = parseTimeframe(timeframe);
    const dateFilter = getDateTimeFilter(hours);

    // Get routing trends with hourly aggregation
    const trendsQuery = `
      SELECT 
        datetime(timestamp, 'start of hour') as hour,
        AVG(confidence_score) as confidence,
        COUNT(*) as decisions_count,
        chosen_model,
        task_type
      FROM routing_decisions 
      WHERE timestamp >= ?
      GROUP BY datetime(timestamp, 'start of hour'), chosen_model, task_type
      ORDER BY hour ASC
    `;

    const trendsResults = await dbManager.query(trendsQuery, [dateFilter]);

    // Process trends data for charting
    const trends = trendsResults.map(row => ({
      timestamp: new Date(row.hour).getTime(),
      confidence: parseFloat(row.confidence) || 0,
      decisions_count: row.decisions_count,
      model: row.chosen_model,
      task_type: row.task_type
    }));

    res.json({
      success: true,
      timeframe,
      trends,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting routing trends:', error);
    res.status(500).json({
      error: 'Failed to get routing trends',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/cognitive-patterns
 * Get cognitive load and time-based patterns
 */
router.get('/cognitive-patterns', async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    const hours = parseTimeframe(timeframe);
    const dateFilter = getDateTimeFilter(hours);

    // Get cognitive patterns by hour of day
    const patternsQuery = `
      SELECT 
        mp.hour_of_day as hour,
        AVG(mp.response_time_ms) as avg_response_time,
        AVG(rd.confidence_score) as avg_confidence,
        COUNT(*) as request_count,
        AVG(CASE 
          WHEN mp.task_type IN ('debug', 'analyze', 'code') THEN 3
          WHEN mp.task_type IN ('write', 'creative') THEN 2
          ELSE 1 
        END) as cognitive_load,
        AVG(CASE 
          WHEN mp.tokens_prompt > 1000 THEN 3
          WHEN mp.tokens_prompt > 500 THEN 2
          ELSE 1 
        END) as task_complexity
      FROM model_performance mp
      LEFT JOIN routing_decisions rd ON mp.id = rd.performance_id
      WHERE mp.timestamp >= ?
      GROUP BY mp.hour_of_day
      ORDER BY mp.hour_of_day
    `;

    const patternsResults = await dbManager.query(patternsQuery, [dateFilter]);

    const patterns = patternsResults.map(row => ({
      hour: row.hour,
      cognitive_load: parseFloat(row.cognitive_load) || 1,
      task_complexity: parseFloat(row.task_complexity) || 1,
      avg_response_time: row.avg_response_time,
      avg_confidence: row.avg_confidence,
      request_count: row.request_count
    }));

    res.json({
      success: true,
      timeframe,
      patterns,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting cognitive patterns:', error);
    res.status(500).json({
      error: 'Failed to get cognitive patterns',
      message: error.message
    });
  }
});

/**
 * POST /api/analytics/feedback
 * Submit user feedback for routing decisions
 */
router.post('/feedback', async (req, res) => {
  try {
    const {
      performance_id,
      routing_id,
      satisfaction_rating,
      quality_rating,
      speed_rating,
      feedback_text,
      preferred_model,
      routing_feedback
    } = req.body;

    if (!performance_id) {
      return res.status(400).json({
        error: 'Invalid feedback data',
        message: 'performance_id is required'
      });
    }

    // Insert feedback record
    const feedbackQuery = `
      INSERT INTO user_feedback (
        performance_id, routing_id, satisfaction_rating, quality_rating, 
        speed_rating, feedback_text, preferred_model, routing_feedback
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const feedbackId = await dbManager.run(feedbackQuery, [
      performance_id,
      routing_id,
      satisfaction_rating,
      quality_rating,
      speed_rating,
      feedback_text,
      preferred_model,
      routing_feedback
    ]);

    res.json({
      success: true,
      feedback_id: feedbackId,
      message: 'Feedback submitted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      error: 'Failed to submit feedback',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/insights
 * Get learning insights and recommendations
 */
router.get('/insights', async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    const insights = await getLearningInsightsData(parseTimeframe(timeframe));
    
    res.json({
      success: true,
      timeframe,
      insights,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting insights:', error);
    res.status(500).json({
      error: 'Failed to get insights',
      message: error.message
    });
  }
});

/**
 * Helper function to get ADHD accommodation data
 */
async function getAdhdAccommodationData(hours) {
  try {
    // This would be implemented when ADHD-specific tracking is added
    // For now, return mock data structure
    return [
      {
        type: 'Fast Local Processing',
        effectiveness: 0.85,
        usage_count: 12,
        description: 'Using local models when cognitive capacity is low'
      },
      {
        type: 'Hyperfocus Detection',
        effectiveness: 0.92,
        usage_count: 8,
        description: 'Enabling complex models during hyperfocus states'
      },
      {
        type: 'Context Switch Management',
        effectiveness: 0.78,
        usage_count: 15,
        description: 'Optimizing task routing for 3-4 task tolerance'
      }
    ];
  } catch (error) {
    console.warn('Error getting ADHD accommodation data:', error);
    return [];
  }
}

/**
 * Helper function to get context switching data
 */
async function getContextSwitchingData(hours) {
  try {
    // This would analyze actual context switching patterns
    // For now, return mock data structure
    return [
      { task_count: 1, productivity_score: 95 },
      { task_count: 2, productivity_score: 88 },
      { task_count: 3, productivity_score: 82 },
      { task_count: 4, productivity_score: 75 },
      { task_count: 5, productivity_score: 65 },
      { task_count: 6, productivity_score: 50 }
    ];
  } catch (error) {
    console.warn('Error getting context switching data:', error);
    return [];
  }
}

/**
 * Helper function to get learning insights
 */
async function getLearningInsightsData(hours) {
  try {
    const dateFilter = getDateTimeFilter(hours);
    
    const query = `
      SELECT 
        insight_type,
        pattern_description,
        recommendation,
        confidence,
        sample_size,
        implemented
      FROM learning_insights 
      WHERE evidence_period_end >= ? 
      AND confidence > 0.5
      ORDER BY confidence DESC, sample_size DESC
      LIMIT 10
    `;

    const results = await dbManager.query(query, [dateFilter]);
    return results;
  } catch (error) {
    console.warn('Error getting learning insights:', error);
    return [];
  }
}

// ==========================================
// LEARNING ENGINE ENDPOINTS
// ==========================================

/**
 * POST /api/analytics/learning/analyze-drift
 * Analyze preference drift patterns
 */
router.post('/learning/analyze-drift', async (req, res) => {
  try {
    const { timeframe = '30d' } = req.body;
    
    const PreferenceDriftDetector = require('../../src/learning/PreferenceDriftDetector');
    const driftDetector = new PreferenceDriftDetector();
    
    const analysis = await driftDetector.analyzeDrift(timeframe);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error analyzing drift patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze drift patterns',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/learning/character-sheet-suggestions
 * Get character sheet suggestions
 */
router.get('/learning/character-sheet-suggestions', async (req, res) => {
  try {
    const CharacterSheetSuggestionsEngine = require('../../src/learning/CharacterSheetSuggestionsEngine');
    const suggestionsEngine = new CharacterSheetSuggestionsEngine();
    
    const suggestions = await suggestionsEngine.getPendingSuggestions();
    
    res.json({
      success: true,
      data: {
        suggestions,
        totalPending: suggestions.length,
        categories: [...new Set(suggestions.map(s => s.category))]
      }
    });
  } catch (error) {
    console.error('Error getting character sheet suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get suggestions',
      message: error.message
    });
  }
});

/**
 * POST /api/analytics/learning/generate-suggestions
 * Generate new character sheet suggestions
 */
router.post('/learning/generate-suggestions', async (req, res) => {
  try {
    const { timeframe = '30d', forceRegenerate = false } = req.body;
    
    const CharacterSheetSuggestionsEngine = require('../../src/learning/CharacterSheetSuggestionsEngine');
    const suggestionsEngine = new CharacterSheetSuggestionsEngine();
    
    const result = await suggestionsEngine.generateSuggestions({ timeframe });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate suggestions',
      message: error.message
    });
  }
});

/**
 * POST /api/analytics/learning/accept-suggestion
 * Accept a character sheet suggestion
 */
router.post('/learning/accept-suggestion', async (req, res) => {
  try {
    const { suggestionId, applyImmediately = true } = req.body;
    
    if (!suggestionId) {
      return res.status(400).json({
        success: false,
        error: 'Suggestion ID is required'
      });
    }
    
    const CharacterSheetSuggestionsEngine = require('../../src/learning/CharacterSheetSuggestionsEngine');
    const suggestionsEngine = new CharacterSheetSuggestionsEngine();
    
    const result = await suggestionsEngine.acceptSuggestion(suggestionId, applyImmediately);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error accepting suggestion:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept suggestion',
      message: error.message
    });
  }
});

/**
 * POST /api/analytics/learning/reject-suggestion
 * Reject a character sheet suggestion
 */
router.post('/learning/reject-suggestion', async (req, res) => {
  try {
    const { suggestionId, reason = null } = req.body;
    
    if (!suggestionId) {
      return res.status(400).json({
        success: false,
        error: 'Suggestion ID is required'
      });
    }
    
    const CharacterSheetSuggestionsEngine = require('../../src/learning/CharacterSheetSuggestionsEngine');
    const suggestionsEngine = new CharacterSheetSuggestionsEngine();
    
    const result = await suggestionsEngine.rejectSuggestion(suggestionId, reason);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error rejecting suggestion:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject suggestion',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/learning/progress-metrics
 * Get learning progress metrics
 */
router.get('/learning/progress-metrics', async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const days = timeframe === '7d' ? 7 : timeframe === '14d' ? 14 : 30;
    
    await dbManager.initialize();
    
    // Get learning progress data
    const progressData = await dbManager.getLearningProgress(days);
    
    // Get achievements progress
    const achievements = await dbManager.getAchievementsProgress();
    
    // Calculate summary metrics
    const latestProgress = progressData[0] || {};
    const totalPatterns = await dbManager._queryOne(
      'SELECT COUNT(*) as count FROM learning_patterns WHERE status = "active"'
    );
    
    const totalSuggestions = await dbManager._queryOne(
      'SELECT COUNT(*) as count FROM character_sheet_suggestions'
    );
    
    const acceptedSuggestions = await dbManager._queryOne(
      'SELECT COUNT(*) as count FROM character_sheet_suggestions WHERE status = "accepted"'
    );
    
    await dbManager.close();
    
    res.json({
      success: true,
      data: {
        progress: progressData,
        achievements: achievements,
        summary: {
          currentIntelligenceScore: latestProgress.intelligence_score || 50,
          routingAccuracy: latestProgress.routing_accuracy || 0,
          preferenceAlignment: latestProgress.preference_alignment_score || 0,
          totalPatternsDetected: totalPatterns.count,
          totalSuggestions: totalSuggestions.count,
          acceptedSuggestions: acceptedSuggestions.count,
          suggestionAcceptanceRate: totalSuggestions.count > 0 ? 
            (acceptedSuggestions.count / totalSuggestions.count) : 0
        },
        timeframe: {
          days,
          startDate: progressData.length > 0 ? progressData[progressData.length - 1].date : null,
          endDate: progressData.length > 0 ? progressData[0].date : null
        }
      }
    });
  } catch (error) {
    console.error('Error getting learning progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get learning progress',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/learning/confidence-calibration
 * Get confidence calibration analysis
 */
router.get('/learning/confidence-calibration', async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const hours = parseTimeframe(timeframe);
    const dateFilter = getDateTimeFilter(hours);
    
    await dbManager.initialize();
    
    // Get calibration data
    const calibrationData = await dbManager._query(`
      SELECT 
        predicted_confidence,
        actual_feedback_score,
        calibration_error,
        task_type,
        model_used,
        DATE(created_at) as date
      FROM confidence_calibration 
      WHERE created_at >= ?
      ORDER BY created_at DESC
    `, [dateFilter]);
    
    // Calculate calibration metrics
    const avgCalibrationError = calibrationData.length > 0 ? 
      calibrationData.reduce((sum, d) => sum + (d.calibration_error || 0), 0) / calibrationData.length : 0;
    
    const calibrationByModel = {};
    calibrationData.forEach(d => {
      if (!calibrationByModel[d.model_used]) {
        calibrationByModel[d.model_used] = { errors: [], count: 0 };
      }
      calibrationByModel[d.model_used].errors.push(d.calibration_error || 0);
      calibrationByModel[d.model_used].count++;
    });
    
    // Calculate averages by model
    Object.keys(calibrationByModel).forEach(model => {
      const data = calibrationByModel[model];
      data.avgError = data.errors.reduce((a, b) => a + b, 0) / data.count;
    });
    
    await dbManager.close();
    
    res.json({
      success: true,
      data: {
        overall: {
          avgCalibrationError,
          totalDataPoints: calibrationData.length
        },
        byModel: calibrationByModel,
        rawData: calibrationData.slice(0, 100), // Limit for performance
        timeframe: { hours, dateFilter }
      }
    });
  } catch (error) {
    console.error('Error getting confidence calibration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get confidence calibration',
      message: error.message
    });
  }
});

module.exports = router;