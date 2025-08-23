// #region start: Smart Routing Engine with Character Sheet Integration
// Time-aware, cognitive profile-driven intelligent model selection
// Built for Chip's character sheet and The Steward's three-tier architecture

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const DatabaseManager = require('../../database/DatabaseManager');
const { makeRoutingDecision, detectTaskType, validateRoutingDecision } = require('./routing-engine');
const TaskClassifier = require('./task-classifier');
const CognitiveProfileManager = require('./cognitive-profile-manager');
const LocalFirstRouter = require('./local-first-router');
const PerformanceLogger = require('./performance-logger');

/**
 * Smart Routing Engine - Enhanced with time-awareness and cognitive profile integration
 * Integrates Chip's character sheet data for intelligent, personalized model selection
 */
class SmartRoutingEngine {
    constructor() {
        this.dbManager = new DatabaseManager();
        this.taskClassifier = new TaskClassifier();
        this.cognitiveProfileManager = new CognitiveProfileManager();
        this.localFirstRouter = new LocalFirstRouter();
        this.performanceLogger = new PerformanceLogger();
        
        this.characterSheet = null;
        this.cognitiveProfile = null;
        this.timeAwareRouting = true;
        this.localFirstRouting = true;
        
        // Cache for performance
        this.performanceCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        
        // Initialize with character sheet data
        this.loadCharacterSheet();
    }

    /**
     * Load character sheet data for personalized routing
     */
    async loadCharacterSheet() {
        try {
            // First try to load from database
            this.characterSheet = await this.dbManager.getUserProfile('Chip Talbert');
            
            // Fallback to YAML file if not in database
            if (!this.characterSheet) {
                const yamlPath = path.join(__dirname, '../../character-sheet.yaml');
                if (fs.existsSync(yamlPath)) {
                    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
                    this.characterSheet = yaml.load(yamlContent);
                    
                    // Add default time profile if not exists
                    if (!this.characterSheet.time_of_day_profile) {
                        this.characterSheet.time_of_day_profile = this.generateDefaultTimeProfile();
                    }
                }
            }
            
            // Ensure we have required fields with sensible defaults
            this.characterSheet = this.characterSheet || {};
            this.characterSheet.task_type_preferences = this.characterSheet.task_type_preferences || {};
            this.characterSheet.fallback_behavior = this.characterSheet.fallback_behavior || {};
            this.characterSheet.time_of_day_profile = this.characterSheet.time_of_day_profile || this.generateDefaultTimeProfile();
            
            // Load cognitive profile
            this.cognitiveProfile = await this.cognitiveProfileManager.loadCognitiveProfile(this.characterSheet);
            
        } catch (error) {
            console.warn('Failed to load character sheet, using defaults:', error.message);
            this.characterSheet = this.getDefaultCharacterSheet();
        }
    }

    /**
     * Generate default time-of-day profile based on common developer patterns
     */
    generateDefaultTimeProfile() {
        return {
            peak_hours: [9, 10, 11, 14, 15, 16], // Common productive hours
            low_energy_hours: [13, 17, 18, 19], // Post-lunch and end-of-day
            preferred_models_by_time: {
                morning: {
                    hours: [6, 7, 8, 9, 10, 11],
                    preferences: {
                        creative: 'gpt-4',
                        technical: 'claude-3.5-sonnet',
                        research: 'perplexity',
                        quick: 'smollm3'
                    }
                },
                afternoon: {
                    hours: [12, 13, 14, 15, 16, 17],
                    preferences: {
                        creative: 'claude-3.5-sonnet',
                        technical: 'gpt-4',
                        research: 'perplexity',
                        quick: 'smollm3'
                    }
                },
                evening: {
                    hours: [18, 19, 20, 21, 22, 23],
                    preferences: {
                        creative: 'gpt-4',
                        technical: 'smollm3', // Local processing for private evening work
                        research: 'smollm3',
                        quick: 'smollm3'
                    }
                },
                night: {
                    hours: [0, 1, 2, 3, 4, 5],
                    preferences: {
                        creative: 'smollm3', // Local only during late hours
                        technical: 'smollm3',
                        research: 'smollm3',
                        quick: 'smollm3'
                    }
                }
            },
            energy_patterns: {
                high_energy: [9, 10, 11, 14, 15, 16],
                medium_energy: [8, 12, 13, 17],
                low_energy: [6, 7, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5]
            },
            cognitive_preferences_by_time: {
                analytical_hours: [9, 10, 11, 14, 15],
                creative_hours: [8, 16, 17, 18, 19, 20],
                routine_hours: [6, 7, 12, 13, 21, 22, 23]
            }
        };
    }

    /**
     * Get default character sheet if loading fails
     */
    getDefaultCharacterSheet() {
        return {
            name: 'Default User',
            task_type_preferences: {
                write: 'gpt-4',
                summarize: 'claude-3.5-sonnet',
                debug: 'gpt-4',
                route: 'smollm3',
                research: 'perplexity',
                fallback: 'smollm3',
                sensitive: 'smollm3'
            },
            fallback_behavior: {
                cloud_failure: 'use_local_only',
                unknown_task: 'ask_before_routing',
                allowFallback: true
            },
            time_of_day_profile: this.generateDefaultTimeProfile(),
            neurotype_style: 'ADHD-aware, clarity-first',
            tone_preference: 'Direct, concise'
        };
    }

    /**
     * Smart routing with time-awareness and cognitive profile integration
     * @param {string} taskInput - User task input
     * @param {object} options - Additional routing options
     * @returns {Promise<object>} - Enhanced routing decision
     */
    async makeSmartRoutingDecision(taskInput, options = {}) {
        const timestamp = new Date();
        const currentHour = timestamp.getHours();
        
        // Ensure character sheet is loaded
        if (!this.characterSheet) {
            await this.loadCharacterSheet();
        }

        // Step 1: Time-aware context enhancement
        const timeContext = this.analyzeTimeContext(currentHour);
        
        // Step 2: Enhanced task classification
        const enhancedClassification = this.taskClassifier.classifyTask(
            taskInput, 
            { current_hour: currentHour, energy_level: timeContext.energy_level }
        );
        
        // Step 3: Cognitive profile analysis with enhanced classification
        const cognitiveState = this.cognitiveProfileManager.analyzeCognitiveState({
            current_hour: currentHour,
            task_type: enhancedClassification.type,
            task_complexity: enhancedClassification.estimated_complexity
        });
        
        // Step 4: Performance-based model selection
        const performanceContext = await this.analyzePerformanceContext(taskInput);
        
        // Step 5: Enhanced options with all contexts
        const enhancedOptions = {
            ...options,
            time_context: timeContext,
            cognitive_state: cognitiveState,
            performance_context: performanceContext,
            enhanced_classification: enhancedClassification,
            character_sheet: this.characterSheet,
            cognitive_profile: this.cognitiveProfile
        };

        // Step 6: Make base routing decision using existing engine
        const baseDecision = await makeRoutingDecision(taskInput, this.characterSheet, enhancedOptions);
        
        // Step 7: Apply smart routing enhancements with enhanced classification
        const smartEnhancements = this.applySmartEnhancements(baseDecision, enhancedOptions);
        
        // Step 8: Apply character sheet preference mapping
        const characterSheetEnhancements = this.applyCharacterSheetMapping(smartEnhancements.selection || baseDecision.selection, enhancedOptions);
        
        // Step 9: Apply local-first routing with cloud override
        const localFirstEnhancements = this.localFirstRouting ? 
            this.localFirstRouter.applyLocalFirstRouting(characterSheetEnhancements, enhancedOptions) :
            characterSheetEnhancements;
        
        // Step 10: Build final smart routing decision
        const smartDecision = {
            ...baseDecision,
            classification: enhancedClassification, // Use enhanced classification
            selection: {
                ...baseDecision.selection,
                ...smartEnhancements.selection,
                ...characterSheetEnhancements,
                ...localFirstEnhancements
            },
            smart_routing: {
                time_aware: true,
                cognitive_aware: true,
                performance_aware: true,
                character_sheet_integrated: true,
                enhanced_classification: true,
                local_first_routing: this.localFirstRouting,
                routing_version: '2.0-smart'
            },
            contexts: {
                time_context: timeContext,
                cognitive_state: cognitiveState,
                performance_context: performanceContext,
                enhanced_classification: enhancedClassification
            }
        };

        // Step 11: Validate and log the decision
        const validation = validateRoutingDecision(smartDecision);
        if (!validation.valid) {
            console.warn('Smart routing validation warnings:', validation.warnings);
        }

        // Validate local-first routing if applied
        if (this.localFirstRouting && localFirstEnhancements.local_first_analysis) {
            const localFirstValidation = this.localFirstRouter.validateLocalFirstDecision(smartDecision.selection);
            if (!localFirstValidation.valid) {
                console.warn('Local-first routing validation errors:', localFirstValidation.errors);
            }
        }

        // Step 12: Log to performance logger for learning
        await this.performanceLogger.logRoutingPerformance(smartDecision);
        
        return smartDecision;
    }

    /**
     * Analyze time context for routing decisions
     * @param {number} currentHour - Current hour (0-23)
     * @returns {object} - Time context analysis
     */
    analyzeTimeContext(currentHour) {
        const timeProfile = this.characterSheet.time_of_day_profile || this.generateDefaultTimeProfile();
        
        // Determine time period
        let timePeriod = 'morning';
        if (currentHour >= 12 && currentHour < 18) timePeriod = 'afternoon';
        else if (currentHour >= 18 && currentHour < 24) timePeriod = 'evening';
        else if (currentHour >= 0 && currentHour < 6) timePeriod = 'night';
        
        // Determine energy level
        let energyLevel = 'medium';
        if (timeProfile.energy_patterns?.high_energy?.includes(currentHour)) energyLevel = 'high';
        else if (timeProfile.energy_patterns?.low_energy?.includes(currentHour)) energyLevel = 'low';
        
        // Get time-based preferences
        const timePreferences = timeProfile.preferred_models_by_time?.[timePeriod]?.preferences || {};
        
        // Determine cognitive state
        let cognitiveState = 'balanced';
        if (timeProfile.cognitive_preferences_by_time?.analytical_hours?.includes(currentHour)) cognitiveState = 'analytical';
        else if (timeProfile.cognitive_preferences_by_time?.creative_hours?.includes(currentHour)) cognitiveState = 'creative';
        else if (timeProfile.cognitive_preferences_by_time?.routine_hours?.includes(currentHour)) cognitiveState = 'routine';
        
        return {
            current_hour: currentHour,
            time_period: timePeriod,
            energy_level: energyLevel,
            cognitive_state: cognitiveState,
            time_preferences: timePreferences,
            is_peak_hour: timeProfile.peak_hours?.includes(currentHour) || false,
            is_low_energy_hour: timeProfile.low_energy_hours?.includes(currentHour) || false
        };
    }

    /**
     * Analyze cognitive context based on task and user profile
     * @param {string} taskInput - User task input
     * @param {object} timeContext - Time context analysis
     * @returns {object} - Cognitive context analysis
     */
    analyzeCognitiveContext(taskInput, timeContext) {
        const neurotype = this.characterSheet.neurotype_style || '';
        const taskType = detectTaskType(taskInput).type;
        
        // ADHD-aware adaptations
        const isAdhdAware = neurotype.toLowerCase().includes('adhd');
        const isClarityFirst = neurotype.toLowerCase().includes('clarity');
        const isScaffoldFriendly = neurotype.toLowerCase().includes('scaffold');
        
        // Analyze task complexity for cognitive load
        const taskComplexity = this.analyzeTaskComplexity(taskInput);
        
        // Determine cognitive requirements
        const cognitiveRequirements = {
            requires_focus: ['debug', 'analyze', 'code'].includes(taskType),
            requires_creativity: ['write', 'creative', 'design'].includes(taskType),
            requires_rapid_iteration: isAdhdAware && ['debug', 'code'].includes(taskType),
            benefits_from_scaffolding: isScaffoldFriendly && taskComplexity.level === 'high'
        };
        
        // Match cognitive state to task requirements
        const cognitiveAlignment = this.calculateCognitiveAlignment(timeContext.cognitive_state, cognitiveRequirements, taskComplexity);
        
        return {
            neurotype_accommodations: {
                adhd_aware: isAdhdAware,
                clarity_first: isClarityFirst,
                scaffold_friendly: isScaffoldFriendly
            },
            task_complexity: taskComplexity,
            cognitive_requirements: cognitiveRequirements,
            cognitive_alignment: cognitiveAlignment,
            recommended_adjustments: this.generateCognitiveAdjustments(cognitiveRequirements, timeContext, cognitiveAlignment)
        };
    }

    /**
     * Analyze performance context from historical data
     * @param {string} taskInput - User task input
     * @returns {Promise<object>} - Performance context analysis
     */
    async analyzePerformanceContext(taskInput) {
        const taskType = detectTaskType(taskInput).type;
        
        try {
            // Get performance insights from performance logger
            const performanceInsights = await this.performanceLogger.getPerformanceInsights(taskType, 48); // 48 hours
            
            return {
                historical_data_available: performanceInsights.sample_size > 0,
                insights: performanceInsights,
                best_performing_model: performanceInsights.model_performance?.best_performing || null,
                time_based_preferences: performanceInsights.time_patterns?.peak_performance_hours || [],
                quality_trends: performanceInsights.quality_patterns || {},
                sample_size: performanceInsights.sample_size,
                confidence: performanceInsights.confidence,
                recommendations: performanceInsights.recommendations || []
            };
            
        } catch (error) {
            console.warn('Failed to analyze performance context:', error.message);
            return {
                historical_data_available: false,
                confidence: 0,
                fallback_reason: error.message,
                insights: null
            };
        }
    }

    /**
     * Apply character sheet preference mapping
     * @param {object} selection - Current selection
     * @param {object} options - Enhanced options with contexts
     * @returns {object} - Character sheet enhanced selection
     */
    applyCharacterSheetMapping(selection, options) {
        const { enhanced_classification, cognitive_state, time_context, cognitive_profile } = options;
        const characterSheet = this.characterSheet || {};
        
        // Apply loadout overrides first
        const loadoutMapping = this.applyLoadoutMapping(selection, enhanced_classification, characterSheet);
        
        // Apply neurotype-specific preferences
        const neurotypeMapping = this.applyNeurotypeMapping(selection, cognitive_state, cognitive_profile);
        
        // Apply task type preferences with cognitive awareness
        const taskTypeMapping = this.applyTaskTypePreferenceMapping(selection, enhanced_classification, characterSheet);
        
        // Apply time-based character sheet preferences
        const timeBasedMapping = this.applyTimeBasedCharacterMapping(selection, time_context, characterSheet);
        
        // Combine all mappings with priority order
        const enhancedSelection = {
            ...selection,
            character_sheet_mappings: {
                loadout: loadoutMapping,
                neurotype: neurotypeMapping,
                task_type: taskTypeMapping,
                time_based: timeBasedMapping
            }
        };
        
        // Apply the highest priority mapping that changed the model
        if (loadoutMapping.model_changed) {
            enhancedSelection.model = loadoutMapping.new_model;
            enhancedSelection.reason += ` → Loadout: ${loadoutMapping.reason}`;
            enhancedSelection.confidence = Math.min((selection.confidence || 0.5) + 0.15, 1.0);
        } else if (neurotypeMapping.model_changed) {
            enhancedSelection.model = neurotypeMapping.new_model;
            enhancedSelection.reason += ` → Neurotype: ${neurotypeMapping.reason}`;
            enhancedSelection.confidence = Math.min((selection.confidence || 0.5) + 0.1, 1.0);
        } else if (taskTypeMapping.model_changed) {
            enhancedSelection.model = taskTypeMapping.new_model;
            enhancedSelection.reason += ` → Task preference: ${taskTypeMapping.reason}`;
            enhancedSelection.confidence = Math.min((selection.confidence || 0.5) + 0.05, 1.0);
        } else if (timeBasedMapping.model_changed) {
            enhancedSelection.model = timeBasedMapping.new_model;
            enhancedSelection.reason += ` → Time-based: ${timeBasedMapping.reason}`;
            enhancedSelection.confidence = Math.min((selection.confidence || 0.5) + 0.05, 1.0);
        }
        
        return enhancedSelection;
    }

    /**
     * Apply loadout mapping from character sheet
     * @param {object} selection - Current selection
     * @param {object} classification - Enhanced classification
     * @param {object} characterSheet - Character sheet data
     * @returns {object} - Loadout mapping result
     */
    applyLoadoutMapping(selection, classification, characterSheet) {
        const loadouts = characterSheet.loadouts || {};
        const currentLoadout = characterSheet.loadout;
        
        if (currentLoadout && loadouts[currentLoadout]) {
            const loadoutConfig = loadouts[currentLoadout];
            if (loadoutConfig.model && loadoutConfig.model !== selection.model) {
                return {
                    model_changed: true,
                    new_model: loadoutConfig.model,
                    reason: `${currentLoadout} loadout override`,
                    loadout_config: loadoutConfig
                };
            }
        }
        
        return { model_changed: false };
    }

    /**
     * Apply neurotype-specific mapping
     * @param {object} selection - Current selection
     * @param {object} cognitiveState - Cognitive state analysis
     * @param {object} cognitiveProfile - Cognitive profile
     * @returns {object} - Neurotype mapping result
     */
    applyNeurotypeMapping(selection, cognitiveState, cognitiveProfile) {
        if (!cognitiveProfile || !cognitiveState) {
            return { model_changed: false };
        }
        
        const neurotype = cognitiveProfile.neurotype_adaptations || {};
        const capacity = cognitiveState.cognitive_capacity || {};
        const alignment = cognitiveState.task_alignment || {};
        
        // ADHD-specific model preferences
        if (neurotype.adhd_aware) {
            // Low capacity or poor alignment -> prefer local fast models
            if (capacity.level === 'low' || alignment.level === 'low') {
                if (!selection.model.includes('smol') && selection.model !== 'smollm3') {
                    return {
                        model_changed: true,
                        new_model: 'smollm3',
                        reason: 'ADHD-aware fast local processing for low capacity'
                    };
                }
            }
            
            // Hyperfocus potential -> allow complex models
            if (capacity.factors?.hyperfocus_potential && 
                ['gpt-4', 'claude-3.5-sonnet'].includes(selection.model)) {
                // Keep current model but boost confidence
                return {
                    model_changed: false,
                    confidence_boost: 0.1,
                    reason: 'ADHD hyperfocus supports complex model'
                };
            }
        }
        
        // Clarity-first preferences
        if (neurotype.clarity_first && 
            ['explain', 'analyze', 'debug'].includes(cognitiveState.contexts?.task_type)) {
            // Prefer Claude for clarity-focused tasks
            if (!selection.model.includes('claude')) {
                return {
                    model_changed: true,
                    new_model: 'claude-3.5-sonnet',
                    reason: 'Clarity-first preference for explanatory tasks'
                };
            }
        }
        
        return { model_changed: false };
    }

    /**
     * Apply task type preference mapping with cognitive awareness
     * @param {object} selection - Current selection
     * @param {object} classification - Enhanced classification
     * @param {object} characterSheet - Character sheet data
     * @returns {object} - Task type mapping result
     */
    applyTaskTypePreferenceMapping(selection, classification, characterSheet) {
        const taskTypePreferences = characterSheet.task_type_preferences || {};
        const taskType = classification.type;
        const uncertainty = classification.uncertainty || {};
        
        // Apply primary task type preference
        const primaryPreference = taskTypePreferences[taskType];
        if (primaryPreference && primaryPreference !== selection.model) {
            // Check if preference is appropriate for current uncertainty level
            if (uncertainty.level === 'high' || uncertainty.level === 'very_high') {
                // High uncertainty -> prefer familiar/reliable models
                if (['smollm3', 'gpt-4', 'claude-3.5-sonnet'].includes(primaryPreference)) {
                    return {
                        model_changed: true,
                        new_model: primaryPreference,
                        reason: `${taskType} preference (uncertainty-aware)`
                    };
                }
            } else {
                return {
                    model_changed: true,
                    new_model: primaryPreference,
                    reason: `${taskType} task type preference`
                };
            }
        }
        
        // Check secondary task type preferences for hybrid tasks
        if (classification.hybrid_task && classification.secondary_types) {
            for (const secondary of classification.secondary_types.slice(0, 2)) {
                const secondaryPreference = taskTypePreferences[secondary.type];
                if (secondaryPreference && secondaryPreference !== selection.model) {
                    return {
                        model_changed: true,
                        new_model: secondaryPreference,
                        reason: `Secondary ${secondary.type} preference (hybrid task)`
                    };
                }
            }
        }
        
        return { model_changed: false };
    }

    /**
     * Apply time-based character mapping
     * @param {object} selection - Current selection
     * @param {object} timeContext - Time context analysis
     * @param {object} characterSheet - Character sheet data
     * @returns {object} - Time-based mapping result
     */
    applyTimeBasedCharacterMapping(selection, timeContext, characterSheet) {
        const timeProfile = characterSheet.time_of_day_profile || {};
        const timePreferences = timeContext.time_preferences || {};
        
        // Check if character sheet has specific time-based overrides
        const currentPeriod = timeContext.time_period;
        const periodPreferences = timeProfile.preferred_models_by_time?.[currentPeriod];
        
        if (periodPreferences?.preferences) {
            // Try to match current task to time-period preferences
            const taskType = timeContext.cognitive_state || 'general';
            const periodModel = periodPreferences.preferences[taskType] || 
                               periodPreferences.preferences.quick;
            
            if (periodModel && periodModel !== selection.model) {
                return {
                    model_changed: true,
                    new_model: periodModel,
                    reason: `${currentPeriod} period preference for ${taskType}`
                };
            }
        }
        
        return { model_changed: false };
    }

    /**
     * Apply smart routing enhancements to base decision
     * @param {object} baseDecision - Base routing decision
     * @param {object} options - Enhanced options with contexts
     * @returns {object} - Smart routing enhancements
     */
    applySmartEnhancements(baseDecision, options) {
        const { time_context, cognitive_state, performance_context } = options;
        
        let selectedModel = baseDecision.selection.model;
        let confidence = baseDecision.selection.confidence || 0.5;
        let reason = baseDecision.selection.reason;
        
        // Apply time-aware adjustments
        const timeAdjustments = this.applyTimeAwareAdjustments(selectedModel, time_context, baseDecision);
        if (timeAdjustments.model_changed) {
            selectedModel = timeAdjustments.new_model;
            reason += ` → Time-aware: ${timeAdjustments.reason}`;
            confidence = Math.min(confidence + timeAdjustments.confidence_boost, 1.0);
        }
        
        // Apply cognitive profile adjustments
        const cognitiveAdjustments = this.applyCognitiveAdjustments(selectedModel, cognitive_state, baseDecision);
        if (cognitiveAdjustments.model_changed) {
            selectedModel = cognitiveAdjustments.new_model;
            reason += ` → Cognitive: ${cognitiveAdjustments.reason}`;
            confidence = Math.min(confidence + cognitiveAdjustments.confidence_boost, 1.0);
        }
        
        // Apply performance-based adjustments
        const performanceAdjustments = this.applyPerformanceAdjustments(selectedModel, performance_context, baseDecision);
        if (performanceAdjustments.model_changed) {
            selectedModel = performanceAdjustments.new_model;
            reason += ` → Performance: ${performanceAdjustments.reason}`;
            confidence = Math.min(confidence + performanceAdjustments.confidence_boost, 1.0);
        }
        
        // Generate enhanced fallback chain with smart routing
        const smartFallbackChain = this.generateSmartFallbackChain(selectedModel, baseDecision.classification.type, options);
        
        return {
            selection: {
                ...baseDecision.selection,
                model: selectedModel,
                reason: reason,
                confidence: confidence,
                fallbacks: smartFallbackChain,
                smart_adjustments: {
                    time_aware: timeAdjustments,
                    cognitive: cognitiveAdjustments,
                    performance: performanceAdjustments
                }
            }
        };
    }

    /**
     * Apply time-aware routing adjustments
     * @param {string} selectedModel - Currently selected model
     * @param {object} timeContext - Time context analysis
     * @param {object} baseDecision - Base routing decision
     * @returns {object} - Time adjustment results
     */
    applyTimeAwareAdjustments(selectedModel, timeContext, baseDecision) {
        if (!this.timeAwareRouting) {
            return { model_changed: false };
        }
        
        const taskType = baseDecision.classification.type;
        const timePreferences = timeContext.time_preferences;
        
        // Check for time-specific model preferences
        let preferredModel = null;
        if (taskType === 'write' && timePreferences.creative) {
            preferredModel = timePreferences.creative;
        } else if (['debug', 'code', 'analyze'].includes(taskType) && timePreferences.technical) {
            preferredModel = timePreferences.technical;
        } else if (taskType === 'research' && timePreferences.research) {
            preferredModel = timePreferences.research;
        } else if (['route', 'summarize'].includes(taskType) && timePreferences.quick) {
            preferredModel = timePreferences.quick;
        }
        
        // Special handling for low energy hours - prefer local models
        if (timeContext.is_low_energy_hour && preferredModel && !preferredModel.includes('smol')) {
            preferredModel = 'smollm3';
        }
        
        // Special handling for late night - force local only for privacy
        if (timeContext.current_hour >= 22 || timeContext.current_hour <= 5) {
            preferredModel = 'smollm3';
        }
        
        if (preferredModel && preferredModel !== selectedModel) {
            return {
                model_changed: true,
                new_model: preferredModel,
                reason: `${timeContext.time_period} preference (${timeContext.energy_level} energy)`,
                confidence_boost: timeContext.is_peak_hour ? 0.2 : 0.1
            };
        }
        
        return { model_changed: false };
    }

    /**
     * Apply cognitive profile adjustments
     * @param {string} selectedModel - Currently selected model
     * @param {object} cognitiveState - Cognitive state from CognitiveProfileManager
     * @param {object} baseDecision - Base routing decision
     * @returns {object} - Cognitive adjustment results
     */
    applyCognitiveAdjustments(selectedModel, cognitiveState, baseDecision) {
        if (!cognitiveState || !cognitiveState.task_alignment) {
            return { model_changed: false };
        }
        
        const { task_alignment, recommendations, cognitive_capacity } = cognitiveState;
        
        // If cognitive alignment is poor, try to improve it
        if (task_alignment.alignment_score < 0.6) {
            // For poor alignment, prefer local models for faster iteration
            if (!selectedModel.includes('smol')) {
                return {
                    model_changed: true,
                    new_model: 'smollm3',
                    reason: `Poor cognitive alignment (${task_alignment.level}) - prefer fast local model`,
                    confidence_boost: 0.1
                };
            }
        }
        
        // ADHD-specific adjustments for hyperfocus potential
        if (cognitive_capacity?.factors?.hyperfocus_potential && 
            ['debug', 'code'].includes(baseDecision.classification?.type) &&
            !['gpt-4', 'claude-3.5-sonnet'].includes(selectedModel)) {
            
            return {
                model_changed: true,
                new_model: 'claude-3.5-sonnet',
                reason: 'ADHD hyperfocus potential - enable complex reasoning',
                confidence_boost: 0.15
            };
        }
        
        // Low cognitive capacity adjustments
        if (cognitive_capacity?.level === 'low' && !selectedModel.includes('smol')) {
            return {
                model_changed: true,
                new_model: 'smollm3',
                reason: 'Low cognitive capacity - prefer fast local processing',
                confidence_boost: 0.05
            };
        }
        
        return { model_changed: false };
    }

    /**
     * Apply performance-based adjustments
     * @param {string} selectedModel - Currently selected model
     * @param {object} performanceContext - Performance context analysis
     * @param {object} baseDecision - Base routing decision
     * @returns {object} - Performance adjustment results
     */
    applyPerformanceAdjustments(selectedModel, performanceContext, baseDecision) {
        if (!performanceContext.historical_data_available || performanceContext.confidence < 0.3) {
            return { model_changed: false };
        }
        
        const bestModel = performanceContext.best_performing_model;
        
        // Switch to best performing model if significantly better and different
        if (bestModel && 
            bestModel.name !== selectedModel && 
            bestModel.performance_score > 0.8 &&
            performanceContext.sample_size >= 5) {
            
            return {
                model_changed: true,
                new_model: bestModel.name,
                reason: `Performance leader (${(bestModel.performance_score * 100).toFixed(1)}% score)`,
                confidence_boost: performanceContext.confidence * 0.2
            };
        }
        
        return { model_changed: false };
    }

    /**
     * Generate smart fallback chain with context awareness
     * @param {string} primaryModel - Primary selected model
     * @param {string} taskType - Task type
     * @param {object} options - Enhanced options with contexts
     * @returns {Array} - Smart fallback chain
     */
    generateSmartFallbackChain(primaryModel, taskType, options) {
        const { time_context, cognitive_state, performance_context } = options;
        const fallbacks = [];
        
        // Start with time-aware alternatives
        if (time_context.time_preferences) {
            const timeAlternatives = Object.values(time_context.time_preferences)
                .filter(model => model !== primaryModel);
            fallbacks.push(...timeAlternatives);
        }
        
        // Add performance-based alternatives
        if (performance_context.historical_data_available) {
            const performanceAlternatives = performance_context.time_based_preferences
                .filter(entry => entry.model !== primaryModel)
                .map(entry => entry.model);
            fallbacks.push(...performanceAlternatives);
        }
        
        // Add cognitive-aware alternatives
        if (cognitive_state.cognitive_capacity?.factors?.hyperfocus_potential || 
            this.cognitiveProfile?.neurotype_adaptations?.adhd_aware) {
            fallbacks.push('smollm3'); // Always include fast local option for ADHD users
        }
        
        // Add character sheet fallbacks
        const userFallback = this.characterSheet.task_type_preferences?.[taskType];
        if (userFallback && !fallbacks.includes(userFallback)) {
            fallbacks.push(userFallback);
        }
        
        // Ensure we have local fallback
        if (!fallbacks.includes('smollm3')) {
            fallbacks.push('smollm3');
        }
        
        // Remove duplicates and primary model
        return [...new Set(fallbacks.filter(model => model !== primaryModel))];
    }

    /**
     * Log smart routing decision for learning and analysis
     * @param {object} decision - Smart routing decision
     */
    async logSmartRoutingDecision(decision) {
        try {
            // Enhanced routing decision logging
            const routingData = {
                task_type: decision.classification.type,
                prompt_snippet: decision.task.substring(0, 100),
                chosen_model: decision.selection.model,
                routing_reason: decision.selection.reason,
                alternatives_considered: JSON.stringify(decision.selection.fallbacks || []),
                time_of_day: new Date().getHours(),
                user_loadout: this.characterSheet.loadout || 'default',
                fallback_triggered: false,
                confidence_score: decision.selection.confidence,
                smart_routing_data: JSON.stringify({
                    time_context: decision.contexts.time_context,
                    cognitive_state: decision.contexts.cognitive_state,
                    performance_context: decision.contexts.performance_context,
                    smart_adjustments: decision.selection.smart_adjustments
                })
            };
            
            // This would be logged to routing_decisions table
            // await this.dbManager.logRoutingDecision(routingData);
            
        } catch (error) {
            console.warn('Failed to log smart routing decision:', error.message);
        }
    }

    // Helper methods for analysis
    
    analyzeTaskComplexity(taskInput) {
        const complexKeywords = ['complex', 'advanced', 'detailed', 'comprehensive', 'analyze', 'design'];
        const simpleKeywords = ['quick', 'simple', 'brief', 'summarize', 'route'];
        
        const hasComplexKeywords = complexKeywords.some(keyword => 
            taskInput.toLowerCase().includes(keyword));
        const hasSimpleKeywords = simpleKeywords.some(keyword => 
            taskInput.toLowerCase().includes(keyword));
        
        let level = 'medium';
        if (hasComplexKeywords && !hasSimpleKeywords) level = 'high';
        else if (hasSimpleKeywords && !hasComplexKeywords) level = 'low';
        
        return {
            level,
            word_count: taskInput.split(' ').length,
            estimated_tokens: Math.ceil(taskInput.length / 4),
            complexity_indicators: hasComplexKeywords ? complexKeywords.filter(k => 
                taskInput.toLowerCase().includes(k)) : []
        };
    }
    
    calculateCognitiveAlignment(cognitiveState, requirements, complexity) {
        let alignmentScore = 0.5; // Base alignment
        let mismatchReason = '';
        
        // Check state-requirement alignment
        if (cognitiveState === 'analytical' && requirements.requires_focus) {
            alignmentScore += 0.3;
        } else if (cognitiveState === 'creative' && requirements.requires_creativity) {
            alignmentScore += 0.3;
        } else if (cognitiveState === 'routine' && complexity.level === 'low') {
            alignmentScore += 0.2;
        } else if (cognitiveState === 'routine' && complexity.level === 'high') {
            alignmentScore -= 0.2;
            mismatchReason = 'High complexity task during routine cognitive state';
        }
        
        return {
            alignment_score: Math.max(0, Math.min(1, alignmentScore)),
            mismatch_reason: mismatchReason,
            cognitive_state: cognitiveState,
            task_requirements: requirements
        };
    }
    
    generateCognitiveAdjustments(requirements, timeContext, alignment) {
        const adjustments = {
            model_suggestion: null,
            processing_adjustments: [],
            timing_suggestions: []
        };
        
        // Model suggestions based on poor alignment
        if (alignment.alignment_score < 0.6) {
            if (requirements.requires_rapid_iteration || timeContext.energy_level === 'low') {
                adjustments.model_suggestion = 'smollm3';
            } else if (requirements.requires_creativity && timeContext.cognitive_state !== 'creative') {
                adjustments.model_suggestion = 'gpt-4';
            } else if (requirements.requires_focus && timeContext.cognitive_state === 'routine') {
                adjustments.model_suggestion = 'claude-3.5-sonnet';
            }
        }
        
        return adjustments;
    }
    
    // Performance analysis helpers (simplified for now)
    
    async getPerformanceData(taskType, currentHour) {
        // This would query the model_performance table
        // For now, return mock data structure
        return [];
    }
    
    findBestPerformingModel(performanceData) {
        if (performanceData.length === 0) return null;
        
        // Calculate performance scores and return best model
        return {
            name: 'gpt-4', // Mock
            performance_score: 0.85,
            avg_response_time: 2500,
            success_rate: 0.95
        };
    }
    
    analyzeTimeBasedPerformance(performanceData, currentHour) {
        // Analyze performance by time of day
        return [];
    }
    
    analyzeQualityTrends(performanceData) {
        // Analyze quality trends over time
        return {
            trending_up: [],
            trending_down: [],
            stable: []
        };
    }

    /**
     * Get performance insights for a task type
     * @param {string} taskType - Task type to analyze
     * @param {number} hours - Hours to look back
     * @returns {Promise<object>} - Performance insights
     */
    async getPerformanceInsights(taskType, hours = 24) {
        return await this.performanceLogger.getPerformanceInsights(taskType, hours);
    }

    /**
     * Log performance data after model execution
     * @param {object} smartDecision - The routing decision made
     * @param {object} performanceData - Execution performance data
     * @returns {Promise<number>} - Performance record ID
     */
    async logPerformance(smartDecision, performanceData) {
        return await this.performanceLogger.logRoutingPerformance(smartDecision, performanceData);
    }

    /**
     * Enable or disable local-first routing
     * @param {boolean} enabled - Whether to enable local-first routing
     */
    setLocalFirstRouting(enabled) {
        this.localFirstRouting = enabled;
    }

    /**
     * Enable or disable time-aware routing
     * @param {boolean} enabled - Whether to enable time-aware routing
     */
    setTimeAwareRouting(enabled) {
        this.timeAwareRouting = enabled;
    }

    /**
     * Get routing engine configuration
     * @returns {object} - Configuration object
     */
    getConfiguration() {
        return {
            time_aware_routing: this.timeAwareRouting,
            local_first_routing: this.localFirstRouting,
            character_sheet_loaded: !!this.characterSheet,
            cognitive_profile_loaded: !!this.cognitiveProfile,
            routing_version: '2.0-smart'
        };
    }

    /**
     * Close database connections
     */
    async close() {
        if (this.dbManager) {
            await this.dbManager.close();
        }
        if (this.performanceLogger) {
            await this.performanceLogger.close();
        }
    }
}

module.exports = SmartRoutingEngine;

// #endregion end: Smart Routing Engine with Character Sheet Integration