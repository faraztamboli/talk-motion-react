-- ============================================================================
-- LLM INTEGRATION - DATABASE MIGRATION (PostgreSQL)
-- ============================================================================
-- This migration adds all tables and columns needed for LLM integration
-- Run this after the main dashboard schema migration
-- ============================================================================

-- ============================================================================
-- NEW TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. AI_GENERATED_CONTENT
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_generated_content (
    id SERIAL PRIMARY KEY,
    content_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id INTEGER NOT NULL,
    original_content TEXT,
    generated_content TEXT NOT NULL,
    model_name VARCHAR(100),
    prompt_used TEXT,
    generation_metadata JSONB,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending',
    approved_at TIMESTAMP,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_content_target ON ai_generated_content(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_ai_content_type ON ai_generated_content(content_type);
CREATE INDEX IF NOT EXISTS idx_ai_content_user ON ai_generated_content(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_content_status ON ai_generated_content(status);
CREATE INDEX IF NOT EXISTS idx_ai_content_created ON ai_generated_content(created_at DESC);

-- ----------------------------------------------------------------------------
-- 2. LLM_API_USAGE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS llm_api_usage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    api_provider VARCHAR(50) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    endpoint VARCHAR(100) NOT NULL,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    cost DECIMAL(10, 6),
    response_time_ms INTEGER,
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    request_metadata JSONB,
    response_metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_llm_usage_user_date ON llm_api_usage(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_llm_usage_provider ON llm_api_usage(api_provider, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_llm_usage_model ON llm_api_usage(model_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_llm_usage_status ON llm_api_usage(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_llm_usage_cost ON llm_api_usage(cost, created_at DESC);

-- ----------------------------------------------------------------------------
-- 3. USER_AI_PREFERENCES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_ai_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    ai_descriptions_enabled BOOLEAN DEFAULT TRUE,
    ai_summaries_enabled BOOLEAN DEFAULT TRUE,
    ai_subtitles_enabled BOOLEAN DEFAULT TRUE,
    ai_recommendations_enabled BOOLEAN DEFAULT TRUE,
    ai_tutor_enabled BOOLEAN DEFAULT TRUE,
    ai_search_enabled BOOLEAN DEFAULT TRUE,
    ai_content_generation_enabled BOOLEAN DEFAULT TRUE,
    ai_assistance_level VARCHAR(20) DEFAULT 'moderate',
    custom_settings JSONB,
    share_data_for_improvement BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_prefs_user ON user_ai_preferences(user_id);

-- ----------------------------------------------------------------------------
-- 4. AI_CONVERSATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    conversation_type VARCHAR(50) NOT NULL,
    context_type VARCHAR(50),
    context_id INTEGER,
    title VARCHAR(255),
    messages JSONB NOT NULL,
    summary TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_type ON ai_conversations(conversation_type);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_context ON ai_conversations(context_type, context_id);

-- ----------------------------------------------------------------------------
-- 5. AI_RECOMMENDATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    recommendation_type VARCHAR(50) NOT NULL,
    recommended_id INTEGER NOT NULL,
    recommendation_reason TEXT,
    confidence_score DECIMAL(3, 2),
    ranking INTEGER,
    metadata JSONB,
    shown_at TIMESTAMP,
    clicked_at TIMESTAMP,
    dismissed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user ON ai_recommendations(user_id, ranking, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_type ON ai_recommendations(recommendation_type, recommended_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_shown ON ai_recommendations(user_id, shown_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_active ON ai_recommendations(user_id, created_at DESC) 
    WHERE dismissed_at IS NULL;

-- ----------------------------------------------------------------------------
-- 6. AI_FEEDBACK
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_feedback (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    content_id INTEGER REFERENCES ai_generated_content(id) ON DELETE CASCADE,
    feedback_type VARCHAR(50) NOT NULL,
    rating INTEGER,
    feedback_text TEXT,
    corrected_content TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_content ON ai_feedback(content_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user ON ai_feedback(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_type ON ai_feedback(feedback_type);

-- ----------------------------------------------------------------------------
-- 7. AI_LEARNING_INSIGHTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_learning_insights (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    insight_text TEXT NOT NULL,
    confidence_score DECIMAL(3, 2),
    supporting_data JSONB,
    actionable_items JSONB,
    shown_at TIMESTAMP,
    acknowledged_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_insights_user ON ai_learning_insights(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_learning_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_unacknowledged ON ai_learning_insights(user_id, created_at DESC) 
    WHERE acknowledged_at IS NULL;

-- ----------------------------------------------------------------------------
-- 8. CONTENT_EMBEDDINGS (Optional - requires pgvector extension)
-- ----------------------------------------------------------------------------
-- Uncomment if using vector embeddings for semantic search
-- Requires: CREATE EXTENSION IF NOT EXISTS vector;
/*
CREATE TABLE IF NOT EXISTS content_embeddings (
    id SERIAL PRIMARY KEY,
    content_type VARCHAR(50) NOT NULL,
    content_id INTEGER NOT NULL,
    embedding_model VARCHAR(100) NOT NULL,
    embedding_vector vector(1536),
    text_content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_content_embeddings_vector ON content_embeddings 
    USING ivfflat (embedding_vector vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_content_embeddings_target ON content_embeddings(content_type, content_id);
*/

-- ============================================================================
-- TABLE MODIFICATIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- MODIFY VIDEO_RECORDING TABLE
-- ----------------------------------------------------------------------------
ALTER TABLE video_recording 
    ADD COLUMN IF NOT EXISTS ai_description TEXT,
    ADD COLUMN IF NOT EXISTS ai_summary TEXT,
    ADD COLUMN IF NOT EXISTS ai_tags TEXT[],
    ADD COLUMN IF NOT EXISTS ai_description_generated_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS ai_summary_generated_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS ai_description_approved BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS ai_summary_approved BOOLEAN DEFAULT FALSE;

-- ----------------------------------------------------------------------------
-- MODIFY FOLDERS TABLE (Courses)
-- ----------------------------------------------------------------------------
ALTER TABLE folders 
    ADD COLUMN IF NOT EXISTS ai_description TEXT,
    ADD COLUMN IF NOT EXISTS ai_outline JSONB,
    ADD COLUMN IF NOT EXISTS ai_objectives TEXT[],
    ADD COLUMN IF NOT EXISTS ai_generated_at TIMESTAMP;

-- ----------------------------------------------------------------------------
-- MODIFY USERS TABLE
-- ----------------------------------------------------------------------------
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS ai_features_enabled BOOLEAN DEFAULT TRUE;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update updated_at timestamp on ai_generated_content
CREATE OR REPLACE FUNCTION update_ai_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_content_updated_at
    BEFORE UPDATE ON ai_generated_content
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_content_updated_at();

-- Trigger to update updated_at timestamp on user_ai_preferences
CREATE OR REPLACE FUNCTION update_ai_prefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_prefs_updated_at
    BEFORE UPDATE ON user_ai_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_prefs_updated_at();

-- Trigger to update updated_at timestamp on ai_conversations
CREATE OR REPLACE FUNCTION update_ai_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_conversations_updated_at
    BEFORE UPDATE ON ai_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_conversations_updated_at();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check all tables were created
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
--   AND table_name IN (
--     'ai_generated_content', 'llm_api_usage', 'user_ai_preferences',
--     'ai_conversations', 'ai_recommendations', 'ai_feedback',
--     'ai_learning_insights'
--   );

-- Check columns were added
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'video_recording' 
--   AND column_name LIKE 'ai_%';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

