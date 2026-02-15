# User Role-Based Navigation System

## Overview

This document describes the role-based navigation system implemented to help different types of users (students, teachers, ASL experts, signers, etc.) easily access the functionality they need in the TalkMotion system.

## User Types Identified

### 1. **Deaf Students**
- Primary users who need to learn and communicate
- Need easy access to educational content and communication tools

### 2. **Teachers**
- Create and manage educational content
- Organize classrooms and courses
- Monitor student progress

### 3. **ASL Experts**
- Train and improve AI models
- Verify sign language accuracy
- Create reference content

### 4. **Signers/Content Creators**
- Create video content with sign language
- Share content with the community
- Manage their video library

### 5. **Parents/Guardians** (Future)
- Monitor student progress
- Access educational resources

### 6. **Administrators** (Future)
- System management
- User management
- Content moderation

## Functionality Classification

### For Deaf Students
- ✅ **Watch Videos** - Access videos with sign language subtitles (`/video-subtitles/library`)
- ✅ **My Videos** - Personal video library (`/video-subtitles/mylibrary`)
- ✅ **My Classrooms** - Join and access classrooms (`/classrooms`)
- ✅ **My Courses** - Study assigned courses (`/courses`)
- ✅ **Translator** - Sign-to-speech and speech-to-sign conversion (`/converter`)

### For Teachers
- ✅ **Create Subtitle Videos** - Record sign language for educational videos (`/video-subtitles/designer`)
- ✅ **Manage Classrooms** - Create and manage classrooms (`/classrooms`)
- ✅ **Create Courses** - Organize content into courses (`/courses`)
- ✅ **My Videos** - Manage created content (`/video-subtitles/mylibrary`)
- ✅ **Translator** - Communication tool (`/converter`)
- ✅ **Staff Rooms** - Collaborate with other staff (`/staff-rooms`)

### For ASL Experts
- ✅ **Train Models** - Train AI models (`/trainer/train`)
- ✅ **Upload Training Data** - Upload gesture videos (`/trainer/upload`)
- ✅ **Collect Data** - Organize training data (`/trainer/collect`)
- ✅ **My Models** - View trained models (`/my-models`)
- ✅ **Training Models** - Monitor training progress (`/models/training-models`)
- ✅ **Create Subtitle Videos** - Create reference videos (`/video-subtitles/designer`)

### For Signers/Content Creators
- ✅ **Create Subtitle Videos** - Record sign language gestures (`/video-subtitles/designer`)
- ✅ **My Video Library** - Manage created content (`/video-subtitles/mylibrary`)
- ✅ **Browse Videos** - Explore community content (`/video-subtitles/library`)
- ✅ **Translator** - Communication tool (`/converter`)

## Implementation Details

### Components Created

1. **`useUserRole` Hook** (`src/hooks/useUserRole.js`)
   - Detects user roles based on:
     - Explicit role selection (stored in localStorage)
     - Classroom participation (student/teacher)
     - Future: Model training activity (ASL expert)
     - Future: Content creation activity (signer)
   - Provides role management functions

2. **Dashboard Component** (`src/pages/Dashboard.jsx`)
   - Welcome page with role-based navigation
   - Two tabs:
     - **Quick Access**: Shows features relevant to selected role
     - **All Features**: Shows all features organized by user type
   - Role selection interface
   - Sidebar hint for expert users

### Navigation Features

1. **Role Selection**
   - Users can select their primary role
   - Role preference is saved in localStorage
   - System auto-detects roles from user activity

2. **Feature Cards**
   - Large, colorful cards with icons
   - Hover effects for better UX
   - Clear descriptions for each feature
   - Direct links to functionality

3. **Sidebar Integration**
   - Dashboard link added to sidebar for expert users
   - Sidebar remains available for quick navigation
   - Hint shown to first-time users about sidebar usage

### Routing Updates

- Dashboard set as default landing page (`/`)
- Dashboard also accessible at `/dashboard`
- All existing routes remain functional

## User Experience Flow

### First-Time Users
1. Land on Dashboard
2. See welcome message and role selection
3. Select their role (or system auto-detects)
4. See personalized feature cards
5. Click cards to access functionality
6. Receive hint about sidebar menu for future use

### Returning Users
1. Land on Dashboard (or use sidebar)
2. See their selected role and relevant features
3. Can switch roles if needed
4. Use either dashboard cards or sidebar for navigation

### Expert Users
1. Use sidebar menu for quick navigation
2. Can still access dashboard if needed
3. Sidebar hint can be dismissed

## Accessibility Features

- All navigation cards are keyboard accessible
- ARIA labels for screen readers
- Clear visual hierarchy
- Color-coded features for easy identification
- Responsive design for mobile devices

## Future Enhancements

1. **Role Permissions**
   - Restrict access based on role
   - Show/hide features based on permissions

2. **Activity-Based Detection**
   - Automatically detect ASL expert role from model training activity
   - Detect signer role from content creation activity

3. **Parent/Guardian Dashboard**
   - Student progress monitoring
   - Resource access
   - Communication tools

4. **Administrator Dashboard**
   - System statistics
   - User management
   - Content moderation tools

5. **Customizable Dashboard**
   - Allow users to pin favorite features
   - Customize card layout
   - Save preferred navigation style

## Technical Notes

- Role preference stored in localStorage with key `userRole`
- Sidebar hint dismissal stored with key `hasSeenSidebarHint`
- All role detection is non-blocking (errors don't prevent access)
- Default role is "student" if no role is detected

## Files Modified/Created

### Created
- `src/hooks/useUserRole.js` - Role detection and management hook
- `src/pages/Dashboard.jsx` - Main dashboard component
- `USER_ROLE_NAVIGATION_SYSTEM.md` - This documentation

### Modified
- `src/routes/AppRoutes.jsx` - Added dashboard route, set as default
- `src/data/sidebarNav.jsx` - Added dashboard link to sidebar

## Usage

Users can now:
1. Access the dashboard at `/` or `/dashboard`
2. Select their role to see personalized features
3. Click feature cards to navigate
4. Use sidebar menu for expert navigation
5. Switch roles anytime from the dashboard

The system provides a user-friendly way for first-time users to discover functionality while maintaining the sidebar menu for expert users who prefer traditional navigation.

