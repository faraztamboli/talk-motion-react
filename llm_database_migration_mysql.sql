-- ============================================================================
-- LLM INTEGRATION - DATABASE MIGRATION (MySQL)
-- ============================================================================
-- This migration adds all tables and columns needed for LLM integration
-- Run this after the main dashboard schema migration
-- 
-- MySQL Compatibility Notes:
-- - Uses JSON instead of JSONB (PostgreSQL-specific)
-- - Uses INT AUTO_INCREMENT instead of SERIAL
-- - Arrays (TEXT[]) stored as JSON
-- - Partial indexes (WHERE clause) not supported - removed from MySQL version
-- - Requires helper procedures from database_schema_mysql.sql
-- - Requires MySQL 5.7+ for JSON support, MySQL 8.0+ recommended
-- ============================================================================

-- ============================================================================
-- NEW TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. AI_GENERATED_CONTENT
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_generated_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id INT NOT NULL,
    original_content TEXT,
    generated_content TEXT NOT NULL,
    model_name VARCHAR(100),
    prompt_used TEXT,
    generation_metadata JSON,
    user_id INT,
    status VARCHAR(50) DEFAULT 'pending',
    approved_at TIMESTAMP NULL,
    approved_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES alpharithmic.user(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES alpharithmic.user(id) ON DELETE SET NULL,
    INDEX idx_ai_content_target (target_type, target_id),
    INDEX idx_ai_content_type (content_type),
    INDEX idx_ai_content_user (user_id),
    INDEX idx_ai_content_status (status),
    INDEX idx_ai_content_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. LLM_API_USAGE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS llm_api_usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    api_provider VARCHAR(50) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    endpoint VARCHAR(100) NOT NULL,
    prompt_tokens INT,
    completion_tokens INT,
    total_tokens INT,
    cost DECIMAL(10, 6),
    response_time_ms INT,
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    request_metadata JSON,
    response_metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES alpharithmic.user(id) ON DELETE SET NULL,
    INDEX idx_llm_usage_user_date (user_id, created_at DESC),
    INDEX idx_llm_usage_provider (api_provider, created_at DESC),
    INDEX idx_llm_usage_model (model_name, created_at DESC),
    INDEX idx_llm_usage_status (status, created_at DESC),
    INDEX idx_llm_usage_cost (cost, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. USER_AI_PREFERENCES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_ai_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    ai_descriptions_enabled BOOLEAN DEFAULT TRUE,
    ai_summaries_enabled BOOLEAN DEFAULT TRUE,
    ai_subtitles_enabled BOOLEAN DEFAULT TRUE,
    ai_recommendations_enabled BOOLEAN DEFAULT TRUE,
    ai_tutor_enabled BOOLEAN DEFAULT TRUE,
    ai_search_enabled BOOLEAN DEFAULT TRUE,
    ai_content_generation_enabled BOOLEAN DEFAULT TRUE,
    ai_assistance_level VARCHAR(20) DEFAULT 'moderate',
    custom_settings JSON,
    share_data_for_improvement BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES alpharithmic.user(id) ON DELETE CASCADE,
    INDEX idx_ai_prefs_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. AI_CONVERSATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    conversation_type VARCHAR(50) NOT NULL,
    context_type VARCHAR(50),
    context_id INT,
    title VARCHAR(255),
    messages JSON NOT NULL,
    summary TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES alpharithmic.user(id) ON DELETE CASCADE,
    INDEX idx_ai_conversations_user (user_id, created_at DESC),
    INDEX idx_ai_conversations_type (conversation_type),
    INDEX idx_ai_conversations_context (context_type, context_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. AI_RECOMMENDATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    recommendation_type VARCHAR(50) NOT NULL,
    recommended_id INT NOT NULL,
    recommendation_reason TEXT,
    confidence_score DECIMAL(3, 2),
    ranking INT,
    metadata JSON,
    shown_at TIMESTAMP NULL,
    clicked_at TIMESTAMP NULL,
    dismissed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES alpharithmic.user(id) ON DELETE CASCADE,
    INDEX idx_ai_recommendations_user (user_id, ranking, created_at DESC),
    INDEX idx_ai_recommendations_type (recommendation_type, recommended_id),
    INDEX idx_ai_recommendations_shown (user_id, shown_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. AI_FEEDBACK
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    content_id INT NOT NULL,
    feedback_type VARCHAR(50) NOT NULL,
    rating INT,
    feedback_text TEXT,
    corrected_content TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES alpharithmic.user(id) ON DELETE SET NULL,
    FOREIGN KEY (content_id) REFERENCES ai_generated_content(id) ON DELETE CASCADE,
    INDEX idx_ai_feedback_content (content_id, created_at DESC),
    INDEX idx_ai_feedback_user (user_id, created_at DESC),
    INDEX idx_ai_feedback_type (feedback_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. AI_LEARNING_INSIGHTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_learning_insights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    insight_type VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    insight_text TEXT NOT NULL,
    confidence_score DECIMAL(3, 2),
    supporting_data JSON,
    actionable_items JSON,
    shown_at TIMESTAMP NULL,
    acknowledged_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES alpharithmic.user(id) ON DELETE CASCADE,
    INDEX idx_ai_insights_user (user_id, created_at DESC),
    INDEX idx_ai_insights_type (insight_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE MODIFICATIONS
-- ============================================================================
-- Use helper procedures from database_schema_mysql.sql
--
-- IMPORTANT: Before running, find your actual table names:
-- 
-- To find folder/course table:
-- SHOW TABLES LIKE '%folder%';
-- SHOW TABLES LIKE '%course%';
--
-- To find video table:
-- SHOW TABLES LIKE '%video%';
--
-- To find all tables in current schema:
-- SHOW TABLES;

-- ----------------------------------------------------------------------------
-- MODIFY VIDEO_RECORDING TABLE
-- ----------------------------------------------------------------------------
-- If your video table has a different name, update it here
CALL add_column_if_not_exists('video_recording', 'ai_description', 'TEXT');
CALL add_column_if_not_exists('video_recording', 'ai_summary', 'TEXT');
CALL add_column_if_not_exists('video_recording', 'ai_tags', 'JSON');
CALL add_column_if_not_exists('video_recording', 'ai_description_generated_at', 'TIMESTAMP NULL');
CALL add_column_if_not_exists('video_recording', 'ai_summary_generated_at', 'TIMESTAMP NULL');
CALL add_column_if_not_exists('video_recording', 'ai_description_approved', 'BOOLEAN DEFAULT FALSE');
CALL add_column_if_not_exists('video_recording', 'ai_summary_approved', 'BOOLEAN DEFAULT FALSE');

-- ----------------------------------------------------------------------------
-- MODIFY FOLDER TABLE (Courses)
-- ----------------------------------------------------------------------------
-- Table name confirmed: 'folder' (singular)
CALL add_column_if_not_exists('folder', 'ai_description', 'TEXT');
CALL add_column_if_not_exists('folder', 'ai_outline', 'JSON');
CALL add_column_if_not_exists('folder', 'ai_objectives', 'JSON');
CALL add_column_if_not_exists('folder', 'ai_generated_at', 'TIMESTAMP NULL');

-- ----------------------------------------------------------------------------
-- MODIFY USERS TABLE
-- ----------------------------------------------------------------------------
CALL add_column_if_not_exists_cross_schema('alpharithmic', 'user', 'ai_features_enabled', 'BOOLEAN DEFAULT TRUE');

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check all tables were created
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = DATABASE()
--   AND table_name IN (
--     'ai_generated_content', 'llm_api_usage', 'user_ai_preferences',
--     'ai_conversations', 'ai_recommendations', 'ai_feedback',
--     'ai_learning_insights'
--   );

-- Check columns were added
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = DATABASE()
--   AND table_name = 'video_recording' 
--   AND column_name LIKE 'ai_%';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

