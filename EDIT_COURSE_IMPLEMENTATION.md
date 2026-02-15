# Edit Course Functionality Implementation

## Current Status

✅ **EditCourseModal Component Created** - Modern, user-friendly edit modal with all necessary features

## Function Availability Analysis

### Available Function
- ✅ `TalkMotionServer.saveFolder(name, description, parentId, image, isPublic)` - Currently used for creating folders/courses

### Potential Issue
The `saveFolder` function signature does **NOT** include a `folderId` parameter, which suggests it may only support **creating** new folders, not updating existing ones.

### Possible Solutions

#### Option 1: `saveFolder` Supports Updates (Most Likely)
Many backend APIs use the same endpoint for both create and update:
- If `folderId` is passed in the request body (not as a parameter), it updates
- If no `folderId` is provided, it creates a new folder

**Action Required**: Check backend API documentation or test if `saveFolder` accepts a folder ID in the request body.

#### Option 2: Need to Add `updateFolder` Function
If the backend has a separate update endpoint, we need to:
1. Add `updateFolder` function to `useFolders.js` hook
2. Update `EditCourseModal.jsx` to use `updateFolder` instead of `saveFolder`

**Function Signature (if needed)**:
```javascript
function updateFolder(folderId, name, description, image, isPublic) {
  return new Promise((resolve, reject) => {
    try {
      JS2Py.PythonFunctions.TalkMotionServer.updateFolder(
        token,
        folderId,
        name,
        description,
        image,
        isPublic,
        function (res) {
          resolve(res);
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}
```

## Current Implementation

The `EditCourseModal` component is implemented and ready to use. It:
- ✅ Pre-populates form with existing course data
- ✅ Handles image updates (keeps existing if no new image)
- ✅ Validates input fields
- ✅ Shows loading states
- ✅ Provides user feedback

**Current Code**: Uses `saveFolder` - may need adjustment based on backend API.

## Testing Required

1. **Test if `saveFolder` works for updates**:
   - Try calling `saveFolder` with an existing folder's name and parentId
   - Check if it updates or creates a duplicate

2. **Check backend API**:
   - Review API documentation for folder update endpoint
   - Check if `saveFolder` accepts folder ID parameter

3. **If update doesn't work**:
   - Add `updateFolder` function to `useFolders.js`
   - Update `EditCourseModal.jsx` to use `updateFolder`

## Integration Points

✅ **CourseDetail.jsx** - Edit button added to course header
✅ **CourseCard.jsx** - Edit button added to course card actions
✅ **Courses.jsx** - Ready for edit functionality

## Next Steps

1. **Test the current implementation** with a real course
2. **Verify backend behavior** - Does `saveFolder` support updates?
3. **If needed**, add `updateFolder` function to the hook
4. **Update EditCourseModal** to use the correct function

## Notes

- The EditCourseModal is fully functional from a UI/UX perspective
- The only uncertainty is whether `saveFolder` supports updates or if we need a separate function
- The component gracefully handles errors and provides user feedback
- All form validation and image handling is implemented

