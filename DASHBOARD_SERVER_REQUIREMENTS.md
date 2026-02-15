# Dashboard Server-Side Requirements - Quick Reference

## Summary
This document provides a quick reference for all server-side APIs and database changes needed to support the Deaf Community Collaboration Dashboard.

---

## API Endpoints Required

### Activity & Feed APIs
| Endpoint | Method | Description | Priority |
|----------|--------|-------------|----------|
| `/api/dashboard/activity-feed` | GET | Get user's personalized activity feed | High |
| `/api/dashboard/community-activity` | GET | Get community-wide activity feed | Medium |
| `/api/dashboard/classroom-activity/:classroomId` | GET | Get classroom-specific activity | Medium |
| `/api/dashboard/activity/:activityId/read` | POST | Mark activity as read | High |

### Statistics APIs
| Endpoint | Method | Description | Priority |
|----------|--------|-------------|----------|
| `/api/dashboard/stats` | GET | Get user dashboard statistics | High |
| `/api/dashboard/learning-progress` | GET | Get user learning progress | High |
| `/api/dashboard/course-progress` | GET | Get user course progress | High |
| `/api/dashboard/learning-streak` | GET | Get user learning streak | Medium |
| `/api/dashboard/badges` | GET | Get user badges/achievements | Medium |
| `/api/dashboard/video-stats` | GET | Get user video statistics | Medium |
| `/api/dashboard/community-stats` | GET | Get community-wide statistics | Low |
| `/api/dashboard/personal-stats` | GET | Get user personal statistics | High |

### Collaboration APIs
| Endpoint | Method | Description | Priority |
|----------|--------|-------------|----------|
| `/api/collaboration/projects` | GET | Get open collaboration projects | Medium |
| `/api/collaboration/projects` | POST | Create collaboration project | Medium |
| `/api/collaboration/projects/:projectId/request` | POST | Request to join project | Medium |
| `/api/collaboration/requests` | GET | Get user's collaboration requests | Medium |
| `/api/collaboration/requests/:requestId/accept` | POST | Accept collaboration request | Medium |
| `/api/collaboration/requests/:requestId/decline` | POST | Decline collaboration request | Medium |
| `/api/collaboration/matches` | GET | Find matching collaborators | Low |
| `/api/collaboration/skills` | GET | Get user skills | Medium |

### Notification APIs
| Endpoint | Method | Description | Priority |
|----------|--------|-------------|----------|
| `/api/notifications` | GET | Get user notifications | High |
| `/api/notifications/:notificationId/read` | POST | Mark notification as read | High |
| `/api/notifications/read-all` | POST | Mark all notifications as read | High |
| `/api/notifications/:notificationId` | DELETE | Delete notification | Medium |

### Discovery APIs
| Endpoint | Method | Description | Priority |
|----------|--------|-------------|----------|
| `/api/discovery/featured-classrooms` | GET | Get featured classrooms | Medium |
| `/api/discovery/popular-videos` | GET | Get popular videos | Medium |
| `/api/discovery/top-contributors` | GET | Get top contributors | Low |
| `/api/discovery/collaboration-opportunities` | GET | Get collaboration opportunities | Medium |
| `/api/discovery/new-classrooms` | GET | Get new public classrooms | Medium |
| `/api/discovery/recent-videos` | GET | Get recent videos | High |
| `/api/search` | GET | Global search | Medium |
| `/api/search/suggestions` | GET | Get search suggestions | Low |

### Preferences APIs
| Endpoint | Method | Description | Priority |
|----------|--------|-------------|----------|
| `/api/preferences/accessibility` | GET/POST | Get/save accessibility preferences | Low |
| `/api/preferences/dashboard-layout` | GET/POST | Get/save dashboard layout | Low |

---

## API Request/Response Examples

### Get User Dashboard Stats
**Request:**
```
GET /api/dashboard/stats
Headers: { Authorization: Bearer <token> }
```

**Response:**
```json
{
  "activeClassrooms": 5,
  "myCourses": 8,
  "videosCreated": 45,
  "communityContributions": 12,
  "modelsTrained": 7
}
```

### Get Activity Feed
**Request:**
```
GET /api/dashboard/activity-feed?limit=20&offset=0
Headers: { Authorization: Bearer <token> }
```

**Response:**
```json
{
  "activities": [
    {
      "id": "activity_123",
      "type": "classroom_update",
      "title": "New video added",
      "description": "John added 'Introduction to ASL' to Classroom ABC",
      "timestamp": "2024-01-15T10:30:00Z",
      "actor": {
        "id": "user_456",
        "name": "John Doe",
        "avatar": "https://..."
      },
      "target": {
        "type": "classroom",
        "id": "classroom_789",
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

### Get Learning Progress
**Request:**
```
GET /api/dashboard/learning-progress
Headers: { Authorization: Bearer <token> }
```

**Response:**
```json
{
  "coursesInProgress": [
    {
      "courseId": "course_123",
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
      "id": "badge_1",
      "name": "First Video",
      "icon": "https://...",
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

### Get Notifications
**Request:**
```
GET /api/notifications?unreadOnly=true
Headers: { Authorization: Bearer <token> }
```

**Response:**
```json
{
  "notifications": [
    {
      "id": "notif_123",
      "type": "classroom_request",
      "title": "New classroom access request",
      "message": "Jane Doe requested to join 'ASL Learning Group'",
      "timestamp": "2024-01-15T09:00:00Z",
      "read": false,
      "actionUrl": "/classroom/789/requests",
      "actionData": {
        "classroomId": "classroom_789",
        "userId": "user_456",
        "requestId": "request_123"
      }
    }
  ],
  "unreadCount": 5
}
```

### Get Collaboration Projects
**Request:**
```
GET /api/collaboration/projects?status=active&limit=10
Headers: { Authorization: Bearer <token> }
```

**Response:**
```json
{
  "projects": [
    {
      "id": "project_123",
      "title": "ASL Medical Terms Model",
      "description": "Creating a comprehensive model for medical sign language",
      "creator": {
        "id": "user_456",
        "name": "Dr. Smith",
        "avatar": "https://..."
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

## Database Schema Changes

### New Tables

#### 1. activities
```sql
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR(50) NOT NULL, -- 'classroom_update', 'course_progress', 'community_activity', etc.
    title VARCHAR(255) NOT NULL,
    description TEXT,
    actor_id INTEGER REFERENCES users(id),
    target_type VARCHAR(50), -- 'classroom', 'course', 'video', etc.
    target_id INTEGER,
    action_url VARCHAR(500),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB, -- Additional flexible data
    INDEX idx_user_timestamp (user_id, timestamp),
    INDEX idx_type_timestamp (type, timestamp)
);
```

#### 2. activity_reads
```sql
CREATE TABLE activity_reads (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER REFERENCES activities(id),
    user_id INTEGER REFERENCES users(id),
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(activity_id, user_id),
    INDEX idx_user_read (user_id, read_at)
);
```

#### 3. notifications
```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR(50) NOT NULL, -- 'classroom_request', 'collaboration_invite', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT,
    action_url VARCHAR(500),
    action_data JSONB,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_unread (user_id, read, created_at)
);
```

#### 4. collaboration_projects
```sql
CREATE TABLE collaboration_projects (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    skills_needed TEXT[], -- Array of required skills
    max_contributors INTEGER DEFAULT 10,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'cancelled'
    deadline DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status_created (status, created_at)
);
```

#### 5. collaboration_requests
```sql
CREATE TABLE collaboration_requests (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES collaboration_projects(id),
    requester_id INTEGER REFERENCES users(id),
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP,
    INDEX idx_project_status (project_id, status),
    INDEX idx_requester (requester_id)
);
```

#### 6. collaboration_project_contributors
```sql
CREATE TABLE collaboration_project_contributors (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES collaboration_projects(id),
    user_id INTEGER REFERENCES users(id),
    role VARCHAR(50) DEFAULT 'contributor', -- 'contributor', 'co-lead'
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id),
    INDEX idx_user_projects (user_id)
);
```

#### 7. user_badges
```sql
CREATE TABLE user_badges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    badge_id VARCHAR(100) NOT NULL, -- 'first_video', 'course_complete', etc.
    badge_name VARCHAR(255) NOT NULL,
    badge_icon VARCHAR(500),
    earned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    INDEX idx_user_badges (user_id, earned_date)
);
```

#### 8. user_skills
```sql
CREATE TABLE user_skills (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    skill_name VARCHAR(100) NOT NULL, -- 'ASL Expert', 'Video Creation', etc.
    skill_level VARCHAR(50), -- 'beginner', 'intermediate', 'expert'
    verified BOOLEAN DEFAULT FALSE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_skills (user_id),
    INDEX idx_skill_name (skill_name)
);
```

#### 9. dashboard_layouts
```sql
CREATE TABLE dashboard_layouts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    layout_config JSONB NOT NULL, -- Widget positions, visibility, sizes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);
```

#### 10. user_accessibility_preferences
```sql
CREATE TABLE user_accessibility_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    high_contrast BOOLEAN DEFAULT FALSE,
    font_size VARCHAR(20) DEFAULT 'medium', -- 'small', 'medium', 'large', 'xlarge'
    reduced_motion BOOLEAN DEFAULT FALSE,
    color_blind_mode VARCHAR(50), -- 'none', 'protanopia', 'deuteranopia', etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);
```

#### 11. video_views
```sql
CREATE TABLE video_views (
    id SERIAL PRIMARY KEY,
    video_id INTEGER REFERENCES videos(id),
    user_id INTEGER REFERENCES users(id),
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    view_duration INTEGER, -- seconds
    INDEX idx_video_views (video_id, viewed_at),
    INDEX idx_user_views (user_id, viewed_at)
);
```

#### 12. classroom_access_logs
```sql
CREATE TABLE classroom_access_logs (
    id SERIAL PRIMARY KEY,
    classroom_id INTEGER REFERENCES classrooms(id),
    user_id INTEGER REFERENCES users(id),
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_classroom_user (classroom_id, user_id, accessed_at),
    INDEX idx_user_recent (user_id, accessed_at)
);
```

### Table Modifications

#### classrooms
```sql
ALTER TABLE classrooms ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0;
ALTER TABLE classrooms ADD COLUMN IF NOT EXISTS recent_activity_count INTEGER DEFAULT 0;
ALTER TABLE classrooms ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP;

-- Create index for sorting by activity
CREATE INDEX IF NOT EXISTS idx_classrooms_activity ON classrooms(recent_activity_count DESC, last_activity_at DESC);
```

#### users
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS learning_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_contributions INTEGER DEFAULT 0;
```

---

## Background Jobs / Scheduled Tasks

### Daily Jobs
1. **Update Learning Streaks**: Calculate and update user learning streaks
2. **Update Community Stats**: Recalculate community-wide statistics
3. **Update Classroom Activity Counts**: Recalculate recent activity for classrooms
4. **Generate Activity Feed**: Create activity entries for significant events
5. **Update Popular Content**: Calculate trending videos, classrooms, etc.

### Real-time Events (WebSocket)
- New activity created → Broadcast to relevant users
- New notification created → Push to user
- Classroom activity → Broadcast to classroom members
- Collaboration request → Push to project creator

---

## Caching Strategy

### Cache Keys
- `dashboard:stats:{userId}` - User dashboard stats (TTL: 5 minutes)
- `dashboard:activity:{userId}` - User activity feed (TTL: 2 minutes)
- `community:stats` - Community statistics (TTL: 15 minutes)
- `popular:videos:{period}` - Popular videos (TTL: 1 hour)
- `featured:classrooms` - Featured classrooms (TTL: 30 minutes)

### Cache Invalidation
- Invalidate user stats cache when:
  - User creates video
  - User joins/leaves classroom
  - User completes course
  - User trains model
- Invalidate community stats cache when:
  - New user signs up
  - New classroom created
  - New video published

---

## Performance Considerations

### Database Indexing
- All foreign keys should be indexed
- All timestamp columns used in queries should be indexed
- Composite indexes for common query patterns

### Query Optimization
- Use pagination for all list endpoints
- Limit default result sets (e.g., 20 items)
- Use database views for complex queries
- Consider materialized views for expensive aggregations

### API Response Times
- Target: < 200ms for simple queries
- Target: < 500ms for complex aggregations
- Use async processing for expensive operations

---

## Security Considerations

### Authentication
- All endpoints require valid JWT token
- User can only access their own data
- Validate user permissions for collaboration features

### Authorization
- Check user permissions before allowing actions
- Validate ownership before modifying resources
- Rate limiting on all endpoints

### Data Privacy
- Don't expose sensitive user information
- Respect user privacy settings
- Filter activities based on user visibility preferences

---

## Testing Requirements

### Unit Tests
- Test all API endpoints
- Test database queries
- Test business logic

### Integration Tests
- Test API with database
- Test authentication/authorization
- Test caching behavior

### Performance Tests
- Load testing for high-traffic endpoints
- Database query performance
- Cache hit rates

---

## Deployment Checklist

- [ ] Database migrations run
- [ ] Indexes created
- [ ] Background jobs configured
- [ ] Caching configured
- [ ] WebSocket server running (if implemented)
- [ ] API endpoints documented
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Monitoring set up

---

## Priority Implementation Order

### Phase 1 (MVP)
1. Statistics APIs (dashboard stats, learning progress)
2. Activity Feed API (basic)
3. Notification API (basic)
4. Enhance existing classroom API with activity metrics

### Phase 2
5. Discovery APIs (featured, popular content)
6. Collaboration APIs (basic)
7. Search API

### Phase 3
8. Advanced collaboration features
9. Real-time updates (WebSocket)
10. Personalization APIs

