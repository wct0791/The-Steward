const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

/**
 * Database Manager for The Steward
 * Provides high-level interface for all database operations
 * No SQL knowledge required - handles all database interactions
 */
class DatabaseManager {
    constructor(dbPath = null) {
        this.dbPath = dbPath || path.join(__dirname, 'steward.db');
        this.db = null;
        this.isConnected = false;
    }

    /**
     * Initialize database connection
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.isConnected) {
            return;
        }

        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    reject(new Error(`Database connection failed: ${err.message}`));
                } else {
                    this.db.run('PRAGMA foreign_keys = ON');
                    this.isConnected = true;
                    resolve();
                }
            });
        });
    }

    /**
     * Close database connection
     * @returns {Promise<void>}
     */
    async close() {
        if (!this.isConnected || !this.db) {
            return;
        }

        return new Promise((resolve) => {
            this.db.close((err) => {
                if (err) {
                    console.warn('Database close warning:', err.message);
                }
                this.isConnected = false;
                resolve();
            });
        });
    }

    /**
     * Execute a query with parameters
     * @private
     */
    async _query(sql, params = []) {
        await this.initialize();
        
        return new Promise((resolve, reject) => {
            if (sql.trim().toUpperCase().startsWith('SELECT')) {
                this.db.all(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            } else {
                this.db.run(sql, params, function(err) {
                    if (err) reject(err);
                    else resolve({ lastID: this.lastID, changes: this.changes });
                });
            }
        });
    }

    /**
     * Execute a single-row query
     * @private
     */
    async _queryOne(sql, params = []) {
        await this.initialize();
        
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row || null);
            });
        });
    }

    // ==========================================
    // USER PROFILE OPERATIONS
    // ==========================================

    /**
     * Create or update user profile from character sheet data
     * @param {object} characterData - Parsed character sheet data
     * @returns {Promise<number>} User profile ID
     */
    async saveUserProfile(characterData) {
        const {
            name, roles, learning_goals, current_projects,
            tone_preference, neurotype_style, preferred_formats,
            default_output_format, default_verbosity, copilot_comments_format,
            abilities, preferences, tools_environment,
            task_type_preferences, fallback_behavior, loadouts,
            active_memory, model_endpoints,
            time_of_day_profile, cognitive_patterns
        } = characterData;

        // Check if user profile exists
        const existing = await this._queryOne('SELECT id FROM user_profile WHERE name = ?', [name]);

        const profileData = [
            name,
            JSON.stringify(roles || []),
            JSON.stringify(learning_goals || []),
            JSON.stringify(current_projects || []),
            tone_preference,
            neurotype_style,
            JSON.stringify(preferred_formats || []),
            default_output_format,
            default_verbosity,
            copilot_comments_format,
            JSON.stringify(abilities || {}),
            JSON.stringify(preferences || {}),
            JSON.stringify(tools_environment || {}),
            JSON.stringify(task_type_preferences || {}),
            JSON.stringify(fallback_behavior || {}),
            JSON.stringify(loadouts || {}),
            JSON.stringify(active_memory || []),
            JSON.stringify(model_endpoints || {}),
            JSON.stringify(time_of_day_profile || {}),
            JSON.stringify(cognitive_patterns || {}),
            1 // profile_version
        ];

        if (existing) {
            // Update existing profile
            const sql = `UPDATE user_profile SET 
                roles=?, learning_goals=?, current_projects=?, tone_preference=?, neurotype_style=?,
                preferred_formats=?, default_output_format=?, default_verbosity=?, copilot_comments_format=?,
                abilities=?, preferences=?, tools_environment=?, task_type_preferences=?, fallback_behavior=?,
                loadouts=?, active_memory=?, model_endpoints=?, time_of_day_profile=?, cognitive_patterns=?,
                profile_version=?, updated_at=CURRENT_TIMESTAMP
                WHERE name=?`;
            
            const params = [...profileData.slice(1), name];
            await this._query(sql, params);
            return existing.id;
        } else {
            // Insert new profile
            const sql = `INSERT INTO user_profile (
                name, roles, learning_goals, current_projects, tone_preference, neurotype_style,
                preferred_formats, default_output_format, default_verbosity, copilot_comments_format,
                abilities, preferences, tools_environment, task_type_preferences, fallback_behavior,
                loadouts, active_memory, model_endpoints, time_of_day_profile, cognitive_patterns,
                profile_version
            ) VALUES (${new Array(21).fill('?').join(',')})`;
            
            const result = await this._query(sql, profileData);
            return result.lastID;
        }
    }

    /**
     * Get user profile by name
     * @param {string} name - User name
     * @returns {Promise<object|null>} User profile data
     */
    async getUserProfile(name) {
        const profile = await this._queryOne('SELECT * FROM user_profile WHERE name = ?', [name]);
        if (!profile) return null;

        // Parse JSON fields
        const jsonFields = [
            'roles', 'learning_goals', 'current_projects', 'preferred_formats',
            'abilities', 'preferences', 'tools_environment', 'task_type_preferences',
            'fallback_behavior', 'loadouts', 'active_memory', 'model_endpoints',
            'time_of_day_profile', 'cognitive_patterns'
        ];

        for (const field of jsonFields) {
            if (profile[field]) {
                try {
                    profile[field] = JSON.parse(profile[field]);
                } catch (e) {
                    console.warn(`Failed to parse ${field} field:`, e.message);
                    profile[field] = null;
                }
            }
        }

        return profile;
    }

    // ==========================================
    // PERFORMANCE TRACKING OPERATIONS
    // ==========================================

    /**
     * Log model performance data
     * @param {object} performanceData - Performance metrics
     * @returns {Promise<number>} Performance record ID
     */
    async logPerformance({
        model_name, adapter_type, task_type,
        response_time_ms, tokens_prompt, tokens_completion, tokens_total,
        success, error_type, error_message,
        prompt_length, response_length, temperature, max_tokens,
        user_rating, session_id, user_context
    }) {
        const now = new Date();
        const hour_of_day = now.getHours();
        const day_of_week = now.getDay();

        const sql = `INSERT INTO model_performance (
            model_name, adapter_type, task_type, response_time_ms,
            tokens_prompt, tokens_completion, tokens_total,
            success, error_type, error_message,
            prompt_length, response_length, temperature, max_tokens,
            hour_of_day, day_of_week, user_rating, session_id, user_context
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const params = [
            model_name, adapter_type, task_type, response_time_ms,
            tokens_prompt, tokens_completion, tokens_total,
            success, error_type, error_message,
            prompt_length, response_length, temperature, max_tokens,
            hour_of_day, day_of_week, user_rating, session_id,
            user_context ? JSON.stringify(user_context) : null
        ];

        const result = await this._query(sql, params);
        return result.lastID;
    }

    /**
     * Log routing decision
     * @param {object} routingData - Routing decision data
     * @returns {Promise<number>} Routing decision ID
     */
    async logRoutingDecision({
        task_type, prompt_snippet, chosen_model, routing_reason,
        alternatives_considered, user_loadout, fallback_triggered,
        confidence_score, performance_id
    }) {
        const now = new Date();
        const hour_of_day = now.getHours();

        const sql = `INSERT INTO routing_decisions (
            task_type, prompt_snippet, chosen_model, routing_reason,
            alternatives_considered, time_of_day, user_loadout, fallback_triggered,
            confidence_score, performance_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const params = [
            task_type, prompt_snippet, chosen_model, routing_reason,
            JSON.stringify(alternatives_considered || []), hour_of_day,
            user_loadout, fallback_triggered, confidence_score, performance_id
        ];

        const result = await this._query(sql, params);
        return result.lastID;
    }

    /**
     * Get performance statistics for a model
     * @param {string} modelName - Name of the model
     * @param {number} days - Number of days to look back (default: 30)
     * @returns {Promise<object>} Performance statistics
     */
    async getModelPerformance(modelName, days = 30) {
        const sql = `
            SELECT 
                COUNT(*) as total_requests,
                AVG(response_time_ms) as avg_response_time,
                AVG(CASE WHEN success THEN 1.0 ELSE 0.0 END) as success_rate,
                AVG(tokens_total) as avg_tokens,
                AVG(user_rating) as avg_rating,
                COUNT(CASE WHEN user_rating IS NOT NULL THEN 1 END) as rated_requests
            FROM model_performance 
            WHERE model_name = ? AND timestamp > datetime('now', '-' || ? || ' days')
        `;

        return await this._queryOne(sql, [modelName, days]);
    }

    /**
     * Get task type performance across all models
     * @param {string} taskType - Type of task
     * @param {number} days - Number of days to look back (default: 30)
     * @returns {Promise<Array>} Performance by model for this task type
     */
    async getTaskTypePerformance(taskType, days = 30) {
        const sql = `
            SELECT 
                model_name,
                COUNT(*) as request_count,
                AVG(response_time_ms) as avg_response_time,
                AVG(CASE WHEN success THEN 1.0 ELSE 0.0 END) as success_rate,
                AVG(user_rating) as avg_rating
            FROM model_performance 
            WHERE task_type = ? AND timestamp > datetime('now', '-' || ? || ' days')
            GROUP BY model_name
            ORDER BY request_count DESC
        `;

        return await this._query(sql, [taskType, days]);
    }

    // ==========================================
    // FEEDBACK OPERATIONS
    // ==========================================

    /**
     * Store user feedback
     * @param {object} feedbackData - User feedback
     * @returns {Promise<number>} Feedback ID
     */
    async storeFeedback({
        performance_id, routing_id, satisfaction_rating, quality_rating, speed_rating,
        feedback_text, suggested_improvements, correction_provided,
        original_output, corrected_output, preferred_model, routing_feedback
    }) {
        const sql = `INSERT INTO user_feedback (
            performance_id, routing_id, satisfaction_rating, quality_rating, speed_rating,
            feedback_text, suggested_improvements, correction_provided,
            original_output, corrected_output, preferred_model, routing_feedback
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const params = [
            performance_id, routing_id, satisfaction_rating, quality_rating, speed_rating,
            feedback_text, suggested_improvements, correction_provided,
            original_output, corrected_output, preferred_model, routing_feedback
        ];

        const result = await this._query(sql, params);
        return result.lastID;
    }

    // ==========================================
    // LEARNING INSIGHTS OPERATIONS
    // ==========================================

    /**
     * Store a learning insight
     * @param {object} insightData - Learning insight data
     * @returns {Promise<number>} Insight ID
     */
    async storeLearningInsight({
        insight_type, confidence, pattern_description, pattern_data,
        sample_size, evidence_period_start, evidence_period_end,
        recommendation
    }) {
        const sql = `INSERT INTO learning_insights (
            insight_type, confidence, pattern_description, pattern_data,
            sample_size, evidence_period_start, evidence_period_end,
            recommendation
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        const params = [
            insight_type, confidence, pattern_description, JSON.stringify(pattern_data),
            sample_size, evidence_period_start, evidence_period_end, recommendation
        ];

        const result = await this._query(sql, params);
        return result.lastID;
    }

    /**
     * Get actionable insights that haven't been implemented
     * @returns {Promise<Array>} Unimplemented insights
     */
    async getActionableInsights() {
        const sql = `
            SELECT * FROM learning_insights 
            WHERE implemented = FALSE AND superseded_by IS NULL
            ORDER BY confidence DESC, timestamp DESC
        `;

        const insights = await this._query(sql);
        return insights.map(insight => {
            if (insight.pattern_data) {
                try {
                    insight.pattern_data = JSON.parse(insight.pattern_data);
                } catch (e) {
                    console.warn('Failed to parse pattern_data:', e.message);
                }
            }
            return insight;
        });
    }

    // ==========================================
    // JOURNAL OPERATIONS (Future Feature)
    // ==========================================

    /**
     * Create or update journal entry for a date
     * @param {string} date - Date in YYYY-MM-DD format
     * @param {object} journalData - Journal entry data
     * @returns {Promise<void>}
     */
    async saveJournalEntry(date, journalData) {
        const {
            energy_level, mood, frustration_level, productive_hours,
            preferred_task_types, workflow_notes, goals_set, goals_achieved,
            blockers_encountered, ai_requests_count, most_helpful_model,
            least_helpful_model, process_improvements, tools_used,
            learning_moments, daily_reflection, tomorrow_focus
        } = journalData;

        // Calculate word count and completion percentage
        const textFields = [workflow_notes, daily_reflection, tomorrow_focus].filter(Boolean);
        const word_count = textFields.join(' ').split(/\s+/).length;
        
        const totalFields = Object.keys(journalData).length;
        const filledFields = Object.values(journalData).filter(val => val !== null && val !== undefined && val !== '').length;
        const completion_percentage = filledFields / totalFields;

        const sql = `INSERT OR REPLACE INTO journal_entries (
            date, energy_level, mood, frustration_level, productive_hours,
            preferred_task_types, workflow_notes, goals_set, goals_achieved,
            blockers_encountered, ai_requests_count, most_helpful_model,
            least_helpful_model, process_improvements, tools_used,
            learning_moments, daily_reflection, tomorrow_focus,
            word_count, completion_percentage, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;

        const params = [
            date, energy_level, mood, frustration_level,
            JSON.stringify(productive_hours || []),
            JSON.stringify(preferred_task_types || []),
            workflow_notes,
            JSON.stringify(goals_set || []),
            JSON.stringify(goals_achieved || []),
            JSON.stringify(blockers_encountered || []),
            ai_requests_count, most_helpful_model, least_helpful_model,
            JSON.stringify(process_improvements || []),
            JSON.stringify(tools_used || []),
            JSON.stringify(learning_moments || []),
            daily_reflection, tomorrow_focus,
            word_count, completion_percentage
        ];

        await this._query(sql, params);
    }

    // ==========================================
    // ANALYTICS AND REPORTING
    // ==========================================

    /**
     * Get usage summary for the last N days
     * @param {number} days - Number of days to analyze
     * @returns {Promise<object>} Usage summary
     */
    async getUsageSummary(days = 7) {
        const performanceSQL = `
            SELECT 
                COUNT(*) as total_requests,
                COUNT(DISTINCT model_name) as unique_models,
                AVG(response_time_ms) as avg_response_time,
                SUM(tokens_total) as total_tokens,
                AVG(CASE WHEN success THEN 1.0 ELSE 0.0 END) as overall_success_rate,
                AVG(user_rating) as avg_user_rating
            FROM model_performance 
            WHERE timestamp > datetime('now', '-' || ? || ' days')
        `;

        const topModelsSQL = `
            SELECT 
                model_name,
                COUNT(*) as usage_count,
                AVG(user_rating) as avg_rating
            FROM model_performance 
            WHERE timestamp > datetime('now', '-' || ? || ' days') AND success = TRUE
            GROUP BY model_name
            ORDER BY usage_count DESC
            LIMIT 5
        `;

        const [summary] = await Promise.all([
            this._queryOne(performanceSQL, [days]),
            this._query(topModelsSQL, [days])
        ]);

        const topModels = await this._query(topModelsSQL, [days]);

        return {
            period_days: days,
            ...summary,
            top_models: topModels
        };
    }

    /**
     * Get model recommendations based on historical performance
     * @param {string} taskType - Type of task
     * @returns {Promise<Array>} Recommended models in order of preference
     */
    async getModelRecommendations(taskType) {
        const sql = `
            SELECT 
                model_name,
                COUNT(*) as usage_count,
                AVG(CASE WHEN success THEN 1.0 ELSE 0.0 END) as success_rate,
                AVG(response_time_ms) as avg_response_time,
                AVG(user_rating) as avg_rating,
                -- Composite score: success_rate * 0.4 + (1/avg_response_time) * 0.2 + avg_rating * 0.4
                (AVG(CASE WHEN success THEN 1.0 ELSE 0.0 END) * 0.4 + 
                 (1000.0 / NULLIF(AVG(response_time_ms), 0)) * 0.2 + 
                 COALESCE(AVG(user_rating), 3.0) * 0.08) as composite_score
            FROM model_performance
            WHERE task_type = ? AND timestamp > datetime('now', '-30 days')
            GROUP BY model_name
            HAVING usage_count >= 3
            ORDER BY composite_score DESC
        `;

        return await this._query(sql, [taskType]);
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================

    /**
     * Generate a session ID for grouping related requests
     * @returns {string} Session ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Clean up old data based on retention policies
     * @param {object} retentionPolicies - Days to keep data for each table
     * @returns {Promise<object>} Cleanup summary
     */
    async cleanupOldData(retentionPolicies = {}) {
        const defaults = {
            model_performance: 90,
            routing_decisions: 90,
            user_feedback: 365,
            learning_insights: null, // Keep forever
            journal_entries: null,   // Keep forever
            context_data: 30
        };

        const policies = { ...defaults, ...retentionPolicies };
        const summary = {};

        for (const [table, days] of Object.entries(policies)) {
            if (days === null) continue; // Skip tables that should be kept forever

            const sql = `DELETE FROM ${table} WHERE timestamp < datetime('now', '-' || ? || ' days')`;
            const result = await this._query(sql, [days]);
            summary[table] = result.changes;
        }

        return summary;
    }
}

module.exports = DatabaseManager;