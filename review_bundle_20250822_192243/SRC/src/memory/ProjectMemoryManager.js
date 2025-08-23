// #region start: Project Memory Manager for The Steward
// Manages project context classification and routing decision history correlation
// Enables cross-session pattern recognition for intelligent model selection

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

/**
 * ProjectMemoryManager - Core memory bridge between semantic database and routing intelligence
 * 
 * Key Features:
 * - Import and classify existing semantic memory chunks
 * - Build routing decision history correlation
 * - Enable project-aware model selection
 * - Cross-session learning and pattern recognition
 */
class ProjectMemoryManager {
  constructor(options = {}) {
    this.semanticDbPath = options.semanticDbPath || '/Users/chip/Claude/_Claude-Controlled/semantic-memory-database.json';
    this.stewardDbPath = options.stewardDbPath || path.join(__dirname, '../../database/steward.db');
    this.db = null;
    this.semanticMemory = null;
    
    // Project classification patterns
    this.projectPatterns = {
      'steward-development': {
        keywords: ['steward', 'routing', 'model', 'ai-coordination', 'analytics', 'cli', 'web-interface'],
        importance_threshold: 2.0,
        preferred_models: ['claude', 'smollm3'],
        complexity_bias: 'high'
      },
      'creative-writing': {
        keywords: ['creative', 'writing', 'fiction', 'story', 'character', 'narrative'],
        importance_threshold: 1.5,
        preferred_models: ['dolphin-mistral', 'gpt-4'],
        complexity_bias: 'medium'
      },
      'technical-development': {
        keywords: ['development', 'coding', 'programming', 'debugging', 'implementation'],
        importance_threshold: 1.8,
        preferred_models: ['claude', 'qwen3-coder'],
        complexity_bias: 'high'
      },
      'research-analysis': {
        keywords: ['research', 'analysis', 'investigation', 'documentation'],
        importance_threshold: 1.5,
        preferred_models: ['perplexity', 'claude'],
        complexity_bias: 'medium'
      },
      'quick-tasks': {
        keywords: ['quick', 'simple', 'brief', 'route', 'fallback'],
        importance_threshold: 0.5,
        preferred_models: ['smollm3', 'phi4'],
        complexity_bias: 'low'
      }
    };
  }

  /**
   * Initialize memory manager and database connections
   */
  async initialize() {
    try {
      // Load semantic memory database
      await this.loadSemanticMemory();
      
      // Initialize SQLite connection
      await this.initializeDatabase();
      
      // Import project history if not already done
      await this.importProjectHistory();
      
      console.log('ProjectMemoryManager initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize ProjectMemoryManager:', error);
      return false;
    }
  }

  /**
   * Load semantic memory database from JSON file
   */
  async loadSemanticMemory() {
    try {
      const semanticData = fs.readFileSync(this.semanticDbPath, 'utf8');
      this.semanticMemory = JSON.parse(semanticData);
      console.log(`Loaded ${this.semanticMemory.chunks.length} memory chunks from semantic database`);
    } catch (error) {
      console.warn('Could not load semantic memory database:', error.message);
      this.semanticMemory = { chunks: [], relationships: [] };
    }
  }

  /**
   * Initialize database connection and create memory tables
   */
  async initializeDatabase() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.stewardDbPath, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Create memory tables
        this.db.serialize(() => {
          // Project contexts table
          this.db.run(`
            CREATE TABLE IF NOT EXISTS project_contexts (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              project_name TEXT UNIQUE,
              keywords TEXT,
              importance_threshold REAL,
              preferred_models TEXT,
              complexity_bias TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `);

          // Routing history with project context
          this.db.run(`
            CREATE TABLE IF NOT EXISTS routing_history_context (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              project_context TEXT,
              task_input TEXT,
              task_type TEXT,
              selected_model TEXT,
              confidence REAL,
              success_rating REAL,
              user_feedback TEXT,
              performance_score REAL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `);

          // Project patterns table
          this.db.run(`
            CREATE TABLE IF NOT EXISTS project_patterns (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              project_context TEXT,
              pattern_type TEXT,
              pattern_data TEXT,
              success_count INTEGER DEFAULT 0,
              total_count INTEGER DEFAULT 0,
              confidence REAL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `);

          resolve();
        });
      });
    });
  }

  /**
   * Import project history from semantic memory
   */
  async importProjectHistory() {
    if (!this.semanticMemory || !this.semanticMemory.chunks) {
      console.log('No semantic memory data to import');
      return;
    }

    let importCount = 0;
    
    for (const chunk of this.semanticMemory.chunks) {
      try {
        const projectContext = this.classifyProjectContext(chunk);
        
        if (projectContext !== 'unknown') {
          // Store project context classification
          await this.storeProjectContextClassification(chunk, projectContext);
          
          // Extract routing patterns if available
          await this.extractRoutingPatterns(chunk, projectContext);
          
          importCount++;
        }
      } catch (error) {
        console.warn(`Failed to import chunk ${chunk.id}:`, error.message);
      }
    }

    console.log(`Imported ${importCount} memory chunks with project context`);
  }

  /**
   * Classify project context from memory chunk
   */
  classifyProjectContext(chunk) {
    const content = chunk.content.toLowerCase();
    const topics = chunk.metadata?.topics || [];
    
    let bestMatch = 'unknown';
    let highestScore = 0;
    
    for (const [projectName, pattern] of Object.entries(this.projectPatterns)) {
      let score = 0;
      
      // Score based on keywords in content
      for (const keyword of pattern.keywords) {
        if (content.includes(keyword)) {
          score += 1;
        }
      }
      
      // Score based on topics match
      for (const topic of topics) {
        for (const keyword of pattern.keywords) {
          if (topic.includes(keyword)) {
            score += 0.5;
          }
        }
      }
      
      // Consider importance score
      const importanceScore = chunk.metadata?.importance_score || 0;
      if (importanceScore >= pattern.importance_threshold) {
        score += 1;
      }
      
      if (score > highestScore) {
        highestScore = score;
        bestMatch = projectName;
      }
    }
    
    return highestScore >= 2 ? bestMatch : 'unknown';
  }

  /**
   * Store project context classification
   */
  async storeProjectContextClassification(chunk, projectContext) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        INSERT OR IGNORE INTO project_contexts 
        (project_name, keywords, importance_threshold, preferred_models, complexity_bias)
        VALUES (?, ?, ?, ?, ?)
      `, [
        projectContext,
        JSON.stringify(this.projectPatterns[projectContext]?.keywords || []),
        this.projectPatterns[projectContext]?.importance_threshold || 1.0,
        JSON.stringify(this.projectPatterns[projectContext]?.preferred_models || []),
        this.projectPatterns[projectContext]?.complexity_bias || 'medium'
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Extract routing patterns from memory chunk
   */
  async extractRoutingPatterns(chunk, projectContext) {
    const content = chunk.content;
    
    // Look for routing decision patterns
    const routingMatches = content.match(/model[:\s]+([a-zA-Z0-9-]+)/gi) || [];
    const performanceMatches = content.match(/performance|success|completed|working/gi) || [];
    
    if (routingMatches.length > 0) {
      for (const match of routingMatches) {
        const model = match.split(/[:\s]+/)[1];
        const successIndicator = performanceMatches.length > 0;
        
        await this.storeRoutingPattern(projectContext, model, successIndicator);
      }
    }
  }

  /**
   * Store routing pattern from historical data
   */
  async storeRoutingPattern(projectContext, model, success) {
    return new Promise((resolve, reject) => {
      // First check if pattern exists
      this.db.get(`
        SELECT * FROM project_patterns 
        WHERE project_context = ? AND pattern_type = 'model_preference' 
        AND pattern_data = ?
      `, [projectContext, model], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (row) {
          // Update existing pattern
          const newSuccessCount = row.success_count + (success ? 1 : 0);
          const newTotalCount = row.total_count + 1;
          const newConfidence = newTotalCount > 0 ? newSuccessCount / newTotalCount : 0;

          this.db.run(`
            UPDATE project_patterns 
            SET success_count = ?, total_count = ?, confidence = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [newSuccessCount, newTotalCount, newConfidence, row.id], resolve);
        } else {
          // Create new pattern
          this.db.run(`
            INSERT INTO project_patterns 
            (project_context, pattern_type, pattern_data, success_count, total_count, confidence)
            VALUES (?, 'model_preference', ?, ?, 1, ?)
          `, [projectContext, model, success ? 1 : 0, success ? 1 : 0], resolve);
        }
      });
    });
  }

  /**
   * Detect current project context from task input
   */
  async detectCurrentProjectContext(taskInput) {
    const loweredInput = taskInput.toLowerCase();
    let bestMatch = 'unknown';
    let highestScore = 0;
    
    for (const [projectName, pattern] of Object.entries(this.projectPatterns)) {
      let score = 0;
      
      for (const keyword of pattern.keywords) {
        if (loweredInput.includes(keyword)) {
          score += 1;
        }
      }
      
      if (score > highestScore) {
        highestScore = score;
        bestMatch = projectName;
      }
    }
    
    return {
      project: highestScore >= 1 ? bestMatch : 'unknown',
      confidence: Math.min(highestScore / 3, 1.0),
      keywords_matched: highestScore
    };
  }

  /**
   * Get routing recommendations based on project context and history
   */
  async getRoutingRecommendations(projectContext, taskType) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT pattern_data, confidence, success_count, total_count
        FROM project_patterns 
        WHERE project_context = ? AND pattern_type = 'model_preference'
        ORDER BY confidence DESC, success_count DESC
        LIMIT 5
      `, [projectContext], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        const recommendations = rows.map(row => ({
          model: row.pattern_data,
          confidence: row.confidence,
          success_rate: row.total_count > 0 ? row.success_count / row.total_count : 0,
          historical_uses: row.total_count
        }));

        // Add default project preferences
        const projectPattern = this.projectPatterns[projectContext];
        if (projectPattern && projectPattern.preferred_models) {
          for (const model of projectPattern.preferred_models) {
            if (!recommendations.find(r => r.model === model)) {
              recommendations.push({
                model: model,
                confidence: 0.7,
                success_rate: 0.5,
                historical_uses: 0,
                source: 'project_pattern'
              });
            }
          }
        }

        resolve(recommendations);
      });
    });
  }

  /**
   * Record routing decision for future learning
   */
  async recordRoutingDecision(projectContext, taskInput, taskType, selectedModel, confidence, userFeedback = null) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        INSERT INTO routing_history_context 
        (project_context, task_input, task_type, selected_model, confidence, user_feedback)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [projectContext, taskInput, taskType, selectedModel, confidence, userFeedback], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Update routing pattern based on user feedback
   */
  async updateRoutingPattern(projectContext, model, success, performanceScore = null) {
    return new Promise((resolve, reject) => {
      // Update or create pattern based on feedback
      this.db.get(`
        SELECT * FROM project_patterns 
        WHERE project_context = ? AND pattern_type = 'model_preference' AND pattern_data = ?
      `, [projectContext, model], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (row) {
          const newSuccessCount = row.success_count + (success ? 1 : 0);
          const newTotalCount = row.total_count + 1;
          const newConfidence = newTotalCount > 0 ? newSuccessCount / newTotalCount : 0;

          this.db.run(`
            UPDATE project_patterns 
            SET success_count = ?, total_count = ?, confidence = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [newSuccessCount, newTotalCount, newConfidence, row.id], resolve);
        } else {
          this.db.run(`
            INSERT INTO project_patterns 
            (project_context, pattern_type, pattern_data, success_count, total_count, confidence)
            VALUES (?, 'model_preference', ?, ?, 1, ?)
          `, [projectContext, model, success ? 1 : 0, success ? 1.0 : 0.0], resolve);
        }
      });
    });
  }

  /**
   * Get project statistics and insights
   */
  async getProjectInsights(projectContext) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          COUNT(*) as total_decisions,
          AVG(confidence) as avg_confidence,
          selected_model,
          COUNT(*) as usage_count
        FROM routing_history_context 
        WHERE project_context = ?
        GROUP BY selected_model
        ORDER BY usage_count DESC
      `, [projectContext], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        resolve({
          project: projectContext,
          total_decisions: rows.reduce((sum, row) => sum + row.usage_count, 0),
          average_confidence: rows.length > 0 ? rows.reduce((sum, row) => sum + row.avg_confidence, 0) / rows.length : 0,
          model_usage: rows,
          top_model: rows[0]?.selected_model || null
        });
      });
    });
  }

  /**
   * Get cross-session learning insights
   */
  async getCrossSessionInsights() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          project_context,
          COUNT(*) as decisions,
          AVG(confidence) as avg_confidence,
          COUNT(DISTINCT selected_model) as models_used
        FROM routing_history_context 
        GROUP BY project_context
        ORDER BY decisions DESC
      `, [], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        resolve({
          total_projects: rows.length,
          total_decisions: rows.reduce((sum, row) => sum + row.decisions, 0),
          projects: rows,
          learning_status: 'active'
        });
      });
    });
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.db) {
      return new Promise((resolve) => {
        this.db.close((err) => {
          if (err) console.error('Error closing database:', err);
          resolve();
        });
      });
    }
  }
}

module.exports = ProjectMemoryManager;

// #endregion end: Project Memory Manager