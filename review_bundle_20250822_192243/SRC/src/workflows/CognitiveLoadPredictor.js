// #region start: Cognitive Load Predictor for The Steward
// Predicts cognitive capacity trends and provides ADHD-aware timing suggestions
// Analyzes hyperfocus cycles, context switching costs, and optimal task timing

const ContextEngine = require('../memory/ContextEngine');

/**
 * CognitiveLoadPredictor - Predicts cognitive capacity and provides timing optimization
 * 
 * Key Features:
 * - Analyze ADHD patterns from historical data
 * - Predict cognitive capacity trends throughout day
 * - Suggest optimal timing for different task complexities  
 * - Recommend break patterns based on hyperfocus cycles
 * - Calculate context switching costs and mitigation strategies
 */
class CognitiveLoadPredictor {
  constructor(options = {}) {
    this.contextEngine = new ContextEngine(options);
    this.cognitivePatterns = new Map();
    this.hyperfocusCycles = [];
    this.contextSwitchingHistory = [];
    
    // Cognitive load factors and their weights
    this.loadFactors = {
      time_of_day: 0.3,        // Circadian rhythm impact
      task_complexity: 0.25,   // Current task cognitive demand
      context_switching: 0.2,  // Recent context switch frequency
      hyperfocus_state: 0.15,  // Current hyperfocus/distraction state
      fatigue_buildup: 0.1     // Accumulated cognitive fatigue
    };

    // Time-based cognitive capacity patterns (ADHD-aware)
    this.timePatterns = {
      // Morning patterns
      6: { capacity: 0.6, focus_quality: 'building', energy: 'low' },
      7: { capacity: 0.7, focus_quality: 'improving', energy: 'medium' },
      8: { capacity: 0.85, focus_quality: 'good', energy: 'high' },
      9: { capacity: 0.95, focus_quality: 'peak', energy: 'high' },      // Morning hyperfocus
      10: { capacity: 0.9, focus_quality: 'excellent', energy: 'high' },
      11: { capacity: 0.85, focus_quality: 'good', energy: 'medium' },
      
      // Afternoon patterns
      12: { capacity: 0.6, focus_quality: 'lunch_dip', energy: 'low' },
      13: { capacity: 0.5, focus_quality: 'post_lunch', energy: 'low' },
      14: { capacity: 0.75, focus_quality: 'recovering', energy: 'medium' },
      15: { capacity: 0.8, focus_quality: 'good', energy: 'medium' },     // Afternoon peak
      16: { capacity: 0.7, focus_quality: 'declining', energy: 'medium' },
      17: { capacity: 0.6, focus_quality: 'tired', energy: 'low' },
      
      // Evening patterns
      18: { capacity: 0.65, focus_quality: 'variable', energy: 'medium' },
      19: { capacity: 0.7, focus_quality: 'evening_focus', energy: 'medium' },
      20: { capacity: 0.6, focus_quality: 'relaxed', energy: 'low' },
      21: { capacity: 0.5, focus_quality: 'winding_down', energy: 'low' },
      22: { capacity: 0.4, focus_quality: 'tired', energy: 'very_low' },
      23: { capacity: 0.3, focus_quality: 'exhausted', energy: 'very_low' }
    };

    // Task complexity cognitive load requirements
    this.complexityLoads = {
      'trivial': { cognitive_load: 0.1, sustained_attention: 5, context_switching_tolerance: 0.9 },
      'simple': { cognitive_load: 0.3, sustained_attention: 15, context_switching_tolerance: 0.7 },
      'moderate': { cognitive_load: 0.6, sustained_attention: 30, context_switching_tolerance: 0.4 },
      'complex': { cognitive_load: 0.8, sustained_attention: 60, context_switching_tolerance: 0.2 },
      'expert': { cognitive_load: 1.0, sustained_attention: 120, context_switching_tolerance: 0.1 }
    };

    // ADHD-specific accommodation strategies
    this.accommodationStrategies = {
      rapid_switching: {
        strategy: 'context_anchoring',
        techniques: ['visual_cues', 'task_batching', 'transition_rituals'],
        effectiveness: 0.8
      },
      hyperfocus: {
        strategy: 'momentum_preservation',
        techniques: ['interruption_blocking', 'extended_sessions', 'natural_breaks'],
        effectiveness: 0.9
      },
      distractibility: {
        strategy: 'environmental_control',
        techniques: ['notification_blocking', 'single_tasking', 'timer_based_work'],
        effectiveness: 0.7
      },
      fatigue: {
        strategy: 'cognitive_pacing',
        techniques: ['complexity_cycling', 'micro_breaks', 'task_switching'],
        effectiveness: 0.75
      }
    };
  }

  /**
   * Initialize cognitive load predictor
   */
  async initialize() {
    try {
      await this.contextEngine.initialize();
      await this.loadCognitiveHistory();
      return true;
    } catch (error) {
      console.error('Failed to initialize CognitiveLoadPredictor:', error);
      return false;
    }
  }

  /**
   * Load historical cognitive patterns
   */
  async loadCognitiveHistory() {
    try {
      // Load context switching patterns from memory
      const contextInsights = this.contextEngine.getContextSwitchingInsights();
      
      if (contextInsights.recent_session_contexts) {
        this.contextSwitchingHistory = Object.entries(contextInsights.recent_session_contexts).map(([context, count]) => ({
          context,
          frequency: count,
          timestamp: new Date().toISOString()
        }));
      }

      console.log('Loaded cognitive history for prediction');
    } catch (error) {
      console.warn('Could not load cognitive history:', error.message);
    }
  }

  /**
   * Predict cognitive capacity for specific time and task
   */
  predictCognitiveCapacity(targetTime, taskComplexity, currentContext = {}) {
    try {
      const hour = targetTime.getHours();
      const baseCapacity = this.timePatterns[hour] || this.timePatterns[12]; // Fallback to noon
      
      // Calculate cognitive load factors
      const factors = this.calculateLoadFactors(targetTime, taskComplexity, currentContext);
      
      // Apply ADHD-specific adjustments
      const adhdAdjustments = this.calculateADHDAdjustments(targetTime, currentContext);
      
      // Calculate final capacity prediction
      const predictedCapacity = Math.max(0.1, Math.min(1.0, 
        baseCapacity.capacity * factors.overall_multiplier * adhdAdjustments.capacity_modifier
      ));

      return {
        predicted_capacity: predictedCapacity,
        base_capacity: baseCapacity.capacity,
        time_of_day_factor: factors.time_factor,
        complexity_factor: factors.complexity_factor,
        switching_penalty: factors.switching_penalty,
        adhd_adjustments: adhdAdjustments,
        confidence: factors.confidence,
        recommendations: this.generateCapacityRecommendations(predictedCapacity, factors, adhdAdjustments),
        optimal_window: this.findOptimalTimeWindow(targetTime, taskComplexity),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error predicting cognitive capacity:', error);
      return this.getFallbackCapacityPrediction(targetTime, taskComplexity);
    }
  }

  /**
   * Calculate cognitive load factors
   */
  calculateLoadFactors(targetTime, taskComplexity, currentContext) {
    const hour = targetTime.getHours();
    const basePattern = this.timePatterns[hour] || this.timePatterns[12];
    
    // Time of day factor
    const timeFactor = this.calculateTimeOfDayFactor(hour);
    
    // Task complexity factor
    const complexityInfo = this.complexityLoads[taskComplexity] || this.complexityLoads['moderate'];
    const complexityFactor = 1.0 - (complexityInfo.cognitive_load * 0.3); // Higher complexity reduces available capacity
    
    // Context switching penalty
    const switchingPenalty = this.calculateContextSwitchingPenalty(currentContext);
    
    // Hyperfocus bonus (if applicable)
    const hyperfocusBonus = this.calculateHyperfocusBonus(targetTime, currentContext);
    
    // Overall multiplier
    const overallMultiplier = timeFactor * complexityFactor * (1 - switchingPenalty) * (1 + hyperfocusBonus);
    
    return {
      time_factor: timeFactor,
      complexity_factor: complexityFactor,
      switching_penalty: switchingPenalty,
      hyperfocus_bonus: hyperfocusBonus,
      overall_multiplier: overallMultiplier,
      confidence: this.calculatePredictionConfidence(basePattern, currentContext)
    };
  }

  /**
   * Calculate time of day cognitive factor
   */
  calculateTimeOfDayFactor(hour) {
    // Peak hours: 9-10 AM and 2-3 PM
    if (hour >= 9 && hour <= 10) return 1.2; // Morning peak
    if (hour >= 14 && hour <= 15) return 1.1; // Afternoon peak
    if (hour >= 12 && hour <= 13) return 0.7; // Lunch dip
    if (hour >= 21) return 0.6; // Evening fatigue
    return 1.0; // Baseline
  }

  /**
   * Calculate context switching penalty
   */
  calculateContextSwitchingPenalty(currentContext) {
    const recentSwitches = currentContext.recent_context_switches || 0;
    const switchingFrequency = currentContext.switching_frequency || 0;
    
    // Higher penalty for more recent switches
    let penalty = Math.min(0.4, recentSwitches * 0.1 + switchingFrequency * 0.2);
    
    // ADHD context switching cost is typically higher
    penalty *= 1.3;
    
    return penalty;
  }

  /**
   * Calculate hyperfocus bonus
   */
  calculateHyperfocusBonus(targetTime, currentContext) {
    const isHyperfocusTime = currentContext.hyperfocus_detected || false;
    const hyperfocusHistory = currentContext.hyperfocus_history || [];
    
    if (isHyperfocusTime) {
      return 0.3; // 30% capacity bonus during hyperfocus
    }
    
    // Check if target time aligns with historical hyperfocus patterns
    const hour = targetTime.getHours();
    const historicalHyperfocus = hyperfocusHistory.filter(h => 
      new Date(h.timestamp).getHours() === hour
    ).length;
    
    return historicalHyperfocus > 2 ? 0.15 : 0; // Smaller bonus for predicted hyperfocus
  }

  /**
   * Calculate ADHD-specific adjustments
   */
  calculateADHDAdjustments(targetTime, currentContext) {
    let capacityModifier = 1.0;
    const adjustments = [];
    
    // Rapid context switching detected
    if (currentContext.rapid_switching) {
      capacityModifier *= 0.8; // 20% capacity reduction
      adjustments.push({
        type: 'rapid_switching',
        impact: -0.2,
        accommodation: this.accommodationStrategies.rapid_switching
      });
    }
    
    // Hyperfocus state
    if (currentContext.hyperfocus_detected) {
      capacityModifier *= 1.25; // 25% capacity increase
      adjustments.push({
        type: 'hyperfocus',
        impact: 0.25,
        accommodation: this.accommodationStrategies.hyperfocus
      });
    }
    
    // High distractibility period
    if (this.isHighDistractionTime(targetTime)) {
      capacityModifier *= 0.85; // 15% reduction
      adjustments.push({
        type: 'distractibility',
        impact: -0.15,
        accommodation: this.accommodationStrategies.distractibility
      });
    }
    
    // Cognitive fatigue accumulation
    const fatigueLevel = this.calculateCognitiveFatigue(targetTime, currentContext);
    if (fatigueLevel > 0.7) {
      capacityModifier *= 0.9; // 10% reduction for high fatigue
      adjustments.push({
        type: 'fatigue',
        impact: -0.1,
        accommodation: this.accommodationStrategies.fatigue
      });
    }

    return {
      capacity_modifier: capacityModifier,
      adjustments: adjustments,
      adhd_accommodations_active: adjustments.length > 0
    };
  }

  /**
   * Check if time period has historically high distraction
   */
  isHighDistractionTime(targetTime) {
    const hour = targetTime.getHours();
    // Typical high-distraction periods: lunch time, late afternoon, evening
    return hour === 12 || hour === 13 || hour >= 17;
  }

  /**
   * Calculate accumulated cognitive fatigue
   */
  calculateCognitiveFatigue(targetTime, currentContext) {
    const hoursSinceStart = targetTime.getHours() - 8; // Assume 8 AM start
    const baselineDecay = Math.max(0, hoursSinceStart * 0.05); // 5% per hour
    
    // Additional fatigue from context switching
    const switchingFatigue = (currentContext.switching_frequency || 0) * 0.2;
    
    // Task complexity fatigue
    const complexityFatigue = (currentContext.recent_complex_tasks || 0) * 0.1;
    
    return Math.min(1.0, baselineDecay + switchingFatigue + complexityFatigue);
  }

  /**
   * Calculate prediction confidence
   */
  calculatePredictionConfidence(basePattern, currentContext) {
    let confidence = 0.7; // Base confidence
    
    // Higher confidence during established patterns
    if (basePattern.focus_quality === 'peak' || basePattern.focus_quality === 'excellent') {
      confidence += 0.15;
    }
    
    // Lower confidence during variable periods
    if (basePattern.focus_quality === 'variable' || basePattern.focus_quality === 'post_lunch') {
      confidence -= 0.1;
    }
    
    // Context data quality affects confidence
    const contextDataQuality = Object.keys(currentContext).length / 10; // Assume 10 is full context
    confidence *= Math.max(0.5, contextDataQuality);
    
    return Math.max(0.3, Math.min(0.95, confidence));
  }

  /**
   * Generate capacity-based recommendations
   */
  generateCapacityRecommendations(predictedCapacity, factors, adhdAdjustments) {
    const recommendations = [];
    
    // Capacity-based task recommendations
    if (predictedCapacity > 0.8) {
      recommendations.push({
        type: 'task_selection',
        message: 'High capacity window - ideal for complex, creative, or challenging tasks',
        priority: 'high'
      });
    } else if (predictedCapacity < 0.4) {
      recommendations.push({
        type: 'task_selection', 
        message: 'Low capacity period - focus on routine, simple, or administrative tasks',
        priority: 'high'
      });
    }
    
    // Context switching recommendations
    if (factors.switching_penalty > 0.2) {
      recommendations.push({
        type: 'context_management',
        message: 'High context switching penalty - batch similar tasks together',
        priority: 'medium'
      });
    }
    
    // ADHD accommodation recommendations
    adhdAdjustments.adjustments.forEach(adj => {
      if (adj.accommodation) {
        recommendations.push({
          type: 'adhd_accommodation',
          message: `${adj.type} detected - recommend: ${adj.accommodation.techniques.join(', ')}`,
          priority: adj.impact < -0.15 ? 'high' : 'medium',
          effectiveness: adj.accommodation.effectiveness
        });
      }
    });
    
    return recommendations;
  }

  /**
   * Find optimal time window for task
   */
  findOptimalTimeWindow(currentTime, taskComplexity, searchHours = 8) {
    const windows = [];
    const complexityInfo = this.complexityLoads[taskComplexity] || this.complexityLoads['moderate'];
    
    // Search next several hours for optimal capacity
    for (let i = 0; i < searchHours; i++) {
      const testTime = new Date(currentTime.getTime() + (i * 60 * 60 * 1000));
      const prediction = this.predictCognitiveCapacity(testTime, taskComplexity);
      
      // Check if capacity meets task requirements
      if (prediction.predicted_capacity >= complexityInfo.cognitive_load) {
        windows.push({
          start_time: testTime.toISOString(),
          predicted_capacity: prediction.predicted_capacity,
          capacity_match: prediction.predicted_capacity / complexityInfo.cognitive_load,
          confidence: prediction.confidence
        });
      }
    }
    
    // Return best window (highest capacity match with good confidence)
    return windows
      .sort((a, b) => (b.capacity_match * b.confidence) - (a.capacity_match * a.confidence))
      .slice(0, 3); // Top 3 windows
  }

  /**
   * Predict hyperfocus cycle timing
   */
  predictHyperfocusCycle(currentTime, historicalData = []) {
    try {
      // Analyze historical hyperfocus patterns
      const hyperfocusPatterns = this.analyzeHyperfocusPatterns(historicalData);
      
      // Predict next hyperfocus window
      const nextHyperfocus = this.predictNextHyperfocusWindow(currentTime, hyperfocusPatterns);
      
      return {
        next_hyperfocus_window: nextHyperfocus,
        typical_duration: hyperfocusPatterns.average_duration || 120, // Default 2 hours
        confidence: hyperfocusPatterns.prediction_confidence || 0.6,
        preparation_time: 15, // Minutes to prepare for hyperfocus
        recommendations: this.generateHyperfocusRecommendations(nextHyperfocus),
        historical_pattern: hyperfocusPatterns.dominant_pattern || 'morning_peak'
      };
    } catch (error) {
      console.error('Error predicting hyperfocus cycle:', error);
      return this.getFallbackHyperfocusPrediction(currentTime);
    }
  }

  /**
   * Analyze historical hyperfocus patterns
   */
  analyzeHyperfocusPatterns(historicalData) {
    // Simulate analysis of hyperfocus patterns
    const patterns = {
      morning_peak: { start_hour: 9, duration: 120, frequency: 0.7 },
      afternoon_burst: { start_hour: 14, duration: 90, frequency: 0.4 },
      evening_focus: { start_hour: 20, duration: 60, frequency: 0.3 }
    };
    
    // Find dominant pattern (would be based on real historical data)
    const dominantPattern = 'morning_peak';
    
    return {
      dominant_pattern: dominantPattern,
      average_duration: patterns[dominantPattern].duration,
      typical_start_time: patterns[dominantPattern].start_hour,
      frequency: patterns[dominantPattern].frequency,
      prediction_confidence: 0.8
    };
  }

  /**
   * Predict next hyperfocus window
   */
  predictNextHyperfocusWindow(currentTime, patterns) {
    const currentHour = currentTime.getHours();
    const dominantHour = patterns.typical_start_time || 9;
    
    let nextWindow = new Date(currentTime);
    
    if (currentHour < dominantHour) {
      // Same day
      nextWindow.setHours(dominantHour, 0, 0, 0);
    } else {
      // Next day
      nextWindow.setDate(nextWindow.getDate() + 1);
      nextWindow.setHours(dominantHour, 0, 0, 0);
    }
    
    return {
      start_time: nextWindow.toISOString(),
      estimated_duration: patterns.average_duration,
      probability: patterns.frequency
    };
  }

  /**
   * Generate hyperfocus-specific recommendations
   */
  generateHyperfocusRecommendations(hyperfocusWindow) {
    return [
      {
        type: 'preparation',
        message: 'Clear schedule and minimize interruptions during predicted hyperfocus window',
        timing: 'before'
      },
      {
        type: 'task_alignment',
        message: 'Schedule most challenging or creative tasks during hyperfocus period',
        timing: 'during'
      },
      {
        type: 'sustainability',
        message: 'Set gentle reminders for breaks and hydration',
        timing: 'during'
      },
      {
        type: 'transition',
        message: 'Plan lighter tasks for post-hyperfocus period',
        timing: 'after'
      }
    ];
  }

  /**
   * Calculate context switching cost
   */
  calculateContextSwitchingCost(fromContext, toContext, userProfile = {}) {
    try {
      const contextDistance = this.calculateContextDistance(fromContext, toContext);
      const userADHDFactor = userProfile.adhd_context_switching_multiplier || 1.3;
      const baseSwitchingCost = 0.15; // 15% base capacity cost
      
      // Calculate switching cost
      const switchingCost = baseSwitchingCost * contextDistance * userADHDFactor;
      
      // Recovery time (minutes)
      const recoveryTime = Math.min(30, 5 + (contextDistance * 10));
      
      return {
        switching_cost: Math.min(0.5, switchingCost), // Cap at 50%
        recovery_time_minutes: recoveryTime,
        context_distance: contextDistance,
        mitigation_strategies: this.generateSwitchingMitigationStrategies(contextDistance),
        severity: this.categorizeSwitchingCost(switchingCost)
      };
    } catch (error) {
      console.error('Error calculating context switching cost:', error);
      return { switching_cost: 0.2, recovery_time_minutes: 10, severity: 'moderate' };
    }
  }

  /**
   * Calculate distance between contexts
   */
  calculateContextDistance(fromContext, toContext) {
    // Context similarity factors
    const factors = {
      domain: fromContext.domain === toContext.domain ? 0 : 0.5,
      complexity: Math.abs((fromContext.complexity || 0.5) - (toContext.complexity || 0.5)),
      cognitive_load: Math.abs((fromContext.cognitive_load || 0.5) - (toContext.cognitive_load || 0.5)),
      tools_overlap: this.calculateToolsOverlap(fromContext.tools || [], toContext.tools || [])
    };
    
    // Calculate weighted distance
    const distance = (factors.domain + factors.complexity + factors.cognitive_load + (1 - factors.tools_overlap)) / 4;
    
    return Math.max(0.1, Math.min(1.0, distance));
  }

  /**
   * Calculate tools/environment overlap between contexts
   */
  calculateToolsOverlap(tools1, tools2) {
    if (tools1.length === 0 && tools2.length === 0) return 1.0;
    
    const intersection = tools1.filter(tool => tools2.includes(tool));
    const union = [...new Set([...tools1, ...tools2])];
    
    return intersection.length / union.length;
  }

  /**
   * Generate strategies to mitigate context switching cost
   */
  generateSwitchingMitigationStrategies(contextDistance) {
    const strategies = [];
    
    if (contextDistance > 0.7) {
      strategies.push('Take 5-minute mental break before switching');
      strategies.push('Use transition ritual (close tabs, organize workspace)');
      strategies.push('Write quick notes about current context before switching');
    }
    
    if (contextDistance > 0.5) {
      strategies.push('Batch similar context tasks together');
      strategies.push('Use visual/physical cues for context anchoring');
    }
    
    strategies.push('Set timer for new context to maintain awareness');
    
    return strategies;
  }

  /**
   * Categorize switching cost severity
   */
  categorizeSwitchingCost(cost) {
    if (cost < 0.15) return 'minimal';
    if (cost < 0.25) return 'moderate';
    if (cost < 0.35) return 'significant';
    return 'high';
  }

  /**
   * Get fallback capacity prediction
   */
  getFallbackCapacityPrediction(targetTime, taskComplexity) {
    const hour = targetTime.getHours();
    let capacity = 0.7; // Default moderate capacity
    
    // Simple time-based adjustment
    if (hour >= 9 && hour <= 11) capacity = 0.9; // Morning peak
    if (hour >= 12 && hour <= 13) capacity = 0.5; // Lunch dip
    if (hour >= 21) capacity = 0.4; // Evening fatigue
    
    return {
      predicted_capacity: capacity,
      confidence: 0.4,
      fallback: true,
      recommendations: [{
        type: 'fallback',
        message: 'Using basic time-based capacity estimation',
        priority: 'low'
      }]
    };
  }

  /**
   * Get fallback hyperfocus prediction
   */
  getFallbackHyperfocusPrediction(currentTime) {
    const tomorrow9AM = new Date(currentTime);
    tomorrow9AM.setDate(tomorrow9AM.getDate() + 1);
    tomorrow9AM.setHours(9, 0, 0, 0);
    
    return {
      next_hyperfocus_window: {
        start_time: tomorrow9AM.toISOString(),
        estimated_duration: 120,
        probability: 0.7
      },
      confidence: 0.5,
      fallback: true
    };
  }

  /**
   * Close predictor and cleanup
   */
  async close() {
    if (this.contextEngine) {
      await this.contextEngine.close();
    }
  }
}

module.exports = CognitiveLoadPredictor;

// #endregion end: Cognitive Load Predictor