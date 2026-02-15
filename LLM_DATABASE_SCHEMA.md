# LLM Integration - Database Schema Requirements

## Overview
This document outlines all database changes needed to support LLM integration features in TalkMotion.

---

## 📊 **NEW TABLES REQUIRED**

### **1. AI_GENERATED_CONTENT** - Store AI-Generated Content
**Purpose**: Track all AI-generated content (descriptions, summaries, subtitles, etc.)

```sql
CREATE TABLE IF NOT EXISTS ai_generated_content (
    id SERIAL PRIMARY KEY,
    content_type VARCHAR(50) NOT NULL,
    -- Types: 'video_description', 'video_summary', 'subtitle', 'course_outline', 
    --        'quiz_question', 'script', 'translation', 'tag', 'title'
    target_type VARCHAR(50) NOT NULL,
    -- Types: 'video', 'course', 'classroom', 'model', 'user'
    target_id INTEGER NOT NULL,
    -- ID of the target resource (video_id, course_id, etc.)
    original_content TEXT,
    -- Original content before AI enhancement (if applicable)
    generated_content TEXT NOT NULL,
    -- AI-generated content
    model_name VARCHAR(100),
    -- LLM model used: 'gpt-4', 'claude-3', 'gemini-pro', etc.
    prompt_used TEXT,
    -- The prompt that generated this content (for debugging/improvement)
    generation_metadata JSONB,
    -- Additional data: {"tokens_used": 150, "cost": 0.002, "temperature": 0.7, etc.}
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    -- User who requested/approved the generation
    status VARCHAR(50) DEFAULT 'pending',
    -- Status: 'pending', 'approved', 'rejected', 'modified'
    approved_at TIMESTAMP,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_ai_content_target ON ai_generated_content(target_type, target_id);
CREATE INDEX idx_ai_content_type ON ai_generated_content(content_type);
CREATE INDEX idx_ai_content_user ON ai_generated_content(user_id);
CREATE INDEX idx_ai_content_status ON ai_generated_content(status);
CREATE INDEX idx_ai_content_created ON ai_generated_content(created_at DESC);
```

**MySQL Version**:
```sql
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
```

---

### **2. LLM_API_USAGE** - Track LLM API Calls
**Purpose**: Monitor API usage, costs, rate limiting, and performance

```sql
CREATE TABLE IF NOT EXISTS llm_api_usage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    -- NULL for system-wide usage
    api_provider VARCHAR(50) NOT NULL,
    -- Providers: 'openai', 'anthropic', 'google', 'azure', 'self-hosted'
    model_name VARCHAR(100) NOT NULL,
    endpoint VARCHAR(100) NOT NULL,
    -- Endpoint: 'chat', 'completion', 'embedding', 'moderation'
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    cost DECIMAL(10, 6),
    -- Cost in USD
    response_time_ms INTEGER,
    -- Response time in milliseconds
    status VARCHAR(50) NOT NULL,
    -- Status: 'success', 'error', 'rate_limited', 'timeout'
    error_message TEXT,
    request_metadata JSONB,
    -- Request details: {"temperature": 0.7, "max_tokens": 500, etc.}
    response_metadata JSONB,
    -- Response details: {"finish_reason": "stop", "model_version": "gpt-4-0613", etc.}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_llm_usage_user_date ON llm_api_usage(user_id, created_at DESC);
CREATE INDEX idx_llm_usage_provider ON llm_api_usage(api_provider, created_at DESC);
CREATE INDEX idx_llm_usage_model ON llm_api_usage(model_name, created_at DESC);
CREATE INDEX idx_llm_usage_status ON llm_api_usage(status, created_at DESC);
CREATE INDEX idx_llm_usage_cost ON llm_api_usage(cost, created_at DESC);
```

**MySQL Version**:
```sql
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
```

---

### **3. USER_AI_PREFERENCES** - User AI Feature Preferences
**Purpose**: Store user preferences for AI features (opt-in/opt-out, settings)

```sql
CREATE TABLE IF NOT EXISTS user_ai_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    -- AI Feature Toggles
    ai_descriptions_enabled BOOLEAN DEFAULT TRUE,
    ai_summaries_enabled BOOLEAN DEFAULT TRUE,
    ai_subtitles_enabled BOOLEAN DEFAULT TRUE,
    ai_recommendations_enabled BOOLEAN DEFAULT TRUE,
    ai_tutor_enabled BOOLEAN DEFAULT TRUE,
    ai_search_enabled BOOLEAN DEFAULT TRUE,
    ai_content_generation_enabled BOOLEAN DEFAULT TRUE,
    -- AI Assistance Level
    ai_assistance_level VARCHAR(20) DEFAULT 'moderate',
    -- Levels: 'minimal', 'moderate', 'aggressive', 'custom'
    -- Custom settings (JSON)
    custom_settings JSONB,
    -- Example: {"auto_approve_descriptions": false, "review_before_publish": true}
    -- Privacy Settings
    share_data_for_improvement BOOLEAN DEFAULT FALSE,
    -- Whether to share anonymized data for AI model improvement
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_ai_prefs_user ON user_ai_preferences(user_id);
```

**MySQL Version**:
```sql
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
```

---

### **4. AI_CONVERSATIONS** - Chat/Conversation History
**Purpose**: Store AI tutor conversations, Q&A sessions, chatbot interactions

```sql
CREATE TABLE IF NOT EXISTS ai_conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    conversation_type VARCHAR(50) NOT NULL,
    -- Types: 'tutor', 'chatbot', 'qa', 'content_help', 'translation_help'
    context_type VARCHAR(50),
    -- Context: 'course', 'video', 'classroom', 'general'
    context_id INTEGER,
    -- ID of the context resource (course_id, video_id, etc.)
    title VARCHAR(255),
    -- Conversation title (auto-generated or user-provided)
    messages JSONB NOT NULL,
    -- Array of messages: [{"role": "user", "content": "...", "timestamp": "..."}, ...]
    summary TEXT,
    -- AI-generated summary of the conversation
    metadata JSONB,
    -- Additional data: {"model": "gpt-4", "total_tokens": 500, etc.}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id, created_at DESC);
CREATE INDEX idx_ai_conversations_type ON ai_conversations(conversation_type);
CREATE INDEX idx_ai_conversations_context ON ai_conversations(context_type, context_id);
```

**MySQL Version**:
```sql
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
```

---

### **5. AI_RECOMMENDATIONS** - Personalized Recommendations
**Purpose**: Store AI-generated content recommendations for users

```sql
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    recommendation_type VARCHAR(50) NOT NULL,
    -- Types: 'video', 'course', 'classroom', 'model', 'collaborator'
    recommended_id INTEGER NOT NULL,
    -- ID of the recommended resource
    recommendation_reason TEXT,
    -- Why this was recommended (AI-generated explanation)
    confidence_score DECIMAL(3, 2),
    -- Confidence score 0.00 to 1.00
    ranking INTEGER,
    -- Position in recommendation list (1 = highest priority)
    metadata JSONB,
    -- Additional data: {"based_on": "viewing_history", "similarity_score": 0.85}
    shown_at TIMESTAMP,
    -- When recommendation was shown to user
    clicked_at TIMESTAMP,
    -- When user clicked on recommendation
    dismissed_at TIMESTAMP,
    -- When user dismissed recommendation
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_ai_recommendations_user ON ai_recommendations(user_id, ranking, created_at DESC);
CREATE INDEX idx_ai_recommendations_type ON ai_recommendations(recommendation_type, recommended_id);
CREATE INDEX idx_ai_recommendations_shown ON ai_recommendations(user_id, shown_at DESC);
CREATE INDEX idx_ai_recommendations_active ON ai_recommendations(user_id, created_at DESC) 
    WHERE dismissed_at IS NULL;
```

**MySQL Version**:
```sql
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
```

---

### **6. AI_FEEDBACK** - User Feedback on AI Outputs
**Purpose**: Collect user feedback to improve AI responses

```sql
CREATE TABLE IF NOT EXISTS ai_feedback (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    content_id INTEGER REFERENCES ai_generated_content(id) ON DELETE CASCADE,
    -- Reference to the AI-generated content
    feedback_type VARCHAR(50) NOT NULL,
    -- Types: 'thumbs_up', 'thumbs_down', 'helpful', 'not_helpful', 'correction', 'suggestion'
    rating INTEGER,
    -- Rating 1-5 (if applicable)
    feedback_text TEXT,
    -- User's written feedback
    corrected_content TEXT,
    -- If user provided correction, store it here
    metadata JSONB,
    -- Additional feedback data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_ai_feedback_content ON ai_feedback(content_id, created_at DESC);
CREATE INDEX idx_ai_feedback_user ON ai_feedback(user_id, created_at DESC);
CREATE INDEX idx_ai_feedback_type ON ai_feedback(feedback_type);
```

**MySQL Version**:
```sql
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
```

---

### **7. CONTENT_EMBEDDINGS** - Vector Embeddings for Semantic Search
**Purpose**: Store vector embeddings for semantic search (if using vector databases)

```sql
CREATE TABLE IF NOT EXISTS content_embeddings (
    id SERIAL PRIMARY KEY,
    content_type VARCHAR(50) NOT NULL,
    -- Types: 'video', 'course', 'classroom', 'description', 'transcript'
    content_id INTEGER NOT NULL,
    -- ID of the content
    embedding_model VARCHAR(100) NOT NULL,
    -- Model used: 'text-embedding-ada-002', 'text-embedding-3-small', etc.
    embedding_vector VECTOR(1536),
    -- Vector embedding (dimension depends on model)
    -- Note: Requires pgvector extension for PostgreSQL
    text_content TEXT NOT NULL,
    -- The text that was embedded
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes (using vector similarity search)
CREATE INDEX idx_content_embeddings_vector ON content_embeddings 
    USING ivfflat (embedding_vector vector_cosine_ops);
CREATE INDEX idx_content_embeddings_target ON content_embeddings(content_type, content_id);
```

**Note**: For MySQL, you'll need to use a separate vector database (like Pinecone, Weaviate, or Qdrant) or store embeddings as JSON and use approximate nearest neighbor search.

---

### **8. AI_LEARNING_INSIGHTS** - Learning Analytics & Insights
**Purpose**: Store AI-generated learning insights and analytics

```sql
CREATE TABLE IF NOT EXISTS ai_learning_insights (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL,
    -- Types: 'strength', 'weakness', 'recommendation', 'progress', 'pattern'
    category VARCHAR(50),
    -- Category: 'gestures', 'vocabulary', 'grammar', 'comprehension', etc.
    insight_text TEXT NOT NULL,
    -- The AI-generated insight
    confidence_score DECIMAL(3, 2),
    -- Confidence in the insight
    supporting_data JSONB,
    -- Data that supports the insight: {"courses_completed": 5, "videos_watched": 20}
    actionable_items JSONB,
    -- Suggested actions: [{"action": "practice_numbers", "priority": "high"}]
    shown_at TIMESTAMP,
    acknowledged_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_ai_insights_user ON ai_learning_insights(user_id, created_at DESC);
CREATE INDEX idx_ai_insights_type ON ai_learning_insights(insight_type);
CREATE INDEX idx_ai_insights_unacknowledged ON ai_learning_insights(user_id, created_at DESC) 
    WHERE acknowledged_at IS NULL;
```

**MySQL Version**:
```sql
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
```

---

## 🔄 **MODIFICATIONS TO EXISTING TABLES**

### **1. VIDEOS TABLE** - Add AI-Generated Content Columns
```sql
-- PostgreSQL
ALTER TABLE video_recording 
    ADD COLUMN IF NOT EXISTS ai_description TEXT,
    ADD COLUMN IF NOT EXISTS ai_summary TEXT,
    ADD COLUMN IF NOT EXISTS ai_tags TEXT[],
    ADD COLUMN IF NOT EXISTS ai_description_generated_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS ai_summary_generated_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS ai_description_approved BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS ai_summary_approved BOOLEAN DEFAULT FALSE;

-- MySQL
CALL add_column_if_not_exists('video_recording', 'ai_description', 'TEXT');
CALL add_column_if_not_exists('video_recording', 'ai_summary', 'TEXT');
CALL add_column_if_not_exists('video_recording', 'ai_tags', 'JSON');
CALL add_column_if_not_exists('video_recording', 'ai_description_generated_at', 'TIMESTAMP NULL');
CALL add_column_if_not_exists('video_recording', 'ai_summary_generated_at', 'TIMESTAMP NULL');
CALL add_column_if_not_exists('video_recording', 'ai_description_approved', 'BOOLEAN DEFAULT FALSE');
CALL add_column_if_not_exists('video_recording', 'ai_summary_approved', 'BOOLEAN DEFAULT FALSE');
```

### **2. COURSES TABLE** - Add AI-Generated Content Columns
```sql
-- PostgreSQL
ALTER TABLE folders  -- or whatever the courses table is named
    ADD COLUMN IF NOT EXISTS ai_description TEXT,
    ADD COLUMN IF NOT EXISTS ai_outline JSONB,
    ADD COLUMN IF NOT EXISTS ai_objectives TEXT[],
    ADD COLUMN IF NOT EXISTS ai_generated_at TIMESTAMP;

-- MySQL
CALL add_column_if_not_exists('folders', 'ai_description', 'TEXT');
CALL add_column_if_not_exists('folders', 'ai_outline', 'JSON');
CALL add_column_if_not_exists('folders', 'ai_objectives', 'JSON');
CALL add_column_if_not_exists('folders', 'ai_generated_at', 'TIMESTAMP NULL');
```

### **3. SUBTITLES TABLE** - Add AI Enhancement Tracking
```sql
-- If you have a subtitles table
ALTER TABLE subtitles  -- adjust table name as needed
    ADD COLUMN IF NOT EXISTS ai_enhanced BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS ai_enhanced_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS original_text TEXT,
    ADD COLUMN IF NOT EXISTS enhancement_metadata JSONB;
```

### **4. USERS TABLE** - Add AI Preferences Reference
```sql
-- Already handled by user_ai_preferences table with foreign key
-- No direct column needed, but you might want:
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS ai_features_enabled BOOLEAN DEFAULT TRUE;
```

---

## 📋 **SUMMARY OF CHANGES**

### **New Tables (8 total)**
1. ✅ `ai_generated_content` - Store all AI-generated content
2. ✅ `llm_api_usage` - Track API calls and costs
3. ✅ `user_ai_preferences` - User AI feature preferences
4. ✅ `ai_conversations` - Chat/conversation history
5. ✅ `ai_recommendations` - Personalized recommendations
6. ✅ `ai_feedback` - User feedback on AI outputs
7. ✅ `content_embeddings` - Vector embeddings (PostgreSQL with pgvector)
8. ✅ `ai_learning_insights` - Learning analytics

### **Modified Tables (4 total)**
1. ✅ `video_recording` - Add AI description, summary, tags columns
2. ✅ `folders` (courses) - Add AI description, outline, objectives
3. ✅ `subtitles` - Add AI enhancement tracking
4. ✅ `users` - Add AI features enabled flag

### **Total Impact**
- **8 new tables** with indexes
- **4 table modifications** (adding columns)
- **~15-20 new indexes** for performance
- **Foreign key relationships** to existing tables

---

## 🚀 **IMPLEMENTATION PRIORITY**

### **Phase 1: Essential (MVP)**
1. ✅ `ai_generated_content` - Core functionality
2. ✅ `llm_api_usage` - Cost tracking
3. ✅ `user_ai_preferences` - User control
4. ✅ Modify `video_recording` - Store AI descriptions

### **Phase 2: Enhanced Features**
5. ✅ `ai_conversations` - Chat/tutor features
6. ✅ `ai_recommendations` - Recommendation system
7. ✅ Modify `folders` - Course AI features

### **Phase 3: Advanced Features**
8. ✅ `ai_feedback` - Feedback system
9. ✅ `ai_learning_insights` - Analytics
10. ✅ `content_embeddings` - Semantic search (if needed)

---

## 💾 **STORAGE ESTIMATES**

### **Table Size Estimates** (for 10,000 users, 100,000 videos)

- `ai_generated_content`: ~5-10 GB (text-heavy)
- `llm_api_usage`: ~2-5 GB (high volume, but compact)
- `user_ai_preferences`: ~1 MB (small, one row per user)
- `ai_conversations`: ~10-20 GB (conversation history)
- `ai_recommendations`: ~1-2 GB (moderate volume)
- `ai_feedback`: ~500 MB (low volume)
- `ai_learning_insights`: ~500 MB (periodic generation)
- `content_embeddings`: ~50-100 GB (if using vector storage)

**Total Estimated Storage**: ~70-140 GB (without embeddings), ~120-240 GB (with embeddings)

---

## 🔒 **PRIVACY & COMPLIANCE CONSIDERATIONS**

1. **Data Retention**: Consider retention policies for conversation history
2. **User Consent**: Ensure user_ai_preferences tracks consent
3. **Data Minimization**: Only store necessary data
4. **Anonymization**: Consider anonymizing data for model improvement
5. **GDPR Compliance**: Allow users to export/delete AI-generated data

---

## 📝 **MIGRATION SCRIPT**

See separate file: `llm_database_migration.sql` (to be created)

---

## ✅ **VERIFICATION QUERIES**

After migration, run these to verify:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'ai_%' OR table_name LIKE 'llm_%';

-- Check columns added to existing tables
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'video_recording' 
  AND column_name LIKE 'ai_%';

-- Check indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename LIKE 'ai_%' OR tablename LIKE 'llm_%';
```

---

**Status**: ✅ Database schema design complete
**Next Steps**: Create migration scripts, test on development database

