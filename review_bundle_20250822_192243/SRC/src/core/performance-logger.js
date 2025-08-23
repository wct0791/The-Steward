// #region start: Performance Logger for Smart Routing Engine
// Integrates with database for performance tracking and learning insights
// Built for The Steward's smart routing system

const DatabaseManager = require('../../database/DatabaseManager');

/**
 * Performance Logger
 * Handles performance tracking, learning insights, and routing optimization
 */
class PerformanceLogger {
    constructor() {
        this.dbManager = new DatabaseManager();
        this.performanceCache = new Map();
        this.insightCache = new Map();
        this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
    }

    /**
     * Log routing decision with performance context
     * @param {object} routingDecision - Smart routing decision
     * @param {object} performanceData - Performance metrics
     * @returns {Promise<number>} - Performance record ID
     */
    async logRoutingPerformance(routingDecision, performanceData = {}) {
        try {
            const timestamp = new Date();
            const classification = routingDecision.classification || {};
            const selection = routingDecision.selection || {};
            const contexts = routingDecision.contexts || {};
            
            // Prepare routing decision data
            const routingData = {
                task_type: classification.type || 'unknown',
                prompt_snippet: (routingDecision.task || '').substring(0, 100),
                chosen_model: selection.model || 'unknown',
                routing_reason: selection.reason || 'No reason provided',
                alternatives_considered: JSON.stringify(selection.fallbacks || []),
                time_of_day: new Date().getHours(),
                user_loadout: routingDecision.loadout || 'default',
                fallback_triggered: selection.fallback_triggered || false,
                confidence_score: selection.confidence || 0.5
            };
            
            // Add smart routing specific data
            if (routingDecision.smart_routing) {
                routingData.smart_routing_data = JSON.stringify({
                    time_context: contexts.time_context,
                    cognitive_state: contexts.cognitive_state,
                    enhanced_classification: contexts.enhanced_classification,
                    character_sheet_mappings: selection.character_sheet_mappings
                });
            }
            
            // Log routing decision
            const routingId = await this.dbManager.logRoutingDecision?.(routingData) || null;
            
            // Prepare performance data
            const performanceRecord = {
                model_name: selection.model || 'unknown',
                adapter_type: this.determineAdapterType(selection.model),
                task_type: classification.type || 'unknown',
                response_time_ms: performanceData.response_time_ms || 0, // Default to 0 when not available
                tokens_prompt: performanceData.tokens_prompt || null,
                tokens_completion: performanceData.tokens_completion || null,
                tokens_total: performanceData.tokens_total || null,
                success: performanceData.success !== false, // Default to true
                error_type: performanceData.error_type || null,
                error_message: performanceData.error_message || null,
                prompt_length: (routingDecision.task || '').length,
                response_length: performanceData.response_length || 0,
                temperature: performanceData.temperature || null,
                max_tokens: performanceData.max_tokens || null,
                session_id: performanceData.session_id || this.generateSessionId(),
                
                // Smart routing enhancements
                hour_of_day: timestamp.getHours(),
                day_of_week: timestamp.getDay(),
                user_energy_level: contexts.time_context?.energy_level || null,
                user_context: JSON.stringify({
                    cognitive_capacity: contexts.cognitive_state?.cognitive_capacity?.level || null,
                    task_alignment: contexts.cognitive_state?.task_alignment?.level || null,
                    time_period: contexts.time_context?.time_period || null,
                    classification_confidence: classification.confidence || null
                }),
                user_rating: performanceData.user_rating || null
            };
            
            // Log performance
            const performanceId = await this.dbManager.logPerformance?.(performanceRecord) || null;
            
            // Cache the performance data for quick access
            if (performanceId) {
                this.cachePerformanceData(performanceId, {
                    ...performanceRecord,
                    routing_id: routingId,
                    timestamp: timestamp
                });
            }
            
            return performanceId;
            
        } catch (error) {
            console.warn('Failed to log routing performance:', error.message);
            return null;
        }
    }

    /**
     * Get performance insights for model selection
     * @param {string} taskType - Task type to analyze
     * @param {number} hours - Hours to look back (default: 24)
     * @returns {Promise<object>} - Performance insights
     */
    async getPerformanceInsights(taskType, hours = 24) {
        const cacheKey = `insights_${taskType}_${hours}`;
        
        // Check cache first
        if (this.insightCache.has(cacheKey)) {
            const cached = this.insightCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }
        
        try {
            // Get recent performance data
            const performanceData = await this.getRecentPerformance(taskType, hours);
            
            if (performanceData.length === 0) {
                return this.getDefaultInsights(taskType);
            }
            
            // Analyze performance patterns
            const insights = {
                task_type: taskType,
                analysis_period: `${hours} hours`,
                sample_size: performanceData.length,
                
                // Model performance analysis
                model_performance: this.analyzeModelPerformance(performanceData),
                
                // Time-based patterns
                time_patterns: this.analyzeTimePatterns(performanceData),
                
                // Cognitive state correlations
                cognitive_correlations: this.analyzeCognitiveCorrelations(performanceData),
                
                // Success and quality patterns
                quality_patterns: this.analyzeQualityPatterns(performanceData),
                
                // Recommendations
                recommendations: this.generatePerformanceRecommendations(performanceData),
                
                // Confidence in insights
                confidence: Math.min(performanceData.length / 10, 1.0),
                
                timestamp: new Date().toISOString()
            };
            
            // Cache the insights
            this.insightCache.set(cacheKey, {
                data: insights,
                timestamp: Date.now()
            });
            
            return insights;
            
        } catch (error) {
            console.warn('Failed to get performance insights:', error.message);
            return this.getDefaultInsights(taskType);
        }
    }

    /**
     * Analyze model performance patterns
     * @param {Array} performanceData - Performance data array
     * @returns {object} - Model performance analysis
     */
    analyzeModelPerformance(performanceData) {
        const modelStats = {};
        
        // Group by model
        for (const record of performanceData) {
            const model = record.model_name;
            if (!modelStats[model]) {
                modelStats[model] = {
                    count: 0,
                    success_count: 0,
                    total_response_time: 0,
                    ratings: [],
                    errors: []
                };
            }
            
            const stats = modelStats[model];
            stats.count++;
            
            if (record.success) {
                stats.success_count++;
            } else if (record.error_type) {
                stats.errors.push(record.error_type);
            }
            
            if (record.response_time_ms) {
                stats.total_response_time += record.response_time_ms;
            }
            
            if (record.user_rating) {
                stats.ratings.push(record.user_rating);
            }
        }
        
        // Calculate metrics for each model
        const modelPerformance = {};
        for (const [model, stats] of Object.entries(modelStats)) {
            modelPerformance[model] = {
                usage_count: stats.count,
                success_rate: stats.success_count / stats.count,
                avg_response_time: stats.total_response_time / stats.count || 0,
                avg_rating: stats.ratings.length > 0 ? 
                    stats.ratings.reduce((a, b) => a + b, 0) / stats.ratings.length : null,
                common_errors: this.getTopErrors(stats.errors),
                performance_score: this.calculatePerformanceScore(stats)
            };
        }
        
        // Sort by performance score
        const rankedModels = Object.entries(modelPerformance)
            .sort(([,a], [,b]) => b.performance_score - a.performance_score);
        
        return {
            model_stats: modelPerformance,
            best_performing: rankedModels[0] ? rankedModels[0][0] : null,
            ranked_models: rankedModels.map(([model, stats]) => ({
                model,
                score: stats.performance_score,
                success_rate: stats.success_rate
            }))
        };
    }

    /**
     * Analyze time-based patterns
     * @param {Array} performanceData - Performance data array
     * @returns {object} - Time pattern analysis
     */
    analyzeTimePatterns(performanceData) {
        const hourlyStats = {};
        const energyStats = {};
        
        for (const record of performanceData) {
            const hour = record.hour_of_day;
            const energy = record.user_energy_level;
            
            // Hourly patterns
            if (hour !== null) {
                if (!hourlyStats[hour]) {
                    hourlyStats[hour] = { count: 0, success_count: 0, ratings: [] };
                }
                hourlyStats[hour].count++;
                if (record.success) hourlyStats[hour].success_count++;
                if (record.user_rating) hourlyStats[hour].ratings.push(record.user_rating);
            }
            
            // Energy level patterns
            if (energy) {
                if (!energyStats[energy]) {
                    energyStats[energy] = { count: 0, success_count: 0, ratings: [] };
                }
                energyStats[energy].count++;
                if (record.success) energyStats[energy].success_count++;
                if (record.user_rating) energyStats[energy].ratings.push(record.user_rating);
            }
        }
        
        return {
            hourly_patterns: this.calculateHourlyMetrics(hourlyStats),
            energy_patterns: this.calculateEnergyMetrics(energyStats),
            peak_performance_hours: this.identifyPeakHours(hourlyStats),
            recommendations: this.generateTimeRecommendations(hourlyStats, energyStats)
        };
    }

    /**
     * Analyze cognitive state correlations
     * @param {Array} performanceData - Performance data array
     * @returns {object} - Cognitive correlation analysis
     */
    analyzeCognitiveCorrelations(performanceData) {
        const capacityStats = {};
        const alignmentStats = {};
        
        for (const record of performanceData) {
            try {
                const userContext = typeof record.user_context === 'string' ? 
                    JSON.parse(record.user_context) : (record.user_context || {});
                
                const capacity = userContext.cognitive_capacity;
                const alignment = userContext.task_alignment;
                
                if (capacity) {
                    if (!capacityStats[capacity]) {
                        capacityStats[capacity] = { count: 0, success_count: 0, ratings: [] };
                    }
                    capacityStats[capacity].count++;
                    if (record.success) capacityStats[capacity].success_count++;
                    if (record.user_rating) capacityStats[capacity].ratings.push(record.user_rating);
                }
                
                if (alignment) {
                    if (!alignmentStats[alignment]) {
                        alignmentStats[alignment] = { count: 0, success_count: 0, ratings: [] };
                    }
                    alignmentStats[alignment].count++;
                    if (record.success) alignmentStats[alignment].success_count++;
                    if (record.user_rating) alignmentStats[alignment].ratings.push(record.user_rating);
                }
            } catch (error) {
                // Skip malformed user_context
                continue;
            }
        }
        
        return {
            cognitive_capacity_impact: this.calculateCognitiveMetrics(capacityStats),
            task_alignment_impact: this.calculateCognitiveMetrics(alignmentStats),
            insights: this.generateCognitiveInsights(capacityStats, alignmentStats)
        };
    }

    /**
     * Generate performance recommendations
     * @param {Array} performanceData - Performance data array
     * @returns {Array} - Performance recommendations
     */
    generatePerformanceRecommendations(performanceData) {
        const recommendations = [];
        const modelPerformance = this.analyzeModelPerformance(performanceData);
        const timePatterns = this.analyzeTimePatterns(performanceData);
        
        // Model recommendations
        if (modelPerformance.best_performing) {
            recommendations.push({
                type: 'model_preference',
                priority: 'high',
                message: `${modelPerformance.best_performing} shows best performance for this task type`,
                confidence: modelPerformance.model_stats[modelPerformance.best_performing].performance_score
            });
        }
        
        // Time-based recommendations
        if (timePatterns.peak_performance_hours.length > 0) {
            recommendations.push({
                type: 'timing',
                priority: 'medium',
                message: `Peak performance hours: ${timePatterns.peak_performance_hours.join(', ')}`,
                confidence: 0.7
            });
        }
        
        // Error pattern recommendations
        const errorPatterns = this.analyzeErrorPatterns(performanceData);
        if (errorPatterns.length > 0) {
            recommendations.push({
                type: 'error_prevention',
                priority: 'medium',
                message: `Common issues: ${errorPatterns.join(', ')}`,
                confidence: 0.6
            });
        }
        
        return recommendations;
    }

    // Helper methods

    /**
     * Determine adapter type from model name
     * @param {string} modelName - Model name
     * @returns {string} - Adapter type
     */
    determineAdapterType(modelName) {
        if (!modelName) return 'unknown';
        
        const localModels = ['smol', 'llama', 'mistral', 'local'];
        const isLocal = localModels.some(local => modelName.toLowerCase().includes(local));
        
        return isLocal ? 'local' : 'cloud';
    }

    /**
     * Generate session ID
     * @returns {string} - Session ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Cache performance data
     * @param {number} performanceId - Performance record ID
     * @param {object} data - Performance data
     */
    cachePerformanceData(performanceId, data) {
        this.performanceCache.set(performanceId, {
            data,
            timestamp: Date.now()
        });
        
        // Clean old cache entries
        this.cleanCache();
    }

    /**
     * Clean expired cache entries
     */
    cleanCache() {
        const now = Date.now();
        
        for (const [key, value] of this.performanceCache.entries()) {
            if (now - value.timestamp > this.cacheTimeout) {
                this.performanceCache.delete(key);
            }
        }
        
        for (const [key, value] of this.insightCache.entries()) {
            if (now - value.timestamp > this.cacheTimeout) {
                this.insightCache.delete(key);
            }
        }
    }

    /**
     * Get recent performance data
     * @param {string} taskType - Task type
     * @param {number} hours - Hours to look back
     * @returns {Promise<Array>} - Performance records
     */
    async getRecentPerformance(taskType, hours) {
        // This would query the actual database
        // For now, return empty array as placeholder
        try {
            // const query = `
            //     SELECT * FROM model_performance 
            //     WHERE task_type = ? 
            //     AND timestamp > datetime('now', '-${hours} hours')
            //     ORDER BY timestamp DESC
            // `;
            // return await this.dbManager.query(query, [taskType]);
            return []; // Placeholder
        } catch (error) {
            console.warn('Failed to get recent performance data:', error.message);
            return [];
        }
    }

    /**
     * Get default insights when no data available
     * @param {string} taskType - Task type
     * @returns {object} - Default insights
     */
    getDefaultInsights(taskType) {
        return {
            task_type: taskType,
            analysis_period: 'No data available',
            sample_size: 0,
            model_performance: { model_stats: {}, best_performing: null, ranked_models: [] },
            time_patterns: { hourly_patterns: {}, energy_patterns: {} },
            cognitive_correlations: { cognitive_capacity_impact: {}, task_alignment_impact: {} },
            quality_patterns: {},
            recommendations: [{
                type: 'data_collection',
                priority: 'low',
                message: 'Insufficient data for performance insights',
                confidence: 0.1
            }],
            confidence: 0,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Calculate performance score
     * @param {object} stats - Performance statistics
     * @returns {number} - Performance score (0-1)
     */
    calculatePerformanceScore(stats) {
        if (stats.count === 0) return 0;
        
        let score = 0;
        
        // Success rate weight: 50%
        score += (stats.success_count / stats.count) * 0.5;
        
        // Response time weight: 25% (inverse - faster is better)
        const avgResponseTime = stats.total_response_time / stats.count;
        if (avgResponseTime > 0) {
            const timeScore = Math.max(0, 1 - (avgResponseTime / 10000)); // 10s baseline
            score += timeScore * 0.25;
        } else {
            score += 0.25; // No timing data, assume good
        }
        
        // User rating weight: 25%
        if (stats.ratings.length > 0) {
            const avgRating = stats.ratings.reduce((a, b) => a + b, 0) / stats.ratings.length;
            score += (avgRating / 5) * 0.25; // Assuming 5-point scale
        } else {
            score += 0.125; // No ratings, assume neutral
        }
        
        return Math.max(0, Math.min(1, score));
    }

    /**
     * Get top errors from error list
     * @param {Array} errors - Error list
     * @returns {Array} - Top error types
     */
    getTopErrors(errors) {
        const errorCounts = {};
        for (const error of errors) {
            errorCounts[error] = (errorCounts[error] || 0) + 1;
        }
        
        return Object.entries(errorCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([error]) => error);
    }

    /**
     * Calculate hourly metrics
     * @param {object} hourlyStats - Hourly statistics
     * @returns {object} - Hourly metrics
     */
    calculateHourlyMetrics(hourlyStats) {
        const metrics = {};
        for (const [hour, stats] of Object.entries(hourlyStats)) {
            metrics[hour] = {
                usage_count: stats.count,
                success_rate: stats.success_count / stats.count,
                avg_rating: stats.ratings.length > 0 ? 
                    stats.ratings.reduce((a, b) => a + b, 0) / stats.ratings.length : null
            };
        }
        return metrics;
    }

    /**
     * Calculate energy metrics
     * @param {object} energyStats - Energy statistics
     * @returns {object} - Energy metrics
     */
    calculateEnergyMetrics(energyStats) {
        const metrics = {};
        for (const [energy, stats] of Object.entries(energyStats)) {
            metrics[energy] = {
                usage_count: stats.count,
                success_rate: stats.success_count / stats.count,
                avg_rating: stats.ratings.length > 0 ? 
                    stats.ratings.reduce((a, b) => a + b, 0) / stats.ratings.length : null
            };
        }
        return metrics;
    }

    /**
     * Identify peak performance hours
     * @param {object} hourlyStats - Hourly statistics
     * @returns {Array} - Peak performance hours
     */
    identifyPeakHours(hourlyStats) {
        const hourMetrics = this.calculateHourlyMetrics(hourlyStats);
        
        return Object.entries(hourMetrics)
            .filter(([, metrics]) => metrics.success_rate > 0.8 && metrics.usage_count >= 3)
            .sort(([,a], [,b]) => (b.success_rate + (b.avg_rating || 0)) - (a.success_rate + (a.avg_rating || 0)))
            .slice(0, 3)
            .map(([hour]) => parseInt(hour));
    }

    /**
     * Generate time-based recommendations
     * @param {object} hourlyStats - Hourly statistics
     * @param {object} energyStats - Energy statistics
     * @returns {Array} - Time-based recommendations
     */
    generateTimeRecommendations(hourlyStats, energyStats) {
        const recommendations = [];
        
        // Find best energy level
        const energyMetrics = this.calculateEnergyMetrics(energyStats);
        const bestEnergy = Object.entries(energyMetrics)
            .sort(([,a], [,b]) => b.success_rate - a.success_rate)[0];
        
        if (bestEnergy && bestEnergy[1].success_rate > 0.8) {
            recommendations.push(`Best performance during ${bestEnergy[0]} energy periods`);
        }
        
        return recommendations;
    }

    /**
     * Calculate cognitive metrics
     * @param {object} cognitiveStats - Cognitive statistics
     * @returns {object} - Cognitive metrics
     */
    calculateCognitiveMetrics(cognitiveStats) {
        const metrics = {};
        for (const [level, stats] of Object.entries(cognitiveStats)) {
            metrics[level] = {
                usage_count: stats.count,
                success_rate: stats.success_count / stats.count,
                avg_rating: stats.ratings.length > 0 ? 
                    stats.ratings.reduce((a, b) => a + b, 0) / stats.ratings.length : null
            };
        }
        return metrics;
    }

    /**
     * Generate cognitive insights
     * @param {object} capacityStats - Capacity statistics
     * @param {object} alignmentStats - Alignment statistics
     * @returns {Array} - Cognitive insights
     */
    generateCognitiveInsights(capacityStats, alignmentStats) {
        const insights = [];
        
        const capacityMetrics = this.calculateCognitiveMetrics(capacityStats);
        const bestCapacity = Object.entries(capacityMetrics)
            .sort(([,a], [,b]) => b.success_rate - a.success_rate)[0];
        
        if (bestCapacity && bestCapacity[1].success_rate > 0.8) {
            insights.push(`Best performance with ${bestCapacity[0]} cognitive capacity`);
        }
        
        return insights;
    }

    /**
     * Analyze error patterns
     * @param {Array} performanceData - Performance data
     * @returns {Array} - Error patterns
     */
    analyzeErrorPatterns(performanceData) {
        const errorTypes = performanceData
            .filter(record => !record.success && record.error_type)
            .map(record => record.error_type);
        
        return this.getTopErrors(errorTypes);
    }

    /**
     * Analyze quality patterns
     * @param {Array} performanceData - Performance data
     * @returns {object} - Quality analysis
     */
    analyzeQualityPatterns(performanceData) {
        // Analyze patterns in response quality, user ratings, etc.
        // This would be expanded based on specific quality metrics
        return {
            avg_quality_score: 0.7, // Placeholder
            quality_trends: 'stable' // Placeholder
        };
    }

    /**
     * Close database connections
     */
    async close() {
        if (this.dbManager) {
            await this.dbManager.close();
        }
    }
}

module.exports = PerformanceLogger;

// #endregion end: Performance Logger for Smart Routing Engine