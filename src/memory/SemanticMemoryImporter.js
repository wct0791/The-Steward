// #region start: Semantic Memory Importer for The Steward
// Imports existing semantic memory database and correlates with routing decisions
// Builds project classification and historical pattern recognition

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

/**
 * SemanticMemoryImporter - Imports and processes semantic memory for routing intelligence
 * 
 * Key Features:
 * - Import semantic memory chunks with project classification
 * - Extract routing patterns from historical content
 * - Build confidence scores for project-specific routing
 * - Create searchable memory index for context awareness
 */
class SemanticMemoryImporter {
  constructor(options = {}) {
    this.semanticDbPath = options.semanticDbPath || '/Users/chip/Claude/_Claude-Controlled/semantic-memory-database.json';
    this.stewardDbPath = options.stewardDbPath || path.join(__dirname, '../../database/steward.db');
    this.db = null;
    
    // Import configuration
    this.importConfig = {
      min_importance_score: 1.0,  // Only import chunks with meaningful importance
      max_chunk_age_days: 365,    // Only import chunks from last year
      batch_size: 50,             // Process chunks in batches
      enable_pattern_extraction: true,
      enable_relationship_mapping: true
    };
    
    // Routing pattern extraction rules
    this.routingPatterns = {
      model_mentions: /(?:model|using|selected|chose)\s+([a-zA-Z0-9-]+)/gi,
      success_indicators: /(?:success|completed|working|achieved|functional|operational)/gi,
      failure_indicators: /(?:failed|error|broken|issue|problem)/gi,
      performance_indicators: /(?:fast|slow|efficient|optimized|performance)/gi,
      satisfaction_indicators: /(?:excellent|good|poor|satisfied|disappointed)/gi
    };
  }

  /**
   * Initialize the importer
   */
  async initialize() {
    try {
      // Initialize database connection
      await this.initializeDatabase();
      console.log('SemanticMemoryImporter initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize SemanticMemoryImporter:', error);
      return false;
    }
  }

  /**
   * Initialize database connection and create import tables
   */
  async initializeDatabase() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.stewardDbPath, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        this.db.serialize(() => {
          // Semantic memory chunks table
          this.db.run(`
            CREATE TABLE IF NOT EXISTS semantic_memory_chunks (
              id TEXT PRIMARY KEY,
              content TEXT,
              content_summary TEXT,
              project_classification TEXT,
              project_confidence REAL,
              importance_score REAL,
              topics TEXT,
              relationships TEXT,
              extracted_patterns TEXT,
              created_date DATETIME,
              last_accessed DATETIME,
              import_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `);

          // Extracted routing patterns table
          this.db.run(`
            CREATE TABLE IF NOT EXISTS extracted_routing_patterns (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              chunk_id TEXT,
              pattern_type TEXT,
              pattern_value TEXT,
              confidence REAL,
              success_indicator BOOLEAN,
              project_context TEXT,
              extraction_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (chunk_id) REFERENCES semantic_memory_chunks (id)
            )
          `);

          // Memory search index table
          this.db.run(`
            CREATE TABLE IF NOT EXISTS memory_search_index (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              chunk_id TEXT,
              keyword TEXT,
              relevance_score REAL,
              context_type TEXT,
              FOREIGN KEY (chunk_id) REFERENCES semantic_memory_chunks (id)
            )
          `);

          resolve();
        });
      });
    });
  }

  /**
   * Import semantic memory database
   */
  async importSemanticMemory() {
    try {
      console.log('Starting semantic memory import...');
      
      // Load semantic memory data
      const semanticData = await this.loadSemanticData();
      if (!semanticData || !semanticData.chunks) {
        console.log('No semantic memory data found to import');
        return { success: true, imported: 0, skipped: 0, errors: 0 };
      }

      // Filter chunks based on import criteria
      const chunksToImport = this.filterChunksForImport(semanticData.chunks);
      console.log(`Found ${chunksToImport.length} chunks to import (filtered from ${semanticData.chunks.length})`);

      // Process chunks in batches
      const results = await this.processChunksInBatches(chunksToImport);
      
      // Import relationships if enabled
      if (this.importConfig.enable_relationship_mapping && semanticData.relationships) {
        await this.importRelationships(semanticData.relationships);
      }

      console.log('Semantic memory import completed:', results);
      return results;

    } catch (error) {
      console.error('Error importing semantic memory:', error);
      throw error;
    }
  }

  /**
   * Load semantic memory data from JSON file
   */
  async loadSemanticData() {
    try {
      const data = fs.readFileSync(this.semanticDbPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.warn('Semantic memory database file not found:', this.semanticDbPath);
        return null;
      }
      throw error;
    }
  }

  /**
   * Filter chunks based on import criteria
   */
  filterChunksForImport(chunks) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.importConfig.max_chunk_age_days);

    return chunks.filter(chunk => {
      // Check importance score
      const importance = chunk.metadata?.importance_score || 0;
      if (importance < this.importConfig.min_importance_score) {
        return false;
      }

      // Check age
      const createdDate = new Date(chunk.metadata?.created || chunk.metadata?.last_updated || '2025-01-01');
      if (createdDate < cutoffDate) {
        return false;
      }

      // Check if chunk has meaningful content
      if (!chunk.content || chunk.content.length < 100) {
        return false;
      }

      return true;
    });
  }

  /**
   * Process chunks in batches to avoid memory issues
   */
  async processChunksInBatches(chunks) {
    const results = { imported: 0, skipped: 0, errors: 0 };
    
    for (let i = 0; i < chunks.length; i += this.importConfig.batch_size) {
      const batch = chunks.slice(i, i + this.importConfig.batch_size);
      console.log(`Processing batch ${Math.floor(i / this.importConfig.batch_size) + 1}/${Math.ceil(chunks.length / this.importConfig.batch_size)}`);
      
      for (const chunk of batch) {
        try {
          const processed = await this.processChunk(chunk);
          if (processed) {
            results.imported++;
          } else {
            results.skipped++;
          }
        } catch (error) {
          console.warn(`Error processing chunk ${chunk.id}:`, error.message);
          results.errors++;
        }
      }
      
      // Small delay between batches to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    results.success = true;
    return results;
  }

  /**
   * Process individual memory chunk
   */
  async processChunk(chunk) {
    // Check if chunk already imported
    const exists = await this.checkChunkExists(chunk.id);
    if (exists) {
      return false; // Skip already imported chunks
    }

    // Classify project context
    const projectClassification = this.classifyProjectContext(chunk);
    
    // Generate content summary
    const contentSummary = this.generateContentSummary(chunk.content);
    
    // Extract routing patterns
    const patterns = this.importConfig.enable_pattern_extraction ? 
      this.extractRoutingPatterns(chunk, projectClassification.project) : [];
    
    // Store chunk in database
    await this.storeChunk(chunk, projectClassification, contentSummary, patterns);
    
    // Build search index
    await this.buildSearchIndex(chunk.id, chunk.content, projectClassification);
    
    return true;
  }

  /**
   * Check if chunk already exists in database
   */
  async checkChunkExists(chunkId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT id FROM semantic_memory_chunks WHERE id = ?',
        [chunkId],
        (err, row) => {
          if (err) reject(err);
          else resolve(!!row);
        }
      );
    });
  }

  /**
   * Classify project context from chunk content
   */
  classifyProjectContext(chunk) {
    const content = chunk.content.toLowerCase();
    const topics = chunk.metadata?.topics || [];
    
    // Project classification patterns
    const patterns = {
      'steward-development': {
        keywords: ['steward', 'routing', 'model', 'ai-coordination', 'analytics', 'cli', 'web-interface'],
        weight: 1.0
      },
      'phase2a-analytics': {
        keywords: ['phase2a', 'analytics', 'dashboard', 'performance', 'feedback'],
        weight: 1.0
      },
      'huggingface-integration': {
        keywords: ['huggingface', 'docker', 'model-integration', 'local-models'],
        weight: 0.8
      },
      'creative-writing': {
        keywords: ['creative', 'writing', 'fiction', 'story', 'character'],
        weight: 0.8
      },
      'technical-development': {
        keywords: ['development', 'coding', 'programming', 'implementation', 'bug-fix'],
        weight: 0.9
      },
      'research-analysis': {
        keywords: ['research', 'analysis', 'documentation', 'investigation'],
        weight: 0.7
      }
    };

    let bestMatch = { project: 'unknown', confidence: 0 };
    
    for (const [projectName, pattern] of Object.entries(patterns)) {
      let score = 0;
      
      // Score based on content keywords
      for (const keyword of pattern.keywords) {
        if (content.includes(keyword)) {
          score += pattern.weight;
        }
      }
      
      // Score based on topics
      for (const topic of topics) {
        for (const keyword of pattern.keywords) {
          if (topic.includes(keyword)) {
            score += pattern.weight * 0.5;
          }
        }
      }
      
      // Consider importance score
      const importance = chunk.metadata?.importance_score || 0;
      if (importance >= 2.0) {
        score += 0.5;
      }
      
      const confidence = Math.min(score / pattern.keywords.length, 1.0);
      
      if (confidence > bestMatch.confidence) {
        bestMatch = { project: projectName, confidence };
      }
    }
    
    // Require minimum confidence
    if (bestMatch.confidence < 0.3) {
      bestMatch = { project: 'unknown', confidence: bestMatch.confidence };
    }
    
    return bestMatch;
  }

  /**
   * Generate content summary for chunk
   */
  generateContentSummary(content) {
    // Extract key sentences (first sentence + sentences with key terms)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const keyTerms = ['success', 'completed', 'achieved', 'implemented', 'problem', 'solution', 'model', 'performance'];
    
    let summary = sentences[0] || '';
    
    for (let i = 1; i < Math.min(sentences.length, 5); i++) {
      const sentence = sentences[i].trim();
      const hasKeyTerm = keyTerms.some(term => sentence.toLowerCase().includes(term));
      
      if (hasKeyTerm || i === 1) {
        summary += (summary ? '. ' : '') + sentence;
      }
    }
    
    return summary.substring(0, 500); // Limit to 500 characters
  }

  /**
   * Extract routing patterns from chunk content
   */
  extractRoutingPatterns(chunk, projectContext) {
    const content = chunk.content;
    const patterns = [];
    
    // Extract model mentions
    const modelMatches = [...content.matchAll(this.routingPatterns.model_mentions)];
    for (const match of modelMatches) {
      const model = match[1]?.toLowerCase();
      if (model && model.length > 2) {
        // Check for success/failure indicators near model mention
        const contextWindow = content.substring(
          Math.max(0, match.index - 100),
          Math.min(content.length, match.index + 100)
        );
        
        const hasSuccess = this.routingPatterns.success_indicators.test(contextWindow);
        const hasFailure = this.routingPatterns.failure_indicators.test(contextWindow);
        
        patterns.push({
          type: 'model_mention',
          value: model,
          confidence: hasSuccess ? 0.8 : (hasFailure ? 0.2 : 0.5),
          success_indicator: hasSuccess && !hasFailure,
          context_window: contextWindow.substring(0, 200)
        });
      }
    }
    
    // Extract performance patterns
    const performanceMatches = [...content.matchAll(this.routingPatterns.performance_indicators)];
    for (const match of performanceMatches) {
      const contextWindow = content.substring(
        Math.max(0, match.index - 50),
        Math.min(content.length, match.index + 50)
      );
      
      patterns.push({
        type: 'performance_indicator',
        value: match[0],
        confidence: 0.6,
        success_indicator: true,
        context_window: contextWindow
      });
    }
    
    return patterns;
  }

  /**
   * Store processed chunk in database
   */
  async storeChunk(chunk, classification, summary, patterns) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        INSERT INTO semantic_memory_chunks (
          id, content, content_summary, project_classification, project_confidence,
          importance_score, topics, relationships, extracted_patterns,
          created_date, last_accessed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        chunk.id,
        chunk.content,
        summary,
        classification.project,
        classification.confidence,
        chunk.metadata?.importance_score || 0,
        JSON.stringify(chunk.metadata?.topics || []),
        JSON.stringify(chunk.metadata?.relationships || []),
        JSON.stringify(patterns),
        chunk.metadata?.created || new Date().toISOString(),
        chunk.metadata?.last_accessed
      ], async (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Store extracted patterns
        for (const pattern of patterns) {
          await this.storeExtractedPattern(chunk.id, pattern, classification.project);
        }
        
        resolve();
      });
    });
  }

  /**
   * Store extracted routing pattern
   */
  async storeExtractedPattern(chunkId, pattern, projectContext) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        INSERT INTO extracted_routing_patterns (
          chunk_id, pattern_type, pattern_value, confidence,
          success_indicator, project_context
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        chunkId,
        pattern.type,
        pattern.value,
        pattern.confidence,
        pattern.success_indicator,
        projectContext
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Build search index for chunk
   */
  async buildSearchIndex(chunkId, content, classification) {
    const keywords = this.extractKeywords(content);
    
    for (const keyword of keywords) {
      await this.storeSearchKeyword(chunkId, keyword, classification.project);
    }
  }

  /**
   * Extract keywords from content for search indexing
   */
  extractKeywords(content) {
    const words = content.toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    // Count word frequency
    const wordFreq = {};
    for (const word of words) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
    
    // Return top keywords by frequency
    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word, freq]) => ({ word, relevance: freq / words.length }));
  }

  /**
   * Store search keyword
   */
  async storeSearchKeyword(chunkId, keyword, contextType) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        INSERT INTO memory_search_index (chunk_id, keyword, relevance_score, context_type)
        VALUES (?, ?, ?, ?)
      `, [chunkId, keyword.word, keyword.relevance, contextType], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Import relationships from semantic memory
   */
  async importRelationships(relationships) {
    console.log(`Importing ${relationships.length} semantic relationships...`);
    
    // This would create a relationships table and store connection data
    // For now, we store relationships as JSON in the chunks table
    // Future enhancement: create dedicated relationship analysis
  }

  /**
   * Get import statistics
   */
  async getImportStatistics() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          project_classification,
          COUNT(*) as chunk_count,
          AVG(importance_score) as avg_importance,
          AVG(project_confidence) as avg_confidence
        FROM semantic_memory_chunks 
        GROUP BY project_classification
        ORDER BY chunk_count DESC
      `, [], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        this.db.get(`
          SELECT 
            COUNT(*) as total_chunks,
            COUNT(DISTINCT project_classification) as unique_projects,
            MAX(import_timestamp) as last_import
          FROM semantic_memory_chunks
        `, [], (err, summary) => {
          if (err) {
            reject(err);
            return;
          }
          
          resolve({
            summary,
            by_project: rows
          });
        });
      });
    });
  }

  /**
   * Search semantic memory by keywords
   */
  async searchMemory(keywords, projectContext = null, limit = 10) {
    const searchTerms = keywords.toLowerCase().split(/\s+/);
    
    return new Promise((resolve, reject) => {
      let query = `
        SELECT DISTINCT c.*, 
               SUM(i.relevance_score) as total_relevance
        FROM semantic_memory_chunks c
        JOIN memory_search_index i ON c.id = i.chunk_id
        WHERE i.keyword IN (${searchTerms.map(() => '?').join(',')})
      `;
      
      let params = [...searchTerms];
      
      if (projectContext) {
        query += ' AND c.project_classification = ?';
        params.push(projectContext);
      }
      
      query += `
        GROUP BY c.id
        ORDER BY total_relevance DESC, c.importance_score DESC
        LIMIT ?
      `;
      params.push(limit);
      
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * Close the importer and cleanup
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

module.exports = SemanticMemoryImporter;

// #endregion end: Semantic Memory Importer