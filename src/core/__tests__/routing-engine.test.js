// #region start: Tests for Enhanced Routing Engine
const { 
  detectTaskType, 
  selectModel, 
  makeRoutingDecision,
  validateRoutingDecision 
} = require('../routing-engine');

describe('Enhanced Routing Engine', () => {
  
  describe('detectTaskType', () => {
    test('should detect debug tasks correctly', () => {
      const result = detectTaskType('Please help me debug this error in my code');
      expect(result.type).toBe('debug');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.keywords).toContain('debug');
    });
    
    test('should detect summarize tasks correctly', () => {
      const result = detectTaskType('Can you summarize this document for me?');
      expect(result.type).toBe('summarize');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.keywords).toContain('summarize');
    });
    
    test('should detect research tasks correctly', () => {
      const result = detectTaskType('I need to research the latest trends in AI');
      expect(result.type).toBe('research');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.keywords).toContain('research');
    });
    
    test('should handle empty input gracefully', () => {
      const result = detectTaskType('');
      expect(result.type).toBe('unknown');
      expect(result.confidence).toBe(0);
    });
    
    test('should handle null/undefined input', () => {
      const result = detectTaskType(null);
      expect(result.type).toBe('unknown');
      expect(result.confidence).toBe(0);
    });
    
    test('should boost confidence for multiple keyword matches', () => {
      const result = detectTaskType('Please help me debug and fix this broken code');
      expect(result.confidence).toBeGreaterThan(0.9); // Should get boosted
      expect(result.keywords.length).toBeGreaterThan(1);
    });
  });
  
  describe('selectModel', () => {
    const mockCharacterSheet = {
      task_type_preferences: {
        debug: 'gpt-4',
        write: 'claude',
        research: 'perplexity'
      },
      fallback_behavior: {
        fallback: 'smollm3'
      }
    };
    
    test('should select model based on character sheet preferences', () => {
      const result = selectModel('debug', mockCharacterSheet);
      expect(result.model).toBe('gpt-4');
      expect(result.reason).toContain('Character sheet preference');
    });
    
    test('should respect tier overrides', () => {
      const result = selectModel('debug', mockCharacterSheet, { preferTier: 'fast' });
      expect(result.reason).toContain('Tier override');
      expect(result.confidence).toBe(1.0);
    });
    
    test('should respect use case overrides', () => {
      const result = selectModel('debug', mockCharacterSheet, { useCase: 'code' });
      expect(result.reason).toContain('Use case override');
      expect(result.confidence).toBe(1.0);
    });
    
    test('should fall back to smollm3 for unknown tasks', () => {
      const result = selectModel('unknown_task', mockCharacterSheet);
      expect(result.model).toBe('smollm3');
      expect(result.reason).toContain('Fallback');
    });
    
    test('should include fallback chain', () => {
      const result = selectModel('debug', mockCharacterSheet);
      expect(result.fallbacks).toBeDefined();
      expect(Array.isArray(result.fallbacks)).toBe(true);
      expect(result.fallbacks).toContain('smollm3'); // Should always include final fallback
    });
  });
  
  describe('makeRoutingDecision', () => {
    const mockCharacterSheet = {
      task_type_preferences: {
        debug: 'gpt-4'
      },
      fallback_behavior: {
        fallback: 'smollm3'
      }
    };
    
    test('should create complete routing decision', () => {
      const result = makeRoutingDecision('Debug this code please', mockCharacterSheet);
      
      expect(result.timestamp).toBeDefined();
      expect(result.task).toBe('Debug this code please');
      expect(result.classification).toBeDefined();
      expect(result.classification.type).toBe('debug');
      expect(result.selection).toBeDefined();
      expect(result.selection.model).toBe('gpt-4');
      expect(result.loadout).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.version).toBe('2.0');
    });
    
    test('should apply loadout overrides', () => {
      const characterSheetWithLoadout = {
        ...mockCharacterSheet,
        loadout: { model: 'claude' }
      };
      
      const result = makeRoutingDecision('Debug this code', characterSheetWithLoadout);
      expect(result.selection.model).toBe('claude');
      expect(result.selection.reason).toContain('Loadout override');
    });
    
    test('should preserve routing options', () => {
      const options = { preferTier: 'fast', useCase: 'debug' };
      const result = makeRoutingDecision('Debug this', mockCharacterSheet, options);
      
      expect(result.options).toEqual(options);
    });
  });
  
  describe('validateRoutingDecision', () => {
    test('should validate correct routing decision', () => {
      const decision = {
        classification: { confidence: 0.8 },
        selection: { 
          model: 'gpt-4',
          fallbacks: ['claude', 'smollm3']
        }
      };
      
      const result = validateRoutingDecision(decision);
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBe(0);
      expect(result.errors.length).toBe(0);
    });
    
    test('should warn about low confidence', () => {
      const decision = {
        classification: { confidence: 0.1 },
        selection: { 
          model: 'gpt-4',
          fallbacks: ['smollm3']
        }
      };
      
      const result = validateRoutingDecision(decision);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Low confidence');
    });
    
    test('should warn about missing fallbacks', () => {
      const decision = {
        classification: { confidence: 0.8 },
        selection: { 
          model: 'gpt-4',
          fallbacks: []
        }
      };
      
      const result = validateRoutingDecision(decision);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('fallback'))).toBe(true);
    });
  });
});

// #endregion end: Tests for Enhanced Routing Engine