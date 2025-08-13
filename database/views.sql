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