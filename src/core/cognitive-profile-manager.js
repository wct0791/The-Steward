// #region start: Cognitive Profile Manager
// Advanced cognitive profiling with certainty thresholds, risk preferences, and adaptive learning
// Tailored for Chip's ADHD-aware, clarity-first neurotype and developer workflow

const fs = require('fs');
const path = require('path');

/**
 * Cognitive Profile Manager
 * Manages user cognitive patterns, certainty thresholds, risk preferences, and decision-making styles
 */
class CognitiveProfileManager {
    constructor() {
        this.defaultCognitiveProfile = this.getDefaultCognitiveProfile();
        this.cognitiveProfile = null;
        this.adaptiveLearning = true;
        this.learningHistory = [];
    }

    /**
     * Load cognitive profile from character sheet or database
     * @param {object} characterSheet - User's character sheet data
     * @returns {Promise<object>} - Loaded cognitive profile
     */
    async loadCognitiveProfile(characterSheet) {
        try {
            // Extract cognitive profile from character sheet
            if (characterSheet && characterSheet.cognitive_patterns) {
                this.cognitiveProfile = this.parseCognitivePatterns(characterSheet.cognitive_patterns);
            } else {
                // Generate from character sheet data
                this.cognitiveProfile = this.generateCognitiveProfile(characterSheet);
            }
            
            // Apply defaults for missing fields
            this.cognitiveProfile = {
                ...this.defaultCognitiveProfile,
                ...this.cognitiveProfile
            };
            
            return this.cognitiveProfile;
            
        } catch (error) {
            console.warn('Failed to load cognitive profile, using defaults:', error.message);
            this.cognitiveProfile = this.defaultCognitiveProfile;
            return this.cognitiveProfile;
        }
    }

    /**
     * Generate cognitive profile from character sheet data
     * @param {object} characterSheet - Character sheet data
     * @returns {object} - Generated cognitive profile
     */
    generateCognitiveProfile(characterSheet) {
        const neurotype = (characterSheet?.neurotype_style || '').toLowerCase();
        const tonePreference = (characterSheet?.tone_preference || '').toLowerCase();
        const preferences = characterSheet?.preferences || {};
        
        return {
            // Neurotype-based settings
            neurotype_adaptations: {
                adhd_aware: neurotype.includes('adhd'),
                clarity_first: neurotype.includes('clarity'),
                scaffold_friendly: neurotype.includes('scaffold'),
                hyperfocus_capable: neurotype.includes('adhd'), // ADHD hyperfocus
                interruption_sensitive: neurotype.includes('adhd')
            },
            
            // Communication and processing preferences
            communication_style: {
                tone_preference: tonePreference,
                prefers_direct: tonePreference.includes('direct'),
                prefers_concise: tonePreference.includes('concise') || tonePreference.includes('brief'),
                whitespace_heavy: tonePreference.includes('whitespace'),
                markdown_friendly: preferences?.default_output_format === 'markdown'
            },
            
            // Certainty and decision-making thresholds
            certainty_thresholds: this.generateCertaintyThresholds(neurotype, preferences),
            
            // Risk preferences
            risk_preferences: this.generateRiskPreferences(characterSheet),
            
            // Cognitive load management
            cognitive_load_management: {
                max_simultaneous_concepts: neurotype.includes('adhd') ? 3 : 5,
                prefers_chunking: neurotype.includes('scaffold') || neurotype.includes('adhd'),
                context_switching_cost: neurotype.includes('adhd') ? 'high' : 'medium',
                attention_span_estimate: neurotype.includes('adhd') ? 'variable' : 'stable',
                hyperfocus_tendency: neurotype.includes('adhd')
            },
            
            // Task management preferences
            task_management: {
                prefers_explicit_instructions: preferences?.prompting_style?.includes('explicit'),
                task_first_approach: preferences?.prompting_style?.includes('task-first'),
                copilot_handoff_preferred: !!characterSheet?.copilot_comments_format,
                iterative_workflow: true, // Inferred from developer role
                memory_external_scaffolding: preferences?.memory_use?.toggle || false
            },
            
            // Learning and adaptation patterns
            learning_patterns: {
                learning_goals: characterSheet?.learning_goals || [],
                preferred_learning_style: 'iterative', // Inferred from ADHD-aware
                feedback_responsiveness: 'high',
                pattern_recognition_strength: 'high' // Developer background
            }
        };
    }

    /**
     * Generate certainty thresholds based on user characteristics
     * @param {string} neurotype - User neurotype style
     * @param {object} preferences - User preferences
     * @returns {object} - Certainty thresholds
     */
    generateCertaintyThresholds(neurotype, preferences) {
        // ADHD users often have different certainty needs
        const isAdhdAware = neurotype.includes('adhd');
        const isClarityFirst = neurotype.includes('clarity');
        
        return {
            // Decision confidence thresholds
            high_confidence_threshold: isClarityFirst ? 0.85 : 0.8,
            medium_confidence_threshold: isClarityFirst ? 0.7 : 0.6,
            low_confidence_threshold: isClarityFirst ? 0.5 : 0.4,
            
            // Action thresholds
            auto_proceed_threshold: isAdhdAware ? 0.7 : 0.8, // ADHD: lower threshold for action
            ask_for_clarification_threshold: isClarityFirst ? 0.6 : 0.5,
            refuse_task_threshold: 0.2,
            
            // Model selection thresholds
            prefer_familiar_model_threshold: isAdhdAware ? 0.6 : 0.5, // ADHD: prefer familiar
            try_new_model_threshold: 0.8,
            
            // Quality vs speed trade-offs
            quality_over_speed_threshold: isClarityFirst ? 0.3 : 0.5, // Clarity-first: lower speed tolerance
            speed_critical_threshold: isAdhdAware ? 0.4 : 0.6, // ADHD: needs faster responses
            
            // Uncertainty handling
            uncertainty_tolerance: {
                creative_tasks: 0.4, // Higher tolerance for creative uncertainty
                technical_tasks: isClarityFirst ? 0.2 : 0.3, // Lower tolerance for technical
                routine_tasks: 0.1, // Very low tolerance for routine tasks
                debugging_tasks: 0.3 // Medium tolerance, but need clear paths
            }
        };
    }

    /**
     * Generate risk preferences based on character sheet
     * @param {object} characterSheet - Character sheet data
     * @returns {object} - Risk preferences
     */
    generateRiskPreferences(characterSheet) {
        const fallbackBehavior = characterSheet?.fallback_behavior || {};
        const taskPreferences = characterSheet?.task_type_preferences || {};
        
        // Analyze existing preferences for risk patterns
        const usesLocalModels = Object.values(taskPreferences).some(model => 
            (model || '').includes('smol') || (model || '').includes('local'));
        const hasCloudFallback = fallbackBehavior?.cloud_failure === 'use_local_only';
        
        return {
            // Privacy and security risk preferences
            privacy_risk_tolerance: 'low', // Developer working on sensitive projects
            data_sharing_preference: hasCloudFallback ? 'local_first' : 'balanced',
            
            // Performance and reliability preferences
            performance_risk_tolerance: 'medium',
            prefer_proven_models: true, // Stability for work
            experimental_model_threshold: 0.8, // High threshold for trying new models
            
            // Cost and resource preferences
            cost_risk_tolerance: 'low', // Budget-conscious
            resource_usage_preference: 'efficient',
            
            // Quality vs speed risk preferences
            quality_degradation_tolerance: 'low', // High standards for work output
            response_time_tolerance: 'medium',
            
            // Fallback and error handling preferences
            cascade_failure_tolerance: 'low', // Need reliable fallbacks
            prefer_graceful_degradation: true,
            error_recovery_preference: 'automatic_with_notification',
            
            // Cognitive load risk preferences
            cognitive_overload_sensitivity: 'high', // ADHD consideration
            context_switching_penalty: 'high',
            decision_fatigue_threshold: 'medium'
        };
    }

    /**
     * Analyze cognitive state for routing decisions
     * @param {object} context - Current context (time, task, etc.)
     * @returns {object} - Cognitive state analysis
     */
    analyzeCognitiveState(context = {}) {
        const currentHour = context.current_hour || new Date().getHours();
        const taskType = context.task_type || 'unknown';
        const taskComplexity = context.task_complexity || { level: 'medium' };
        
        const profile = this.cognitiveProfile || this.defaultCognitiveProfile;
        
        // Determine current cognitive capacity
        const cognitiveCapacity = this.estimateCognitiveCapacity(currentHour, context);
        
        // Analyze cognitive-task alignment
        const taskAlignment = this.analyzeTaskCognitiveAlignment(taskType, taskComplexity, cognitiveCapacity);
        
        // Determine decision-making preferences for current state
        const decisionPreferences = this.determineDecisionPreferences(cognitiveCapacity, taskAlignment);
        
        // Generate routing implications
        const routingImplications = this.generateCognitiveRoutingImplications(
            cognitiveCapacity, 
            taskAlignment, 
            decisionPreferences
        );
        
        return {
            cognitive_capacity: cognitiveCapacity,
            task_alignment: taskAlignment,
            decision_preferences: decisionPreferences,
            routing_implications: routingImplications,
            confidence_adjustments: this.calculateConfidenceAdjustments(cognitiveCapacity, taskAlignment),
            recommendations: this.generateCognitiveRecommendations(cognitiveCapacity, taskType, taskComplexity)
        };
    }

    /**
     * Estimate current cognitive capacity
     * @param {number} currentHour - Current hour of day
     * @param {object} context - Additional context
     * @returns {object} - Cognitive capacity assessment
     */
    estimateCognitiveCapacity(currentHour, context = {}) {
        const profile = this.cognitiveProfile || this.defaultCognitiveProfile;
        
        // Time-based capacity estimation
        let baseCapacity = 0.7; // Default capacity
        
        // Peak hours adjustment (typical developer schedule)
        const peakHours = [9, 10, 11, 14, 15, 16];
        const lowHours = [13, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5];
        
        if (peakHours.includes(currentHour)) {
            baseCapacity = 0.9;
        } else if (lowHours.includes(currentHour)) {
            baseCapacity = 0.4;
        }
        
        // ADHD-specific adjustments
        if (profile.neurotype_adaptations.adhd_aware) {
            // ADHD: more variable capacity, potential for hyperfocus
            const hyperfocusPotential = context.task_type === 'code' || context.task_type === 'debug';
            if (hyperfocusPotential && baseCapacity > 0.6) {
                baseCapacity = Math.min(baseCapacity * 1.3, 1.0); // Hyperfocus boost
            } else if (currentHour >= 13 && currentHour <= 15) {
                baseCapacity *= 0.7; // Post-lunch energy dip more pronounced
            }
        }
        
        // Context adjustments
        if (context.interruptions_recent) {
            baseCapacity *= 0.8; // Interruption penalty
        }
        
        if (context.task_switching_recent) {
            baseCapacity *= profile.cognitive_load_management.context_switching_cost === 'high' ? 0.7 : 0.9;
        }
        
        return {
            level: baseCapacity >= 0.8 ? 'high' : baseCapacity >= 0.5 ? 'medium' : 'low',
            score: Math.max(0.1, Math.min(1.0, baseCapacity)),
            factors: {
                time_of_day: currentHour,
                base_capacity: baseCapacity,
                adhd_adjustments: profile.neurotype_adaptations.adhd_aware,
                hyperfocus_potential: profile.neurotype_adaptations.adhd_aware && 
                    (context.task_type === 'code' || context.task_type === 'debug'),
                context_penalties: {
                    interruptions: context.interruptions_recent || false,
                    task_switching: context.task_switching_recent || false
                }
            }
        };
    }

    /**
     * Analyze alignment between task and cognitive state
     * @param {string} taskType - Type of task
     * @param {object} taskComplexity - Task complexity analysis
     * @param {object} cognitiveCapacity - Current cognitive capacity
     * @returns {object} - Alignment analysis
     */
    analyzeTaskCognitiveAlignment(taskType, taskComplexity, cognitiveCapacity) {
        const profile = this.cognitiveProfile || this.defaultCognitiveProfile;
        
        let alignmentScore = 0.5; // Base alignment
        const alignmentFactors = [];
        const misalignments = [];
        
        // Complexity vs capacity alignment
        const complexityLevel = taskComplexity.level || 'medium';
        if (complexityLevel === 'high' && cognitiveCapacity.level === 'low') {
            alignmentScore -= 0.3;
            misalignments.push('High complexity task with low cognitive capacity');
        } else if (complexityLevel === 'low' && cognitiveCapacity.level === 'high') {
            alignmentScore += 0.1; // Slight bonus for easy task with high capacity
            alignmentFactors.push('Simple task with high capacity - efficient');
        } else if (complexityLevel === cognitiveCapacity.level) {
            alignmentScore += 0.2; // Good match
            alignmentFactors.push(`Task complexity matches cognitive capacity (${complexityLevel})`);
        }
        
        // ADHD-specific alignments
        if (profile.neurotype_adaptations?.adhd_aware) {
            const adhdFriendlyTasks = ['debug', 'code', 'quick_query'];
            const adhdChallengingTasks = ['research', 'analyze', 'write'];
            
            if (adhdFriendlyTasks.includes(taskType) && cognitiveCapacity.factors?.hyperfocus_potential) {
                alignmentScore += 0.3;
                alignmentFactors.push('ADHD hyperfocus-friendly task');
            } else if (adhdChallengingTasks.includes(taskType) && cognitiveCapacity.level === 'low') {
                alignmentScore -= 0.2;
                misalignments.push('ADHD challenging task with low capacity');
            }
        }
        
        // Clarity-first alignment
        if (profile.neurotype_adaptations?.clarity_first) {
            const clarityRequiredTasks = ['explain', 'debug', 'analyze'];
            if (clarityRequiredTasks.includes(taskType)) {
                alignmentScore += 0.1;
                alignmentFactors.push('Clarity-first preference matches task requirements');
            }
        }
        
        return {
            alignment_score: Math.max(0, Math.min(1, alignmentScore)),
            score: Math.max(0, Math.min(1, alignmentScore)), // Keep both for compatibility
            level: alignmentScore >= 0.7 ? 'high' : alignmentScore >= 0.4 ? 'medium' : 'low',
            factors: alignmentFactors,
            misalignments: misalignments,
            recommendations: this.generateAlignmentRecommendations(alignmentScore, misalignments)
        };
    }

    /**
     * Determine decision-making preferences for current cognitive state
     * @param {object} cognitiveCapacity - Cognitive capacity assessment
     * @param {object} taskAlignment - Task alignment analysis
     * @returns {object} - Decision preferences
     */
    determineDecisionPreferences(cognitiveCapacity, taskAlignment) {
        const profile = this.cognitiveProfile || this.defaultCognitiveProfile;
        const thresholds = profile.certainty_thresholds;
        const risks = profile.risk_preferences;
        
        // Adjust thresholds based on current state
        const stateAdjustment = cognitiveCapacity.level === 'low' ? -0.1 : 
                               cognitiveCapacity.level === 'high' ? 0.1 : 0;
        
        return {
            confidence_thresholds: {
                proceed_threshold: Math.max(0.3, thresholds.auto_proceed_threshold + stateAdjustment),
                clarification_threshold: thresholds.ask_for_clarification_threshold + stateAdjustment,
                model_switching_threshold: thresholds.try_new_model_threshold + stateAdjustment
            },
            
            risk_tolerance: {
                current_risk_tolerance: cognitiveCapacity.level === 'high' ? 'medium' : 'low',
                prefer_familiar: cognitiveCapacity.level === 'low' || taskAlignment.level === 'low',
                conservative_fallback: taskAlignment.misalignments.length > 0
            },
            
            decision_speed: {
                prefer_quick_decisions: profile.neurotype_adaptations.adhd_aware && cognitiveCapacity.level !== 'high',
                deliberation_tolerance: cognitiveCapacity.level === 'high' ? 'high' : 'low'
            },
            
            quality_preferences: {
                quality_over_speed: profile.communication_style.prefers_direct && taskAlignment.level === 'high',
                speed_over_quality: cognitiveCapacity.level === 'low' && profile.neurotype_adaptations.adhd_aware
            }
        };
    }

    /**
     * Generate cognitive routing implications
     * @param {object} cognitiveCapacity - Cognitive capacity
     * @param {object} taskAlignment - Task alignment
     * @param {object} decisionPreferences - Decision preferences
     * @returns {object} - Routing implications
     */
    generateCognitiveRoutingImplications(cognitiveCapacity, taskAlignment, decisionPreferences) {
        const implications = {
            preferred_model_characteristics: [],
            avoid_model_characteristics: [],
            routing_strategy_adjustments: [],
            fallback_preferences: []
        };
        
        // Low cognitive capacity implications
        if (cognitiveCapacity.level === 'low') {
            implications.preferred_model_characteristics.push('fast_response', 'simple_output', 'reliable');
            implications.avoid_model_characteristics.push('verbose_output', 'experimental');
            implications.routing_strategy_adjustments.push('prefer_local_models', 'avoid_complex_chains');
            implications.fallback_preferences.push('quick_local_fallback');
        }
        
        // High cognitive capacity implications
        if (cognitiveCapacity.level === 'high') {
            implications.preferred_model_characteristics.push('high_quality', 'detailed_analysis', 'creative');
            implications.routing_strategy_adjustments.push('allow_cloud_models', 'enable_complex_reasoning');
        }
        
        // ADHD-specific implications
        const profile = this.cognitiveProfile || this.defaultCognitiveProfile;
        if (profile.neurotype_adaptations.adhd_aware) {
            if (cognitiveCapacity.factors.hyperfocus_potential) {
                implications.preferred_model_characteristics.push('detailed', 'comprehensive');
                implications.routing_strategy_adjustments.push('enable_deep_analysis');
            } else {
                implications.preferred_model_characteristics.push('concise', 'actionable');
                implications.avoid_model_characteristics.push('verbose', 'rambling');
                implications.routing_strategy_adjustments.push('prioritize_speed');
            }
        }
        
        // Poor alignment implications
        if (taskAlignment.level === 'low') {
            implications.routing_strategy_adjustments.push('conservative_routing', 'ask_for_clarification');
            implications.fallback_preferences.push('human_fallback', 'clarification_request');
        }
        
        return implications;
    }

    /**
     * Calculate confidence adjustments based on cognitive state
     * @param {object} cognitiveCapacity - Cognitive capacity
     * @param {object} taskAlignment - Task alignment
     * @returns {object} - Confidence adjustments
     */
    calculateConfidenceAdjustments(cognitiveCapacity, taskAlignment) {
        let adjustment = 0;
        const reasons = [];
        
        // Cognitive capacity adjustments
        if (cognitiveCapacity.level === 'high') {
            adjustment += 0.1;
            reasons.push('High cognitive capacity boost');
        } else if (cognitiveCapacity.level === 'low') {
            adjustment -= 0.1;
            reasons.push('Low cognitive capacity penalty');
        }
        
        // Task alignment adjustments
        if (taskAlignment.level === 'high') {
            adjustment += 0.15;
            reasons.push('High task-cognitive alignment boost');
        } else if (taskAlignment.level === 'low') {
            adjustment -= 0.2;
            reasons.push('Poor task-cognitive alignment penalty');
        }
        
        // ADHD hyperfocus bonus
        if (cognitiveCapacity.factors?.hyperfocus_potential) {
            adjustment += 0.2;
            reasons.push('ADHD hyperfocus potential bonus');
        }
        
        return {
            adjustment: Math.max(-0.3, Math.min(0.3, adjustment)), // Cap adjustments
            reasons: reasons,
            final_multiplier: 1 + adjustment
        };
    }

    /**
     * Generate cognitive recommendations
     * @param {object} cognitiveCapacity - Cognitive capacity
     * @param {string} taskType - Task type
     * @param {object} taskComplexity - Task complexity
     * @returns {Array} - Cognitive recommendations
     */
    generateCognitiveRecommendations(cognitiveCapacity, taskType, taskComplexity) {
        const recommendations = [];
        const profile = this.cognitiveProfile || this.defaultCognitiveProfile;
        
        // Low capacity recommendations
        if (cognitiveCapacity.level === 'low') {
            recommendations.push({
                type: 'cognitive_state',
                message: 'Consider breaking this task into smaller chunks',
                priority: 'medium'
            });
            
            if (taskComplexity.level === 'high') {
                recommendations.push({
                    type: 'task_management',
                    message: 'High complexity task with low energy - consider postponing or simplifying',
                    priority: 'high'
                });
            }
        }
        
        // ADHD-specific recommendations
        if (profile.neurotype_adaptations.adhd_aware) {
            if (cognitiveCapacity.factors?.hyperfocus_potential) {
                recommendations.push({
                    type: 'optimization',
                    message: 'Hyperfocus potential detected - good time for deep technical work',
                    priority: 'low'
                });
            }
            
            if (taskType === 'research' && cognitiveCapacity.level !== 'high') {
                recommendations.push({
                    type: 'task_strategy',
                    message: 'Research task with ADHD awareness - consider using focused search terms',
                    priority: 'medium'
                });
            }
        }
        
        // Clarity-first recommendations
        if (profile.neurotype_adaptations.clarity_first && 
            ['explain', 'analyze'].includes(taskType)) {
            recommendations.push({
                type: 'output_quality',
                message: 'Clarity-first preference - requesting structured, clear output',
                priority: 'low'
            });
        }
        
        return recommendations;
    }

    /**
     * Generate alignment recommendations
     * @param {number} alignmentScore - Alignment score
     * @param {Array} misalignments - Detected misalignments
     * @returns {Array} - Alignment recommendations
     */
    generateAlignmentRecommendations(alignmentScore, misalignments) {
        const recommendations = [];
        
        if (alignmentScore < 0.4) {
            recommendations.push('Consider postponing this task until cognitive capacity improves');
            recommendations.push('Break the task into smaller, more manageable pieces');
        }
        
        for (const misalignment of misalignments) {
            if (misalignment.includes('High complexity')) {
                recommendations.push('Use scaffolding approach - start with overview, then details');
            }
            if (misalignment.includes('ADHD challenging')) {
                recommendations.push('Consider using Pomodoro technique or time-boxing');
            }
        }
        
        return recommendations;
    }

    /**
     * Get default cognitive profile
     * @returns {object} - Default cognitive profile
     */
    getDefaultCognitiveProfile() {
        return {
            neurotype_adaptations: {
                adhd_aware: true,
                clarity_first: true,
                scaffold_friendly: true,
                hyperfocus_capable: true,
                interruption_sensitive: true
            },
            communication_style: {
                tone_preference: 'direct',
                prefers_direct: true,
                prefers_concise: true,
                whitespace_heavy: true,
                markdown_friendly: true
            },
            certainty_thresholds: {
                high_confidence_threshold: 0.85,
                medium_confidence_threshold: 0.7,
                low_confidence_threshold: 0.5,
                auto_proceed_threshold: 0.7,
                ask_for_clarification_threshold: 0.6,
                refuse_task_threshold: 0.2,
                prefer_familiar_model_threshold: 0.6,
                try_new_model_threshold: 0.8,
                quality_over_speed_threshold: 0.3,
                speed_critical_threshold: 0.4,
                uncertainty_tolerance: {
                    creative_tasks: 0.4,
                    technical_tasks: 0.2,
                    routine_tasks: 0.1,
                    debugging_tasks: 0.3
                }
            },
            risk_preferences: {
                privacy_risk_tolerance: 'low',
                data_sharing_preference: 'local_first',
                performance_risk_tolerance: 'medium',
                prefer_proven_models: true,
                experimental_model_threshold: 0.8,
                cost_risk_tolerance: 'low',
                resource_usage_preference: 'efficient',
                quality_degradation_tolerance: 'low',
                response_time_tolerance: 'medium',
                cascade_failure_tolerance: 'low',
                prefer_graceful_degradation: true,
                error_recovery_preference: 'automatic_with_notification',
                cognitive_overload_sensitivity: 'high',
                context_switching_penalty: 'high',
                decision_fatigue_threshold: 'medium'
            },
            cognitive_load_management: {
                max_simultaneous_concepts: 3,
                prefers_chunking: true,
                context_switching_cost: 'high',
                attention_span_estimate: 'variable',
                hyperfocus_tendency: true
            },
            task_management: {
                prefers_explicit_instructions: true,
                task_first_approach: true,
                copilot_handoff_preferred: true,
                iterative_workflow: true,
                memory_external_scaffolding: true
            },
            learning_patterns: {
                learning_goals: ['JavaScript', 'React', 'Node.js', 'Next.js'],
                preferred_learning_style: 'iterative',
                feedback_responsiveness: 'high',
                pattern_recognition_strength: 'high'
            }
        };
    }

    /**
     * Parse cognitive patterns from database format
     * @param {object} cognitivePatterns - Raw cognitive patterns data
     * @returns {object} - Parsed cognitive profile
     */
    parseCognitivePatterns(cognitivePatterns) {
        if (typeof cognitivePatterns === 'string') {
            try {
                cognitivePatterns = JSON.parse(cognitivePatterns);
            } catch (error) {
                console.warn('Failed to parse cognitive patterns JSON:', error.message);
                return this.defaultCognitiveProfile;
            }
        }
        
        return cognitivePatterns;
    }
}

module.exports = CognitiveProfileManager;

// #endregion end: Cognitive Profile Manager