// #region start: Advanced Task Classification System
// Enhanced task classification with cognitive profile integration and uncertainty handling
// Built for intelligent model routing in The Steward

/**
 * Advanced Task Classification with Cognitive Profile Integration
 * Provides multi-dimensional task analysis for intelligent routing decisions
 */
class TaskClassifier {
    constructor() {
        // Enhanced classification patterns with confidence scoring
        this.classificationPatterns = {
            // Technical tasks
            debug: {
                keywords: ['debug', 'fix', 'error', 'bug', 'broken', 'issue', 'problem', 'troubleshoot'],
                phrases: ['not working', 'throws error', 'fails to', 'broken', 'fix this'],
                confidence_base: 0.9,
                cognitive_load: 'high',
                requires_focus: true,
                time_sensitive: true
            },
            code: {
                keywords: ['code', 'function', 'script', 'program', 'implement', 'build', 'create function'],
                phrases: ['write code', 'implement', 'build this', 'code for', 'programming'],
                confidence_base: 0.8,
                cognitive_load: 'high',
                requires_focus: true,
                creative_element: true
            },
            analyze: {
                keywords: ['analyze', 'examine', 'evaluate', 'assess', 'review', 'investigate'],
                phrases: ['what does this do', 'how does this work', 'analyze this', 'examine'],
                confidence_base: 0.8,
                cognitive_load: 'high',
                requires_focus: true,
                requires_patience: true
            },
            
            // Communication tasks  
            write: {
                keywords: ['write', 'compose', 'create', 'draft', 'document', 'explain'],
                phrases: ['write about', 'compose a', 'create content', 'draft this'],
                confidence_base: 0.8,
                cognitive_load: 'medium',
                creative_element: true,
                requires_clarity: true
            },
            summarize: {
                keywords: ['summarize', 'summary', 'tldr', 'brief', 'condense', 'outline'],
                phrases: ['sum up', 'give me a summary', 'briefly explain', 'tl;dr'],
                confidence_base: 0.9,
                cognitive_load: 'medium',
                requires_focus: true
            },
            explain: {
                keywords: ['explain', 'describe', 'tell me about', 'what is', 'how does', 'clarify'],
                phrases: ['explain how', 'what does this mean', 'help me understand'],
                confidence_base: 0.7,
                cognitive_load: 'medium',
                requires_clarity: true,
                teaching_element: true
            },
            
            // Research tasks
            research: {
                keywords: ['research', 'find out', 'investigate', 'lookup', 'search', 'discover'],
                phrases: ['find information', 'research this', 'look up', 'what can you find'],
                confidence_base: 0.9,
                cognitive_load: 'medium',
                requires_patience: true,
                external_resources: true
            },
            
            // Utility tasks
            route: {
                keywords: ['route', 'direct', 'forward', 'which model', 'who should', 'best for'],
                phrases: ['which model', 'route this to', 'who handles', 'best model for'],
                confidence_base: 0.6,
                cognitive_load: 'low',
                meta_task: true
            },
            
            // Security/Privacy
            sensitive: {
                keywords: ['private', 'confidential', 'personal', 'secret', 'sensitive', 'password'],
                phrases: ['keep private', 'confidential data', 'personal information'],
                confidence_base: 0.9,
                cognitive_load: 'medium',
                requires_local_processing: true,
                privacy_critical: true
            },
            
            // Creative tasks
            creative: {
                keywords: ['creative', 'brainstorm', 'imagine', 'design', 'artistic', 'innovative'],
                phrases: ['be creative', 'brainstorm ideas', 'creative writing', 'design'],
                confidence_base: 0.7,
                cognitive_load: 'medium',
                creative_element: true,
                benefits_from_variety: true
            },
            
            // Quick tasks
            quick_query: {
                keywords: ['quick', 'fast', 'brief', 'simple', 'just', 'only'],
                phrases: ['quick question', 'just tell me', 'simple answer', 'briefly'],
                confidence_base: 0.6,
                cognitive_load: 'low',
                time_sensitive: true,
                prefers_speed: true
            }
        };
        
        // Uncertainty thresholds for different confidence levels
        this.uncertaintyThresholds = {
            high_confidence: 0.8,
            medium_confidence: 0.6,
            low_confidence: 0.4,
            uncertain: 0.2
        };
        
        // Cognitive load patterns
        this.cognitiveLoadFactors = {
            high: ['debug', 'code', 'analyze', 'complex_reasoning'],
            medium: ['write', 'summarize', 'explain', 'research', 'creative'],
            low: ['route', 'quick_query', 'simple_lookup']
        };
    }

    /**
     * Classify task with enhanced analysis and uncertainty handling
     * @param {string} taskInput - User task input
     * @param {object} cognitiveContext - User's cognitive context
     * @param {object} options - Classification options
     * @returns {object} - Comprehensive task classification
     */
    classifyTask(taskInput, cognitiveContext = {}, options = {}) {
        if (!taskInput || typeof taskInput !== 'string') {
            return this.getUnknownTaskClassification('Invalid or empty task input');
        }
        
        // Pre-process input
        const processedInput = this.preprocessInput(taskInput);
        
        // Multi-dimensional classification
        const primaryClassification = this.performPrimaryClassification(processedInput);
        const secondaryClassifications = this.identifySecondaryElements(processedInput);
        const uncertaintyAnalysis = this.analyzeUncertainty(primaryClassification, secondaryClassifications);
        const cognitiveRequirements = this.analyzeCognitiveRequirements(primaryClassification, processedInput, cognitiveContext);
        
        // Build comprehensive classification result
        const classification = {
            // Primary classification
            type: primaryClassification.type,
            confidence: primaryClassification.confidence,
            keywords: primaryClassification.matched_keywords,
            
            // Secondary elements
            secondary_types: secondaryClassifications,
            hybrid_task: secondaryClassifications.length > 0,
            
            // Uncertainty handling
            uncertainty: uncertaintyAnalysis,
            confidence_level: this.getConfidenceLevel(primaryClassification.confidence),
            
            // Cognitive analysis
            cognitive_requirements: cognitiveRequirements,
            estimated_complexity: this.estimateTaskComplexity(processedInput, primaryClassification),
            
            // Routing hints
            routing_preferences: this.generateRoutingPreferences(primaryClassification, cognitiveRequirements, uncertaintyAnalysis),
            
            // Metadata
            processed_input: processedInput,
            classification_version: '2.0-enhanced',
            timestamp: new Date().toISOString()
        };
        
        // Apply cognitive profile adjustments
        if (cognitiveContext && Object.keys(cognitiveContext).length > 0) {
            classification.cognitive_adjustments = this.applyCognitiveAdjustments(classification, cognitiveContext);
        }
        
        return classification;
    }

    /**
     * Preprocess input for better classification
     * @param {string} input - Raw user input
     * @returns {object} - Processed input data
     */
    preprocessInput(input) {
        const lowered = input.toLowerCase();
        const tokens = lowered.split(/\s+/);
        const sentences = input.split(/[.!?]+/).filter(s => s.trim());
        
        // Extract key indicators
        const questionWords = tokens.filter(token => 
            ['what', 'how', 'why', 'when', 'where', 'which'].includes(token));
        const actionWords = tokens.filter(token => 
            ['create', 'build', 'make', 'write', 'debug', 'fix', 'analyze'].includes(token));
        const urgencyWords = tokens.filter(token => 
            ['quick', 'fast', 'urgent', 'asap', 'immediately', 'now'].includes(token));
        
        return {
            original: input,
            lowered: lowered,
            tokens: tokens,
            sentences: sentences,
            length: input.length,
            word_count: tokens.length,
            question_words: questionWords,
            action_words: actionWords,
            urgency_words: urgencyWords,
            has_code_snippets: /```|\`\`|function|class|def |import |require\(/.test(input),
            has_error_messages: /error|exception|failed|undefined|null|traceback/i.test(input)
        };
    }

    /**
     * Perform primary task classification
     * @param {object} processedInput - Preprocessed input
     * @returns {object} - Primary classification result
     */
    performPrimaryClassification(processedInput) {
        let bestMatch = { type: 'general', confidence: 0, matched_keywords: [] };
        
        // Score each classification pattern
        for (const [type, pattern] of Object.entries(this.classificationPatterns)) {
            const score = this.calculatePatternScore(processedInput, pattern);
            
            if (score.confidence > bestMatch.confidence) {
                bestMatch = {
                    type: type,
                    confidence: score.confidence,
                    matched_keywords: score.matched_keywords,
                    pattern_data: pattern
                };
            }
        }
        
        // Apply context-based adjustments
        bestMatch = this.applyContextualAdjustments(bestMatch, processedInput);
        
        return bestMatch;
    }

    /**
     * Calculate pattern matching score
     * @param {object} processedInput - Preprocessed input
     * @param {object} pattern - Classification pattern
     * @returns {object} - Scoring result
     */
    calculatePatternScore(processedInput, pattern) {
        let score = 0;
        const matchedKeywords = [];
        
        // Keyword matching
        for (const keyword of pattern.keywords || []) {
            if (processedInput.lowered.includes(keyword)) {
                score += pattern.confidence_base || 0.5;
                matchedKeywords.push(keyword);
            }
        }
        
        // Phrase matching (higher weight)
        for (const phrase of pattern.phrases || []) {
            if (processedInput.lowered.includes(phrase)) {
                score += (pattern.confidence_base || 0.5) * 1.3;
                matchedKeywords.push(phrase);
            }
        }
        
        // Bonus for multiple matches
        if (matchedKeywords.length > 1) {
            score *= 1.2;
        }
        
        // Context bonuses
        if (pattern.requires_focus && processedInput.has_error_messages) {
            score *= 1.1; // Debugging bonus
        }
        
        if (pattern.creative_element && processedInput.action_words.length > 0) {
            score *= 1.1; // Creative action bonus
        }
        
        return {
            confidence: Math.min(score, 1.0),
            matched_keywords: matchedKeywords
        };
    }

    /**
     * Apply contextual adjustments to classification
     * @param {object} classification - Base classification
     * @param {object} processedInput - Preprocessed input
     * @returns {object} - Adjusted classification
     */
    applyContextualAdjustments(classification, processedInput) {
        let adjustedConfidence = classification.confidence;
        let adjustmentReasons = [];
        
        // Code detection adjustments
        if (processedInput.has_code_snippets && 
            !['code', 'debug', 'analyze'].includes(classification.type)) {
            classification.type = 'code';
            adjustedConfidence = Math.max(adjustedConfidence, 0.8);
            adjustmentReasons.push('Code snippets detected');
        }
        
        // Error message adjustments
        if (processedInput.has_error_messages && classification.type !== 'debug') {
            classification.type = 'debug';
            adjustedConfidence = Math.max(adjustedConfidence, 0.85);
            adjustmentReasons.push('Error messages detected');
        }
        
        // Question word adjustments
        if (processedInput.question_words.length > 0 && 
            !['explain', 'research', 'analyze'].includes(classification.type)) {
            if (processedInput.question_words.includes('how') || processedInput.question_words.includes('why')) {
                classification.type = 'explain';
                adjustedConfidence = Math.max(adjustedConfidence, 0.7);
                adjustmentReasons.push('Explanatory question detected');
            }
        }
        
        // Urgency adjustments
        if (processedInput.urgency_words.length > 0) {
            classification.urgency = 'high';
            adjustmentReasons.push('Urgency indicators detected');
        }
        
        return {
            ...classification,
            confidence: adjustedConfidence,
            contextual_adjustments: adjustmentReasons
        };
    }

    /**
     * Identify secondary task elements
     * @param {object} processedInput - Preprocessed input
     * @returns {Array} - Secondary task types
     */
    identifySecondaryElements(processedInput) {
        const secondaryTypes = [];
        const primaryThreshold = 0.3; // Lower threshold for secondary elements
        
        for (const [type, pattern] of Object.entries(this.classificationPatterns)) {
            const score = this.calculatePatternScore(processedInput, pattern);
            
            if (score.confidence >= primaryThreshold && score.confidence < 0.6) {
                secondaryTypes.push({
                    type: type,
                    confidence: score.confidence,
                    keywords: score.matched_keywords
                });
            }
        }
        
        // Sort by confidence
        return secondaryTypes.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Analyze classification uncertainty
     * @param {object} primaryClassification - Primary classification
     * @param {Array} secondaryClassifications - Secondary classifications
     * @returns {object} - Uncertainty analysis
     */
    analyzeUncertainty(primaryClassification, secondaryClassifications) {
        const primaryConfidence = primaryClassification.confidence;
        const hasStrongSecondary = secondaryClassifications.some(sec => sec.confidence > 0.5);
        
        let uncertaintyLevel = 'low';
        let uncertaintyReasons = [];
        
        if (primaryConfidence < this.uncertaintyThresholds.uncertain) {
            uncertaintyLevel = 'very_high';
            uncertaintyReasons.push('Very low primary confidence');
        } else if (primaryConfidence < this.uncertaintyThresholds.low_confidence) {
            uncertaintyLevel = 'high';
            uncertaintyReasons.push('Low primary confidence');
        } else if (primaryConfidence < this.uncertaintyThresholds.medium_confidence) {
            uncertaintyLevel = 'medium';
            uncertaintyReasons.push('Medium primary confidence');
        }
        
        if (hasStrongSecondary) {
            uncertaintyLevel = uncertaintyLevel === 'low' ? 'medium' : uncertaintyLevel;
            uncertaintyReasons.push('Strong secondary classifications detected');
        }
        
        if (secondaryClassifications.length > 2) {
            uncertaintyLevel = uncertaintyLevel === 'low' ? 'medium' : 'high';
            uncertaintyReasons.push('Multiple potential classifications');
        }
        
        return {
            level: uncertaintyLevel,
            reasons: uncertaintyReasons,
            requires_clarification: uncertaintyLevel === 'very_high' || uncertaintyLevel === 'high',
            classification_confidence: primaryConfidence,
            alternative_classifications: secondaryClassifications.slice(0, 3)
        };
    }

    /**
     * Analyze cognitive requirements for the task
     * @param {object} classification - Primary classification
     * @param {object} processedInput - Preprocessed input
     * @param {object} cognitiveContext - User's cognitive context
     * @returns {object} - Cognitive requirements analysis
     */
    analyzeCognitiveRequirements(classification, processedInput, cognitiveContext) {
        const pattern = classification.pattern_data || {};
        
        const requirements = {
            cognitive_load: pattern.cognitive_load || 'medium',
            requires_focus: pattern.requires_focus || false,
            requires_creativity: pattern.creative_element || false,
            requires_patience: pattern.requires_patience || false,
            requires_clarity: pattern.requires_clarity || false,
            time_sensitive: pattern.time_sensitive || false,
            prefers_speed: pattern.prefers_speed || false,
            benefits_from_variety: pattern.benefits_from_variety || false
        };
        
        // Adjust based on input characteristics
        if (processedInput.word_count > 100) {
            requirements.requires_patience = true;
            requirements.cognitive_load = 'high';
        }
        
        if (processedInput.urgency_words.length > 0) {
            requirements.time_sensitive = true;
            requirements.prefers_speed = true;
        }
        
        if (processedInput.has_code_snippets) {
            requirements.requires_focus = true;
            requirements.cognitive_load = 'high';
        }
        
        return requirements;
    }

    /**
     * Estimate task complexity
     * @param {object} processedInput - Preprocessed input
     * @param {object} classification - Classification result
     * @returns {object} - Complexity estimation
     */
    estimateTaskComplexity(processedInput, classification) {
        let complexityScore = 0.5; // Base complexity
        
        // Word count factor
        if (processedInput.word_count > 50) complexityScore += 0.2;
        if (processedInput.word_count > 100) complexityScore += 0.2;
        
        // Sentence complexity
        if (processedInput.sentences.length > 3) complexityScore += 0.1;
        
        // Classification-based complexity
        const highComplexityTypes = ['debug', 'code', 'analyze', 'complex_reasoning'];
        if (highComplexityTypes.includes(classification.type)) {
            complexityScore += 0.3;
        }
        
        // Code snippet complexity
        if (processedInput.has_code_snippets) complexityScore += 0.2;
        
        // Error handling complexity
        if (processedInput.has_error_messages) complexityScore += 0.2;
        
        const normalizedScore = Math.max(0, Math.min(1, complexityScore));
        
        let level = 'medium';
        if (normalizedScore >= 0.8) level = 'high';
        else if (normalizedScore <= 0.3) level = 'low';
        
        return {
            level: level,
            score: normalizedScore,
            factors: {
                word_count: processedInput.word_count,
                sentence_count: processedInput.sentences.length,
                has_code: processedInput.has_code_snippets,
                has_errors: processedInput.has_error_messages,
                classification_type: classification.type
            }
        };
    }

    /**
     * Generate routing preferences based on classification
     * @param {object} classification - Primary classification
     * @param {object} cognitiveRequirements - Cognitive requirements
     * @param {object} uncertaintyAnalysis - Uncertainty analysis
     * @returns {object} - Routing preferences
     */
    generateRoutingPreferences(classification, cognitiveRequirements, uncertaintyAnalysis) {
        const preferences = {
            tier_preference: null,
            model_characteristics: [],
            avoid_characteristics: [],
            fallback_strategy: 'standard'
        };
        
        // Privacy and local processing requirements
        if (classification.pattern_data?.privacy_critical || classification.type === 'sensitive') {
            preferences.tier_preference = 'tier1-fast';
            preferences.model_characteristics.push('local_processing');
            preferences.avoid_characteristics.push('cloud_api');
        }
        
        // Speed requirements
        if (cognitiveRequirements.prefers_speed || cognitiveRequirements.time_sensitive) {
            preferences.model_characteristics.push('fast_response');
            if (uncertaintyAnalysis.level === 'low') {
                preferences.tier_preference = 'tier1-fast';
            }
        }
        
        // Quality requirements
        if (cognitiveRequirements.cognitive_load === 'high' || cognitiveRequirements.requires_creativity) {
            preferences.model_characteristics.push('high_quality');
            if (uncertaintyAnalysis.level === 'low') {
                preferences.tier_preference = 'tier3-cloud';
            }
        }
        
        // Focus and complexity requirements
        if (cognitiveRequirements.requires_focus && cognitiveRequirements.cognitive_load === 'high') {
            preferences.model_characteristics.push('reasoning_capable', 'detailed_analysis');
        }
        
        // Uncertainty handling
        if (uncertaintyAnalysis.level === 'high' || uncertaintyAnalysis.level === 'very_high') {
            preferences.fallback_strategy = 'ask_user';
            preferences.model_characteristics.push('clarification_capable');
        }
        
        return preferences;
    }

    /**
     * Apply cognitive profile adjustments
     * @param {object} classification - Base classification
     * @param {object} cognitiveContext - Cognitive context
     * @returns {object} - Cognitive adjustments
     */
    applyCognitiveAdjustments(classification, cognitiveContext) {
        const adjustments = {
            model_preference_adjustments: [],
            processing_adjustments: [],
            confidence_adjustments: 0
        };
        
        // ADHD-specific adjustments
        if (cognitiveContext.adhd_aware) {
            if (classification.cognitive_requirements.cognitive_load === 'high') {
                adjustments.model_preference_adjustments.push('prefer_local_fast');
                adjustments.processing_adjustments.push('break_into_smaller_tasks');
            }
            
            if (classification.cognitive_requirements.time_sensitive) {
                adjustments.confidence_adjustments += 0.1; // Higher confidence in time-sensitive classification
            }
        }
        
        // Clarity-first adjustments
        if (cognitiveContext.clarity_first) {
            adjustments.model_preference_adjustments.push('prefer_clear_explanations');
            if (classification.type === 'explain') {
                adjustments.confidence_adjustments += 0.1;
            }
        }
        
        // Energy level adjustments
        if (cognitiveContext.energy_level === 'low') {
            adjustments.model_preference_adjustments.push('prefer_simple_responses');
            if (classification.cognitive_requirements.cognitive_load === 'high') {
                adjustments.processing_adjustments.push('suggest_break_task_down');
            }
        }
        
        return adjustments;
    }

    /**
     * Get confidence level description
     * @param {number} confidence - Confidence score
     * @returns {string} - Confidence level
     */
    getConfidenceLevel(confidence) {
        if (confidence >= this.uncertaintyThresholds.high_confidence) return 'high';
        if (confidence >= this.uncertaintyThresholds.medium_confidence) return 'medium';
        if (confidence >= this.uncertaintyThresholds.low_confidence) return 'low';
        return 'very_low';
    }

    /**
     * Get unknown task classification
     * @param {string} reason - Reason for unknown classification
     * @returns {object} - Unknown task classification
     */
    getUnknownTaskClassification(reason) {
        return {
            type: 'unknown',
            confidence: 0,
            keywords: [],
            secondary_types: [],
            hybrid_task: false,
            uncertainty: {
                level: 'very_high',
                reasons: [reason],
                requires_clarification: true,
                classification_confidence: 0,
                alternative_classifications: []
            },
            confidence_level: 'very_low',
            cognitive_requirements: {
                cognitive_load: 'low',
                requires_focus: false,
                requires_creativity: false,
                requires_patience: false,
                requires_clarity: true,
                time_sensitive: false,
                prefers_speed: false,
                benefits_from_variety: false
            },
            estimated_complexity: {
                level: 'low',
                score: 0.1,
                factors: {}
            },
            routing_preferences: {
                tier_preference: null,
                model_characteristics: ['clarification_capable'],
                avoid_characteristics: [],
                fallback_strategy: 'ask_user'
            },
            classification_version: '2.0-enhanced',
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = TaskClassifier;

// #endregion end: Advanced Task Classification System