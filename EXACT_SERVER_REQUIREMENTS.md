# Exact Server Functionality & Database Schema Requirements

## 📋 Overview
This document lists **exactly** what server functionality and database schema changes are needed for the Deaf Community Dashboard.

---

## 🗄️ DATABASE SCHEMA CHANGES

### NEW TABLES (12 tables)

#### 1. **activities** - Activity Feed System
```sql
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id), -- User this activity is for (NULL = community-wide)
    type VARCHAR(50) NOT NULL, -- 'classroom_update', 'course_progress', 'community_activity', 'collaboration_request'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    actor_id INTEGER REFERENCES users(id), -- User who performed the action
    target_type VARCHAR(50), -- 'classroom', 'course', 'video', 'model', 'user'
    target_id INTEGER, -- ID of the target resource
    action_url VARCHAR(500), -- URL to navigate to when clicked
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB, -- Flexible additional data
    INDEX idx_user_timestamp (user_id, timestamp),
    INDEX idx_type_timestamp (type, timestamp),
    INDEX idx_actor (actor_id)
);
```
**Purpose**: Stores all activity feed items (personalized and community-wide)

---

#### 2. **activity_reads** - Track Read Status
```sql
CREATE TABLE activity_reads (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(activity_id, user_id),
    INDEX idx_user_read (user_id, read_at)
);
```
**Purpose**: Tracks which activities each user has read

---

#### 3. **notifications** - Notification System
```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'classroom_request', 'collaboration_invite', 'course_complete', 'system_announcement'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    action_url VARCHAR(500), -- URL to navigate to
    action_data JSONB, -- Data needed for actions (e.g., request IDs)
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_unread (user_id, read, created_at),
    INDEX idx_user_created (user_id, created_at DESC)
);
```
**Purpose**: Stores user notifications (requests, invites, updates)

---

#### 4. **collaboration_projects** - Collaboration Projects
```sql
CREATE TABLE collaboration_projects (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    skills_needed TEXT[], -- Array: ['ASL Expert', 'Video Creation', 'Model Training']
    max_contributors INTEGER DEFAULT 10,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'cancelled'
    deadline DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status_created (status, created_at DESC),
    INDEX idx_creator (creator_id)
);
```
**Purpose**: Stores collaboration projects users can join

---

#### 5. **collaboration_requests** - Collaboration Requests
```sql
CREATE TABLE collaboration_requests (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES collaboration_projects(id) ON DELETE CASCADE,
    requester_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP,
    INDEX idx_project_status (project_id, status),
    INDEX idx_requester (requester_id, status),
    INDEX idx_creator_pending (project_id, status) -- For finding pending requests for project creator
);
```
**Purpose**: Stores requests to join collaboration projects

---

#### 6. **collaboration_project_contributors** - Project Contributors
```sql
CREATE TABLE collaboration_project_contributors (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES collaboration_projects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'contributor', -- 'contributor', 'co-lead'
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id),
    INDEX idx_user_projects (user_id),
    INDEX idx_project_contributors (project_id)
);
```
**Purpose**: Tracks who is contributing to each project

---

#### 7. **user_badges** - Achievement Badges
```sql
CREATE TABLE user_badges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    badge_id VARCHAR(100) NOT NULL, -- 'first_video', 'course_complete', 'model_trainer', 'collaborator'
    badge_name VARCHAR(255) NOT NULL,
    badge_icon VARCHAR(500), -- URL to badge icon
    earned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB, -- Additional badge data
    INDEX idx_user_badges (user_id, earned_date DESC),
    UNIQUE(user_id, badge_id) -- Prevent duplicate badges
);
```
**Purpose**: Stores user achievements/badges

---

#### 8. **user_skills** - User Skills/Expertise
```sql
CREATE TABLE user_skills (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL, -- 'ASL Expert', 'Video Creation', 'Model Training', 'Course Creation'
    skill_level VARCHAR(50), -- 'beginner', 'intermediate', 'expert'
    verified BOOLEAN DEFAULT FALSE, -- Whether skill is verified by others
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_skills (user_id),
    INDEX idx_skill_name (skill_name),
    UNIQUE(user_id, skill_name) -- One skill entry per user per skill
);
```
**Purpose**: Stores user skills for collaboration matching

---

#### 9. **dashboard_layouts** - Dashboard Customization
```sql
CREATE TABLE dashboard_layouts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    layout_config JSONB NOT NULL, -- {widgets: [{id, position, visible, size}], ...}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);
```
**Purpose**: Stores user's customized dashboard layout

---

#### 10. **user_accessibility_preferences** - Accessibility Settings
```sql
CREATE TABLE user_accessibility_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    high_contrast BOOLEAN DEFAULT FALSE,
    font_size VARCHAR(20) DEFAULT 'medium', -- 'small', 'medium', 'large', 'xlarge'
    reduced_motion BOOLEAN DEFAULT FALSE,
    color_blind_mode VARCHAR(50), -- 'none', 'protanopia', 'deuteranopia', 'tritanopia'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);
```
**Purpose**: Stores user accessibility preferences

---

#### 11. **video_views** - Video View Tracking
```sql
CREATE TABLE video_views (
    id SERIAL PRIMARY KEY,
    video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    view_duration INTEGER, -- seconds watched
    INDEX idx_video_views (video_id, viewed_at DESC),
    INDEX idx_user_views (user_id, viewed_at DESC),
    INDEX idx_video_popularity (video_id, viewed_at) -- For trending calculations
);
```
**Purpose**: Tracks video views for statistics and trending

---

#### 12. **classroom_access_logs** - Classroom Access Tracking
```sql
CREATE TABLE classroom_access_logs (
    id SERIAL PRIMARY KEY,
    classroom_id INTEGER REFERENCES classrooms(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_classroom_user (classroom_id, user_id, accessed_at DESC),
    INDEX idx_user_recent (user_id, accessed_at DESC)
);
```
**Purpose**: Tracks when users access classrooms (for "last accessed" feature)

---

### TABLE MODIFICATIONS (2 tables)

#### **classrooms** - Add Activity Metrics
```sql
ALTER TABLE classrooms ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0;
ALTER TABLE classrooms ADD COLUMN IF NOT EXISTS recent_activity_count INTEGER DEFAULT 0;
ALTER TABLE classrooms ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP;

-- Index for sorting by activity
CREATE INDEX IF NOT EXISTS idx_classrooms_activity 
    ON classrooms(recent_activity_count DESC, last_activity_at DESC);
```
**Purpose**: Add cached metrics for dashboard display

---

#### **users** - Add Learning Metrics
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS learning_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_contributions INTEGER DEFAULT 0;
```
**Purpose**: Track user learning progress and contributions

---

## 🔌 SERVER API ENDPOINTS

### PHASE 1: MVP (High Priority)

#### 1. Dashboard Statistics API
```
GET /api/dashboard/stats
Headers: Authorization: Bearer <token>
Response: {
  "activeClassrooms": 5,
  "myCourses": 8,
  "videosCreated": 45,
  "communityContributions": 12,
  "modelsTrained": 7
}
```
**Functionality**: 
- Count user's active classrooms (from existing classroom tables)
- Count user's courses (from existing course tables)
- Count user's videos (from existing video tables)
- Count user's contributions (videos shared, models shared, etc.)
- Count user's trained models (from existing model tables)

---

#### 2. Activity Feed API
```
GET /api/dashboard/activity-feed?limit=20&offset=0
Headers: Authorization: Bearer <token>
Response: {
  "activities": [{
    "id": "activity_123",
    "type": "classroom_update",
    "title": "New video added",
    "description": "John added 'Introduction to ASL' to Classroom ABC",
    "timestamp": "2024-01-15T10:30:00Z",
    "actor": {"id": "user_456", "name": "John Doe", "avatar": "url"},
    "target": {"type": "classroom", "id": "classroom_789", "name": "ASL Learning Group"},
    "actionUrl": "/classroom/789",
    "read": false
  }],
  "total": 150,
  "hasMore": true
}
```
**Functionality**:
- Query `activities` table filtered by `user_id` OR `user_id IS NULL` (community)
- Join with `activity_reads` to determine read status
- Order by `timestamp DESC`
- Paginate with limit/offset

---

#### 3. Mark Activity as Read API
```
POST /api/dashboard/activity/:activityId/read
Headers: Authorization: Bearer <token>
Response: {"success": true}
```
**Functionality**:
- Insert into `activity_reads` table (or update if exists)
- Use ON CONFLICT for unique constraint

---

#### 4. Notifications API
```
GET /api/notifications?unreadOnly=true&limit=20
Headers: Authorization: Bearer <token>
Response: {
  "notifications": [{
    "id": "notif_123",
    "type": "classroom_request",
    "title": "New classroom access request",
    "message": "Jane Doe requested to join 'ASL Learning Group'",
    "timestamp": "2024-01-15T09:00:00Z",
    "read": false,
    "actionUrl": "/classroom/789/requests",
    "actionData": {"classroomId": "classroom_789", "userId": "user_456", "requestId": "request_123"}
  }],
  "unreadCount": 5
}
```
**Functionality**:
- Query `notifications` table filtered by `user_id`
- Filter by `read = false` if `unreadOnly=true`
- Order by `created_at DESC`
- Count unread notifications

---

#### 5. Mark Notification as Read API
```
POST /api/notifications/:notificationId/read
Headers: Authorization: Bearer <token>
Response: {"success": true}
```
**Functionality**:
- Update `notifications` table: `read = TRUE` where `id = notificationId` AND `user_id = current_user`

---

#### 6. Mark All Notifications as Read API
```
POST /api/notifications/read-all
Headers: Authorization: Bearer <token>
Response: {"success": true, "updatedCount": 5}
```
**Functionality**:
- Update `notifications` table: `read = TRUE` where `user_id = current_user` AND `read = FALSE`

---

#### 7. Learning Progress API
```
GET /api/dashboard/learning-progress
Headers: Authorization: Bearer <token>
Response: {
  "coursesInProgress": [{
    "courseId": "course_123",
    "courseName": "ASL Basics",
    "progress": 65,
    "lessonsCompleted": 13,
    "totalLessons": 20
  }],
  "videosCreated": {
    "total": 45,
    "thisWeek": 5,
    "lastWeek": 3,
    "trend": "up"
  },
  "modelsTrained": 12,
  "badges": [{
    "id": "badge_1",
    "name": "First Video",
    "icon": "url",
    "earnedDate": "2024-01-10"
  }],
  "learningStreak": {
    "current": 7,
    "longest": 15,
    "lastActivity": "2024-01-15"
  }
}
```
**Functionality**:
- Query course progress from existing course tables
- Count videos created (total, this week, last week) from existing video tables
- Count models trained from existing model tables
- Query `user_badges` table
- Get `learning_streak` and `last_activity_date` from `users` table

---

#### 8. Enhanced Classrooms API (Modify Existing)
```
GET /api/classrooms/my-classrooms
Headers: Authorization: Bearer <token>
Response: {
  "classrooms": [{
    "id": "classroom_123",
    "name": "ASL Learning Group",
    "description": "...",
    "memberCount": 25,
    "recentActivityCount": 3,
    "lastAccessed": "2024-01-15T10:00:00Z",
    "lastActivityAt": "2024-01-15T09:30:00Z"
  }]
}
```
**Functionality**:
- Use existing classroom query
- Add `member_count` from `classrooms` table
- Add `recent_activity_count` from `classrooms` table
- Query `classroom_access_logs` for `lastAccessed` (most recent for this user)
- Add `last_activity_at` from `classrooms` table

---

#### 9. Recent Videos API (Modify Existing)
```
GET /api/videos/recent?type=created&limit=10
GET /api/videos/recent?type=viewed&limit=10
Headers: Authorization: Bearer <token>
```
**Functionality**:
- For `type=created`: Query existing videos table filtered by `user_id`, ordered by `created_at DESC`
- For `type=viewed`: Query `video_views` table filtered by `user_id`, ordered by `viewed_at DESC`, join with videos table

---

### PHASE 2: Core Features (Medium Priority)

#### 10. Community Activity Feed API
```
GET /api/dashboard/community-activity?limit=20&offset=0
Headers: Authorization: Bearer <token>
```
**Functionality**: Query `activities` where `user_id IS NULL` (community-wide activities)

---

#### 11. Classroom Activity API
```
GET /api/dashboard/classroom-activity/:classroomId?limit=20
Headers: Authorization: Bearer <token>
```
**Functionality**: Query `activities` where `target_type = 'classroom'` AND `target_id = classroomId`

---

#### 12. User Badges API
```
GET /api/dashboard/badges
Headers: Authorization: Bearer <token>
```
**Functionality**: Query `user_badges` table filtered by `user_id`

---

#### 13. Learning Streak API
```
GET /api/dashboard/learning-streak
Headers: Authorization: Bearer <token>
```
**Functionality**: Get `learning_streak` and `last_activity_date` from `users` table

---

#### 14. Video Statistics API
```
GET /api/dashboard/video-stats?period=week
Headers: Authorization: Bearer <token>
```
**Functionality**: Count videos created by user in specified period (week, month, year)

---

#### 15. Featured Classrooms API
```
GET /api/discovery/featured-classrooms?limit=10
Headers: Authorization: Bearer <token>
```
**Functionality**: Query `classrooms` where `is_public = true`, ordered by `recent_activity_count DESC` or manual featured flag

---

#### 16. Popular Videos API
```
GET /api/discovery/popular-videos?period=week&limit=10
Headers: Authorization: Bearer <token>
```
**Functionality**: 
- Query `video_views` table
- Group by `video_id`, count views in period
- Join with videos table
- Order by view count DESC

---

#### 17. Top Contributors API
```
GET /api/discovery/top-contributors?period=month&limit=10
Headers: Authorization: Bearer <token>
```
**Functionality**: 
- Query `users` table ordered by `total_contributions DESC`
- Or calculate from activities/videos/models created

---

#### 18. New Public Classrooms API
```
GET /api/discovery/new-classrooms?limit=10
Headers: Authorization: Bearer <token>
```
**Functionality**: Query `classrooms` where `is_public = true`, ordered by `created_at DESC`

---

#### 19. Community Statistics API
```
GET /api/dashboard/community-stats
Headers: Authorization: Bearer <token>
Response: {
  "totalMembers": 1250,
  "totalVideos": 5000,
  "totalClassrooms": 150,
  "activeUsersThisWeek": 350
}
```
**Functionality**: Aggregate counts from users, videos, classrooms tables

---

### PHASE 3: Advanced Features (Low Priority)

#### 20-26. Collaboration APIs
- `GET /api/collaboration/projects` - Query `collaboration_projects` table
- `POST /api/collaboration/projects` - Insert into `collaboration_projects`
- `POST /api/collaboration/projects/:projectId/request` - Insert into `collaboration_requests`
- `GET /api/collaboration/requests` - Query `collaboration_requests` table
- `POST /api/collaboration/requests/:requestId/accept` - Update request status, insert into `collaboration_project_contributors`
- `POST /api/collaboration/requests/:requestId/decline` - Update request status
- `GET /api/collaboration/skills` - Query `user_skills` table

#### 27-28. Search APIs
- `GET /api/search?q=query&type=all` - Search across videos, classrooms, courses, users
- `GET /api/search/suggestions?q=query` - Return search suggestions

#### 29-30. Preferences APIs
- `GET/POST /api/preferences/accessibility` - Query/update `user_accessibility_preferences` table
- `GET/POST /api/preferences/dashboard-layout` - Query/update `dashboard_layouts` table

---

## 🔄 BACKGROUND JOBS / SCHEDULED TASKS

### Daily Jobs (Run once per day)

1. **Update Learning Streaks**
   - Query `users` table
   - Check `last_activity_date`
   - If `last_activity_date = yesterday`, increment `learning_streak`
   - If `last_activity_date < yesterday`, reset `learning_streak = 0`
   - Update `users` table

2. **Update Classroom Activity Counts**
   - Query `activities` table for last 7 days
   - Group by `target_id` where `target_type = 'classroom'`
   - Update `classrooms.recent_activity_count` and `classrooms.last_activity_at`

3. **Update Community Stats Cache**
   - Count total users, videos, classrooms
   - Cache results

4. **Update Popular Content**
   - Query `video_views` for last period (week/month)
   - Calculate trending videos
   - Cache results

5. **Generate Activity Feed Entries**
   - When events occur (video created, classroom joined, etc.), insert into `activities` table
   - This can be done in real-time or batched

---

## 📝 ACTIVITY GENERATION TRIGGERS

These events should create entries in the `activities` table:

1. **Video Created**: Insert activity with `type='video_created'`, `target_type='video'`
2. **Classroom Joined**: Insert activity with `type='classroom_joined'`, `target_type='classroom'`
3. **Course Completed**: Insert activity with `type='course_completed'`, `target_type='course'`
4. **Model Trained**: Insert activity with `type='model_trained'`, `target_type='model'`
5. **Classroom Video Added**: Insert activity with `type='classroom_update'`, `target_type='classroom'`
6. **Collaboration Request**: Insert activity with `type='collaboration_request'`

**Implementation**: Add triggers/application logic when these events occur

---

## 🔔 NOTIFICATION GENERATION TRIGGERS

These events should create entries in the `notifications` table:

1. **Classroom Access Request**: When user requests to join classroom → notify classroom owner
2. **Collaboration Request**: When user requests to join project → notify project creator
3. **Course Completion**: When user completes course → notify user
4. **Badge Earned**: When user earns badge → notify user

**Implementation**: Add application logic when these events occur

---

## 🎯 SUMMARY

### Database Changes:
- **12 new tables** (activities, notifications, collaboration tables, badges, skills, etc.)
- **2 table modifications** (classrooms, users)
- **Multiple indexes** for performance

### Server APIs:
- **Phase 1 (MVP)**: 9 endpoints (stats, activity feed, notifications, learning progress)
- **Phase 2**: 10 endpoints (discovery, community features)
- **Phase 3**: 11 endpoints (collaboration, search, preferences)

### Background Jobs:
- **5 daily jobs** (streaks, activity counts, stats, trending)

### Event Triggers:
- **Activity generation** on 6+ event types
- **Notification generation** on 4+ event types

---

## ✅ IMPLEMENTATION CHECKLIST

### Database Setup
- [ ] Create 12 new tables
- [ ] Modify 2 existing tables
- [ ] Create all indexes
- [ ] Set up foreign key constraints

### Phase 1 APIs
- [ ] Dashboard stats endpoint
- [ ] Activity feed endpoint
- [ ] Mark activity read endpoint
- [ ] Notifications endpoint
- [ ] Mark notification read endpoints
- [ ] Learning progress endpoint
- [ ] Enhanced classrooms endpoint
- [ ] Recent videos endpoint

### Background Jobs
- [ ] Learning streak updater
- [ ] Classroom activity counter
- [ ] Community stats updater
- [ ] Popular content calculator

### Event Triggers
- [ ] Activity generation on events
- [ ] Notification generation on events

