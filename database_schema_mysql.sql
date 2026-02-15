-- ============================================================================
-- DEAF COMMUNITY DASHBOARD - DATABASE SCHEMA (MySQL VERSION)
-- ============================================================================
-- This file contains all database schema changes needed for the dashboard
-- Compatible with MySQL 5.7+ and MySQL 8.0+
-- 
-- SCHEMA NOTES:
-- - All new tables are created in the 'talk-motion' schema
-- - The 'user' table is in the 'alpharithmic' schema (referenced as alpharithmic.user)
-- - MySQL has limitations with cross-schema foreign keys in CREATE TABLE statements
-- - If 'videos' table foreign key fails, you may need to:
--   1. Add it separately with ALTER TABLE after table creation
--   2. Or remove the constraint if videos table is in a different schema
--   3. Or ensure videos table exists in the same schema (talk-motion)
-- ============================================================================

-- ============================================================================
-- NEW TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ACTIVITIES - Activity Feed System
-- ----------------------------------------------------------------------------
-- Stores all activity feed items (personalized and community-wide)
-- Activities are generated when events occur (video created, classroom joined, etc.)
-- NULL user_id means community-wide activity visible to all
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    -- NULL user_id means community-wide activity visible to all
    type VARCHAR(50) NOT NULL,
    -- Types: 'classroom_update', 'course_progress', 'community_activity', 
    --        'collaboration_request', 'video_created', 'model_trained', 
    --        'classroom_joined', 'course_completed'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    actor_id INT NULL,
    -- User who performed the action
    target_type VARCHAR(50) NULL,
    -- Types: 'classroom', 'course', 'video', 'model', 'user', 'collaboration_project'
    target_id INT NULL,
    -- ID of the target resource (classroom_id, course_id, video_id, etc.)
    action_url VARCHAR(500) NULL,
    -- URL to navigate to when activity is clicked
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSON NULL,
    -- Flexible additional data: {"videoTitle": "...", "classroomName": "...", etc.}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES alpharithmic.user(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES alpharithmic.user(id) ON DELETE SET NULL,
    INDEX idx_activities_user_timestamp (user_id, timestamp DESC),
    INDEX idx_activities_type_timestamp (type, timestamp DESC),
    INDEX idx_activities_actor (actor_id),
    INDEX idx_activities_target (target_type, target_id),
    INDEX idx_activities_community (timestamp DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. ACTIVITY_READS - Track Read Status
-- ----------------------------------------------------------------------------
-- Tracks which activities each user has read
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_reads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity_id INT NOT NULL,
    user_id INT NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_activity_read (activity_id, user_id),
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES alpharithmic.user(id) ON DELETE CASCADE,
    INDEX idx_activity_reads_user_read (user_id, read_at DESC),
    INDEX idx_activity_reads_activity (activity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. NOTIFICATIONS - Notification System
-- ----------------------------------------------------------------------------
-- Stores user notifications (requests, invites, updates, announcements)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    -- User who should receive this notification
    type VARCHAR(50) NOT NULL,
    -- Types: 'classroom_request', 'collaboration_invite', 'course_complete', 
    --        'system_announcement', 'badge_earned', 'collaboration_request'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    action_url VARCHAR(500) NULL,
    -- URL to navigate to when notification is clicked
    action_data JSON NULL,
    -- Data needed for actions: {"classroomId": 123, "userId": 456, "requestId": 789}
    `read` BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES alpharithmic.user(id) ON DELETE CASCADE,
    INDEX idx_notifications_user_unread (user_id, `read`, created_at DESC),
    INDEX idx_notifications_user_created (user_id, created_at DESC),
    INDEX idx_notifications_unread_count (user_id, `read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. COLLABORATION_PROJECTS - Collaboration Projects
-- ----------------------------------------------------------------------------
-- Stores collaboration projects that users can join
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS collaboration_projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    creator_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    skills_needed JSON NULL,
    -- Array of required skills: ["ASL Expert", "Video Creation", "Model Training"]
    max_contributors INT DEFAULT 10,
    status VARCHAR(50) DEFAULT 'active',
    -- Status: 'active', 'completed', 'cancelled'
    deadline DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES alpharithmic.user(id) ON DELETE CASCADE,
    INDEX idx_collab_projects_status_created (status, created_at DESC),
    INDEX idx_collab_projects_creator (creator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. COLLABORATION_REQUESTS - Collaboration Requests
-- ----------------------------------------------------------------------------
-- Stores requests to join collaboration projects
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS collaboration_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    requester_id INT NOT NULL,
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    -- Status: 'pending', 'accepted', 'declined'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL,
    FOREIGN KEY (project_id) REFERENCES collaboration_projects(id) ON DELETE CASCADE,
    FOREIGN KEY (requester_id) REFERENCES alpharithmic.user(id) ON DELETE CASCADE,
    INDEX idx_collab_requests_project_status (project_id, status),
    INDEX idx_collab_requests_requester (requester_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. COLLABORATION_PROJECT_CONTRIBUTORS - Project Contributors
-- ----------------------------------------------------------------------------
-- Tracks who is contributing to each collaboration project
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS collaboration_project_contributors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    role VARCHAR(50) DEFAULT 'contributor',
    -- Role: 'contributor', 'co-lead'
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_project_contributor (project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES collaboration_projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES alpharithmic.user(id) ON DELETE CASCADE,
    INDEX idx_collab_contributors_user (user_id),
    INDEX idx_collab_contributors_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. USER_BADGES - Achievement Badges
-- ----------------------------------------------------------------------------
-- Stores user achievements/badges earned
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    badge_id VARCHAR(100) NOT NULL,
    -- Badge IDs: 'first_video', 'course_complete', 'model_trainer', 
    --            'collaborator', 'video_master', 'classroom_creator', etc.
    badge_name VARCHAR(255) NOT NULL,
    badge_icon VARCHAR(500) NULL,
    -- URL to badge icon/image
    earned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSON NULL,
    -- Additional badge data: {"courseId": 123, "videoCount": 10, etc.}
    UNIQUE KEY unique_user_badge (user_id, badge_id),
    FOREIGN KEY (user_id) REFERENCES alpharithmic.user(id) ON DELETE CASCADE,
    INDEX idx_user_badges_user_earned (user_id, earned_date DESC),
    INDEX idx_user_badges_badge_id (badge_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. USER_SKILLS - User Skills/Expertise
-- ----------------------------------------------------------------------------
-- Stores user skills for collaboration matching
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    -- Skills: 'ASL Expert', 'Video Creation', 'Model Training', 
    --         'Course Creation', 'Sign Language Interpreter', etc.
    skill_level VARCHAR(50) NULL,
    -- Level: 'beginner', 'intermediate', 'expert'
    verified BOOLEAN DEFAULT FALSE,
    -- Whether skill is verified by others or system
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_skill (user_id, skill_name),
    FOREIGN KEY (user_id) REFERENCES alpharithmic.user(id) ON DELETE CASCADE,
    INDEX idx_user_skills_user (user_id),
    INDEX idx_user_skills_name (skill_name),
    INDEX idx_user_skills_verified (skill_name, verified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. DASHBOARD_LAYOUTS - Dashboard Customization
-- ----------------------------------------------------------------------------
-- Stores user's customized dashboard layout
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dashboard_layouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    layout_config JSON NOT NULL,
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_layout (user_id),
    FOREIGN KEY (user_id) REFERENCES alpharithmic.user(id) ON DELETE CASCADE,
    INDEX idx_dashboard_layouts_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. USER_ACCESSIBILITY_PREFERENCES - Accessibility Settings
-- ----------------------------------------------------------------------------
-- Stores user accessibility preferences
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_accessibility_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    high_contrast BOOLEAN DEFAULT FALSE,
    font_size VARCHAR(20) DEFAULT 'medium',
    -- Font sizes: 'small', 'medium', 'large', 'xlarge'
    reduced_motion BOOLEAN DEFAULT FALSE,
    color_blind_mode VARCHAR(50) DEFAULT 'none',
    -- Modes: 'none', 'protanopia', 'deuteranopia', 'tritanopia'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_accessibility (user_id),
    FOREIGN KEY (user_id) REFERENCES alpharithmic.user(id) ON DELETE CASCADE,
    INDEX idx_accessibility_prefs_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 11. VIDEO_VIEWS - Video View Tracking
-- ----------------------------------------------------------------------------
-- Tracks video views for statistics and trending calculations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS video_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    video_id INT NOT NULL,
    user_id INT NULL,
    -- NULL user_id for anonymous views
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    view_duration INT NULL,
    -- Duration in seconds watched
    ip_address VARCHAR(45) NULL,
    -- For analytics (optional, consider privacy)
    user_agent TEXT NULL,
    -- For analytics (optional)
    -- Reference to video_recording table (actual table name)
    FOREIGN KEY (video_id) REFERENCES video_recording(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES alpharithmic.user(id) ON DELETE SET NULL,
    INDEX idx_video_views_video_viewed (video_id, viewed_at DESC),
    INDEX idx_video_views_user_viewed (user_id, viewed_at DESC),
    INDEX idx_video_views_popularity (video_id, viewed_at),
    INDEX idx_video_views_recent (viewed_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 12. CLASSROOM_ACCESS_LOGS - Classroom Access Tracking
-- ----------------------------------------------------------------------------
-- Tracks when users access classrooms (for "last accessed" feature)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS classroom_access_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    classroom_id INT NOT NULL,
    user_id INT NOT NULL,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Reference to classroom table (singular, in talk-motion schema)
    FOREIGN KEY (classroom_id) REFERENCES classroom(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES alpharithmic.user(id) ON DELETE CASCADE,
    INDEX idx_classroom_access_classroom_user (classroom_id, user_id, accessed_at DESC),
    INDEX idx_classroom_access_user_recent (user_id, accessed_at DESC),
    INDEX idx_classroom_access_recent (accessed_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- HELPER PROCEDURE: Add column if not exists
-- ============================================================================
-- Use this procedure to safely add columns that may already exist
-- Note: MySQL doesn't support IF NOT EXISTS in CREATE PROCEDURE
-- Drop and recreate if it already exists, or ignore the error
DELIMITER //

DROP PROCEDURE IF EXISTS add_column_if_not_exists //

CREATE PROCEDURE add_column_if_not_exists(
    IN table_name_param VARCHAR(64),
    IN column_name_param VARCHAR(64),
    IN column_definition TEXT
)
BEGIN
    DECLARE column_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO column_exists
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = table_name_param
      AND COLUMN_NAME = column_name_param;
    
    IF column_exists = 0 THEN
        SET @sql = CONCAT('ALTER TABLE ', table_name_param, ' ADD COLUMN ', column_name_param, ' ', column_definition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //

DELIMITER ;

-- Helper procedure to add column if not exists (cross-schema version)
DELIMITER //

DROP PROCEDURE IF EXISTS add_column_if_not_exists_cross_schema //

CREATE PROCEDURE add_column_if_not_exists_cross_schema(
    IN schema_name_param VARCHAR(64),
    IN table_name_param VARCHAR(64),
    IN column_name_param VARCHAR(64),
    IN column_definition TEXT
)
BEGIN
    DECLARE column_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO column_exists
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = schema_name_param
      AND TABLE_NAME = table_name_param
      AND COLUMN_NAME = column_name_param;
    
    IF column_exists = 0 THEN
        SET @sql = CONCAT('ALTER TABLE ', schema_name_param, '.', table_name_param, ' ADD COLUMN ', column_name_param, ' ', column_definition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //

DELIMITER ;

-- Helper procedure to create index if not exists
DELIMITER //

DROP PROCEDURE IF EXISTS create_index_if_not_exists //

CREATE PROCEDURE create_index_if_not_exists(
    IN index_name_param VARCHAR(64),
    IN table_name_param VARCHAR(64),
    IN index_definition TEXT
)
BEGIN
    DECLARE index_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO index_exists
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = table_name_param
      AND INDEX_NAME = index_name_param;
    
    IF index_exists = 0 THEN
        SET @sql = CONCAT('CREATE INDEX ', index_name_param, ' ON ', table_name_param, ' ', index_definition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //

-- Helper procedure to create index if not exists (cross-schema version)
DROP PROCEDURE IF EXISTS create_index_if_not_exists_cross_schema //

CREATE PROCEDURE create_index_if_not_exists_cross_schema(
    IN index_name_param VARCHAR(64),
    IN schema_name_param VARCHAR(64),
    IN table_name_param VARCHAR(64),
    IN index_definition TEXT
)
BEGIN
    DECLARE index_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO index_exists
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = schema_name_param
      AND TABLE_NAME = table_name_param
      AND INDEX_NAME = index_name_param;
    
    IF index_exists = 0 THEN
        SET @sql = CONCAT('CREATE INDEX ', index_name_param, ' ON ', schema_name_param, '.', table_name_param, ' ', index_definition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //

DELIMITER ;

-- ============================================================================
-- TABLE MODIFICATIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- MODIFY CLASSROOM TABLE
-- ----------------------------------------------------------------------------
-- Add activity metrics columns to classroom table (singular)
-- ----------------------------------------------------------------------------
-- Use the helper procedure to safely add columns
CALL add_column_if_not_exists('classroom', 'member_count', 'INT DEFAULT 0');
CALL add_column_if_not_exists('classroom', 'recent_activity_count', 'INT DEFAULT 0');
CALL add_column_if_not_exists('classroom', 'last_activity_at', 'TIMESTAMP NULL');

-- Option 2: Use stored procedure to check first (see below)

-- Index for sorting classrooms by activity
-- Use helper procedure to create index safely
CALL create_index_if_not_exists('idx_classroom_activity', 'classroom', '(recent_activity_count DESC, last_activity_at DESC)');

-- Index for public classrooms sorted by activity
CALL create_index_if_not_exists('idx_classroom_public_activity', 'classroom', '(recent_activity_count DESC, last_activity_at DESC)');

-- Note: MySQL doesn't support partial indexes like PostgreSQL
-- If you need to filter by is_public, add a WHERE clause in your queries

-- ----------------------------------------------------------------------------
-- MODIFY USERS TABLE
-- ----------------------------------------------------------------------------
-- Add learning metrics columns to users table
-- ----------------------------------------------------------------------------
-- Note: MySQL doesn't support IF NOT EXISTS in ALTER TABLE
-- Use the helper procedure to add columns safely
-- user table is in alpharithmic schema (singular, not users)

-- Note: MySQL doesn't support IF NOT EXISTS in ALTER TABLE
-- Use helper procedure for cross-schema tables to safely add columns
-- user table is in alpharithmic schema (singular, not users)
CALL add_column_if_not_exists_cross_schema('alpharithmic', 'user', 'learning_streak', 'INT DEFAULT 0');
CALL add_column_if_not_exists_cross_schema('alpharithmic', 'user', 'last_activity_date', 'DATE NULL');
CALL add_column_if_not_exists_cross_schema('alpharithmic', 'user', 'total_contributions', 'INT DEFAULT 0');

-- Index for users sorted by contributions
-- Use cross-schema helper procedure to create index safely
-- user table is in alpharithmic schema
CALL create_index_if_not_exists_cross_schema('idx_user_contributions', 'alpharithmic', 'user', '(total_contributions DESC)');

-- Index for users with active streaks
CALL create_index_if_not_exists_cross_schema('idx_user_streak', 'alpharithmic', 'user', '(learning_streak DESC)');

-- ============================================================================
-- STORED PROCEDURES (MySQL equivalent of PostgreSQL functions)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Procedure to update classroom activity count
-- ----------------------------------------------------------------------------
DELIMITER //

DROP PROCEDURE IF EXISTS update_classroom_activity_count //

CREATE PROCEDURE update_classroom_activity_count(IN classroom_id_param INT)
BEGIN
    UPDATE classroom
    SET 
        recent_activity_count = (
            SELECT COUNT(*)
            FROM activities
            WHERE target_type = 'classroom'
                AND target_id = classroom_id_param
                AND timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ),
        last_activity_at = (
            SELECT MAX(timestamp)
            FROM activities
            WHERE target_type = 'classroom'
                AND target_id = classroom_id_param
        )
    WHERE id = classroom_id_param;
END //

DELIMITER ;

-- ----------------------------------------------------------------------------
-- Procedure to update user learning streak
-- ----------------------------------------------------------------------------
DELIMITER //

DROP PROCEDURE IF EXISTS update_user_learning_streak //

CREATE PROCEDURE update_user_learning_streak(IN user_id_param INT)
BEGIN
    DECLARE last_activity DATE;
    DECLARE current_streak INT;
    
    SELECT last_activity_date, learning_streak 
    INTO last_activity, current_streak
    FROM alpharithmic.user
    WHERE id = user_id_param;

    IF last_activity = DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY) THEN
        -- Continue streak
        UPDATE alpharithmic.user
        SET learning_streak = current_streak + 1,
            last_activity_date = CURRENT_DATE
        WHERE id = user_id_param;
    ELSEIF last_activity < DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY) THEN
        -- Reset streak
        UPDATE alpharithmic.user
        SET learning_streak = 1,
            last_activity_date = CURRENT_DATE
        WHERE id = user_id_param;
    END IF;
END //

DELIMITER ;

-- ----------------------------------------------------------------------------
-- Function to get user's last accessed classroom
-- ----------------------------------------------------------------------------
DELIMITER //

DROP FUNCTION IF EXISTS get_user_last_accessed_classroom //

CREATE FUNCTION get_user_last_accessed_classroom(
    user_id_param INT, 
    classroom_id_param INT
) RETURNS TIMESTAMP
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE last_accessed TIMESTAMP;
    
    SELECT MAX(accessed_at)
    INTO last_accessed
    FROM classroom_access_logs
    WHERE user_id = user_id_param
        AND classroom_id = classroom_id_param;
    
    RETURN last_accessed;
END //

DELIMITER ;

-- ============================================================================
-- VERIFICATION QUERIES (Run after migration to verify)
-- ============================================================================

-- Check all tables were created
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = DATABASE()
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
-- WHERE table_schema = DATABASE()
--   AND table_name = 'classroom' 
--   AND column_name IN ('member_count', 'recent_activity_count', 'last_activity_at');

-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'alpharithmic'
--   AND table_name = 'user'
--   AND column_name IN ('learning_streak', 'last_activity_date', 'total_contributions');

-- ============================================================================
-- ROLLBACK SCRIPT (If needed)
-- ============================================================================

-- To rollback, run these in reverse order:
-- 
-- DROP PROCEDURE IF EXISTS get_user_last_accessed_classroom;
-- DROP PROCEDURE IF EXISTS update_user_learning_streak;
-- DROP PROCEDURE IF EXISTS update_classroom_activity_count;
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
-- ALTER TABLE classroom 
--     DROP COLUMN IF EXISTS member_count,
--     DROP COLUMN IF EXISTS recent_activity_count,
--     DROP COLUMN IF EXISTS last_activity_at;
-- 
-- ALTER TABLE alpharithmic.user 
--     DROP COLUMN IF EXISTS learning_streak,
--     DROP COLUMN IF EXISTS last_activity_date,
--     DROP COLUMN IF EXISTS total_contributions;

-- ============================================================================
-- ADDITIONAL FOREIGN KEY CONSTRAINTS
-- ============================================================================
-- MySQL doesn't support cross-schema foreign keys in CREATE TABLE statements
-- Add these constraints separately after table creation if needed
-- 
-- For video_views table - video_recording is the actual table name
-- If video_recording is in alpharithmic schema, comment out the FK in CREATE TABLE and use this:
-- ALTER TABLE video_views 
--   ADD CONSTRAINT fk_video_views_video 
--   FOREIGN KEY (video_id) REFERENCES alpharithmic.video_recording(id) ON DELETE CASCADE;
--
-- For classroom_access_logs table - if MySQL doesn't allow cross-schema FK in CREATE TABLE:
-- Comment out the FK in CREATE TABLE (line 293) and use this:
-- ALTER TABLE classroom_access_logs 
--   ADD CONSTRAINT fk_classroom_access_classroom 
--   FOREIGN KEY (classroom_id) REFERENCES classroom(id) ON DELETE CASCADE;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

