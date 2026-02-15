# Backend Analysis & UI Implementation Plan

## 🔍 Backend Developer's Intent Analysis

### Core Concepts

1. **Hierarchical Folder Structure**
   - Folders can be nested (parent_id)
   - Root folders have `parent_id = null`
   - Recursive structure with children and contents

2. **Multi-Type Content Support**
   - Folders can contain: Models, Video Recordings, Users, Classrooms
   - Each content type has different metadata

3. **Permission System**
   - Folders can be shared with Users or Classrooms
   - Permissions: read, write, delete
   - Owner has full control

4. **Public/Private Folders**
   - Public folders create Stripe products for monetization
   - Private folders are only accessible to owner and those with permissions

5. **Folder Operations**
   - Create/Update (via `saveFolder` with ON DUPLICATE KEY UPDATE)
   - Copy (recursive copy with contents and permissions)
   - Move (change parent_id)
   - Delete content from folders

### Key Discovery: Edit Functionality

**`saveFolder` uses `ON DUPLICATE KEY UPDATE`** - This means:
- If a folder with the same `name` + `parent_id` exists, it **UPDATES** instead of creating
- To edit: Call `saveFolder` with the **same name and parent_id**, and it will update
- **However**, this is not ideal because:
  - User might want to change the name
  - We need the folder ID to ensure we're updating the right folder

**Better approach**: The backend likely has a unique constraint on `(name, parent_id)`, so we need to:
1. Get the current folder's name and parent_id
2. If name changes, we might need to delete and recreate, OR
3. Check if there's a way to pass folder_id (might be in the response or need to be added)

## 🎯 UI Implementation Plan

### 1. Enhanced Course Detail Page
**Current**: Basic view with topics and content
**Enhancement**: Full folder management interface

**Features to Add**:
- ✅ Edit course (using saveFolder with same name+parent_id)
- ✅ Delete course functionality
- ✅ Share/Permissions management
- ✅ Copy/Move folder operations
- ✅ Better content organization
- ✅ Content type filtering
- ✅ Bulk operations

### 2. Folder Permissions UI
**New Component**: Permission management modal
- View current permissions (users/classrooms)
- Add new permissions (user or classroom)
- Set permission levels (read/write/delete)
- Remove permissions

### 3. Enhanced Content Management
**Current**: Basic list
**Enhancement**: 
- Content type tabs/filters
- Drag-and-drop reordering (if supported)
- Bulk actions
- Content preview
- Quick actions per content item

### 4. Folder Operations
- Copy folder (with confirmation)
- Move folder (with folder picker)
- Delete folder (with confirmation and content handling)

### 5. Better Navigation
- Breadcrumb navigation for nested folders
- Folder tree sidebar
- Quick navigation between related folders

## 📋 Implementation Priority

### Phase 1: Core Edit Functionality (HIGH PRIORITY)
1. Fix EditCourseModal to use correct update approach
2. Add Delete Course functionality
3. Test saveFolder update behavior

### Phase 2: Permissions Management (MEDIUM PRIORITY)
1. Create PermissionManagementModal
2. Add permissions section to CourseDetail
3. Implement add/remove permissions

### Phase 3: Advanced Operations (LOW PRIORITY)
1. Copy/Move folder modals
2. Enhanced content management
3. Folder tree navigation

