// Preference Drift Detection Algorithm
// Identifies when actual usage patterns diverge from character sheet preferences

const DatabaseManager = require('../../../database/DatabaseManager');

class PreferenceDriftDetector {
    constructor() {
        this.dbManager = new DatabaseManager();
        this.minSampleSize = 5; // Minimum decisions needed to detect drift
        this.significanceThreshold = 0.3; // Minimum drift percentage to be significant
        this.confidenceThreshold = 0.7; // Minimum confidence for pattern reporting
    }

    /**
     * Analyze preference drift patterns
     * @param {string} timeframe - '7d', '14d', '30d'
     * @returns {Promise<Object>} Drift analysis results
     */
    async analyzeDrift(timeframe = '30d') {
        await this.dbManager.initialize();
        
        try {
            const driftPatterns = await this.detectDriftPatterns(timeframe);
            const processedPatterns = await this.processDriftPatterns(driftPatterns);
            
            // Store significant patterns in learning_patterns table
            await this.storeLearningPatterns(processedPatterns);
            
            return {
                driftPatterns: processedPatterns,
                analysisTimestamp: new Date().toISOString(),
                timeframe: timeframe,
                totalPatternsFound: processedPatterns.length
            };
        } finally {
            await this.dbManager.close();
        }
    }

    /**
     * Detect raw drift patterns from routing data
     */
    async detectDriftPatterns(timeframe) {
        const days = this.parseTimeframe(timeframe);
        
        // Get character sheet preferences
        const characterSheet = await this.getCharacterSheetPreferences();
        if (!characterSheet) {
            throw new Error('No character sheet found for drift analysis');
        }
        
        // Get actual routing decisions for the timeframe
        const routingData = await this.getRoutingData(days);
        
        // Group by task type and analyze drift
        const taskGroups = this.groupByTaskType(routingData);
        const driftPatterns = [];
        
        for (const [taskType, decisions] of Object.entries(taskGroups)) {
            if (decisions.length < this.minSampleSize) continue;
            
            const drift = this.calculateTaskTypeDrift(
                taskType, 
                decisions, 
                characterSheet.task_type_preferences
            );
            
            if (drift) {
                driftPatterns.push(drift);
            }
        }
        
        return driftPatterns;
    }

    /**
     * Calculate drift for a specific task type
     */
    calculateTaskTypeDrift(taskType, decisions, preferences) {
        // Get character sheet preference for this task type
        const preferredModel = preferences[taskType];
        if (!preferredModel) return null;
        
        // Count actual model usage
        const modelCounts = {};
        decisions.forEach(decision => {
            modelCounts[decision.chosen_model] = (modelCounts[decision.chosen_model] || 0) + 1;
        });
        
        // Find most used model
        const mostUsedModel = Object.keys(modelCounts).reduce((a, b) => 
            modelCounts[a] > modelCounts[b] ? a : b
        );
        
        // Calculate drift metrics
        const totalDecisions = decisions.length;
        const preferredModelUsage = modelCounts[preferredModel] || 0;
        const mostUsedModelUsage = modelCounts[mostUsedModel];
        
        const preferredUsageRate = preferredModelUsage / totalDecisions;
        const mostUsedUsageRate = mostUsedModelUsage / totalDecisions;
        
        // Significant drift if preferred model is used less than most used model
        const driftMagnitude = mostUsedUsageRate - preferredUsageRate;
        
        if (driftMagnitude > this.significanceThreshold && mostUsedModel !== preferredModel) {
            return {
                taskType,
                characterSheetPreference: preferredModel,
                actualUsagePattern: mostUsedModel,
                preferredModelUsageRate,
                actualModelUsageRate: mostUsedUsageRate,
                driftMagnitude,
                occurrences: totalDecisions,
                confidence: this.calculateDriftConfidence(decisions, mostUsedModel, preferredModel),
                timespan: this.getTimespanString(decisions),
                supportingData: {
                    allModelCounts: modelCounts,
                    decisionIds: decisions.map(d => d.id),
                    avgConfidenceScore: this.calculateAvgConfidence(decisions)
                }
            };
        }
        
        return null;
    }

    /**
     * Calculate confidence in drift detection
     */
    calculateDriftConfidence(decisions, actualModel, preferredModel) {
        const sampleSizeConfidence = Math.min(decisions.length / 20, 1.0); // Max confidence at 20+ samples
        
        // Calculate consistency of the drift pattern
        const actualModelCount = decisions.filter(d => d.chosen_model === actualModel).length;
        const consistencyScore = actualModelCount / decisions.length;
        
        // Factor in routing confidence scores
        const avgRoutingConfidence = this.calculateAvgConfidence(decisions);
        
        // Combined confidence score
        const combinedConfidence = (
            sampleSizeConfidence * 0.4 + 
            consistencyScore * 0.4 + 
            avgRoutingConfidence * 0.2
        );
        
        return Math.round(combinedConfidence * 100) / 100;
    }

    /**
     * Process and enrich drift patterns
     */
    async processDriftPatterns(rawPatterns) {
        const processedPatterns = [];
        
        for (const pattern of rawPatterns) {
            if (pattern.confidence >= this.confidenceThreshold) {
                // Enrich with additional context
                const enrichedPattern = {
                    ...pattern,
                    recommendation: this.generateRecommendation(pattern),
                    estimatedImprovement: this.estimateImprovement(pattern),
                    severity: this.calculateSeverity(pattern)
                };
                
                processedPatterns.push(enrichedPattern);
            }
        }
        
        // Sort by confidence and severity
        return processedPatterns.sort((a, b) => 
            (b.confidence * b.severity) - (a.confidence * a.severity)
        );
    }

    /**
     * Generate actionable recommendation for drift pattern
     */
    generateRecommendation(pattern) {
        const improvement = Math.round(pattern.driftMagnitude * 100);
        return `Consider updating character sheet: change ${pattern.taskType} preference from '${pattern.characterSheetPreference}' to '${pattern.actualUsagePattern}'. You've chosen ${pattern.actualUsagePattern} ${improvement}% more often than your stated preference.`;
    }

    /**
     * Estimate improvement from addressing drift
     */
    estimateImprovement(pattern) {
        const routingSpeedImprovement = Math.round(pattern.driftMagnitude * 15); // Faster routing decisions
        const accuracyImprovement = Math.round(pattern.confidence * 25); // Better accuracy
        
        return `${routingSpeedImprovement}% faster routing, ${accuracyImprovement}% better accuracy`;
    }

    /**
     * Calculate severity of drift (for prioritization)
     */
    calculateSeverity(pattern) {
        // Higher severity for larger drift magnitude and more occurrences
        const magnitudeFactor = pattern.driftMagnitude;
        const volumeFactor = Math.min(pattern.occurrences / 50, 1.0);
        
        return magnitudeFactor * volumeFactor;
    }

    /**
     * Store significant patterns in database
     */
    async storeLearningPatterns(patterns) {
        for (const pattern of patterns) {
            const patternData = {
                pattern_type: 'preference_drift',
                pattern_data: JSON.stringify(pattern),
                confidence: pattern.confidence,
                sample_size: pattern.occurrences,
                first_observed: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago approximation
                last_observed: new Date().toISOString(),
                evidence_strength: pattern.severity,
                impact_score: pattern.driftMagnitude,
                recommendation: pattern.recommendation
            };
            
            await this.dbManager.insertLearningPattern(patternData);
        }
    }

    // Helper methods
    parseTimeframe(timeframe) {
        const match = timeframe.match(/(\d+)([dw])/);
        if (!match) return 30;
        
        const value = parseInt(match[1]);
        const unit = match[2];
        
        return unit === 'w' ? value * 7 : value;
    }

    async getCharacterSheetPreferences() {
        return new Promise((resolve, reject) => {
            this.dbManager.db.get(
                'SELECT task_type_preferences FROM user_profile ORDER BY updated_at DESC LIMIT 1',
                (err, row) => {
                    if (err) reject(err);
                    else if (row) {
                        try {
                            resolve(JSON.parse(row.task_type_preferences));
                        } catch (e) {
                            reject(new Error('Failed to parse task_type_preferences JSON'));
                        }
                    } else {
                        resolve(null);
                    }
                }
            );
        });
    }

    async getRoutingData(days) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT id, task_type, chosen_model, confidence_score, timestamp
                FROM routing_decisions 
                WHERE timestamp >= datetime('now', '-${days} days')
                ORDER BY timestamp DESC
            `;
            
            this.dbManager.db.all(sql, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    groupByTaskType(routingData) {
        return routingData.reduce((groups, decision) => {
            const taskType = decision.task_type;
            if (!groups[taskType]) groups[taskType] = [];
            groups[taskType].push(decision);
            return groups;
        }, {});
    }

    calculateAvgConfidence(decisions) {
        if (decisions.length === 0) return 0;
        
        const validConfidences = decisions
            .filter(d => d.confidence_score !== null)
            .map(d => d.confidence_score);
            
        if (validConfidences.length === 0) return 0.5; // Default confidence
        
        return validConfidences.reduce((sum, conf) => sum + conf, 0) / validConfidences.length;
    }

    getTimespanString(decisions) {
        if (decisions.length === 0) return 'unknown';
        
        const timestamps = decisions.map(d => new Date(d.timestamp));
        const earliest = new Date(Math.min(...timestamps));
        const latest = new Date(Math.max(...timestamps));
        
        const daysDiff = Math.ceil((latest - earliest) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= 7) return `${daysDiff} days`;
        if (daysDiff <= 30) return `${Math.ceil(daysDiff / 7)} weeks`;
        return `${Math.ceil(daysDiff / 30)} months`;
    }
}

module.exports = PreferenceDriftDetector;