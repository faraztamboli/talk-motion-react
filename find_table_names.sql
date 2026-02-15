-- ============================================================================
-- FIND TABLE NAMES - Run this first to identify your actual table names
-- ============================================================================
-- Run these queries to find the correct table names before running the migration

-- Find folder/course related tables
SHOW TABLES LIKE '%folder%';
SHOW TABLES LIKE '%course%';

-- Find video related tables
SHOW TABLES LIKE '%video%';

-- Find all tables in current database
SHOW TABLES;

-- Find tables in specific schema (if using multiple schemas)
-- SELECT TABLE_NAME 
-- FROM information_schema.TABLES 
-- WHERE TABLE_SCHEMA = 'talk-motion' 
--   AND (TABLE_NAME LIKE '%folder%' OR TABLE_NAME LIKE '%course%' OR TABLE_NAME LIKE '%video%');

-- ============================================================================
-- COMMON TABLE NAME VARIATIONS
-- ============================================================================
-- Based on your schema, the table might be named:
-- - folders (plural)
-- - folder (singular)
-- - courses (plural)
-- - course (singular)
-- - folder_content
-- - course_content
-- - Or might be in a different schema (e.g., alpharithmic.folders)
--
-- Once you identify the correct name, update the migration file accordingly.

