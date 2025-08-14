-- Learning Engine Schema Extension for The Steward
-- Adds learning tables for preference drift detection, confidence calibration, and character sheet evolution

-- Learning Patterns Table
-- Stores detected patterns in user behavior and routing decisions
CREATE TABLE IF NOT EXISTS learning_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern_type TEXT NOT NULL, -- 'preference_drift', 'time_pattern', 'task_correlation'
    pattern_data TEXT NOT NULL, -- JSON object with pattern details
    confidence REAL NOT NULL, -- 0.0-1.0 confidence in pattern detection
    sample_size INTEGER NOT NULL, -- Number of data points supporting pattern
    first_observed DATETIME NOT NULL,
    last_observed DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    validated_at DATETIME, -- When pattern was confirmed by feedback
    status TEXT DEFAULT 'active', -- 'active', 'validated', 'invalidated', 'superseded'
    
    -- Pattern metadata
    evidence_strength REAL, -- Statistical significance of pattern
    impact_score REAL, -- How much this pattern could improve routing
    recommendation TEXT, -- What action to take based on this pattern
    
    -- Validation tracking
    validation_attempts INTEGER DEFAULT 0,
    validation_successes INTEGER DEFAULT 0
);

-- Confidence Calibration Table
-- Maps routing confidence scores to actual user feedback for learning
CREATE TABLE IF NOT EXISTS confidence_calibration (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    routing_decision_id INTEGER,
    predicted_confidence REAL NOT NULL, -- Original confidence score (0.0-1.0)
    actual_feedback_score REAL, -- User feedback converted to 0.0-1.0 scale
    calibration_error REAL, -- Absolute difference between predicted and actual
    
    -- Context information
    task_type TEXT,
    model_used TEXT,
    response_time_ms INTEGER,
    
    -- Time tracking
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    feedback_received_at DATETIME,
    
    -- Learning metadata
    used_for_training BOOLEAN DEFAULT FALSE,
    calibration_adjustment REAL, -- How much to adjust confidence for similar cases
    
    FOREIGN KEY (routing_decision_id) REFERENCES routing_decisions(id)
);

-- Character Sheet Suggestions Table
-- Smart recommendations for updating user preferences based on learned patterns
CREATE TABLE IF NOT EXISTS character_sheet_suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    suggestion_type TEXT NOT NULL, -- 'task_preference_update', 'time_routing_change', 'fallback_adjustment'
    
    -- Current vs suggested values
    current_value TEXT NOT NULL, -- Current character sheet setting
    suggested_value TEXT NOT NULL, -- Recommended new setting
    setting_path TEXT NOT NULL, -- JSON path to the setting in character sheet
    
    -- Justification and evidence
    reasoning TEXT NOT NULL, -- Human-readable explanation
    supporting_evidence TEXT, -- JSON object with statistical evidence
    confidence REAL NOT NULL, -- 0.0-1.0 confidence in suggestion
    estimated_improvement TEXT, -- Expected benefits from change
    
    -- Pattern that generated this suggestion
    source_pattern_id INTEGER,
    
    -- User decision tracking
    status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'ignored'
    presented_at DATETIME, -- When shown to user
    decided_at DATETIME, -- When user made decision
    applied_at DATETIME, -- When change was actually made
    
    -- Impact tracking (after implementation)
    pre_change_metrics TEXT, -- JSON with baseline performance
    post_change_metrics TEXT, -- JSON with performance after change
    actual_improvement REAL, -- Measured improvement vs estimated
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (source_pattern_id) REFERENCES learning_patterns(id)
);

-- Learning Progress Metrics Table
-- Tracks how the system's learning capabilities improve over time
CREATE TABLE IF NOT EXISTS learning_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL UNIQUE, -- One entry per day
    
    -- Routing accuracy metrics
    routing_accuracy REAL, -- % of routing decisions with positive feedback
    confidence_calibration_error REAL, -- Average error in confidence predictions
    preference_alignment_score REAL, -- How well routing matches actual usage
    
    -- Learning activity metrics
    new_patterns_detected INTEGER DEFAULT 0,
    patterns_validated INTEGER DEFAULT 0,
    suggestions_generated INTEGER DEFAULT 0,
    suggestions_accepted INTEGER DEFAULT 0,
    
    -- Character sheet evolution
    character_sheet_changes INTEGER DEFAULT 0,
    character_sheet_accuracy REAL, -- How well current sheet predicts choices
    
    -- System performance impact
    response_time_improvement REAL, -- % improvement in response times
    user_satisfaction_trend REAL, -- Trend in user satisfaction scores
    model_selection_efficiency REAL, -- % of optimal model choices
    
    -- Gamification metrics
    learning_achievements INTEGER DEFAULT 0,
    learning_streak_days INTEGER DEFAULT 0,
    intelligence_score REAL, -- Overall system intelligence rating
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Learning Achievements Table
-- ADHD-friendly achievement system for learning progress
CREATE TABLE IF NOT EXISTS learning_achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    achievement_type TEXT NOT NULL, -- 'first_pattern', 'preference_master', 'week_streak'
    achievement_name TEXT NOT NULL,
    achievement_description TEXT NOT NULL,
    
    -- Achievement criteria
    criteria TEXT NOT NULL, -- JSON object defining unlock conditions
    difficulty TEXT DEFAULT 'normal', -- 'easy', 'normal', 'hard', 'legendary'
    category TEXT, -- 'routing', 'learning', 'adaptation', 'optimization'
    
    -- Progress tracking
    unlocked_at DATETIME,
    progress_current INTEGER DEFAULT 0,
    progress_target INTEGER NOT NULL,
    
    -- Rewards and motivation
    reward_description TEXT, -- What the user gets for this achievement
    dopamine_factor INTEGER DEFAULT 1, -- 1-5 scale for ADHD motivation
    celebration_message TEXT,
    
    -- Badge data
    badge_icon TEXT, -- Icon identifier for UI
    badge_color TEXT, -- Color scheme for badge
    rarity TEXT DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for learning tables
CREATE INDEX IF NOT EXISTS idx_learning_patterns_type ON learning_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_learning_patterns_confidence ON learning_patterns(confidence);
CREATE INDEX IF NOT EXISTS idx_learning_patterns_status ON learning_patterns(status);
CREATE INDEX IF NOT EXISTS idx_learning_patterns_observed ON learning_patterns(last_observed);

CREATE INDEX IF NOT EXISTS idx_confidence_calibration_decision ON confidence_calibration(routing_decision_id);
CREATE INDEX IF NOT EXISTS idx_confidence_calibration_error ON confidence_calibration(calibration_error);
CREATE INDEX IF NOT EXISTS idx_confidence_calibration_task ON confidence_calibration(task_type);

CREATE INDEX IF NOT EXISTS idx_character_suggestions_status ON character_sheet_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_character_suggestions_type ON character_sheet_suggestions(suggestion_type);
CREATE INDEX IF NOT EXISTS idx_character_suggestions_confidence ON character_sheet_suggestions(confidence);

CREATE INDEX IF NOT EXISTS idx_learning_progress_date ON learning_progress(date);
CREATE INDEX IF NOT EXISTS idx_learning_achievements_unlocked ON learning_achievements(unlocked_at);
CREATE INDEX IF NOT EXISTS idx_learning_achievements_category ON learning_achievements(category);

-- Views for learning analytics
CREATE VIEW IF NOT EXISTS learning_summary AS
SELECT 
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patterns,
    COUNT(CASE WHEN status = 'validated' THEN 1 END) as validated_patterns,
    AVG(confidence) as avg_pattern_confidence,
    MAX(last_observed) as latest_pattern_observed
FROM learning_patterns;

CREATE VIEW IF NOT EXISTS suggestion_summary AS
SELECT 
    suggestion_type,
    COUNT(*) as total_suggestions,
    COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
    AVG(confidence) as avg_confidence
FROM character_sheet_suggestions
GROUP BY suggestion_type;

-- Initialize default achievements
INSERT OR IGNORE INTO learning_achievements (
    achievement_type, achievement_name, achievement_description, 
    criteria, progress_target, reward_description, 
    dopamine_factor, badge_icon, badge_color
) VALUES 
(
    'first_pattern', 'Pattern Detective', 
    'Discovered your first usage pattern',
    '{"patterns_detected": 1}', 1,
    'System starts learning your preferences',
    3, 'detective', 'blue'
),
(
    'preference_master', 'Preference Master',
    'Successfully adapted to 5 character sheet suggestions',
    '{"suggestions_accepted": 5}', 5,
    'Character sheet now perfectly tuned',
    4, 'master', 'gold'
),
(
    'week_streak', 'Learning Streak',
    'System learned something new for 7 days straight',
    '{"learning_streak_days": 7}', 7,
    'Consistent intelligence growth unlocked',
    5, 'streak', 'purple'
),
(
    'accuracy_boost', 'Accuracy Booster',
    'Achieved 90% routing accuracy',
    '{"routing_accuracy": 0.9}', 1,
    'Nearly perfect model selection',
    4, 'target', 'green'
);