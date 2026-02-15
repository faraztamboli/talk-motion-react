# Unused Functions Implementation Plan

## Current Status Analysis

### ✅ Already Implemented (But May Need Better Integration)

#### Classroom Access Functions
1. **`requestClassroomAccessAsStudent`** ✅
   - ✅ Hook: `useClassrooms.js`
   - ✅ Component: `RequestClassroomAccess.jsx`
   - ⚠️ **Status**: Component exists but may need better integration

2. **`requestClassroomAccessAsTeacher`** ✅
   - ✅ Hook: `useClassrooms.js`
   - ✅ Component: `RequestClassroomAccess.jsx`
   - ⚠️ **Status**: Component exists but may need better integration

3. **`approveStudentRequestToClass`** ✅
   - ✅ Hook: `useClassrooms.js`
   - ✅ Component: `ApproveClassroomRequest.jsx`
   - ⚠️ **Status**: Component exists but may need better integration

4. **`approveTeacherRequestToClass`** ✅
   - ✅ Hook: `useClassrooms.js`
   - ✅ Component: `ApproveClassroomRequest.jsx`
   - ⚠️ **Status**: Component exists but may need better integration

### ❌ Not Implemented

#### Utility Functions
1. **`addContactUsMessage`** ❌
   - ❌ No hook
   - ❌ No component
   - **Need**: Contact Us page/modal

2. **`languagesSupported`** ❌
   - ❌ No hook
   - ❌ No component
   - **Need**: Language selection/settings

---

## Implementation Plan

### Phase 1: Enhance Classroom Access Features (HIGH PRIORITY)

#### 1.1 Enhanced Classroom Detail Page
**Location**: `src/pages/ClassroomDetail.jsx`

**Features to Add**:
- ✅ **Pending Requests Section**
  - Show pending student/teacher requests
  - Quick approve/reject actions
  - Badge with request count
  - Filter by student/teacher requests

- ✅ **Request Access Button**
  - For students/teachers not in classroom
  - Show request status (pending/approved/rejected)
  - Disable if already requested

- ✅ **Request Management Tab**
  - List all pending requests
  - User info (name, email, role)
  - Approve/Reject buttons
  - Bulk approve/reject

**UI Components Needed**:
1. `PendingRequestsSection.jsx` - Display pending requests
2. `RequestStatusBadge.jsx` - Show request status
3. Enhanced `ClassroomDetail.jsx` - Integrate request management

#### 1.2 Classroom List Enhancements
**Location**: `src/pages/ClassroomsRedesigned.jsx`

**Features to Add**:
- ✅ **Request Access Button** on classroom cards
  - Show for classrooms user is not part of
  - Display request status
  - One-click request access

- ✅ **Request Status Indicator**
  - Badge showing "Requested", "Approved", "Pending"
  - Color-coded status

**UI Components Needed**:
1. Enhanced `ClassroomCard.jsx` - Add request button
2. `RequestStatusIndicator.jsx` - Status badge component

#### 1.3 Staff Dashboard for Request Management
**Location**: `src/pages/StaffRooms.jsx`

**Features to Add**:
- ✅ **Requests Overview Card**
  - Total pending requests
  - Student vs Teacher requests
  - Quick action buttons

- ✅ **Requests Tab**
  - List all requests across all classrooms
  - Filter by classroom, role, status
  - Bulk actions

**UI Components Needed**:
1. `RequestsOverviewCard.jsx` - Dashboard widget
2. `AllRequestsList.jsx` - Comprehensive requests view

---

### Phase 2: Contact Us Feature (MEDIUM PRIORITY)

#### 2.1 Contact Us Page/Modal
**Location**: New page or footer modal

**Features**:
- ✅ **Contact Form**
  - Name, Email, Subject, Message
  - Category selection (Support, Bug Report, Feature Request, etc.)
  - File attachment (optional)
  - Character counter for message

- ✅ **Contact Methods**
  - Email form (uses `addContactUsMessage`)
  - Success confirmation
  - Auto-response message

**UI Components Needed**:
1. `ContactUsModal.jsx` - Modal version
2. `ContactUsPage.jsx` - Full page version
3. Hook: `useContact.js` - For `addContactUsMessage`

**Integration Points**:
- Footer "Contact Us" link
- Help/Support menu
- Error pages (when user needs help)

---

### Phase 3: Language Support Feature (LOW PRIORITY)

#### 3.1 Language Selection
**Location**: Settings or header

**Features**:
- ✅ **Language Dropdown**
  - Fetch supported languages from `languagesSupported`
  - Display language name and flag
  - Save user preference
  - Apply to UI immediately

- ✅ **Language Settings Page**
  - List all supported languages
  - Set default language
  - Preview language changes

**UI Components Needed**:
1. `LanguageSelector.jsx` - Dropdown component
2. `LanguageSettings.jsx` - Settings page
3. Hook: `useLanguages.js` - For `languagesSupported`

**Integration Points**:
- Header/Settings menu
- User profile settings
- First-time user onboarding

---

## Detailed Implementation Specifications

### 1. Enhanced Classroom Request Management

#### Component: `PendingRequestsSection.jsx`
```jsx
Features:
- Display pending student and teacher requests
- Tabs for Students/Teachers
- List with user info, request date
- Approve/Reject buttons per request
- Bulk approve/reject
- Empty state when no requests
- Loading states
- Real-time updates
```

#### Component: `RequestAccessButton.jsx`
```jsx
Features:
- Show on classroom cards/pages
- Check if user already requested
- Show request status (Pending/Approved/Rejected)
- One-click request submission
- Success/error feedback
- Disable if already member
```

#### Enhanced: `ClassroomDetail.jsx`
```jsx
New Sections:
- "Pending Requests" tab or section
- Request count badge
- Quick approve/reject actions
- User info cards for requests
```

### 2. Contact Us Feature

#### Component: `ContactUsModal.jsx`
```jsx
Form Fields:
- Name (required)
- Email (required, validated)
- Subject (required)
- Category dropdown (Support, Bug, Feature, Other)
- Message (required, textarea, character counter)
- File attachment (optional)

Features:
- Form validation
- Loading state during submission
- Success message with auto-close
- Error handling
- Accessibility (ARIA labels)
```

#### Hook: `useContact.js`
```javascript
Functions:
- addContactUsMessage(name, email, subject, message, category, attachment)
- Returns success/error status
```

### 3. Language Support Feature

#### Component: `LanguageSelector.jsx`
```jsx
Features:
- Dropdown with language list
- Flag icons for each language
- Current language highlighted
- Search/filter languages
- Save preference on selection
- Apply immediately
```

#### Hook: `useLanguages.js`
```javascript
Functions:
- getLanguagesSupported() - Fetch all supported languages
- Returns array of language objects with code, name, flag
```

---

## User Experience Flow

### Classroom Request Flow

1. **Student/Teacher Views Classroom**
   - Sees "Request Access" button if not member
   - Clicks button → Request submitted
   - Button changes to "Request Pending" with status badge

2. **Staff Views Classroom**
   - Sees "X Pending Requests" badge
   - Opens requests section
   - Reviews user info
   - Approves/Rejects requests
   - User receives notification (if implemented)

3. **Request Status Tracking**
   - User can see request status on classroom card
   - Status: Pending → Approved/Rejected
   - Approved users automatically added to classroom

### Contact Us Flow

1. **User Needs Help**
   - Clicks "Contact Us" (footer/menu)
   - Modal opens with form
   - Fills out form
   - Submits → Success message
   - Receives confirmation

2. **Admin Receives Message**
   - Message stored via `addContactUsMessage`
   - Admin can view in dashboard (if implemented)

### Language Selection Flow

1. **User Changes Language**
   - Opens language selector (header/settings)
   - Sees list of supported languages
   - Selects language
   - UI updates immediately
   - Preference saved

---

## Priority Implementation Order

### 🔴 High Priority (Do First)
1. ✅ Enhance `ClassroomDetail.jsx` with request management
2. ✅ Add request access button to classroom cards
3. ✅ Create `PendingRequestsSection.jsx`
4. ✅ Integrate `ApproveClassroomRequest` better

### 🟡 Medium Priority (Do Next)
5. ✅ Create `ContactUsModal.jsx`
6. ✅ Add Contact Us link to footer/menu
7. ✅ Create `useContact.js` hook

### 🟢 Low Priority (Nice to Have)
8. ✅ Create `LanguageSelector.jsx`
9. ✅ Create `useLanguages.js` hook
10. ✅ Add to settings page

---

## Files to Create/Modify

### New Files
1. `src/components/ui/PendingRequestsSection.jsx`
2. `src/components/ui/RequestAccessButton.jsx`
3. `src/components/ui/RequestStatusBadge.jsx`
4. `src/components/ui/ContactUsModal.jsx`
5. `src/components/ui/LanguageSelector.jsx`
6. `src/hooks/useContact.js`
7. `src/hooks/useLanguages.js`

### Files to Modify
1. `src/pages/ClassroomDetail.jsx` - Add request management
2. `src/pages/ClassroomsRedesigned.jsx` - Add request buttons
3. `src/pages/StaffRooms.jsx` - Add requests overview
4. `src/components/ui/ClassroomCard.jsx` - Add request button
5. Footer/Header - Add Contact Us and Language selector

---

## Success Metrics

- ✅ All classroom request functions fully utilized
- ✅ Contact Us accessible from multiple locations
- ✅ Language selection available and functional
- ✅ User-friendly workflows for all features
- ✅ Consistent UI/UX across all new components

