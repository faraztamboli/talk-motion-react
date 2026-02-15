# Deaf Community Collaboration Dashboard - Specification Document

## Overview
This document outlines the features and requirements for an interactive home page dashboard designed specifically for the Deaf community to collaborate, learn, and connect on the TalkMotion platform.

## Dashboard Goals
1. **Foster Collaboration**: Enable easy discovery and participation in community activities
2. **Quick Access**: Provide fast access to most-used features
3. **Community Engagement**: Showcase community activity and opportunities
4. **Learning Progress**: Track and display user's learning journey
5. **Accessibility First**: Ensure all features are fully accessible for Deaf users

---

## Dashboard Layout Structure

### 1. Header Section
**Purpose**: Quick stats and welcome message

**Components**:
- Welcome message with user's name
- Quick stats cards (4 cards in a row):
  - Active Classrooms (count)
  - My Courses (count)
  - Videos Created (count)
  - Community Contributions (count)

**Server Requirements**: 
- ✅ **Available**: User profile API, classroom count API
- ❌ **Needs Implementation**: 
  - `getUserDashboardStats(userId)` - Returns counts for all stats
  - `getUserVideoCount(userId)` - Returns total videos created
  - `getUserContributionsCount(userId)` - Returns contributions (models, videos shared, etc.)

---

### 2. Quick Actions Panel
**Purpose**: One-click access to most common actions

**Components**:
- Large, accessible buttons with icons:
  - 🎥 **Start Recording** → `/video-subtitles/designer`
  - 📚 **Browse Classrooms** → `/classrooms`
  - 🎓 **My Courses** → `/courses`
  - 🔄 **Voice to Gesture** → `/converter`
  - 📤 **Upload Video** → `/trainer/upload`
  - 👥 **Find Collaborators** → New feature (see below)

**Server Requirements**: 
- ✅ **Available**: All routes exist
- ❌ **Needs Implementation**: None (all are navigation)

---

### 3. Recent Activity Feed
**Purpose**: Show what's happening in the community and user's activities

**Components**:
- Scrollable activity feed with cards showing:
  - **Classroom Updates**: New videos added, new members joined
  - **Course Progress**: Courses completed, new lessons available
  - **Community Activity**: Popular videos, trending classrooms
  - **Collaboration Requests**: Requests to join classrooms, model training invites
  - **Achievements**: Badges earned, milestones reached

**Activity Types**:
1. **Classroom Activity**
   - "New video added to [Classroom Name]"
   - "[User] joined [Classroom Name]"
   - "[User] shared a video in [Classroom Name]"

2. **Course Activity**
   - "You completed [Course Name]"
   - "New lesson available in [Course Name]"
   - "[User] completed [Course Name]"

3. **Community Activity**
   - "Trending: [Video Title] has 50+ views"
   - "Popular: [Classroom Name] has 20+ members"
   - "New: [User] created a public classroom"

4. **Collaboration**
   - "[User] requested to join your classroom"
   - "[User] invited you to collaborate on [Model Name]"
   - "You have 3 pending classroom requests"

**Server Requirements**:
- ❌ **Needs Implementation**:
  - `getUserActivityFeed(userId, limit, offset)` - Returns personalized activity feed
  - `getCommunityActivityFeed(limit, offset)` - Returns public community activities
  - `getClassroomActivity(classroomId, limit)` - Returns activity for specific classroom
  - `getPendingCollaborationRequests(userId)` - Returns pending requests
  - `markActivityAsRead(activityId)` - Mark activity as read

**Data Structure**:
```json
{
  "id": "activity_123",
  "type": "classroom_update",
  "title": "New video added",
  "description": "John added 'Introduction to ASL' to Classroom ABC",
  "timestamp": "2024-01-15T10:30:00Z",
  "actor": {
    "id": "user_456",
    "name": "John Doe",
    "avatar": "url"
  },
  "target": {
    "type": "classroom",
    "id": "classroom_789",
    "name": "ASL Learning Group"
  },
  "actionUrl": "/classroom/789",
  "read": false
}
```

---

### 4. My Active Classrooms Widget
**Purpose**: Quick access to classrooms user is actively participating in

**Components**:
- Grid of classroom cards (3-4 per row)
- Each card shows:
  - Classroom thumbnail/icon
  - Classroom name
  - Member count
  - Recent activity indicator (e.g., "2 new videos")
  - Last accessed time
  - Quick action: "Open" button

**Server Requirements**:
- ✅ **Available**: `getStudentsClassrooms()`, `getStaffClassrooms()`
- ❌ **Needs Enhancement**:
  - Add `lastAccessed` timestamp to classroom response
  - Add `recentActivityCount` (new videos/posts since last visit)
  - Add `memberCount` to classroom object
  - `getUserActiveClassrooms(userId, limit)` - Returns classrooms sorted by activity/recency

---

### 5. Learning Progress Widget
**Purpose**: Visual representation of user's learning journey

**Components**:
- Progress bars/charts showing:
  - **Courses in Progress**: List of courses with completion percentage
  - **Videos Created**: Total count with trend (this week vs last week)
  - **Models Trained**: Count of models user has trained
  - **Skills Acquired**: Badges or skills earned
  - **Learning Streak**: Days of consecutive activity

**Server Requirements**:
- ❌ **Needs Implementation**:
  - `getUserLearningProgress(userId)` - Returns learning statistics
  - `getUserCourseProgress(userId)` - Returns course completion data
  - `getUserLearningStreak(userId)` - Returns consecutive days of activity
  - `getUserBadges(userId)` - Returns earned badges/achievements
  - `getUserVideoStats(userId, period)` - Returns video creation stats over time

**Data Structure**:
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
      "icon": "url",
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

---

### 6. Community Spotlight
**Purpose**: Highlight community achievements and opportunities

**Components**:
- **Featured Classrooms**: Public classrooms with high engagement
- **Popular Videos**: Most viewed/shared videos this week
- **Community Contributors**: Top contributors this month
- **New Public Classrooms**: Recently created public classrooms
- **Collaboration Opportunities**: Open projects seeking contributors

**Server Requirements**:
- ❌ **Needs Implementation**:
  - `getFeaturedClassrooms(limit)` - Returns featured/public classrooms
  - `getPopularVideos(period, limit)` - Returns trending videos
  - `getTopContributors(period, limit)` - Returns top community contributors
  - `getCollaborationOpportunities(limit)` - Returns open collaboration projects
  - `getNewPublicClassrooms(limit)` - Returns recently created public classrooms

---

### 7. Notifications Panel
**Purpose**: Important updates and alerts

**Components**:
- Notification bell icon with badge count
- Dropdown panel showing:
  - Classroom access requests (approve/deny)
  - Collaboration invitations
  - Course completion notifications
  - System announcements
  - Comments/reactions on user's content

**Server Requirements**:
- ❌ **Needs Implementation**:
  - `getUserNotifications(userId, unreadOnly)` - Returns user notifications
  - `markNotificationAsRead(notificationId)` - Mark as read
  - `markAllNotificationsAsRead(userId)` - Mark all as read
  - `deleteNotification(notificationId)` - Delete notification
  - **Real-time updates**: WebSocket or polling for new notifications

**Data Structure**:
```json
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
```

---

### 8. Quick Stats & Insights
**Purpose**: At-a-glance community and personal metrics

**Components**:
- **Personal Stats**:
  - Total videos created
  - Total models trained
  - Courses completed
  - Classrooms joined/created
  
- **Community Stats**:
  - Total community members
  - Total videos in library
  - Total classrooms
  - Active users this week

**Server Requirements**:
- ❌ **Needs Implementation**:
  - `getCommunityStats()` - Returns overall community statistics
  - `getUserPersonalStats(userId)` - Returns user's personal statistics

---

### 9. Collaboration Hub
**Purpose**: Find and join collaboration opportunities

**Components**:
- **Open Projects**: Projects seeking contributors
  - Model training projects
  - Video creation projects
  - Course development projects
  
- **Skill Matching**: Match users based on:
  - Sign language expertise
  - Video creation skills
  - Model training experience
  - Course creation experience

- **Collaboration Requests**: 
  - Send collaboration requests
  - Accept/decline incoming requests
  - Manage active collaborations

**Server Requirements**:
- ❌ **Needs Implementation**:
  - `getOpenCollaborationProjects(filters)` - Returns open projects
  - `createCollaborationProject(projectData)` - Create new collaboration project
  - `requestCollaboration(projectId, userId, message)` - Request to join project
  - `getUserCollaborationRequests(userId)` - Get user's collaboration requests
  - `acceptCollaborationRequest(requestId)` - Accept collaboration
  - `declineCollaborationRequest(requestId)` - Decline collaboration
  - `findCollaborationMatches(userId, criteria)` - Find matching collaborators
  - `getUserSkills(userId)` - Get user's skills/expertise tags

**Data Structure**:
```json
{
  "id": "project_123",
  "title": "ASL Medical Terms Model",
  "description": "Creating a comprehensive model for medical sign language",
  "creator": {
    "id": "user_456",
    "name": "Dr. Smith"
  },
  "skillsNeeded": ["ASL Expert", "Model Training", "Video Creation"],
  "currentContributors": 3,
  "maxContributors": 5,
  "status": "active",
  "createdDate": "2024-01-10",
  "deadline": "2024-02-15"
}
```

---

### 10. Recent Videos Widget
**Purpose**: Quick access to recently created/viewed videos

**Components**:
- Horizontal scrollable list of video thumbnails
- Each video shows:
  - Thumbnail
  - Title
  - Creator name
  - View count
  - Created date
  - Quick play button

**Server Requirements**:
- ✅ **Available**: Video library APIs exist
- ❌ **Needs Enhancement**:
  - `getUserRecentVideos(userId, limit)` - Returns user's recently created videos
  - `getRecentlyViewedVideos(userId, limit)` - Returns recently viewed videos
  - `getCommunityRecentVideos(limit)` - Returns recently added community videos

---

## Additional Features

### 11. Search & Discovery
**Purpose**: Quick search across all content

**Components**:
- Global search bar in header
- Search suggestions as user types
- Quick filters:
  - Classrooms
  - Videos
  - Courses
  - Users
  - Models

**Server Requirements**:
- ❌ **Needs Implementation**:
  - `globalSearch(query, filters, limit)` - Unified search across all content types
  - `getSearchSuggestions(query)` - Returns search suggestions

---

### 12. Accessibility Features
**Purpose**: Ensure full accessibility for Deaf users

**Components**:
- **Visual Indicators**: All actions have clear visual feedback
- **Text Alternatives**: All icons have text labels
- **Keyboard Navigation**: Full keyboard accessibility
- **High Contrast Mode**: Option for high contrast display
- **Font Size Controls**: Adjustable text size
- **No Audio Dependencies**: All features work without audio
- **Video Captions**: All videos have captions/subtitles
- **Sign Language Support**: Option to view content in sign language

**Server Requirements**:
- ✅ **Available**: Most features are visual
- ❌ **Needs Implementation**:
  - User preference storage for accessibility settings
  - `saveUserAccessibilityPreferences(userId, preferences)` - Save user preferences

---

### 13. Personalization
**Purpose**: Customize dashboard to user's preferences

**Components**:
- Drag-and-drop widget reordering
- Show/hide widgets
- Customize widget sizes
- Set default view (grid/list)
- Save dashboard layout preferences

**Server Requirements**:
- ❌ **Needs Implementation**:
  - `saveDashboardLayout(userId, layout)` - Save user's dashboard layout
  - `getDashboardLayout(userId)` - Retrieve user's saved layout

---

## Server-Side API Summary

### New APIs Required

#### Activity & Feed APIs
1. `getUserActivityFeed(userId, limit, offset)` - User's activity feed
2. `getCommunityActivityFeed(limit, offset)` - Community-wide activity
3. `getClassroomActivity(classroomId, limit)` - Classroom-specific activity
4. `markActivityAsRead(activityId)` - Mark activity as read

#### Statistics APIs
5. `getUserDashboardStats(userId)` - User dashboard statistics
6. `getUserVideoCount(userId)` - User's video count
7. `getUserContributionsCount(userId)` - User's contribution count
8. `getUserLearningProgress(userId)` - Learning progress data
9. `getUserCourseProgress(userId)` - Course progress
10. `getUserLearningStreak(userId)` - Learning streak
11. `getUserBadges(userId)` - Earned badges
12. `getUserVideoStats(userId, period)` - Video statistics
13. `getCommunityStats()` - Community-wide statistics
14. `getUserPersonalStats(userId)` - Personal statistics

#### Collaboration APIs
15. `getOpenCollaborationProjects(filters)` - Open collaboration projects
16. `createCollaborationProject(projectData)` - Create collaboration project
17. `requestCollaboration(projectId, userId, message)` - Request collaboration
18. `getUserCollaborationRequests(userId)` - User's collaboration requests
19. `acceptCollaborationRequest(requestId)` - Accept request
20. `declineCollaborationRequest(requestId)` - Decline request
21. `findCollaborationMatches(userId, criteria)` - Find matching collaborators
22. `getUserSkills(userId)` - User skills/expertise

#### Notification APIs
23. `getUserNotifications(userId, unreadOnly)` - User notifications
24. `markNotificationAsRead(notificationId)` - Mark notification read
25. `markAllNotificationsAsRead(userId)` - Mark all as read
26. `deleteNotification(notificationId)` - Delete notification

#### Discovery APIs
27. `getFeaturedClassrooms(limit)` - Featured classrooms
28. `getPopularVideos(period, limit)` - Popular videos
29. `getTopContributors(period, limit)` - Top contributors
30. `getCollaborationOpportunities(limit)` - Collaboration opportunities
31. `getNewPublicClassrooms(limit)` - New public classrooms
32. `getUserRecentVideos(userId, limit)` - User's recent videos
33. `getRecentlyViewedVideos(userId, limit)` - Recently viewed videos
34. `getCommunityRecentVideos(limit)` - Community recent videos
35. `globalSearch(query, filters, limit)` - Global search
36. `getSearchSuggestions(query)` - Search suggestions

#### Enhancement APIs (Modify Existing)
37. Enhance `getStudentsClassrooms()` to include:
   - `lastAccessed` timestamp
   - `recentActivityCount`
   - `memberCount`
38. Enhance classroom objects to include activity metrics

#### Preferences APIs
39. `saveUserAccessibilityPreferences(userId, preferences)` - Save accessibility preferences
40. `saveDashboardLayout(userId, layout)` - Save dashboard layout
41. `getDashboardLayout(userId)` - Get saved layout

---

## Real-Time Features

### WebSocket Events (Optional but Recommended)
- New activity notifications
- Real-time collaboration updates
- Live classroom activity
- New notification alerts

**Server Requirements**:
- WebSocket server implementation
- Event broadcasting system
- User connection management

---

## Database Schema Additions

### New Tables Needed

1. **activities** - Store activity feed items
2. **notifications** - Store user notifications
3. **collaboration_projects** - Store collaboration projects
4. **collaboration_requests** - Store collaboration requests
5. **user_badges** - Store user achievements/badges
6. **user_skills** - Store user skills/expertise
7. **dashboard_layouts** - Store user dashboard preferences
8. **user_accessibility_preferences** - Store accessibility settings
9. **activity_reads** - Track which activities user has read
10. **video_views** - Track video views for statistics

### Table Modifications

1. **classrooms** - Add:
   - `last_accessed` (per user, in separate table)
   - `member_count` (cached)
   - `recent_activity_count` (cached)

2. **users** - Add:
   - `learning_streak`
   - `last_activity_date`
   - `total_contributions`

---

## Implementation Priority

### Phase 1 (MVP - High Priority)
1. ✅ Quick Actions Panel (navigation only)
2. ✅ My Active Classrooms Widget (enhance existing API)
3. ✅ Header Stats (basic counts)
4. ✅ Recent Videos Widget (enhance existing API)
5. ⚠️ Recent Activity Feed (needs new APIs)

### Phase 2 (Medium Priority)
6. ⚠️ Learning Progress Widget (needs new APIs)
7. ⚠️ Notifications Panel (needs new APIs)
8. ⚠️ Community Spotlight (needs new APIs)
9. ⚠️ Quick Stats & Insights (needs new APIs)

### Phase 3 (Future Enhancements)
10. ⚠️ Collaboration Hub (needs new APIs)
11. ⚠️ Search & Discovery (needs new APIs)
12. ⚠️ Personalization (needs new APIs)
13. ⚠️ Real-time updates (needs WebSocket)

---

## UI/UX Considerations

### Design Principles
1. **Visual-First**: All information conveyed visually
2. **Clear Hierarchy**: Important information prominently displayed
3. **Consistent Icons**: Use consistent iconography throughout
4. **Color Coding**: Use colors to indicate status/types
5. **Responsive**: Works on desktop, tablet, and mobile
6. **Fast Loading**: Optimize for quick initial load
7. **Progressive Enhancement**: Load critical content first

### Accessibility Checklist
- ✅ All interactive elements keyboard accessible
- ✅ All images have alt text
- ✅ All icons have text labels
- ✅ High contrast mode available
- ✅ Screen reader compatible
- ✅ No audio-only content
- ✅ Clear visual feedback for all actions
- ✅ Focus indicators visible
- ✅ Error messages are clear and visual

---

## Testing Requirements

### Functional Testing
- All widgets load correctly
- Navigation works from all widgets
- Data displays accurately
- Real-time updates work (if implemented)

### Performance Testing
- Dashboard loads in < 2 seconds
- Widgets load progressively
- Smooth scrolling and interactions
- Efficient API calls (batch where possible)

### Accessibility Testing
- Keyboard navigation works
- Screen reader compatibility
- High contrast mode works
- All text is readable

---

## Success Metrics

### User Engagement
- Time spent on dashboard
- Click-through rates from widgets
- Feature usage statistics
- Return user rate

### Community Growth
- New classroom creations
- Collaboration project participation
- Video sharing rates
- Community member growth

---

## Notes

- All timestamps should be in UTC and converted to user's local timezone
- Consider implementing caching for frequently accessed data
- Implement pagination for all lists/feeds
- Add loading states for all async operations
- Implement error handling and retry logic
- Consider implementing offline support for critical features

---

## Next Steps

1. Review and approve this specification
2. Prioritize features for MVP
3. Design mockups for dashboard layout
4. Begin server-side API development
5. Implement frontend components
6. Test and iterate

