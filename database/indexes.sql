-- Performance Indexes for The Steward Database
-- Create indexes for common queries after tables are created

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