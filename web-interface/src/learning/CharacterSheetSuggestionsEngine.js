// Character Sheet Suggestions Engine
// Generates smart recommendations for updating user preferences based on learned patterns

const DatabaseManager = require('../../../database/DatabaseManager');
const PreferenceDriftDetector = require('./PreferenceDriftDetector');

class CharacterSheetSuggestionsEngine {
    constructor() {
        this.dbManager = new DatabaseManager();
        this.driftDetector = new PreferenceDriftDetector();
        
        // Thresholds for generating suggestions
        this.minConfidenceThreshold = 0.75;
        this.minImpactThreshold = 0.2;
        this.minSampleSize = 8;
    }

    /**
     * Generate character sheet suggestions based on learning patterns
     * @param {object} options - Generation options
     * @returns {Promise<Object>} Generated suggestions
     */
    async generateSuggestions(options = {}) {
        await this.dbManager.initialize();
        
        try {
            // Get drift patterns from detector
            const driftAnalysis = await this.driftDetector.analyzeDrift(options.timeframe || '30d');
            
            // Get existing character sheet
            const characterSheet = await this.getCurrentCharacterSheet();
            if (!characterSheet) {
                throw new Error('Character sheet not found');
            }
            
            // Generate suggestions from patterns
            const suggestions = [];
            
            for (const pattern of driftAnalysis.driftPatterns) {
                if (this.shouldGenerateSuggestion(pattern)) {
                    const suggestion = await this.createSuggestionFromPattern(pattern, characterSheet);
                    if (suggestion) {
                        suggestions.push(suggestion);
                    }
                }
            }
            
            // Store suggestions in database
            for (const suggestion of suggestions) {
                await this.storeSuggestion(suggestion);
            }
            
            // Update learning progress metrics
            await this.updateGenerationMetrics(suggestions.length);
            
            return {
                suggestions: suggestions.sort((a, b) => 
                    (b.confidence * b.priority) - (a.confidence * a.priority)
                ),
                generatedAt: new Date().toISOString(),
                totalSuggestions: suggestions.length,
                source: 'preference_drift_analysis'
            };
            
        } finally {
            await this.dbManager.close();
        }
    }

    /**
     * Get pending suggestions from database
     * @returns {Promise<Array>} Pending suggestions
     */
    async getPendingSuggestions() {
        await this.dbManager.initialize();
        
        try {
            const rawSuggestions = await this.dbManager.getPendingCharacterSheetSuggestions();
            
            // Enrich with additional context
            const enrichedSuggestions = rawSuggestions.map(suggestion => ({
                ...suggestion,
                supporting_evidence: JSON.parse(suggestion.supporting_evidence || '{}'),
                actionable: true,
                category: this.categorizeSuggestion(suggestion.suggestion_type),
                urgency: this.calculateUrgency(suggestion)
            }));
            
            return enrichedSuggestions;
        } finally {
            await this.dbManager.close();
        }
    }

    /**
     * Accept a character sheet suggestion and apply it
     * @param {number} suggestionId - ID of suggestion to accept
     * @param {boolean} applyImmediately - Whether to apply the change immediately
     * @returns {Promise<Object>} Application result
     */
    async acceptSuggestion(suggestionId, applyImmediately = true) {
        await this.dbManager.initialize();
        
        try {
            // Get the suggestion
            const suggestions = await this.dbManager.getPendingCharacterSheetSuggestions();
            const suggestion = suggestions.find(s => s.id === suggestionId);
            
            if (!suggestion) {
                throw new Error(`Suggestion ${suggestionId} not found`);
            }
            
            // Update suggestion status
            await this.dbManager.updateSuggestionStatus(suggestionId, 'accepted');
            
            let applicationResult = { applied: false, error: null };
            
            if (applyImmediately) {
                // Apply the change to character sheet
                applicationResult = await this.applySuggestionToCharacterSheet(suggestion);
                
                if (applicationResult.applied) {
                    // Mark as applied
                    await this.dbManager._query(
                        'UPDATE character_sheet_suggestions SET applied_at = CURRENT_TIMESTAMP WHERE id = ?',
                        [suggestionId]
                    );
                    
                    // Update learning progress
                    await this.updateAcceptanceMetrics();
                    
                    // Check for achievements
                    await this.checkSuggestionAchievements();
                }
            }
            
            return {
                suggestionId,
                status: 'accepted',
                applied: applicationResult.applied,
                error: applicationResult.error,
                message: `Suggestion accepted${applicationResult.applied ? ' and applied' : ''}`
            };
            
        } finally {
            await this.dbManager.close();
        }
    }

    /**
     * Reject a character sheet suggestion
     * @param {number} suggestionId - ID of suggestion to reject
     * @param {string} reason - Reason for rejection
     * @returns {Promise<Object>} Rejection result
     */
    async rejectSuggestion(suggestionId, reason = null) {
        await this.dbManager.initialize();
        
        try {
            await this.dbManager.updateSuggestionStatus(suggestionId, 'rejected');
            
            // Log rejection reason for learning
            if (reason) {
                await this.dbManager._query(
                    'UPDATE character_sheet_suggestions SET rejection_reason = ? WHERE id = ?',
                    [reason, suggestionId]
                );
            }
            
            return {
                suggestionId,
                status: 'rejected',
                message: 'Suggestion rejected'
            };
            
        } finally {
            await this.dbManager.close();
        }
    }

    // Private methods

    /**
     * Check if pattern warrants a suggestion
     */
    shouldGenerateSuggestion(pattern) {
        return pattern.confidence >= this.minConfidenceThreshold &&
               pattern.driftMagnitude >= this.minImpactThreshold &&
               pattern.occurrences >= this.minSampleSize;
    }

    /**
     * Create suggestion object from drift pattern
     */
    async createSuggestionFromPattern(pattern, characterSheet) {
        const settingPath = `task_type_preferences.${pattern.taskType}`;
        const currentValue = characterSheet.task_type_preferences[pattern.taskType];
        
        // Don't suggest if already matches
        if (currentValue === pattern.actualUsagePattern) {
            return null;
        }
        
        const suggestion = {
            type: 'task_preference_update',
            current: `${pattern.taskType}: ${currentValue}`,
            suggested: `${pattern.taskType}: ${pattern.actualUsagePattern}`,
            settingPath,
            currentValue,
            suggestedValue: pattern.actualUsagePattern,
            reasoning: this.generateDetailedReasoning(pattern),
            confidence: pattern.confidence,
            estimatedImprovement: pattern.estimatedImprovement,
            priority: this.calculatePriority(pattern),
            
            // Supporting evidence
            supportingEvidence: {
                totalDecisions: pattern.occurrences,
                preferredModelUsage: Math.round(pattern.preferredModelUsageRate * 100),
                actualModelUsage: Math.round(pattern.actualModelUsageRate * 100),
                driftMagnitude: Math.round(pattern.driftMagnitude * 100),
                timespan: pattern.timespan,
                avgConfidence: pattern.supportingData.avgConfidenceScore
            },
            
            // Categories for UI
            category: 'Model Preferences',
            tags: ['routing', 'efficiency', 'preferences'],
            
            // Impact estimation
            impactAreas: ['routing_speed', 'model_accuracy', 'user_satisfaction'],
            riskLevel: this.assessRisk(pattern)
        };
        
        return suggestion;
    }

    /**
     * Generate detailed reasoning for suggestion
     */
    generateDetailedReasoning(pattern) {
        const usage = Math.round(pattern.actualModelUsageRate * 100);
        const timespan = pattern.timespan;
        
        return `Over the past ${timespan}, you've chosen ${pattern.actualUsagePattern} for ${pattern.taskType} tasks ${usage}% of the time (${pattern.occurrences} decisions), while your character sheet preference is set to ${pattern.characterSheetPreference}. This suggests ${pattern.actualUsagePattern} better matches your actual workflow for this task type.`;
    }

    /**
     * Calculate suggestion priority
     */
    calculatePriority(pattern) {
        // Higher priority for larger drift and more occurrences
        const volumeFactor = Math.min(pattern.occurrences / 50, 1.0);
        const impactFactor = pattern.driftMagnitude;
        const confidenceFactor = pattern.confidence;
        
        return (volumeFactor * 0.3 + impactFactor * 0.4 + confidenceFactor * 0.3);
    }

    /**
     * Assess risk level of applying suggestion
     */
    assessRisk(pattern) {
        if (pattern.confidence > 0.9 && pattern.occurrences > 20) return 'low';
        if (pattern.confidence > 0.8 && pattern.occurrences > 10) return 'medium';
        return 'high';
    }

    /**
     * Store suggestion in database
     */
    async storeSuggestion(suggestion) {
        const suggestionData = {
            suggestion_type: suggestion.type,
            current_value: suggestion.currentValue,
            suggested_value: suggestion.suggestedValue,
            setting_path: suggestion.settingPath,
            reasoning: suggestion.reasoning,
            supporting_evidence: JSON.stringify(suggestion.supportingEvidence),
            confidence: suggestion.confidence,
            estimated_improvement: suggestion.estimatedImprovement,
            source_pattern_id: null // Could link to learning pattern if stored
        };
        
        const suggestionId = await this.dbManager.insertCharacterSheetSuggestion(suggestionData);
        suggestion.id = suggestionId;
        return suggestionId;
    }

    /**
     * Apply suggestion to character sheet
     */
    async applySuggestionToCharacterSheet(suggestion) {
        try {
            // Get current character sheet
            const characterSheet = await this.getCurrentCharacterSheet();
            if (!characterSheet) {
                return { applied: false, error: 'Character sheet not found' };
            }
            
            // Apply the change
            const pathParts = suggestion.setting_path.split('.');
            let current = characterSheet;
            
            // Navigate to parent object
            for (let i = 0; i < pathParts.length - 1; i++) {
                if (!current[pathParts[i]]) {
                    return { applied: false, error: `Path ${pathParts.slice(0, i + 1).join('.')} not found` };
                }
                current = current[pathParts[i]];
            }
            
            // Update the value
            const finalKey = pathParts[pathParts.length - 1];
            current[finalKey] = suggestion.suggested_value;
            
            // Save back to database
            await this.saveCharacterSheet(characterSheet);
            
            return { applied: true, error: null };
            
        } catch (error) {
            return { applied: false, error: error.message };
        }
    }

    /**
     * Get current character sheet from database
     */
    async getCurrentCharacterSheet() {
        return new Promise((resolve, reject) => {
            this.dbManager.db.get(
                'SELECT * FROM user_profile ORDER BY updated_at DESC LIMIT 1',
                (err, row) => {
                    if (err) reject(err);
                    else if (row) {
                        // Parse JSON fields
                        const sheet = { ...row };
                        try {
                            sheet.task_type_preferences = JSON.parse(row.task_type_preferences || '{}');
                            resolve(sheet);
                        } catch (e) {
                            reject(new Error('Failed to parse character sheet JSON'));
                        }
                    } else {
                        resolve(null);
                    }
                }
            );
        });
    }

    /**
     * Save character sheet back to database
     */
    async saveCharacterSheet(characterSheet) {
        const sql = `
            UPDATE user_profile 
            SET task_type_preferences = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        await this.dbManager._query(sql, [
            JSON.stringify(characterSheet.task_type_preferences),
            characterSheet.id
        ]);
    }

    /**
     * Categorize suggestion for UI organization
     */
    categorizeSuggestion(suggestionType) {
        const categories = {
            'task_preference_update': 'Model Preferences',
            'time_routing_change': 'Time-Based Routing',
            'fallback_adjustment': 'Fallback Behavior'
        };
        
        return categories[suggestionType] || 'Other';
    }

    /**
     * Calculate suggestion urgency
     */
    calculateUrgency(suggestion) {
        const age = (Date.now() - new Date(suggestion.created_at)) / (1000 * 60 * 60 * 24); // days
        const confidenceUrgency = suggestion.confidence > 0.9 ? 2 : 1;
        const ageUrgency = age > 7 ? 2 : 1;
        
        return confidenceUrgency * ageUrgency > 2 ? 'high' : 'normal';
    }

    /**
     * Update metrics when suggestions are generated
     */
    async updateGenerationMetrics(count) {
        const today = new Date().toISOString().split('T')[0];
        
        // Update or create today's learning progress
        const existingProgress = await this.dbManager._queryOne(
            'SELECT * FROM learning_progress WHERE date = ?',
            [today]
        );
        
        if (existingProgress) {
            await this.dbManager._query(
                'UPDATE learning_progress SET suggestions_generated = suggestions_generated + ? WHERE date = ?',
                [count, today]
            );
        } else {
            await this.dbManager.updateLearningProgress({
                date: today,
                suggestions_generated: count,
                routing_accuracy: 0.0,
                confidence_calibration_error: 0.0,
                preference_alignment_score: 0.0,
                new_patterns_detected: 0,
                patterns_validated: 0,
                suggestions_accepted: 0,
                character_sheet_changes: 0,
                response_time_improvement: 0.0,
                user_satisfaction_trend: 0.0,
                intelligence_score: 50.0
            });
        }
    }

    /**
     * Update metrics when suggestions are accepted
     */
    async updateAcceptanceMetrics() {
        const today = new Date().toISOString().split('T')[0];
        
        await this.dbManager._query(`
            UPDATE learning_progress 
            SET suggestions_accepted = suggestions_accepted + 1,
                character_sheet_changes = character_sheet_changes + 1
            WHERE date = ?
        `, [today]);
    }

    /**
     * Check and unlock achievements related to suggestions
     */
    async checkSuggestionAchievements() {
        // Check preference master achievement (5 accepted suggestions)
        const acceptedCount = await this.dbManager._queryOne(`
            SELECT COUNT(*) as count FROM character_sheet_suggestions 
            WHERE status = 'accepted'
        `);
        
        if (acceptedCount.count >= 5) {
            await this.dbManager.unlockAchievement('preference_master');
        }
    }
}

module.exports = CharacterSheetSuggestionsEngine;