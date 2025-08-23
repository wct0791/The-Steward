// #region start: Local-First Router with Cloud Override
// Implements privacy-aware, local-first routing with intelligent cloud fallback
// Built for Chip's privacy preferences and The Steward's three-tier architecture

/**
 * Local-First Router
 * Prioritizes local processing with intelligent cloud override based on context and preferences
 */
class LocalFirstRouter {
    constructor() {
        // Local model preferences by capability
        this.localModelPreferences = {
            fast_response: ['smollm3-1.7b', 'smollm3'],
            quality_local: ['smollm3-8b', 'smollm3'],
            code_analysis: ['smollm3', 'codellama'],
            general_local: ['smollm3', 'llama', 'mistral']
        };
        
        // Cloud override conditions
        this.cloudOverrideConditions = {
            complexity_threshold: 0.8,
            quality_requirement_threshold: 0.9,
            research_task_override: true,
            creative_task_override: false, // Keep creative tasks local by default
            user_explicit_cloud_request: true
        };
        
        // Privacy protection levels
        this.privacyLevels = {
            strict: ['sensitive', 'private', 'confidential', 'personal'],
            medium: ['debug', 'code', 'work'],
            relaxed: ['research', 'general', 'creative']
        };
    }

    /**
     * Apply local-first routing with cloud override logic
     * @param {object} selection - Current model selection
     * @param {object} routingContext - Full routing context
     * @returns {object} - Local-first routing result
     */
    applyLocalFirstRouting(selection, routingContext) {
        const {
            enhanced_classification,
            cognitive_state,
            time_context,
            character_sheet,
            cognitive_profile
        } = routingContext;
        
        // Step 1: Determine privacy requirements
        const privacyAnalysis = this.analyzePrivacyRequirements(
            enhanced_classification, 
            character_sheet,
            routingContext.task || ''
        );
        
        // Step 2: Evaluate local capability
        const localCapability = this.evaluateLocalCapability(
            enhanced_classification,
            cognitive_state,
            privacyAnalysis
        );
        
        // Step 3: Check cloud override conditions
        const cloudOverride = this.evaluateCloudOverride(
            selection,
            enhanced_classification,
            cognitive_state,
            localCapability,
            character_sheet
        );
        
        // Step 4: Make local-first decision
        const localFirstDecision = this.makeLocalFirstDecision(
            selection,
            localCapability,
            cloudOverride,
            privacyAnalysis
        );
        
        return {
            ...localFirstDecision,
            local_first_analysis: {
                privacy_analysis: privacyAnalysis,
                local_capability: localCapability,
                cloud_override: cloudOverride,
                routing_strategy: localFirstDecision.routing_strategy
            }
        };
    }

    /**
     * Analyze privacy requirements for the request
     * @param {object} classification - Task classification
     * @param {object} characterSheet - Character sheet data
     * @param {string} taskInput - Original task input
     * @returns {object} - Privacy analysis
     */
    analyzePrivacyRequirements(classification, characterSheet, taskInput) {
        const taskType = classification.type;
        const keywords = classification.keywords || [];
        const taskLower = taskInput.toLowerCase();
        
        // Check for explicit privacy indicators
        const privacyKeywords = ['private', 'confidential', 'personal', 'secret', 'password', 
                                'api key', 'token', 'credentials', 'sensitive'];
        const hasPrivacyKeywords = privacyKeywords.some(keyword => 
            taskLower.includes(keyword) || keywords.includes(keyword));
        
        // Determine privacy level
        let privacyLevel = 'relaxed';
        let requiresLocal = false;
        let reasons = [];
        
        if (hasPrivacyKeywords) {
            privacyLevel = 'strict';
            requiresLocal = true;
            reasons.push('Privacy keywords detected');
        } else if (this.privacyLevels.strict.includes(taskType)) {
            privacyLevel = 'strict';
            requiresLocal = true;
            reasons.push('Sensitive task type');
        } else if (this.privacyLevels.medium.includes(taskType)) {
            privacyLevel = 'medium';
            reasons.push('Work-related task type');
        }
        
        // Check character sheet privacy preferences
        const fallbackBehavior = characterSheet.fallback_behavior || {};
        if (fallbackBehavior.cloud_failure === 'use_local_only') {
            requiresLocal = true;
            reasons.push('Character sheet local-first preference');
        }
        
        // Time-based privacy (late hours = local only)
        const currentHour = new Date().getHours();
        if (currentHour >= 22 || currentHour <= 5) {
            requiresLocal = true;
            reasons.push('Late hours privacy protection');
        }
        
        return {
            privacy_level: privacyLevel,
            requires_local: requiresLocal,
            reasons: reasons,
            confidence: hasPrivacyKeywords || this.privacyLevels.strict.includes(taskType) ? 0.9 : 0.6
        };
    }

    /**
     * Evaluate local model capability for the task
     * @param {object} classification - Task classification
     * @param {object} cognitiveState - Cognitive state
     * @param {object} privacyAnalysis - Privacy analysis
     * @returns {object} - Local capability assessment
     */
    evaluateLocalCapability(classification, cognitiveState, privacyAnalysis) {
        const taskType = classification.type;
        const complexity = classification.estimated_complexity || { level: 'medium' };
        const uncertainty = classification.uncertainty || { level: 'medium' };
        
        // Task type capability mapping
        const localCapabilityByTask = {
            route: { capability: 0.9, preferred_models: this.localModelPreferences.fast_response },
            summarize: { capability: 0.8, preferred_models: this.localModelPreferences.quality_local },
            debug: { capability: 0.7, preferred_models: this.localModelPreferences.code_analysis },
            code: { capability: 0.7, preferred_models: this.localModelPreferences.code_analysis },
            quick_query: { capability: 0.9, preferred_models: this.localModelPreferences.fast_response },
            sensitive: { capability: 0.9, preferred_models: this.localModelPreferences.quality_local },
            explain: { capability: 0.6, preferred_models: this.localModelPreferences.quality_local },
            write: { capability: 0.5, preferred_models: this.localModelPreferences.quality_local },
            research: { capability: 0.3, preferred_models: this.localModelPreferences.general_local },
            analyze: { capability: 0.6, preferred_models: this.localModelPreferences.quality_local }
        };
        
        const baseCapability = localCapabilityByTask[taskType] || {
            capability: 0.5,
            preferred_models: this.localModelPreferences.general_local
        };
        
        // Adjust for complexity
        let adjustedCapability = baseCapability.capability;
        if (complexity.level === 'high') {
            adjustedCapability *= 0.7; // Reduce capability for complex tasks
        } else if (complexity.level === 'low') {
            adjustedCapability *= 1.2; // Boost capability for simple tasks
            adjustedCapability = Math.min(adjustedCapability, 1.0);
        }
        
        // Adjust for uncertainty
        if (uncertainty.level === 'high' || uncertainty.level === 'very_high') {
            adjustedCapability *= 0.8; // Reduce for uncertain classification
        }
        
        // ADHD-friendly boost for certain tasks
        if (cognitiveState.cognitive_capacity?.factors?.hyperfocus_potential) {
            if (['debug', 'code'].includes(taskType)) {
                adjustedCapability *= 1.1; // Hyperfocus boost for technical tasks
            }
        }
        
        // Privacy requirement boost
        if (privacyAnalysis.requires_local) {
            adjustedCapability = Math.max(adjustedCapability, 0.8); // Force high capability for privacy
        }
        
        return {
            task_capability_score: Math.max(0, Math.min(1, adjustedCapability)),
            capability_level: adjustedCapability >= 0.8 ? 'high' : 
                             adjustedCapability >= 0.5 ? 'medium' : 'low',
            preferred_local_models: baseCapability.preferred_models,
            recommended_model: this.selectBestLocalModel(
                baseCapability.preferred_models,
                taskType,
                complexity,
                cognitiveState
            ),
            limitations: this.identifyLocalLimitations(taskType, complexity, uncertainty)
        };
    }

    /**
     * Evaluate conditions for cloud override
     * @param {object} selection - Current model selection
     * @param {object} classification - Task classification
     * @param {object} cognitiveState - Cognitive state
     * @param {object} localCapability - Local capability assessment
     * @param {object} characterSheet - Character sheet data
     * @returns {object} - Cloud override evaluation
     */
    evaluateCloudOverride(selection, classification, cognitiveState, localCapability, characterSheet) {
        const taskType = classification.type;
        const complexity = classification.estimated_complexity || { level: 'medium' };
        const uncertainty = classification.uncertainty || { level: 'medium' };
        const cognitiveRequirements = classification.cognitive_requirements || {};
        
        let overrideScore = 0;
        const reasons = [];
        
        // Complexity-based override
        if (complexity.level === 'high' && localCapability.capability_level === 'low') {
            overrideScore += 0.3;
            reasons.push('High complexity exceeds local capability');
        }
        
        // Quality requirement override
        if (cognitiveRequirements.requires_creativity && taskType === 'write') {
            overrideScore += 0.2;
            reasons.push('Creative writing benefits from cloud models');
        }
        
        // Research task override
        if (taskType === 'research' && this.cloudOverrideConditions.research_task_override) {
            overrideScore += 0.4;
            reasons.push('Research tasks benefit from cloud knowledge');
        }
        
        // Uncertainty handling override
        if (uncertainty.level === 'very_high') {
            overrideScore += 0.2;
            reasons.push('High uncertainty requires advanced reasoning');
        }
        
        // Cognitive state considerations
        if (cognitiveState.cognitive_capacity?.level === 'high' && 
            cognitiveState.task_alignment?.level === 'high') {
            overrideScore += 0.1;
            reasons.push('High cognitive state supports cloud processing');
        }
        
        // User preference override (explicit cloud request)
        const explicitCloudRequest = characterSheet.prefer_cloud_override || false;
        if (explicitCloudRequest) {
            overrideScore += 0.5;
            reasons.push('User explicit cloud preference');
        }
        
        // Time-based adjustments
        const currentHour = new Date().getHours();
        if (currentHour >= 22 || currentHour <= 5) {
            overrideScore -= 0.5; // Strongly discourage cloud at night
            reasons.push('Late hours - prefer local processing');
        }
        
        const shouldOverride = overrideScore >= 0.5;
        
        return {
            should_override: shouldOverride,
            override_score: Math.max(0, Math.min(1, overrideScore)),
            override_confidence: shouldOverride ? Math.min(overrideScore, 1.0) : 0,
            reasons: reasons,
            recommended_cloud_model: shouldOverride ? this.selectCloudModel(taskType, complexity) : null
        };
    }

    /**
     * Make final local-first routing decision
     * @param {object} originalSelection - Original model selection
     * @param {object} localCapability - Local capability assessment
     * @param {object} cloudOverride - Cloud override evaluation
     * @param {object} privacyAnalysis - Privacy analysis
     * @returns {object} - Final local-first decision
     */
    makeLocalFirstDecision(originalSelection, localCapability, cloudOverride, privacyAnalysis) {
        let finalModel = originalSelection.model;
        let routingStrategy = 'original';
        let confidence = originalSelection.confidence || 0.5;
        let reason = originalSelection.reason || 'Base routing decision';
        
        // Privacy override - force local
        if (privacyAnalysis.requires_local) {
            finalModel = localCapability.recommended_model;
            routingStrategy = 'privacy_local_only';
            confidence = Math.max(confidence, 0.8);
            reason = `${reason} → Privacy: Local-only processing required`;
        }
        // Cloud override conditions met
        else if (cloudOverride.should_override && 
                 localCapability.capability_level !== 'high' && 
                 cloudOverride.recommended_cloud_model) {
            finalModel = cloudOverride.recommended_cloud_model;
            routingStrategy = 'cloud_override';
            confidence = Math.min(confidence + 0.1, 1.0);
            reason = `${reason} → Cloud override: ${cloudOverride.reasons[0] || 'Quality requirements'}`;
        }
        // Local capability is sufficient
        else if (localCapability.capability_level === 'high' || 
                 localCapability.task_capability_score >= 0.7) {
            finalModel = localCapability.recommended_model;
            routingStrategy = 'local_first_capable';
            confidence = Math.min(confidence + 0.05, 1.0);
            reason = `${reason} → Local-first: Sufficient local capability`;
        }
        // Fallback to local anyway (local-first principle)
        else {
            finalModel = localCapability.recommended_model;
            routingStrategy = 'local_first_fallback';
            confidence = Math.max(confidence - 0.1, 0.3);
            reason = `${reason} → Local-first fallback: Privacy-first approach`;
        }
        
        // Generate local-first fallback chain
        const fallbackChain = this.generateLocalFirstFallbackChain(
            finalModel,
            localCapability,
            cloudOverride,
            privacyAnalysis
        );
        
        return {
            model: finalModel,
            reason: reason,
            confidence: confidence,
            routing_strategy: routingStrategy,
            fallbacks: fallbackChain,
            local_first_metadata: {
                original_model: originalSelection.model,
                local_recommended: localCapability.recommended_model,
                cloud_recommended: cloudOverride.recommended_cloud_model,
                privacy_protected: privacyAnalysis.requires_local,
                local_capability_score: localCapability.task_capability_score
            }
        };
    }

    /**
     * Select best local model for the task
     * @param {Array} preferredModels - Preferred local models
     * @param {string} taskType - Task type
     * @param {object} complexity - Task complexity
     * @param {object} cognitiveState - Cognitive state
     * @returns {string} - Best local model
     */
    selectBestLocalModel(preferredModels, taskType, complexity, cognitiveState) {
        if (!preferredModels || preferredModels.length === 0) {
            return 'smollm3'; // Default fallback
        }
        
        // For simple tasks, prefer fastest model
        if (complexity.level === 'low' || taskType === 'quick_query') {
            return preferredModels.find(model => model.includes('1.7b')) || preferredModels[0];
        }
        
        // For complex tasks, prefer larger model if available
        if (complexity.level === 'high') {
            return preferredModels.find(model => model.includes('8b')) || 
                   preferredModels.find(model => model.includes('smollm3')) || 
                   preferredModels[0];
        }
        
        // ADHD hyperfocus - prefer responsive model
        if (cognitiveState.cognitive_capacity?.factors?.hyperfocus_potential) {
            return preferredModels.find(model => model.includes('smollm3')) || preferredModels[0];
        }
        
        // Default to first preferred model
        return preferredModels[0];
    }

    /**
     * Select cloud model for override
     * @param {string} taskType - Task type
     * @param {object} complexity - Task complexity
     * @returns {string} - Recommended cloud model
     */
    selectCloudModel(taskType, complexity) {
        // Task-specific cloud model preferences
        const cloudPreferences = {
            research: 'perplexity',
            write: 'gpt-4',
            analyze: 'claude-3.5-sonnet',
            explain: 'claude-3.5-sonnet',
            debug: 'gpt-4',
            code: 'gpt-4'
        };
        
        const preferredModel = cloudPreferences[taskType];
        
        // Adjust for complexity
        if (complexity.level === 'high') {
            if (taskType === 'write' || taskType === 'creative') {
                return 'gpt-4';
            } else if (taskType === 'analyze' || taskType === 'explain') {
                return 'claude-3.5-sonnet';
            }
        }
        
        return preferredModel || 'claude-3.5-sonnet'; // Default cloud model
    }

    /**
     * Identify limitations of local processing
     * @param {string} taskType - Task type
     * @param {object} complexity - Task complexity
     * @param {object} uncertainty - Classification uncertainty
     * @returns {Array} - List of limitations
     */
    identifyLocalLimitations(taskType, complexity, uncertainty) {
        const limitations = [];
        
        if (taskType === 'research') {
            limitations.push('Limited knowledge cutoff');
            limitations.push('No real-time information access');
        }
        
        if (complexity.level === 'high') {
            limitations.push('May struggle with very complex reasoning');
        }
        
        if (uncertainty.level === 'very_high') {
            limitations.push('Limited disambiguation capability');
        }
        
        if (['write', 'creative'].includes(taskType)) {
            limitations.push('Less creative variety than cloud models');
        }
        
        return limitations;
    }

    /**
     * Generate local-first fallback chain
     * @param {string} primaryModel - Primary selected model
     * @param {object} localCapability - Local capability assessment
     * @param {object} cloudOverride - Cloud override evaluation
     * @param {object} privacyAnalysis - Privacy analysis
     * @returns {Array} - Fallback chain
     */
    generateLocalFirstFallbackChain(primaryModel, localCapability, cloudOverride, privacyAnalysis) {
        const fallbacks = [];
        
        // Add local alternatives first
        for (const model of localCapability.preferred_local_models) {
            if (model !== primaryModel && !fallbacks.includes(model)) {
                fallbacks.push(model);
            }
        }
        
        // Add other local models
        const otherLocalModels = ['smollm3', 'smollm3-1.7b', 'smollm3-8b'];
        for (const model of otherLocalModels) {
            if (model !== primaryModel && !fallbacks.includes(model)) {
                fallbacks.push(model);
            }
        }
        
        // Add cloud models only if privacy allows
        if (!privacyAnalysis.requires_local) {
            if (cloudOverride.recommended_cloud_model && 
                !fallbacks.includes(cloudOverride.recommended_cloud_model)) {
                fallbacks.push(cloudOverride.recommended_cloud_model);
            }
            
            // Add general cloud fallbacks
            const cloudFallbacks = ['claude-3.5-sonnet', 'gpt-4', 'perplexity'];
            for (const model of cloudFallbacks) {
                if (!fallbacks.includes(model)) {
                    fallbacks.push(model);
                    break; // Only add one cloud fallback unless explicitly needed
                }
            }
        }
        
        return fallbacks.slice(0, 5); // Limit fallback chain length
    }

    /**
     * Validate local-first routing decision
     * @param {object} decision - Local-first routing decision
     * @returns {object} - Validation result
     */
    validateLocalFirstDecision(decision) {
        const warnings = [];
        const errors = [];
        
        // Check if privacy requirements are met
        if (decision.local_first_analysis?.privacy_analysis?.requires_local &&
            !this.isLocalModel(decision.model)) {
            errors.push('Privacy requires local processing but cloud model selected');
        }
        
        // Check fallback chain has local options
        const hasLocalFallback = decision.fallbacks?.some(model => this.isLocalModel(model));
        if (!hasLocalFallback) {
            warnings.push('No local fallback available in chain');
        }
        
        // Check for reasonable confidence levels
        if (decision.confidence < 0.3 && decision.routing_strategy !== 'local_first_fallback') {
            warnings.push('Low confidence in routing decision');
        }
        
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Check if model is local
     * @param {string} modelName - Model name
     * @returns {boolean} - True if local model
     */
    isLocalModel(modelName) {
        if (!modelName) return false;
        
        const localIndicators = ['smol', 'llama', 'mistral', 'local', 'codellama'];
        return localIndicators.some(indicator => 
            modelName.toLowerCase().includes(indicator));
    }
}

module.exports = LocalFirstRouter;

// #endregion end: Local-First Router with Cloud Override