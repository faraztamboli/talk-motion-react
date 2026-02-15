# Backend Remotepy Functions - Implementation Guide

## Overview
This document lists all remotepy functions that need to be implemented in the Python backend for the Deaf Community Dashboard. Functions follow the pattern: `TalkMotionServer.functionName(token, ...params, callback)`

---

## 📊 PHASE 1: MVP (High Priority)

### Dashboard Statistics

#### `getUserDashboardStats(token, callback)`
**Purpose**: Get user's dashboard statistics (counts)
**Parameters**: 
- `token` (string): User authentication token
- `callback` (function): Callback with result

**Returns**:
```json
{
  "activeClassrooms": 5,
  "myCourses": 8,
  "videosCreated": 45,
  "communityContributions": 12,
  "modelsTrained": 7
}
```

**Implementation Notes**:
- Count user's active classrooms (from classroom_students/classroom_teachers)
- Count user's courses (from course enrollment tables)
- Count user's videos (from video_recording where create_user = user)
- Count contributions (videos shared publicly, models shared, etc.)
- Count models trained (from model training tables)

---

### Activity Feed

#### `getUserActivityFeed(token, limit, offset, callback)`
**Purpose**: Get user's personalized activity feed
**Parameters**:
- `token` (string): User authentication token
- `limit` (int): Number of activities to return (default: 20)
- `offset` (int): Pagination offset (default: 0)
- `callback` (function): Callback with result

**Returns**:
```json
{
  "activities": [
    {
      "id": 123,
      "type": "classroom_update",
      "title": "New video added",
      "description": "John added 'Introduction to ASL' to Classroom ABC",
      "timestamp": "2024-01-15T10:30:00Z",
      "actor": {
        "id": 456,
        "name": "John Doe",
        "avatar": "url"
      },
      "target": {
        "type": "classroom",
        "id": 789,
        "name": "ASL Learning Group"
      },
      "actionUrl": "/classroom/789",
      "read": false
    }
  ],
  "total": 150,
  "hasMore": true
}
```

**Implementation Notes**:
- Query `activities` table where `user_id = current_user_id` OR `user_id IS NULL` (community activities)
- Join with `activity_reads` to determine read status
- Join with `user` table to get actor information
- Order by `timestamp DESC`
- Include pagination

---

#### `markActivityAsRead(token, activityId, callback)`
**Purpose**: Mark an activity as read
**Parameters**:
- `token` (string): User authentication token
- `activityId` (int): Activity ID to mark as read
- `callback` (function): Callback with result

**Returns**:
```json
{
  "success": true
}
```

**Implementation Notes**:
- Insert into `activity_reads` table (or update if exists)
- Use ON CONFLICT/INSERT IGNORE to handle duplicates

---

### Notifications

#### `getUserNotifications(token, unreadOnly, limit, callback)`
**Purpose**: Get user notifications
**Parameters**:
- `token` (string): User authentication token
- `unreadOnly` (bool): If true, only return unread notifications (default: false)
- `limit` (int): Number of notifications to return (default: 20)
- `callback` (function): Callback with result

**Returns**:
```json
{
  "notifications": [
    {
      "id": 123,
      "type": "classroom_request",
      "title": "New classroom access request",
      "message": "Jane Doe requested to join 'ASL Learning Group'",
      "timestamp": "2024-01-15T09:00:00Z",
      "read": false,
      "actionUrl": "/classroom/789/requests",
      "actionData": {
        "classroomId": 789,
        "userId": 456,
        "requestId": 123
      }
    }
  ],
  "unreadCount": 5
}
```

**Implementation Notes**:
- Query `notifications` table where `user_id = current_user_id`
- Filter by `read = false` if `unreadOnly = true`
- Order by `created_at DESC`
- Count unread notifications

---

#### `markNotificationAsRead(token, notificationId, callback)`
**Purpose**: Mark a notification as read
**Parameters**:
- `token` (string): User authentication token
- `notificationId` (int): Notification ID
- `callback` (function): Callback with result

**Returns**:
```json
{
  "success": true
}
```

---

#### `markAllNotificationsAsRead(token, callback)`
**Purpose**: Mark all user notifications as read
**Parameters**:
- `token` (string): User authentication token
- `callback` (function): Callback with result

**Returns**:
```json
{
  "success": true,
  "updatedCount": 5
}
```

---

### Learning Progress

#### `getUserLearningProgress(token, callback)`
**Purpose**: Get user's learning progress data
**Parameters**:
- `token` (string): User authentication token
- `callback` (function): Callback with result

**Returns**:
```json
{
  "coursesInProgress": [
    {
      "courseId": 123,
      "courseName": "ASL Basics",
      "progress": 65,
      "lessonsCompleted": 13,
      "totalLessons": 20
    }
  ],
  "videosCreated": {
    "total": 45,
    "thisWeek": 5,
    "lastWeek": 3,
    "trend": "up"
  },
  "modelsTrained": 12,
  "badges": [
    {
      "id": 1,
      "badgeId": "first_video",
      "badgeName": "First Video",
      "badgeIcon": "url",
      "earnedDate": "2024-01-10"
    }
  ],
  "learningStreak": {
    "current": 7,
    "longest": 15,
    "lastActivity": "2024-01-15"
  }
}
```

**Implementation Notes**:
- Query course progress from existing course tables
- Count videos created (total, this week, last week) from `video_recording`
- Count models trained from existing model tables
- Query `user_badges` table
- Get `learning_streak` and `last_activity_date` from `alpharithmic.user` table

---

### Enhanced Classrooms API

#### `getUserActiveClassrooms(token, limit, callback)`
**Purpose**: Get user's active classrooms with activity metrics
**Parameters**:
- `token` (string): User authentication token
- `limit` (int): Number of classrooms to return (default: 10)
- `callback` (function): Callback with result

**Returns**:
```json
{
  "classrooms": [
    {
      "id": 123,
      "name": "ASL Learning Group",
      "description": "...",
      "memberCount": 25,
      "recentActivityCount": 3,
      "lastAccessed": "2024-01-15T10:00:00Z",
      "lastActivityAt": "2024-01-15T09:30:00Z"
    }
  ]
}
```

**Implementation Notes**:
- Use existing classroom query logic
- Add `member_count` from `classroom` table
- Add `recent_activity_count` from `classroom` table
- Query `classroom_access_logs` for `lastAccessed` (most recent for this user)
- Add `last_activity_at` from `classroom` table
- Sort by `lastAccessed DESC` or `lastActivityAt DESC`

---

### Recent Videos

#### `getUserRecentVideos(token, type, limit, callback)`
**Purpose**: Get user's recent videos (created or viewed)
**Parameters**:
- `token` (string): User authentication token
- `type` (string): 'created' or 'viewed' (default: 'created')
- `limit` (int): Number of videos to return (default: 10)
- `callback` (function): Callback with result

**Returns**:
```json
{
  "videos": [
    {
      "id": 123,
      "title": "Introduction to ASL",
      "thumbnail": "url",
      "creator": {
        "id": 456,
        "name": "John Doe"
      },
      "viewCount": 50,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**Implementation Notes**:
- For `type='created'`: Query `video_recording` filtered by `create_user`, ordered by `create_time DESC`
- For `type='viewed'`: Query `video_views` filtered by `user_id`, ordered by `viewed_at DESC`, join with `video_recording`

---

## 📊 PHASE 2: Core Features (Medium Priority)

### Community Activity

#### `getCommunityActivityFeed(token, limit, offset, callback)`
**Purpose**: Get community-wide activity feed
**Parameters**:
- `token` (string): User authentication token
- `limit` (int): Number of activities (default: 20)
- `offset` (int): Pagination offset (default: 0)
- `callback` (function): Callback with result

**Implementation Notes**:
- Query `activities` where `user_id IS NULL` (community-wide activities)
- Same structure as `getUserActivityFeed`

---

#### `getClassroomActivity(token, classroomId, limit, callback)`
**Purpose**: Get classroom-specific activity
**Parameters**:
- `token` (string): User authentication token
- `classroomId` (int): Classroom ID
- `limit` (int): Number of activities (default: 20)
- `callback` (function): Callback with result

**Implementation Notes**:
- Query `activities` where `target_type = 'classroom'` AND `target_id = classroomId`

---

### Discovery APIs

#### `getFeaturedClassrooms(token, limit, callback)`
**Purpose**: Get featured/public classrooms
**Parameters**:
- `token` (string): User authentication token
- `limit` (int): Number of classrooms (default: 10)
- `callback` (function): Callback with result

**Implementation Notes**:
- Query `classroom` where `is_public = 1`, ordered by `recent_activity_count DESC` or manual featured flag

---

#### `getPopularVideos(token, period, limit, callback)`
**Purpose**: Get popular videos
**Parameters**:
- `token` (string): User authentication token
- `period` (string): 'week', 'month', 'all' (default: 'week')
- `limit` (int): Number of videos (default: 10)
- `callback` (function): Callback with result

**Implementation Notes**:
- Query `video_views` table
- Group by `video_id`, count views in period
- Join with `video_recording` table
- Order by view count DESC

---

#### `getNewPublicClassrooms(token, limit, callback)`
**Purpose**: Get recently created public classrooms
**Parameters**:
- `token` (string): User authentication token
- `limit` (int): Number of classrooms (default: 10)
- `callback` (function): Callback with result

**Implementation Notes**:
- Query `classroom` where `is_public = 1`, ordered by `create_time DESC`

---

### Statistics

#### `getCommunityStats(token, callback)`
**Purpose**: Get community-wide statistics
**Parameters**:
- `token` (string): User authentication token
- `callback` (function): Callback with result

**Returns**:
```json
{
  "totalMembers": 1250,
  "totalVideos": 5000,
  "totalClassrooms": 150,
  "activeUsersThisWeek": 350
}
```

---

## 📊 PHASE 3: Advanced Features (Low Priority)

### Collaboration APIs

#### `getOpenCollaborationProjects(token, status, limit, callback)`
**Purpose**: Get open collaboration projects
**Parameters**:
- `token` (string): User authentication token
- `status` (string): 'active', 'completed', 'all' (default: 'active')
- `limit` (int): Number of projects (default: 10)
- `callback` (function): Callback with result

**Returns**:
```json
{
  "projects": [
    {
      "id": 123,
      "title": "ASL Medical Terms Model",
      "description": "Creating a comprehensive model for medical sign language",
      "creator": {
        "id": 456,
        "name": "Dr. Smith",
        "avatar": "url"
      },
      "skillsNeeded": ["ASL Expert", "Model Training", "Video Creation"],
      "currentContributors": 3,
      "maxContributors": 5,
      "status": "active",
      "createdDate": "2024-01-10",
      "deadline": "2024-02-15"
    }
  ]
}
```

---

#### `createCollaborationProject(token, title, description, skillsNeeded, maxContributors, deadline, callback)`
**Purpose**: Create a collaboration project
**Parameters**:
- `token` (string): User authentication token
- `title` (string): Project title
- `description` (string): Project description
- `skillsNeeded` (list): Array of required skills
- `maxContributors` (int): Maximum number of contributors
- `deadline` (string): Deadline date (optional)
- `callback` (function): Callback with result

---

#### `requestCollaboration(token, projectId, message, callback)`
**Purpose**: Request to join a collaboration project
**Parameters**:
- `token` (string): User authentication token
- `projectId` (int): Project ID
- `message` (string): Optional message
- `callback` (function): Callback with result

---

#### `getUserCollaborationRequests(token, callback)`
**Purpose**: Get user's collaboration requests (sent and received)
**Parameters**:
- `token` (string): User authentication token
- `callback` (function): Callback with result

---

#### `acceptCollaborationRequest(token, requestId, callback)`
**Purpose**: Accept a collaboration request
**Parameters**:
- `token` (string): User authentication token
- `requestId` (int): Request ID
- `callback` (function): Callback with result

---

#### `declineCollaborationRequest(token, requestId, callback)`
**Purpose**: Decline a collaboration request
**Parameters**:
- `token` (string): User authentication token
- `requestId` (int): Request ID
- `callback` (function): Callback with result

---

### Search

#### `globalSearch(token, query, filters, limit, callback)`
**Purpose**: Global search across all content types
**Parameters**:
- `token` (string): User authentication token
- `query` (string): Search query
- `filters` (dict): Filters by type (e.g., {"type": "videos", "type": "classrooms"})
- `limit` (int): Number of results (default: 20)
- `callback` (function): Callback with result

---

### Preferences

#### `getUserAccessibilityPreferences(token, callback)`
**Purpose**: Get user accessibility preferences
**Parameters**:
- `token` (string): User authentication token
- `callback` (function): Callback with result

**Returns**:
```json
{
  "highContrast": false,
  "fontSize": "medium",
  "reducedMotion": false,
  "colorBlindMode": "none"
}
```

---

#### `saveUserAccessibilityPreferences(token, preferences, callback)`
**Purpose**: Save user accessibility preferences
**Parameters**:
- `token` (string): User authentication token
- `preferences` (dict): Preferences object
- `callback` (function): Callback with result

---

#### `getDashboardLayout(token, callback)`
**Purpose**: Get user's dashboard layout configuration
**Parameters**:
- `token` (string): User authentication token
- `callback` (function): Callback with result

---

#### `saveDashboardLayout(token, layoutConfig, callback)`
**Purpose**: Save user's dashboard layout configuration
**Parameters**:
- `token` (string): User authentication token
- `layoutConfig` (dict): Layout configuration JSON
- `callback` (function): Callback with result

---

## 🔔 Event Triggers (Background/Event Handlers)

These functions should be called automatically when events occur:

### Activity Generation

#### `createActivity(userId, type, title, description, actorId, targetType, targetId, actionUrl, metadata)`
**Purpose**: Create an activity entry (called internally when events occur)
**When to call**:
- When video is created → `type='video_created'`
- When user joins classroom → `type='classroom_joined'`
- When course is completed → `type='course_completed'`
- When model is trained → `type='model_trained'`
- When video added to classroom → `type='classroom_update'`

---

### Notification Generation

#### `createNotification(userId, type, title, message, actionUrl, actionData)`
**Purpose**: Create a notification (called internally when events occur)
**When to call**:
- When classroom access is requested → notify classroom owner
- When collaboration request is made → notify project creator
- When course is completed → notify user
- When badge is earned → notify user

---

## 📝 Implementation Priority Summary

### Must Have (Phase 1 - MVP):
1. ✅ `getUserDashboardStats`
2. ✅ `getUserActivityFeed`
3. ✅ `markActivityAsRead`
4. ✅ `getUserNotifications`
5. ✅ `markNotificationAsRead`
6. ✅ `markAllNotificationsAsRead`
7. ✅ `getUserLearningProgress`
8. ✅ `getUserActiveClassrooms` (enhance existing)
9. ✅ `getUserRecentVideos` (enhance existing)

### Should Have (Phase 2):
10. `getCommunityActivityFeed`
11. `getClassroomActivity`
12. `getFeaturedClassrooms`
13. `getPopularVideos`
14. `getNewPublicClassrooms`
15. `getCommunityStats`

### Nice to Have (Phase 3):
16. `getOpenCollaborationProjects`
17. `createCollaborationProject`
18. `requestCollaboration`
19. `getUserCollaborationRequests`
20. `acceptCollaborationRequest`
21. `declineCollaborationRequest`
22. `globalSearch`
23. `getUserAccessibilityPreferences`
24. `saveUserAccessibilityPreferences`
25. `getDashboardLayout`
26. `saveDashboardLayout`

---

## 🔧 Helper Functions (Internal)

These should be implemented as internal functions (not exposed via remotepy):

- `createActivity()` - Called when events occur
- `createNotification()` - Called when events occur
- Background jobs for:
  - Updating learning streaks (daily)
  - Updating classroom activity counts (daily)
  - Calculating popular content (daily)

---

## 📋 Notes for Backend Developer

1. **Authentication**: All functions should validate the `token` parameter
2. **Error Handling**: Return appropriate error messages in callback
3. **Database**: Use the new tables created in `database_schema_mysql.sql`
4. **Performance**: Use indexes for queries, implement pagination
5. **Caching**: Consider caching frequently accessed data (stats, popular content)
6. **Real-time**: Consider WebSocket for real-time notifications (optional)

---

## Example Implementation Pattern

```python
def getUserDashboardStats(token, callback):
    try:
        # Validate token and get user
        user = validate_token(token)
        if not user:
            callback({"error": "Invalid token"})
            return
        
        # Query database
        stats = {
            "activeClassrooms": get_active_classrooms_count(user.id),
            "myCourses": get_courses_count(user.id),
            "videosCreated": get_videos_count(user.id),
            "communityContributions": get_contributions_count(user.id),
            "modelsTrained": get_models_count(user.id)
        }
        
        callback(stats)
    except Exception as e:
        callback({"error": str(e)})
```

---

## Database Tables Reference

All functions use these new tables:
- `activities`
- `activity_reads`
- `notifications`
- `collaboration_projects`
- `collaboration_requests`
- `collaboration_project_contributors`
- `user_badges`
- `user_skills`
- `dashboard_layouts`
- `user_accessibility_preferences`
- `video_views`
- `classroom_access_logs`

Plus modifications to:
- `classroom` (added: member_count, recent_activity_count, last_activity_at)
- `alpharithmic.user` (added: learning_streak, last_activity_date, total_contributions)

