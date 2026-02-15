-- ============================================================================
-- DEAF COMMUNITY DASHBOARD - DATABASE SCHEMA
-- ============================================================================
-- This file contains all database schema changes needed for the dashboard
-- Run this migration to set up all required tables and modifications
-- ============================================================================

-- ============================================================================
-- NEW TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ACTIVITIES - Activity Feed System
-- ----------------------------------------------------------------------------
-- Stores all activity feed items (personalized and community-wide)
-- Activities are generated when events occur (video created, classroom joined, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    -- NULL user_id means community-wide activity visible to all
    type VARCHAR(50) NOT NULL,
    -- Types: 'classroom_update', 'course_progress', 'community_activity', 
    --        'collaboration_request', 'video_created', 'model_trained', 
    --        'classroom_joined', 'course_completed'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    -- User who performed the action
    target_type VARCHAR(50),
    -- Types: 'classroom', 'course', 'video', 'model', 'user', 'collaboration_project'
    target_id INTEGER,
    -- ID of the target resource (classroom_id, course_id, video_id, etc.)
    action_url VARCHAR(500),
    -- URL to navigate to when activity is clicked
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    -- Flexible additional data: {"videoTitle": "...", "classroomName": "...", etc.}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for activities
CREATE INDEX IF NOT EXISTS idx_activities_user_timestamp ON activities(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type_timestamp ON activities(type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activities_actor ON activities(actor_id);
CREATE INDEX IF NOT EXISTS idx_activities_target ON activities(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_activities_community ON activities(timestamp DESC) WHERE user_id IS NULL;

-- ----------------------------------------------------------------------------
-- 2. ACTIVITY_READS - Track Read Status
-- ----------------------------------------------------------------------------
-- Tracks which activities each user has read
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_reads (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_activity_read UNIQUE(activity_id, user_id)
);

-- Indexes for activity_reads
CREATE INDEX IF NOT EXISTS idx_activity_reads_user_read ON activity_reads(user_id, read_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_reads_activity ON activity_reads(activity_id);

-- ----------------------------------------------------------------------------
-- 3. NOTIFICATIONS - Notification System
-- ----------------------------------------------------------------------------
-- Stores user notifications (requests, invites, updates, announcements)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    -- User who should receive this notification
    type VARCHAR(50) NOT NULL,
    -- Types: 'classroom_request', 'collaboration_invite', 'course_complete', 
    --        'system_announcement', 'badge_earned', 'collaboration_request'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    action_url VARCHAR(500),
    -- URL to navigate to when notification is clicked
    action_data JSONB,
    -- Data needed for actions: {"classroomId": 123, "userId": 456, "requestId": 789}
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread_count ON notifications(user_id, read) WHERE read = FALSE;

-- ----------------------------------------------------------------------------
-- 4. COLLABORATION_PROJECTS - Collaboration Projects
-- ----------------------------------------------------------------------------
-- Stores collaboration projects that users can join
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS collaboration_projects (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    skills_needed TEXT[],
    -- Array of required skills: ['ASL Expert', 'Video Creation', 'Model Training']
    max_contributors INTEGER DEFAULT 10,
    status VARCHAR(50) DEFAULT 'active',
    -- Status: 'active', 'completed', 'cancelled'
    deadline DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for collaboration_projects
CREATE INDEX IF NOT EXISTS idx_collab_projects_status_created ON collaboration_projects(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collab_projects_creator ON collaboration_projects(creator_id);
CREATE INDEX IF NOT EXISTS idx_collab_projects_active ON collaboration_projects(status, created_at DESC) WHERE status = 'active';

-- ----------------------------------------------------------------------------
-- 5. COLLABORATION_REQUESTS - Collaboration Requests
-- ----------------------------------------------------------------------------
-- Stores requests to join collaboration projects
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS collaboration_requests (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES collaboration_projects(id) ON DELETE CASCADE,
    requester_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    -- Status: 'pending', 'accepted', 'declined'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP
);

-- Indexes for collaboration_requests
CREATE INDEX IF NOT EXISTS idx_collab_requests_project_status ON collaboration_requests(project_id, status);
CREATE INDEX IF NOT EXISTS idx_collab_requests_requester ON collaboration_requests(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_collab_requests_pending ON collaboration_requests(project_id, status) WHERE status = 'pending';

-- ----------------------------------------------------------------------------
-- 6. COLLABORATION_PROJECT_CONTRIBUTORS - Project Contributors
-- ----------------------------------------------------------------------------
-- Tracks who is contributing to each collaboration project
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS collaboration_project_contributors (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES collaboration_projects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'contributor',
    -- Role: 'contributor', 'co-lead'
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_project_contributor UNIQUE(project_id, user_id)
);

-- Indexes for collaboration_project_contributors
CREATE INDEX IF NOT EXISTS idx_collab_contributors_user ON collaboration_project_contributors(user_id);
CREATE INDEX IF NOT EXISTS idx_collab_contributors_project ON collaboration_project_contributors(project_id);

-- ----------------------------------------------------------------------------
-- 7. USER_BADGES - Achievement Badges
-- ----------------------------------------------------------------------------
-- Stores user achievements/badges earned
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_badges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    badge_id VARCHAR(100) NOT NULL,
    -- Badge IDs: 'first_video', 'course_complete', 'model_trainer', 
    --            'collaborator', 'video_master', 'classroom_creator', etc.
    badge_name VARCHAR(255) NOT NULL,
    badge_icon VARCHAR(500),
    -- URL to badge icon/image
    earned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    -- Additional badge data: {"courseId": 123, "videoCount": 10, etc.}
    CONSTRAINT unique_user_badge UNIQUE(user_id, badge_id)
);

-- Indexes for user_badges
CREATE INDEX IF NOT EXISTS idx_user_badges_user_earned ON user_badges(user_id, earned_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);

-- ----------------------------------------------------------------------------
-- 8. USER_SKILLS - User Skills/Expertise
-- ----------------------------------------------------------------------------
-- Stores user skills for collaboration matching
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_skills (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    -- Skills: 'ASL Expert', 'Video Creation', 'Model Training', 
    --         'Course Creation', 'Sign Language Interpreter', etc.
    skill_level VARCHAR(50),
    -- Level: 'beginner', 'intermediate', 'expert'
    verified BOOLEAN DEFAULT FALSE,
    -- Whether skill is verified by others or system
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_skill UNIQUE(user_id, skill_name)
);

-- Indexes for user_skills
CREATE INDEX IF NOT EXISTS idx_user_skills_user ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_name ON user_skills(skill_name);
CREATE INDEX IF NOT EXISTS idx_user_skills_verified ON user_skills(skill_name, verified) WHERE verified = TRUE;

-- ----------------------------------------------------------------------------
-- 9. DASHBOARD_LAYOUTS - Dashboard Customization
-- ----------------------------------------------------------------------------
-- Stores user's customized dashboard layout
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dashboard_layouts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    layout_config JSONB NOT NULL,
    -- Layout structure: {
    --   "widgets": [
    --     {"id": "quick-actions", "position": 0, "visible": true, "size": "large"},
    --     {"id": "activity-feed", "position": 1, "visible": true, "size": "medium"},
    --     ...
    --   ],
    --   "columns": 2,
    --   "theme": "default"
    -- }
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_layout UNIQUE(user_id)
);

-- Indexes for dashboard_layouts
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_user ON dashboard_layouts(user_id);

-- ----------------------------------------------------------------------------
-- 10. USER_ACCESSIBILITY_PREFERENCES - Accessibility Settings
-- ----------------------------------------------------------------------------
-- Stores user accessibility preferences
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_accessibility_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    high_contrast BOOLEAN DEFAULT FALSE,
    font_size VARCHAR(20) DEFAULT 'medium',
    -- Font sizes: 'small', 'medium', 'large', 'xlarge'
    reduced_motion BOOLEAN DEFAULT FALSE,
    color_blind_mode VARCHAR(50) DEFAULT 'none',
    -- Modes: 'none', 'protanopia', 'deuteranopia', 'tritanopia'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_accessibility UNIQUE(user_id)
);

-- Indexes for user_accessibility_preferences
CREATE INDEX IF NOT EXISTS idx_accessibility_prefs_user ON user_accessibility_preferences(user_id);

-- ----------------------------------------------------------------------------
-- 11. VIDEO_VIEWS - Video View Tracking
-- ----------------------------------------------------------------------------
-- Tracks video views for statistics and trending calculations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS video_views (
    id SERIAL PRIMARY KEY,
    video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    -- NULL user_id for anonymous views
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    view_duration INTEGER,
    -- Duration in seconds watched
    ip_address VARCHAR(45),
    -- For analytics (optional, consider privacy)
    user_agent TEXT
    -- For analytics (optional)
);

-- Indexes for video_views
CREATE INDEX IF NOT EXISTS idx_video_views_video_viewed ON video_views(video_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_views_user_viewed ON video_views(user_id, viewed_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_video_views_popularity ON video_views(video_id, viewed_at);
CREATE INDEX IF NOT EXISTS idx_video_views_recent ON video_views(viewed_at DESC);

-- ----------------------------------------------------------------------------
-- 12. CLASSROOM_ACCESS_LOGS - Classroom Access Tracking
-- ----------------------------------------------------------------------------
-- Tracks when users access classrooms (for "last accessed" feature)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS classroom_access_logs (
    id SERIAL PRIMARY KEY,
    classroom_id INTEGER REFERENCES classrooms(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for classroom_access_logs
CREATE INDEX IF NOT EXISTS idx_classroom_access_classroom_user ON classroom_access_logs(classroom_id, user_id, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_classroom_access_user_recent ON classroom_access_logs(user_id, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_classroom_access_recent ON classroom_access_logs(accessed_at DESC);

-- ============================================================================
-- TABLE MODIFICATIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- MODIFY CLASSROOMS TABLE
-- ----------------------------------------------------------------------------
-- Add activity metrics columns to classrooms table
-- ----------------------------------------------------------------------------
ALTER TABLE classrooms 
    ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS recent_activity_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP;

-- Index for sorting classrooms by activity
CREATE INDEX IF NOT EXISTS idx_classrooms_activity 
    ON classrooms(recent_activity_count DESC, last_activity_at DESC NULLS LAST);

-- Index for public classrooms sorted by activity
CREATE INDEX IF NOT EXISTS idx_classrooms_public_activity 
    ON classrooms(recent_activity_count DESC, last_activity_at DESC NULLS LAST) 
    WHERE is_public = TRUE;

-- ----------------------------------------------------------------------------
-- MODIFY USERS TABLE
-- ----------------------------------------------------------------------------
-- Add learning metrics columns to users table
-- ----------------------------------------------------------------------------
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS learning_streak INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_activity_date DATE,
    ADD COLUMN IF NOT EXISTS total_contributions INTEGER DEFAULT 0;

-- Index for users sorted by contributions
CREATE INDEX IF NOT EXISTS idx_users_contributions 
    ON users(total_contributions DESC);

-- Index for users with active streaks
CREATE INDEX IF NOT EXISTS idx_users_streak 
    ON users(learning_streak DESC) WHERE learning_streak > 0;

-- ============================================================================
-- HELPER FUNCTIONS (Optional - for PostgreSQL)
-- ============================================================================

-- Function to update classroom activity count
-- This can be called from application or scheduled job
CREATE OR REPLACE FUNCTION update_classroom_activity_count(classroom_id_param INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE classrooms
    SET 
        recent_activity_count = (
            SELECT COUNT(*)
            FROM activities
            WHERE target_type = 'classroom'
                AND target_id = classroom_id_param
                AND timestamp >= NOW() - INTERVAL '7 days'
        ),
        last_activity_at = (
            SELECT MAX(timestamp)
            FROM activities
            WHERE target_type = 'classroom'
                AND target_id = classroom_id_param
        )
    WHERE id = classroom_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to update user learning streak
-- This should be called daily via scheduled job
CREATE OR REPLACE FUNCTION update_user_learning_streak(user_id_param INTEGER)
RETURNS VOID AS $$
DECLARE
    last_activity DATE;
    current_streak INTEGER;
BEGIN
    SELECT last_activity_date, learning_streak 
    INTO last_activity, current_streak
    FROM users
    WHERE id = user_id_param;

    IF last_activity = CURRENT_DATE - INTERVAL '1 day' THEN
        -- Continue streak
        UPDATE users
        SET learning_streak = current_streak + 1,
            last_activity_date = CURRENT_DATE
        WHERE id = user_id_param;
    ELSIF last_activity < CURRENT_DATE - INTERVAL '1 day' THEN
        -- Reset streak
        UPDATE users
        SET learning_streak = 1,
            last_activity_date = CURRENT_DATE
        WHERE id = user_id_param;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's last accessed classroom
CREATE OR REPLACE FUNCTION get_user_last_accessed_classroom(user_id_param INTEGER, classroom_id_param INTEGER)
RETURNS TIMESTAMP AS $$
DECLARE
    last_accessed TIMESTAMP;
BEGIN
    SELECT MAX(accessed_at)
    INTO last_accessed
    FROM classroom_access_logs
    WHERE user_id = user_id_param
        AND classroom_id = classroom_id_param;
    
    RETURN last_accessed;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS (Optional - for automatic updates)
-- ============================================================================

-- Trigger to update updated_at timestamp on collaboration_projects
CREATE OR REPLACE FUNCTION update_collaboration_project_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_collaboration_project_updated_at
    BEFORE UPDATE ON collaboration_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_collaboration_project_updated_at();

-- Trigger to update updated_at timestamp on dashboard_layouts
CREATE OR REPLACE FUNCTION update_dashboard_layout_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_dashboard_layout_updated_at
    BEFORE UPDATE ON dashboard_layouts
    FOR EACH ROW
    EXECUTE FUNCTION update_dashboard_layout_updated_at();

-- Trigger to update updated_at timestamp on user_accessibility_preferences
CREATE OR REPLACE FUNCTION update_accessibility_prefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_accessibility_prefs_updated_at
    BEFORE UPDATE ON user_accessibility_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_accessibility_prefs_updated_at();

-- ============================================================================
-- INITIAL DATA / DEFAULTS (Optional)
-- ============================================================================

-- You may want to backfill some data or set defaults
-- For example, initialize member_count for existing classrooms:
-- UPDATE classrooms SET member_count = (
--     SELECT COUNT(*) FROM classroom_students WHERE classroom_id = classrooms.id
-- ) + (
--     SELECT COUNT(*) FROM classroom_teachers WHERE classroom_id = classrooms.id
-- );

-- ============================================================================
-- VERIFICATION QUERIES (Run after migration to verify)
-- ============================================================================

-- Check all tables were created
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
--   AND table_name IN (
--     'activities', 'activity_reads', 'notifications', 
--     'collaboration_projects', 'collaboration_requests', 
--     'collaboration_project_contributors', 'user_badges', 
--     'user_skills', 'dashboard_layouts', 
--     'user_accessibility_preferences', 'video_views', 
--     'classroom_access_logs'
--   );

-- Check columns were added to existing tables
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'classrooms' 
--   AND column_name IN ('member_count', 'recent_activity_count', 'last_activity_at');

-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'users' 
--   AND column_name IN ('learning_streak', 'last_activity_date', 'total_contributions');

-- ============================================================================
-- ROLLBACK SCRIPT (If needed)
-- ============================================================================

-- To rollback, run these in reverse order:
-- 
-- DROP TRIGGER IF EXISTS trigger_update_accessibility_prefs_updated_at ON user_accessibility_preferences;
-- DROP TRIGGER IF EXISTS trigger_update_dashboard_layout_updated_at ON dashboard_layouts;
-- DROP TRIGGER IF EXISTS trigger_update_collaboration_project_updated_at ON collaboration_projects;
-- 
-- DROP FUNCTION IF EXISTS update_accessibility_prefs_updated_at();
-- DROP FUNCTION IF EXISTS update_dashboard_layout_updated_at();
-- DROP FUNCTION IF EXISTS update_collaboration_project_updated_at();
-- DROP FUNCTION IF EXISTS get_user_last_accessed_classroom(INTEGER, INTEGER);
-- DROP FUNCTION IF EXISTS update_user_learning_streak(INTEGER);
-- DROP FUNCTION IF EXISTS update_classroom_activity_count(INTEGER);
-- 
-- DROP TABLE IF EXISTS classroom_access_logs;
-- DROP TABLE IF EXISTS video_views;
-- DROP TABLE IF EXISTS user_accessibility_preferences;
-- DROP TABLE IF EXISTS dashboard_layouts;
-- DROP TABLE IF EXISTS user_skills;
-- DROP TABLE IF EXISTS user_badges;
-- DROP TABLE IF EXISTS collaboration_project_contributors;
-- DROP TABLE IF EXISTS collaboration_requests;
-- DROP TABLE IF EXISTS collaboration_projects;
-- DROP TABLE IF EXISTS notifications;
-- DROP TABLE IF EXISTS activity_reads;
-- DROP TABLE IF EXISTS activities;
-- 
-- ALTER TABLE classrooms 
--     DROP COLUMN IF EXISTS member_count,
--     DROP COLUMN IF EXISTS recent_activity_count,
--     DROP COLUMN IF EXISTS last_activity_at;
-- 
-- ALTER TABLE users 
--     DROP COLUMN IF EXISTS learning_streak,
--     DROP COLUMN IF EXISTS last_activity_date,
--     DROP COLUMN IF EXISTS total_contributions;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

