// #region start: Apple Notes Integration for The Steward
// Ambient Intelligence integration with Apple Notes for session capture and research compilation
// Provides automated note-taking and knowledge organization across Steward sessions

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

/**
 * AppleNotesIntegration - Seamless Apple Notes knowledge capture integration
 * 
 * Key Features:
 * - Auto-save important Steward responses to project-specific notebooks
 * - Research compilation across sessions into structured notes
 * - Quick capture workflow: voice → Steward → organized notes
 * - Daily cognitive state extraction from personal journal notes
 * - Session history preservation with searchable formatting
 */
class AppleNotesIntegration {
  constructor(options = {}) {
    this.isInitialized = false;
    this.isAvailable = false;
    
    // Integration configuration
    this.config = {
      enable_session_capture: options.enableSessionCapture !== false,
      research_compilation: options.researchCompilation !== false,
      voice_workflow: options.voiceWorkflow !== false,
      journal_analysis: options.journalAnalysis !== false,
      auto_organization: options.autoOrganization !== false,
      response_threshold: options.responseThreshold || 200, // Min chars to save
      max_note_length: options.maxNoteLength || 10000, // Max chars per note
      session_folder_prefix: options.sessionFolderPrefix || 'Steward Sessions',
      research_folder_prefix: options.researchFolderPrefix || 'Research'
    };

    // Note organization structure
    this.noteStructure = {
      folders: {
        sessions: `${this.config.session_folder_prefix}`,
        research: `${this.config.research_folder_prefix}`,
        daily: 'Daily Notes',
        projects: 'Project Notes',
        archive: 'Archive'
      },
      templates: {
        session: 'session_template',
        research: 'research_template',
        daily: 'daily_template',
        compilation: 'compilation_template'
      }
    };

    // Content categorization for intelligent organization
    this.contentCategories = {
      code: {
        keywords: ['function', 'class', 'import', 'const', 'let', 'var', '=>', 'async'],
        folder: 'Code Snippets',
        template: 'code_template'
      },
      research: {
        keywords: ['research', 'study', 'analysis', 'findings', 'conclusion', 'methodology'],
        folder: 'Research Notes',
        template: 'research_template'
      },
      creative: {
        keywords: ['story', 'narrative', 'character', 'plot', 'creative', 'writing'],
        folder: 'Creative Writing',
        template: 'creative_template'
      },
      planning: {
        keywords: ['plan', 'strategy', 'roadmap', 'timeline', 'milestone', 'goal'],
        folder: 'Planning',
        template: 'planning_template'
      },
      meeting: {
        keywords: ['meeting', 'discussion', 'agenda', 'action items', 'decisions'],
        folder: 'Meetings',
        template: 'meeting_template'
      }
    };

    // Session capture history
    this.sessionHistory = [];
    this.researchCompilations = new Map();
    this.dailyNotes = new Map();
    
    // AppleScript templates for Notes operations
    this.appleScriptTemplates = {
      createNote: `
        tell application "Notes"
          tell folder "%FOLDER%" of account "iCloud"
            make new note with properties {name:"%TITLE%", body:"%BODY%"}
          end tell
        end tell
      `,
      findNote: `
        tell application "Notes"
          set foundNotes to {}
          repeat with acc in accounts
            repeat with fld in folders of acc
              repeat with nt in notes of fld
                if name of nt contains "%SEARCH%" then
                  set end of foundNotes to nt
                end if
              end repeat
            end repeat
          end repeat
          return foundNotes
        end tell
      `,
      appendToNote: `
        tell application "Notes"
          set targetNote to note "%NOTE_NAME%" of folder "%FOLDER%" of account "iCloud"
          set body of targetNote to (body of targetNote) & "%CONTENT%"
        end tell
      `
    };

    console.log('AppleNotesIntegration initialized with config:', this.config);
  }

  /**
   * Initialize Apple Notes integration and verify availability
   */
  async initialize() {
    try {
      // Check if Notes app is available
      this.isAvailable = await this.checkNotesAvailability();
      
      if (!this.isAvailable) {
        console.warn('Apple Notes not available - note integration will be disabled');
        return false;
      }

      // Initialize folder structure
      await this.initializeFolderStructure();
      
      // Load existing session history
      await this.loadSessionHistory();
      
      this.isInitialized = true;
      console.log('AppleNotesIntegration initialized successfully');
      return true;

    } catch (error) {
      console.error('Failed to initialize AppleNotesIntegration:', error);
      return false;
    }
  }

  /**
   * Check if Apple Notes is available on the system
   */
  async checkNotesAvailability() {
    try {
      // Test AppleScript access to Notes
      const testScript = `
        tell application "Notes"
          get name of accounts
        end tell
      `;
      
      const result = execSync(`osascript -e '${testScript}'`, { 
        encoding: 'utf8', 
        timeout: 5000 
      });
      
      return result.trim().length > 0;

    } catch (error) {
      console.log('Apple Notes not available or accessible');
      return false;
    }
  }

  /**
   * Initialize folder structure in Apple Notes
   */
  async initializeFolderStructure() {
    try {
      const foldersToCreate = Object.values(this.noteStructure.folders);
      
      for (const folderName of foldersToCreate) {
        await this.createFolderIfNotExists(folderName);
      }

      console.log(`Initialized ${foldersToCreate.length} folders in Apple Notes`);

    } catch (error) {
      console.error('Error initializing folder structure:', error);
    }
  }

  /**
   * Create folder in Apple Notes if it doesn't exist
   */
  async createFolderIfNotExists(folderName) {
    try {
      const createFolderScript = `
        tell application "Notes"
          try
            get folder "${folderName}" of account "iCloud"
          on error
            make new folder with properties {name:"${folderName}"} at account "iCloud"
          end try
        end tell
      `;

      execSync(`osascript -e '${createFolderScript}'`, { 
        timeout: 10000,
        stdio: 'ignore'
      });

    } catch (error) {
      console.error(`Error creating folder ${folderName}:`, error);
    }
  }

  /**
   * Auto-save important Steward responses to project-specific notes
   */
  async captureSession(sessionData) {
    if (!this.isInitialized || !this.config.enable_session_capture) {
      return { success: false, reason: 'Session capture disabled or not initialized' };
    }

    try {
      const {
        session_id,
        task_input,
        response_content,
        project_context,
        model_used,
        routing_decision,
        start_time,
        user_feedback,
        importance_score
      } = sessionData;

      // Check if response meets threshold for capture
      if (!this.shouldCaptureSession(sessionData)) {
        return { success: false, reason: 'Session does not meet capture criteria' };
      }

      // Determine content category and organization
      const category = this.categorizeContent(response_content, task_input);
      const targetFolder = this.determineTargetFolder(category, project_context);

      // Format session content for Notes
      const noteContent = this.formatSessionForNotes(sessionData, category);
      
      // Create or append to project note
      const noteResult = await this.saveToProjectNote(
        project_context,
        targetFolder,
        noteContent,
        sessionData
      );

      // Update session history
      this.sessionHistory.push({
        session_id,
        captured_at: new Date().toISOString(),
        project_context,
        category: category.name,
        note_id: noteResult.note_id,
        content_length: response_content.length,
        importance_score
      });

      // Compile research if enabled
      if (this.config.research_compilation && category.name === 'research') {
        await this.addToResearchCompilation(sessionData, category);
      }

      return {
        success: true,
        session_id,
        note_id: noteResult.note_id,
        folder: targetFolder,
        category: category.name,
        captured_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error capturing session:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if session should be captured based on various criteria
   */
  shouldCaptureSession(sessionData) {
    const { response_content, user_feedback, importance_score, task_input } = sessionData;

    // Check response length threshold
    if (!response_content || response_content.length < this.config.response_threshold) {
      return false;
    }

    // Always capture if user marked as important
    if (user_feedback?.important || importance_score > 0.8) {
      return true;
    }

    // Capture if response contains valuable content
    const valuableKeywords = [
      'code', 'solution', 'explanation', 'analysis', 'research', 'strategy',
      'implementation', 'workflow', 'process', 'method', 'approach'
    ];

    const contentLower = response_content.toLowerCase();
    const hasValuableContent = valuableKeywords.some(keyword => 
      contentLower.includes(keyword)
    );

    if (hasValuableContent) return true;

    // Capture if task indicates important work
    const importantTaskKeywords = [
      'document', 'research', 'analyze', 'create', 'design', 'implement',
      'plan', 'strategy', 'solution', 'explain'
    ];

    const taskLower = (task_input || '').toLowerCase();
    const isImportantTask = importantTaskKeywords.some(keyword => 
      taskLower.includes(keyword)
    );

    return isImportantTask;
  }

  /**
   * Categorize content based on keywords and context
   */
  categorizeContent(responseContent, taskInput) {
    const combinedContent = `${responseContent} ${taskInput || ''}`.toLowerCase();
    
    let bestMatch = {
      name: 'general',
      score: 0,
      folder: this.noteStructure.folders.sessions,
      template: 'session_template'
    };

    // Check each category for keyword matches
    Object.entries(this.contentCategories).forEach(([categoryName, categoryInfo]) => {
      const matchCount = categoryInfo.keywords.reduce((count, keyword) => {
        return combinedContent.includes(keyword.toLowerCase()) ? count + 1 : count;
      }, 0);

      const score = matchCount / categoryInfo.keywords.length;

      if (score > bestMatch.score) {
        bestMatch = {
          name: categoryName,
          score: score,
          folder: categoryInfo.folder,
          template: categoryInfo.template
        };
      }
    });

    return bestMatch;
  }

  /**
   * Determine target folder based on category and project context
   */
  determineTargetFolder(category, projectContext) {
    // Use category-specific folder if score is high enough
    if (category.score > 0.3) {
      return category.folder;
    }

    // Use project-specific folder if available
    if (projectContext) {
      return `${this.noteStructure.folders.projects}/${projectContext}`;
    }

    // Default to sessions folder
    return this.noteStructure.folders.sessions;
  }

  /**
   * Format session data for Apple Notes
   */
  formatSessionForNotes(sessionData, category) {
    const timestamp = new Date().toLocaleString();
    const lines = [];

    // Session header
    lines.push(`# Steward Session - ${timestamp}`);
    lines.push('');
    
    // Session metadata
    lines.push(`**Session ID:** ${sessionData.session_id}`);
    lines.push(`**Project:** ${sessionData.project_context || 'General'}`);
    lines.push(`**Model Used:** ${sessionData.model_used || 'Unknown'}`);
    lines.push(`**Category:** ${category.name}`);
    
    if (sessionData.routing_decision?.confidence) {
      lines.push(`**Confidence:** ${Math.round(sessionData.routing_decision.confidence * 100)}%`);
    }
    
    lines.push('');

    // Task input
    if (sessionData.task_input) {
      lines.push('## 📋 Task');
      lines.push(sessionData.task_input);
      lines.push('');
    }

    // Response content
    lines.push('## 💬 Response');
    lines.push(this.formatResponseContent(sessionData.response_content, category));
    lines.push('');

    // User feedback if available
    if (sessionData.user_feedback) {
      lines.push('## 📝 Feedback');
      lines.push(JSON.stringify(sessionData.user_feedback, null, 2));
      lines.push('');
    }

    // Tags for searchability
    const tags = this.generateNoteTags(sessionData, category);
    if (tags.length > 0) {
      lines.push('## 🏷️ Tags');
      lines.push(tags.join(', '));
      lines.push('');
    }

    lines.push('---');
    lines.push(`*Captured by The Steward AI on ${timestamp}*`);

    return lines.join('\n');
  }

  /**
   * Format response content based on category
   */
  formatResponseContent(content, category) {
    if (!content) return '';

    // Format code content
    if (category.name === 'code') {
      return this.formatCodeContent(content);
    }

    // Format research content
    if (category.name === 'research') {
      return this.formatResearchContent(content);
    }

    // Format planning content
    if (category.name === 'planning') {
      return this.formatPlanningContent(content);
    }

    // Default formatting
    return content;
  }

  /**
   * Format code content with syntax highlighting indicators
   */
  formatCodeContent(content) {
    // Look for code blocks and format them
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    
    return content.replace(codeBlockRegex, (match, language, code) => {
      const lang = language || 'code';
      return `\`\`\`${lang}\n${code}\`\`\``;
    });
  }

  /**
   * Format research content with structure
   */
  formatResearchContent(content) {
    const lines = content.split('\n');
    const formatted = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      
      // Format headers
      if (trimmed.startsWith('#')) {
        formatted.push(line);
      }
      // Format bullet points
      else if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        formatted.push(line);
      }
      // Format numbered lists
      else if (/^\d+\./.test(trimmed)) {
        formatted.push(line);
      }
      // Regular content
      else {
        formatted.push(line);
      }
    });

    return formatted.join('\n');
  }

  /**
   * Format planning content with structure
   */
  formatPlanningContent(content) {
    // Enhance planning content with checkboxes where appropriate
    return content.replace(/^- (.+)$/gm, '- [ ] $1');
  }

  /**
   * Save content to project-specific note
   */
  async saveToProjectNote(projectContext, targetFolder, noteContent, sessionData) {
    try {
      const noteName = this.generateNoteName(projectContext, sessionData);
      
      // Check if note already exists
      const existingNote = await this.findNote(noteName, targetFolder);
      
      if (existingNote) {
        // Append to existing note
        await this.appendToNote(noteName, targetFolder, noteContent);
        return {
          note_id: existingNote.id,
          action: 'appended',
          note_name: noteName
        };
      } else {
        // Create new note
        const noteId = await this.createNote(noteName, targetFolder, noteContent);
        return {
          note_id: noteId,
          action: 'created',
          note_name: noteName
        };
      }

    } catch (error) {
      console.error('Error saving to project note:', error);
      throw error;
    }
  }

  /**
   * Generate appropriate note name
   */
  generateNoteName(projectContext, sessionData) {
    const date = new Date().toISOString().split('T')[0];
    const project = projectContext || 'General';
    
    return `${project} - Steward Sessions - ${date}`;
  }

  /**
   * Create new note in Apple Notes
   */
  async createNote(noteName, folderName, content) {
    try {
      // Escape content for AppleScript
      const escapedContent = content.replace(/"/g, '\\"').replace(/\n/g, '\\n');
      
      const script = this.appleScriptTemplates.createNote
        .replace('%FOLDER%', folderName)
        .replace('%TITLE%', noteName)
        .replace('%BODY%', escapedContent);

      execSync(`osascript -e '${script}'`, { timeout: 15000 });
      
      return `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  }

  /**
   * Find existing note
   */
  async findNote(noteName, folderName) {
    try {
      const script = this.appleScriptTemplates.findNote
        .replace('%SEARCH%', noteName);

      const result = execSync(`osascript -e '${script}'`, { 
        encoding: 'utf8', 
        timeout: 10000 
      });

      return result.trim().length > 0 ? { id: 'found', name: noteName } : null;

    } catch (error) {
      console.error('Error finding note:', error);
      return null;
    }
  }

  /**
   * Append content to existing note
   */
  async appendToNote(noteName, folderName, content) {
    try {
      const timestamp = new Date().toLocaleString();
      const appendContent = `\n\n---\n### Update ${timestamp}\n\n${content}`;
      const escapedContent = appendContent.replace(/"/g, '\\"').replace(/\n/g, '\\n');

      const script = this.appleScriptTemplates.appendToNote
        .replace('%NOTE_NAME%', noteName)
        .replace('%FOLDER%', folderName)
        .replace('%CONTENT%', escapedContent);

      execSync(`osascript -e '${script}'`, { timeout: 15000 });

    } catch (error) {
      console.error('Error appending to note:', error);
      throw error;
    }
  }

  /**
   * Compile research across sessions into structured notes
   */
  async addToResearchCompilation(sessionData, category) {
    try {
      const topic = this.extractResearchTopic(sessionData);
      const compilationKey = `research_${topic.toLowerCase().replace(/\s+/g, '_')}`;

      if (!this.researchCompilations.has(compilationKey)) {
        this.researchCompilations.set(compilationKey, {
          topic: topic,
          sessions: [],
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          note_id: null
        });
      }

      const compilation = this.researchCompilations.get(compilationKey);
      compilation.sessions.push({
        session_id: sessionData.session_id,
        timestamp: new Date().toISOString(),
        content: sessionData.response_content,
        task: sessionData.task_input
      });
      compilation.last_updated = new Date().toISOString();

      // Create or update research compilation note
      const compilationContent = this.formatResearchCompilation(compilation);
      const noteName = `Research Compilation: ${topic}`;
      
      const noteResult = await this.saveToProjectNote(
        'Research',
        this.noteStructure.folders.research,
        compilationContent,
        { session_id: compilationKey }
      );

      compilation.note_id = noteResult.note_id;

      return {
        success: true,
        compilation_key: compilationKey,
        sessions_count: compilation.sessions.length,
        note_id: noteResult.note_id
      };

    } catch (error) {
      console.error('Error adding to research compilation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Extract research topic from session data
   */
  extractResearchTopic(sessionData) {
    const taskInput = sessionData.task_input || '';
    const responseContent = sessionData.response_content || '';
    
    // Simple topic extraction - could be enhanced with NLP
    const topicKeywords = [
      'research', 'study', 'analysis', 'investigation', 'explore',
      'understand', 'learn', 'discover', 'examine'
    ];

    // Look for topic indicators in task input
    for (const keyword of topicKeywords) {
      const regex = new RegExp(`${keyword}\\s+([^.!?]{10,50})`, 'i');
      const match = taskInput.match(regex);
      if (match) {
        return match[1].trim();
      }
    }

    // Fallback: use project context or first words of task
    if (sessionData.project_context) {
      return sessionData.project_context;
    }

    const words = taskInput.split(' ').slice(0, 5);
    return words.join(' ') || 'General Research';
  }

  /**
   * Format research compilation
   */
  formatResearchCompilation(compilation) {
    const lines = [];

    lines.push(`# Research Compilation: ${compilation.topic}`);
    lines.push('');
    lines.push(`**Created:** ${new Date(compilation.created_at).toLocaleString()}`);
    lines.push(`**Last Updated:** ${new Date(compilation.last_updated).toLocaleString()}`);
    lines.push(`**Sessions:** ${compilation.sessions.length}`);
    lines.push('');

    lines.push('## Summary');
    lines.push('*This is a compilation of research findings from multiple Steward sessions.*');
    lines.push('');

    // Add each session's contribution
    compilation.sessions.forEach((session, index) => {
      lines.push(`## Session ${index + 1} - ${new Date(session.timestamp).toLocaleString()}`);
      lines.push('');
      
      if (session.task) {
        lines.push(`**Task:** ${session.task}`);
        lines.push('');
      }
      
      lines.push('**Findings:**');
      lines.push(session.content);
      lines.push('');
      lines.push('---');
      lines.push('');
    });

    lines.push('*Compiled by The Steward AI*');

    return lines.join('\n');
  }

  /**
   * Generate tags for note searchability
   */
  generateNoteTags(sessionData, category) {
    const tags = [];

    // Base tags
    tags.push('#steward');
    tags.push('#ai-session');

    // Category tag
    tags.push(`#${category.name}`);

    // Project context tag
    if (sessionData.project_context) {
      tags.push(`#${sessionData.project_context.toLowerCase().replace(/\s+/g, '-')}`);
    }

    // Model tag
    if (sessionData.model_used) {
      tags.push(`#${sessionData.model_used.toLowerCase()}`);
    }

    // Content-based tags
    const content = sessionData.response_content.toLowerCase();
    const contentTags = [];

    if (content.includes('code') || content.includes('function')) {
      contentTags.push('#code');
    }
    if (content.includes('plan') || content.includes('strategy')) {
      contentTags.push('#planning');
    }
    if (content.includes('analysis') || content.includes('research')) {
      contentTags.push('#analysis');
    }
    if (content.includes('creative') || content.includes('story')) {
      contentTags.push('#creative');
    }

    tags.push(...contentTags);

    return tags;
  }

  /**
   * Extract daily cognitive state from journal notes
   */
  async extractCognitiveState(date = null) {
    if (!this.config.journal_analysis) {
      return { success: false, reason: 'Journal analysis disabled' };
    }

    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      // Look for daily notes/journal entries
      const journalNote = await this.findNote(`Daily - ${targetDate}`, this.noteStructure.folders.daily);
      
      if (!journalNote) {
        return { success: false, reason: 'No daily note found' };
      }

      // Extract cognitive indicators from note content
      // This would involve NLP analysis of mood, energy, focus indicators
      const cognitiveState = {
        date: targetDate,
        energy_level: 0.7, // Would be extracted from text
        focus_quality: 'good', // Would be extracted from text
        mood_indicators: ['productive', 'focused'], // Would be extracted
        stress_level: 0.3, // Would be extracted
        extracted_at: new Date().toISOString()
      };

      this.dailyNotes.set(targetDate, cognitiveState);

      return {
        success: true,
        date: targetDate,
        cognitive_state: cognitiveState
      };

    } catch (error) {
      console.error('Error extracting cognitive state:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load session history from persistent storage
   */
  async loadSessionHistory() {
    try {
      // In a real implementation, this would load from a data file
      // For now, initialize empty
      this.sessionHistory = [];
      console.log('Session history initialized');

    } catch (error) {
      console.error('Error loading session history:', error);
    }
  }

  /**
   * Get integration status and statistics
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      available: this.isAvailable,
      configuration: this.config,
      session_history_count: this.sessionHistory.length,
      research_compilations: this.researchCompilations.size,
      daily_notes: this.dailyNotes.size,
      folder_structure: this.noteStructure.folders
    };
  }

  /**
   * Get capture statistics
   */
  getCaptureStatistics() {
    const stats = {
      total_sessions_captured: this.sessionHistory.length,
      by_category: {},
      by_project: {},
      by_month: {},
      average_content_length: 0
    };

    this.sessionHistory.forEach(session => {
      // Count by category
      stats.by_category[session.category] = (stats.by_category[session.category] || 0) + 1;
      
      // Count by project
      stats.by_project[session.project_context] = (stats.by_project[session.project_context] || 0) + 1;
      
      // Count by month
      const month = session.captured_at.substring(0, 7); // YYYY-MM
      stats.by_month[month] = (stats.by_month[month] || 0) + 1;
    });

    // Calculate average content length
    if (this.sessionHistory.length > 0) {
      const totalLength = this.sessionHistory.reduce((sum, session) => sum + session.content_length, 0);
      stats.average_content_length = Math.round(totalLength / this.sessionHistory.length);
    }

    return stats;
  }

  /**
   * Close integration and cleanup
   */
  async close() {
    this.isInitialized = false;
    this.isAvailable = false;
    this.sessionHistory = [];
    this.researchCompilations.clear();
    this.dailyNotes.clear();
    console.log('AppleNotesIntegration closed');
  }
}

module.exports = AppleNotesIntegration;

// #endregion end: Apple Notes Integration