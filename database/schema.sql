-- The Steward Database Schema
-- SQLite database for character sheet storage, performance tracking, and learning capabilities

-- User Profile Table (Character Sheet Data)
-- Stores user preferences, cognitive patterns, and adaptive settings
CREATE TABLE IF NOT EXISTS user_profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Basic user data
    roles TEXT, -- JSON array of roles
    learning_goals TEXT, -- JSON array of goals
    current_projects TEXT, -- JSON array of projects
    
    -- Preference data
    tone_preference TEXT,
    neurotype_style TEXT,
    preferred_formats TEXT, -- JSON array
    default_output_format TEXT,
    default_verbosity TEXT,
    copilot_comments_format TEXT,
    
    -- Abilities and strengths
    abilities TEXT, -- JSON object with strengths, scripting_preference, ide
    
    -- Preferences object
    preferences TEXT, -- JSON object with formatting_style, prompting_style, ai_behavior, memory_use
    
    -- Tools and environment
    tools_environment TEXT, -- JSON object with devices, local_stack, cloud_models, hosting_infra
    
    -- Task type preferences (model routing preferences)
    task_type_preferences TEXT, -- JSON object mapping task types to preferred models
    
    -- Fallback behavior settings
    fallback_behavior TEXT, -- JSON object with cloud_failure, unknown_task, memory_toggle, allowFallback
    
    -- Loadouts (predefined configurations)
    loadouts TEXT, -- JSON object with different mode configurations
    
    -- Active memory
    active_memory TEXT, -- JSON array of active memory items
    
    -- Model endpoints
    model_endpoints TEXT, -- JSON object with endpoint configurations
    
    -- Time-aware routing (for future enhancement)
    time_of_day_profile TEXT, -- JSON object with time-based preferences
    cognitive_patterns TEXT, -- JSON object with cognitive state patterns
    
    -- Version for schema evolution
    profile_version INTEGER DEFAULT 1
);

-- Model Performance Tracking
-- Logs every model request with performance metrics
CREATE TABLE IF NOT EXISTS model_performance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Request details
    model_name TEXT NOT NULL,
    adapter_type TEXT NOT NULL, -- 'local' or 'cloud'
    task_type TEXT, -- 'write', 'debug', 'research', etc.
    
    -- Performance metrics
    response_time_ms INTEGER NOT NULL,
    tokens_prompt INTEGER,
    tokens_completion INTEGER,
    tokens_total INTEGER,
    
    -- Success/failure tracking
    success BOOLEAN NOT NULL DEFAULT TRUE,
    error_type TEXT, -- NULL if success, error type if failure
    error_message TEXT, -- NULL if success, error message if failure
    
    -- Request context
    prompt_length INTEGER,
    response_length INTEGER,
    temperature REAL,
    max_tokens INTEGER,
    
    -- Time context (for pattern analysis)
    hour_of_day INTEGER, -- 0-23
    day_of_week INTEGER, -- 0-6 (0=Sunday)
    
    -- User context (prepared for future integration)
    user_energy_level TEXT, -- 'high', 'medium', 'low' (future)
    user_context TEXT, -- JSON object with VSCode activity, etc. (future)
    
    -- Performance rating (if user provides feedback)
    user_rating INTEGER, -- 1-5 scale, NULL if no rating
    
    -- Session tracking
    session_id TEXT -- For grouping related requests
);

-- Routing Decisions
-- Logs what model was chosen and why for each request
CREATE TABLE IF NOT EXISTS routing_decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Original request
    task_type TEXT NOT NULL,
    prompt_snippet TEXT, -- First 100 chars of prompt for context
    
    -- Routing decision
    chosen_model TEXT NOT NULL,
    routing_reason TEXT NOT NULL, -- 'user_preference', 'task_type_match', 'fallback', 'load_balancing'
    
    -- Alternative models considered
    alternatives_considered TEXT, -- JSON array of other models that could have been used
    
    -- Context that influenced decision
    time_of_day INTEGER, -- 0-23
    user_loadout TEXT, -- 'creative', 'sqa_mode', 'frugal_mode', etc.
    fallback_triggered BOOLEAN DEFAULT FALSE,
    
    -- Decision confidence
    confidence_score REAL, -- 0.0-1.0 how confident the routing was
    
    -- Link to performance result
    performance_id INTEGER,
    FOREIGN KEY (performance_id) REFERENCES model_performance(id)
);

-- User Feedback
-- Stores satisfaction ratings, corrections, and quality feedback
CREATE TABLE IF NOT EXISTS user_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Link to the request being rated
    performance_id INTEGER NOT NULL,
    routing_id INTEGER,
    
    -- Feedback data
    satisfaction_rating INTEGER, -- 1-5 scale
    quality_rating INTEGER, -- 1-5 scale
    speed_rating INTEGER, -- 1-5 scale
    
    -- Qualitative feedback
    feedback_text TEXT,
    suggested_improvements TEXT,
    
    -- Correction data (when user corrects or refines output)
    correction_provided BOOLEAN DEFAULT FALSE,
    original_output TEXT, -- What the model originally said
    corrected_output TEXT, -- What the user wanted instead
    
    -- Model preference feedback
    preferred_model TEXT, -- What model user thinks should have been used
    routing_feedback TEXT, -- 'good_choice', 'wrong_model', 'should_have_fallback'
    
    FOREIGN KEY (performance_id) REFERENCES model_performance(id),
    FOREIGN KEY (routing_id) REFERENCES routing_decisions(id)
);

-- Learning Insights
-- Adaptive preferences discovered over time through usage patterns
CREATE TABLE IF NOT EXISTS learning_insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Insight category
    insight_type TEXT NOT NULL, -- 'time_preference', 'task_model_correlation', 'quality_pattern', etc.
    confidence REAL NOT NULL, -- 0.0-1.0 confidence in this insight
    
    -- The discovered pattern
    pattern_description TEXT NOT NULL,
    pattern_data TEXT, -- JSON object with the actual data pattern
    
    -- Supporting evidence
    sample_size INTEGER, -- How many data points support this insight
    evidence_period_start DATETIME, -- When did we start observing this pattern
    evidence_period_end DATETIME, -- When did we last see this pattern
    
    -- Actionable recommendation
    recommendation TEXT, -- What should we do based on this insight
    implemented BOOLEAN DEFAULT FALSE, -- Has this insight been acted upon
    
    -- Validation tracking
    validation_attempts INTEGER DEFAULT 0,
    validation_successes INTEGER DEFAULT 0,
    
    -- Meta-learning
    insight_version INTEGER DEFAULT 1, -- For evolving insights
    superseded_by INTEGER, -- Points to newer insight that replaces this one
    
    FOREIGN KEY (superseded_by) REFERENCES learning_insights(id)
);

-- Journal Entries
-- Daily workflow patterns, energy levels, frustrations (future personal assistant feature)
CREATE TABLE IF NOT EXISTS journal_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL UNIQUE, -- One entry per day
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Energy and mood tracking
    energy_level TEXT, -- 'high', 'medium', 'low'
    mood TEXT, -- 'focused', 'scattered', 'creative', 'analytical', etc.
    frustration_level INTEGER, -- 1-5 scale
    
    -- Workflow patterns
    productive_hours TEXT, -- JSON array of hour ranges when most productive
    preferred_task_types TEXT, -- JSON array of task types tackled today
    workflow_notes TEXT, -- Free-form notes about the day's workflow
    
    -- Goal tracking
    goals_set TEXT, -- JSON array of goals set for the day
    goals_achieved TEXT, -- JSON array of goals actually achieved
    blockers_encountered TEXT, -- JSON array of things that blocked progress
    
    -- Context for AI assistance
    ai_requests_count INTEGER DEFAULT 0, -- How many times AI was used
    most_helpful_model TEXT, -- Which model was most helpful today
    least_helpful_model TEXT, -- Which model was least helpful today
    
    -- Process notes (for continuous improvement)
    process_improvements TEXT, -- JSON array of process improvements identified
    tools_used TEXT, -- JSON array of tools and technologies used
    learning_moments TEXT, -- JSON array of key learning moments
    
    -- Reflection and planning
    daily_reflection TEXT, -- Free-form reflection on the day
    tomorrow_focus TEXT, -- What to focus on tomorrow
    
    -- Metadata
    word_count INTEGER, -- Total words written in all fields
    completion_percentage REAL -- How much of the journal was filled out (0.0-1.0)
);

-- Context Data
-- VSCode activity, external tool usage, environment context (prepared for future integration)
CREATE TABLE IF NOT EXISTS context_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Context source
    source_type TEXT NOT NULL, -- 'vscode', 'terminal', 'browser', 'system', 'manual'
    source_details TEXT, -- JSON object with source-specific details
    
    -- Activity data
    activity_type TEXT NOT NULL, -- 'file_edit', 'command_run', 'search', 'debug', etc.
    activity_data TEXT, -- JSON object with activity-specific data
    
    -- File and project context
    project_name TEXT,
    file_path TEXT,
    file_type TEXT, -- 'js', 'py', 'md', etc.
    
    -- Time context
    duration_seconds INTEGER, -- How long this activity lasted
    session_id TEXT, -- Groups related activities
    
    -- State information
    current_task TEXT, -- What task the user is working on
    cognitive_load TEXT, -- 'light', 'medium', 'heavy' based on context clues
    
    -- Integration status
    processed BOOLEAN DEFAULT FALSE, -- Has this context been processed for insights
    used_for_routing BOOLEAN DEFAULT FALSE, -- Has this influenced routing decisions
    
    -- Privacy and sensitivity
    contains_sensitive BOOLEAN DEFAULT FALSE, -- Flag for data that should be handled carefully
    retention_days INTEGER DEFAULT 30 -- How long to keep this context data
);

-- Performance Indexes
-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_model_performance_timestamp ON model_performance(timestamp);
CREATE INDEX IF NOT EXISTS idx_model_performance_model ON model_performance(model_name);
CREATE INDEX IF NOT EXISTS idx_model_performance_task_type ON model_performance(task_type);
CREATE INDEX IF NOT EXISTS idx_model_performance_success ON model_performance(success);
CREATE INDEX IF NOT EXISTS idx_model_performance_session ON model_performance(session_id);

CREATE INDEX IF NOT EXISTS idx_routing_decisions_timestamp ON routing_decisions(timestamp);
CREATE INDEX IF NOT EXISTS idx_routing_decisions_task_type ON routing_decisions(task_type);
CREATE INDEX IF NOT EXISTS idx_routing_decisions_model ON routing_decisions(chosen_model);

CREATE INDEX IF NOT EXISTS idx_user_feedback_performance ON user_feedback(performance_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_timestamp ON user_feedback(timestamp);

CREATE INDEX IF NOT EXISTS idx_learning_insights_type ON learning_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_learning_insights_confidence ON learning_insights(confidence);
CREATE INDEX IF NOT EXISTS idx_learning_insights_implemented ON learning_insights(implemented);

CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_energy ON journal_entries(energy_level);

CREATE INDEX IF NOT EXISTS idx_context_data_timestamp ON context_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_context_data_source ON context_data(source_type);
CREATE INDEX IF NOT EXISTS idx_context_data_activity ON context_data(activity_type);
CREATE INDEX IF NOT EXISTS idx_context_data_project ON context_data(project_name);
CREATE INDEX IF NOT EXISTS idx_context_data_processed ON context_data(processed);

-- Views for common queries
-- Performance summary view
CREATE VIEW IF NOT EXISTS performance_summary AS
SELECT 
    model_name,
    adapter_type,
    task_type,
    COUNT(*) as request_count,
    AVG(response_time_ms) as avg_response_time,
    AVG(CASE WHEN success THEN 1.0 ELSE 0.0 END) as success_rate,
    AVG(tokens_total) as avg_tokens,
    AVG(user_rating) as avg_rating
FROM model_performance
GROUP BY model_name, adapter_type, task_type;

-- Daily usage summary view
CREATE VIEW IF NOT EXISTS daily_usage AS
SELECT 
    DATE(timestamp) as date,
    COUNT(*) as total_requests,
    COUNT(DISTINCT model_name) as models_used,
    AVG(response_time_ms) as avg_response_time,
    SUM(tokens_total) as total_tokens,
    AVG(CASE WHEN success THEN 1.0 ELSE 0.0 END) as success_rate
FROM model_performance
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- Model preference trends view
CREATE VIEW IF NOT EXISTS model_preferences AS
SELECT 
    model_name,
    task_type,
    COUNT(*) as usage_count,
    AVG(user_rating) as avg_rating,
    AVG(response_time_ms) as avg_response_time,
    MIN(timestamp) as first_used,
    MAX(timestamp) as last_used
FROM model_performance
WHERE success = TRUE
GROUP BY model_name, task_type
ORDER BY usage_count DESC;