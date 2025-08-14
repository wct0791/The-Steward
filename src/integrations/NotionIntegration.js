// #region start: Notion Integration for The Steward
// Ambient Intelligence integration with Notion for project context detection and automated documentation
// Provides real-time workspace awareness and session history documentation

const { Client } = require('@notionhq/client');

/**
 * NotionIntegration - Seamless Notion workspace integration
 * 
 * Key Features:
 * - Project context detection from current workspace/page
 * - Automated documentation of Steward sessions to project pages
 * - Task status synchronization with project databases
 * - Import Notion project history into Steward memory
 * - Real-time workspace awareness for enhanced routing context
 */
class NotionIntegration {
  constructor(options = {}) {
    this.apiToken = options.apiToken || process.env.NOTION_API_TOKEN;
    this.notion = null;
    this.isInitialized = false;
    
    // Integration configuration
    this.config = {
      auto_documentation: options.autoDocumentation !== false,
      project_sync_frequency: options.projectSyncFrequency || 'real_time',
      workspace_routing_weight: options.workspaceRoutingWeight || 0.4,
      enable_context_detection: options.enableContextDetection !== false,
      session_documentation_template: options.sessionDocumentationTemplate || 'steward_session',
      max_pages_to_scan: options.maxPagesToScan || 50
    };

    // Cache for performance
    this.workspaceCache = new Map();
    this.projectContextCache = new Map();
    this.databaseCache = new Map();
    
    // Current context tracking
    this.currentWorkspaceId = null;
    this.currentPageId = null;
    this.currentProjectContext = null;
    this.lastContextUpdate = null;

    console.log('NotionIntegration initialized with config:', this.config);
  }

  /**
   * Initialize Notion client and verify connection
   */
  async initialize() {
    try {
      if (!this.apiToken) {
        console.warn('Notion API token not provided - integration will be disabled');
        return false;
      }

      this.notion = new Client({
        auth: this.apiToken,
      });

      // Test connection
      await this.testConnection();
      
      // Load workspace information
      await this.loadWorkspaceInfo();
      
      this.isInitialized = true;
      console.log('NotionIntegration initialized successfully');
      return true;

    } catch (error) {
      console.error('Failed to initialize NotionIntegration:', error);
      return false;
    }
  }

  /**
   * Test Notion API connection
   */
  async testConnection() {
    try {
      const response = await this.notion.users.me();
      console.log(`Connected to Notion as: ${response.name || response.id}`);
      return true;
    } catch (error) {
      throw new Error(`Notion connection failed: ${error.message}`);
    }
  }

  /**
   * Load workspace information and cache frequently used data
   */
  async loadWorkspaceInfo() {
    try {
      // Get all accessible databases
      const databases = await this.notion.search({
        filter: {
          property: 'object',
          value: 'database'
        },
        page_size: this.config.max_pages_to_scan
      });

      // Cache database information
      for (const db of databases.results) {
        this.databaseCache.set(db.id, {
          id: db.id,
          title: this.extractTitle(db.title),
          properties: db.properties,
          last_edited: db.last_edited_time,
          created: db.created_time
        });
      }

      // Get recent pages for context detection
      const pages = await this.notion.search({
        filter: {
          property: 'object',
          value: 'page'
        },
        sort: {
          direction: 'descending',
          timestamp: 'last_edited_time'
        },
        page_size: this.config.max_pages_to_scan
      });

      // Cache page information for context detection
      for (const page of pages.results) {
        const pageInfo = await this.extractPageInfo(page);
        this.projectContextCache.set(page.id, pageInfo);
      }

      console.log(`Loaded ${databases.results.length} databases and ${pages.results.length} pages`);

    } catch (error) {
      console.error('Error loading workspace info:', error);
    }
  }

  /**
   * Detect current project context from Notion workspace
   */
  async detectProjectContext(hints = {}) {
    if (!this.isInitialized) {
      return this.getDefaultContext();
    }

    try {
      // Use hints if provided (e.g., from current browser tab, clipboard, etc.)
      let contextCandidates = [];

      // Method 1: Check recently edited pages
      const recentPages = await this.getRecentlyEditedPages(10);
      contextCandidates.push(...recentPages);

      // Method 2: Search based on hints
      if (hints.keywords && hints.keywords.length > 0) {
        const searchResults = await this.searchByKeywords(hints.keywords);
        contextCandidates.push(...searchResults);
      }

      // Method 3: Check for active project databases
      const projectDatabases = await this.getProjectDatabases();
      contextCandidates.push(...projectDatabases);

      // Analyze and rank context candidates
      const rankedContexts = this.rankContextCandidates(contextCandidates, hints);
      
      if (rankedContexts.length > 0) {
        this.currentProjectContext = rankedContexts[0];
        this.lastContextUpdate = new Date().toISOString();
        
        return {
          success: true,
          context: this.currentProjectContext,
          confidence: rankedContexts[0].confidence,
          detected_at: this.lastContextUpdate,
          method: rankedContexts[0].detection_method
        };
      }

      return this.getDefaultContext();

    } catch (error) {
      console.error('Error detecting project context:', error);
      return this.getDefaultContext();
    }
  }

  /**
   * Get recently edited pages
   */
  async getRecentlyEditedPages(limit = 10) {
    try {
      const response = await this.notion.search({
        filter: {
          property: 'object',
          value: 'page'
        },
        sort: {
          direction: 'descending',
          timestamp: 'last_edited_time'
        },
        page_size: limit
      });

      return response.results.map(page => ({
        id: page.id,
        title: this.extractTitle(page.properties?.title?.title || page.properties?.Name?.title || []),
        type: 'recent_page',
        last_edited: page.last_edited_time,
        confidence: 0.7,
        detection_method: 'recent_activity',
        page_url: page.url,
        properties: page.properties
      }));

    } catch (error) {
      console.error('Error getting recent pages:', error);
      return [];
    }
  }

  /**
   * Search Notion by keywords
   */
  async searchByKeywords(keywords) {
    try {
      const searchQuery = keywords.join(' ');
      const response = await this.notion.search({
        query: searchQuery,
        page_size: 20
      });

      return response.results.map(item => ({
        id: item.id,
        title: this.extractTitle(item.properties?.title?.title || item.properties?.Name?.title || item.title || []),
        type: item.object === 'database' ? 'database' : 'page',
        last_edited: item.last_edited_time,
        confidence: 0.8,
        detection_method: 'keyword_search',
        search_query: searchQuery,
        url: item.url,
        properties: item.properties
      }));

    } catch (error) {
      console.error('Error searching by keywords:', error);
      return [];
    }
  }

  /**
   * Get project databases (databases that likely contain project information)
   */
  async getProjectDatabases() {
    const projectKeywords = ['project', 'task', 'steward', 'development', 'work', 'todo'];
    const projectDatabases = [];

    for (const [dbId, dbInfo] of this.databaseCache) {
      const titleLower = dbInfo.title.toLowerCase();
      const matchScore = projectKeywords.reduce((score, keyword) => {
        return titleLower.includes(keyword) ? score + 1 : score;
      }, 0);

      if (matchScore > 0) {
        projectDatabases.push({
          id: dbId,
          title: dbInfo.title,
          type: 'project_database',
          last_edited: dbInfo.last_edited,
          confidence: Math.min(0.9, 0.6 + (matchScore * 0.1)),
          detection_method: 'project_database',
          match_score: matchScore,
          properties: dbInfo.properties
        });
      }
    }

    return projectDatabases.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Rank context candidates based on various factors
   */
  rankContextCandidates(candidates, hints = {}) {
    return candidates
      .map(candidate => ({
        ...candidate,
        final_confidence: this.calculateContextConfidence(candidate, hints)
      }))
      .sort((a, b) => b.final_confidence - a.final_confidence)
      .slice(0, 5); // Top 5 candidates
  }

  /**
   * Calculate context confidence based on various factors
   */
  calculateContextConfidence(candidate, hints) {
    let confidence = candidate.confidence || 0.5;

    // Boost confidence for recent activity
    if (candidate.last_edited) {
      const hoursAgo = (Date.now() - new Date(candidate.last_edited).getTime()) / (1000 * 60 * 60);
      if (hoursAgo < 1) confidence *= 1.3;
      else if (hoursAgo < 24) confidence *= 1.1;
      else if (hoursAgo > 168) confidence *= 0.8; // Older than a week
    }

    // Boost confidence for keyword matches
    if (hints.keywords && candidate.title) {
      const titleLower = candidate.title.toLowerCase();
      const keywordMatches = hints.keywords.filter(keyword => 
        titleLower.includes(keyword.toLowerCase())
      ).length;
      confidence += keywordMatches * 0.1;
    }

    // Boost confidence for project-related content
    if (candidate.type === 'project_database') {
      confidence *= 1.2;
    }

    // Boost confidence for Steward-related content
    if (candidate.title && candidate.title.toLowerCase().includes('steward')) {
      confidence *= 1.4;
    }

    return Math.min(0.95, confidence);
  }

  /**
   * Document Steward session to appropriate Notion page
   */
  async documentSession(sessionData) {
    if (!this.isInitialized || !this.config.auto_documentation) {
      return { success: false, reason: 'Documentation disabled or not initialized' };
    }

    try {
      const {
        session_id,
        start_time,
        end_time,
        task_input,
        project_context,
        model_used,
        response_content,
        routing_decision,
        user_feedback
      } = sessionData;

      // Determine target page for documentation
      let targetPageId = await this.determineDocumentationTarget(project_context, task_input);
      
      if (!targetPageId) {
        // Create new session documentation page
        targetPageId = await this.createSessionDocumentationPage(project_context);
      }

      // Format session content
      const sessionBlocks = this.formatSessionForNotion(sessionData);

      // Add content to page
      await this.appendToPage(targetPageId, sessionBlocks);

      // Update project database if applicable
      await this.updateProjectDatabase(project_context, sessionData);

      return {
        success: true,
        page_id: targetPageId,
        documented_at: new Date().toISOString(),
        blocks_added: sessionBlocks.length
      };

    } catch (error) {
      console.error('Error documenting session:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Determine where to document the session
   */
  async determineDocumentationTarget(projectContext, taskInput) {
    // Look for existing Steward documentation pages
    const searchQuery = `Steward Sessions ${projectContext || ''}`;
    
    try {
      const searchResults = await this.notion.search({
        query: searchQuery,
        filter: {
          property: 'object',
          value: 'page'
        }
      });

      if (searchResults.results.length > 0) {
        // Use the most recently edited Steward documentation page
        const sortedResults = searchResults.results.sort((a, b) => 
          new Date(b.last_edited_time) - new Date(a.last_edited_time)
        );
        return sortedResults[0].id;
      }

      // Look in current project context
      if (this.currentProjectContext && this.currentProjectContext.id) {
        return this.currentProjectContext.id;
      }

      return null;

    } catch (error) {
      console.error('Error determining documentation target:', error);
      return null;
    }
  }

  /**
   * Create new session documentation page
   */
  async createSessionDocumentationPage(projectContext) {
    try {
      const pageTitle = `Steward Sessions - ${projectContext || 'General'} - ${new Date().toISOString().split('T')[0]}`;
      
      const response = await this.notion.pages.create({
        parent: {
          type: 'page_id',
          page_id: this.getDefaultParentPage() // Would need to be configured
        },
        properties: {
          title: {
            title: [
              {
                text: {
                  content: pageTitle
                }
              }
            ]
          }
        },
        children: [
          {
            object: 'block',
            type: 'heading_1',
            heading_1: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: pageTitle
                  }
                }
              ]
            }
          },
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: 'Automated documentation of Steward AI sessions for this project.'
                  }
                }
              ]
            }
          }
        ]
      });

      return response.id;

    } catch (error) {
      console.error('Error creating documentation page:', error);
      throw error;
    }
  }

  /**
   * Format session data for Notion blocks
   */
  formatSessionForNotion(sessionData) {
    const blocks = [];
    const timestamp = new Date().toLocaleString();

    // Session header
    blocks.push({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: `Session ${sessionData.session_id} - ${timestamp}`
            }
          }
        ]
      }
    });

    // Task input
    if (sessionData.task_input) {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: '📋 Task: '
              },
              annotations: {
                bold: true
              }
            },
            {
              type: 'text',
              text: {
                content: sessionData.task_input
              }
            }
          ]
        }
      });
    }

    // Routing decision
    if (sessionData.routing_decision) {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: '🎯 Model Selected: '
              },
              annotations: {
                bold: true
              }
            },
            {
              type: 'text',
              text: {
                content: `${sessionData.model_used} (Confidence: ${Math.round((sessionData.routing_decision.confidence || 0.8) * 100)}%)`
              }
            }
          ]
        }
      });
    }

    // Response content (truncated if too long)
    if (sessionData.response_content) {
      const content = sessionData.response_content.length > 1000 
        ? sessionData.response_content.substring(0, 1000) + '...'
        : sessionData.response_content;

      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: '💬 Response: '
              },
              annotations: {
                bold: true
              }
            }
          ]
        }
      });

      blocks.push({
        object: 'block',
        type: 'quote',
        quote: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: content
              }
            }
          ]
        }
      });
    }

    // Divider
    blocks.push({
      object: 'block',
      type: 'divider',
      divider: {}
    });

    return blocks;
  }

  /**
   * Append blocks to existing page
   */
  async appendToPage(pageId, blocks) {
    try {
      await this.notion.blocks.children.append({
        block_id: pageId,
        children: blocks
      });
    } catch (error) {
      console.error('Error appending to page:', error);
      throw error;
    }
  }

  /**
   * Synchronize task status with Notion databases
   */
  async synchronizeTaskStatus(taskData) {
    if (!this.isInitialized) {
      return { success: false, reason: 'Not initialized' };
    }

    try {
      // Find relevant task databases
      const taskDatabases = this.findTaskDatabases();
      const results = [];

      for (const db of taskDatabases) {
        const result = await this.updateTaskInDatabase(db.id, taskData);
        results.push(result);
      }

      return {
        success: true,
        databases_updated: results.filter(r => r.success).length,
        total_databases: results.length,
        results: results
      };

    } catch (error) {
      console.error('Error synchronizing task status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Find databases that likely contain tasks
   */
  findTaskDatabases() {
    const taskKeywords = ['task', 'todo', 'project', 'backlog', 'sprint'];
    const taskDatabases = [];

    for (const [dbId, dbInfo] of this.databaseCache) {
      const titleLower = dbInfo.title.toLowerCase();
      const hasTaskKeyword = taskKeywords.some(keyword => titleLower.includes(keyword));
      const hasStatusProperty = Object.keys(dbInfo.properties).some(prop => 
        prop.toLowerCase().includes('status')
      );

      if (hasTaskKeyword || hasStatusProperty) {
        taskDatabases.push({
          id: dbId,
          title: dbInfo.title,
          properties: dbInfo.properties
        });
      }
    }

    return taskDatabases;
  }

  /**
   * Import Notion project history into Steward memory
   */
  async importProjectHistory(projectId, options = {}) {
    if (!this.isInitialized) {
      return { success: false, reason: 'Not initialized' };
    }

    try {
      const {
        include_pages = true,
        include_databases = true,
        date_range_days = 30,
        max_items = 100
      } = options;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - date_range_days);

      const importedData = {
        pages: [],
        databases: [],
        tasks: [],
        notes: [],
        project_context: null
      };

      // Import pages
      if (include_pages) {
        const pages = await this.getProjectPages(projectId, cutoffDate, max_items);
        importedData.pages = pages;
      }

      // Import databases
      if (include_databases) {
        const databases = await this.getProjectDatabases(projectId);
        importedData.databases = databases;
      }

      // Extract project context
      importedData.project_context = await this.extractProjectContextFromHistory(importedData);

      return {
        success: true,
        imported_at: new Date().toISOString(),
        data: importedData,
        items_imported: importedData.pages.length + importedData.databases.length
      };

    } catch (error) {
      console.error('Error importing project history:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Extract text content from Notion rich text
   */
  extractTitle(richTextArray) {
    if (!Array.isArray(richTextArray)) {
      return 'Untitled';
    }
    
    return richTextArray
      .map(item => item.text?.content || item.plain_text || '')
      .join('')
      .trim() || 'Untitled';
  }

  /**
   * Extract comprehensive page information
   */
  async extractPageInfo(page) {
    return {
      id: page.id,
      title: this.extractTitle(page.properties?.title?.title || page.properties?.Name?.title || []),
      url: page.url,
      created_time: page.created_time,
      last_edited_time: page.last_edited_time,
      created_by: page.created_by,
      last_edited_by: page.last_edited_by,
      parent: page.parent,
      properties: page.properties,
      archived: page.archived
    };
  }

  /**
   * Get default context when detection fails
   */
  getDefaultContext() {
    return {
      success: false,
      context: {
        id: 'default',
        title: 'General Workspace',
        type: 'default',
        confidence: 0.3,
        detection_method: 'fallback'
      },
      confidence: 0.3,
      detected_at: new Date().toISOString(),
      method: 'fallback'
    };
  }

  /**
   * Get default parent page for new documentation
   */
  getDefaultParentPage() {
    // This would need to be configured per user
    // For now, return the first available page or database
    const firstPage = Array.from(this.projectContextCache.keys())[0];
    return firstPage || 'root';
  }

  /**
   * Get current integration status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      connected: !!this.notion,
      current_context: this.currentProjectContext,
      last_context_update: this.lastContextUpdate,
      cached_databases: this.databaseCache.size,
      cached_pages: this.projectContextCache.size,
      configuration: this.config
    };
  }

  /**
   * Close integration and cleanup
   */
  async close() {
    this.isInitialized = false;
    this.notion = null;
    this.workspaceCache.clear();
    this.projectContextCache.clear();
    this.databaseCache.clear();
    console.log('NotionIntegration closed');
  }
}

module.exports = NotionIntegration;

// #endregion end: Notion Integration