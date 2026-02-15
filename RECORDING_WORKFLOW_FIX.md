# Recording Workflow Fix - Preventing Data Loss

## Current Issues

1. **Shots being recorded on pause/unpause**: This is expected behavior - each pause creates a segment that needs to be saved. However, if users pause/unpause quickly, multiple shots might be created unnecessarily.

2. **Saving doesn't happen immediately**: The saving process has multiple delays:
   - Wait for first chunk validation (up to 6 seconds)
   - Wait for shot ID from `openVideoRecordingShot` (up to 20 seconds)
   - Then upload starts

3. **Potential data loss**: If the user closes the page or navigates away before the upload completes, data could be lost.

## Current Workflow

### When Video is Paused:
1. `pauseRecording()` is called
2. `recorder.pause()` triggers `onpause` event
3. `onpause` handler waits for first chunk validation (up to 6 seconds)
4. Then finalizes the segment (creates blob)
5. Calls `_record_blob_base64` which waits for shot ID (up to 20 seconds)
6. Then starts upload via UploadManager

### When Video is Resumed:
1. `resumeRecording()` is called
2. Waits for pending recorders to complete
3. Starts a new recording session
4. Creates a new shot (calls `openVideoRecordingShot`)
5. Waits for first chunk validation before resuming

## Recommended Fixes

### 1. Create Shot in Database Immediately on Pause
- **Current**: Shot is created when recording starts/resumes, but ID might not be available when pausing
- **Fix**: Ensure shot has an ID before finalization, or create it immediately on pause if missing
- **Benefit**: No waiting for shot ID during finalization

### 2. Store Blob in IndexedDB Immediately After Finalization
- **Current**: Blob is only stored in IndexedDB when upload starts
- **Fix**: Store blob in IndexedDB immediately after finalization (before upload)
- **Benefit**: Data is persisted locally even if upload fails or page is closed

### 3. Ensure Resume Waits for Previous Segment Save
- **Current**: Resume might start new session before previous segment is saved
- **Fix**: Wait for previous segment to be at least saved to IndexedDB before starting new session
- **Benefit**: No data loss when quickly pausing/resuming

### 4. Add Visual Feedback
- Show upload progress for each segment
- Indicate when segment is saved to IndexedDB
- Show warning if segment is still uploading when user tries to leave

## Implementation Plan

1. **Modify `onpause` handler** to:
   - Ensure shot has an ID before finalization (create if missing)
   - Store blob in IndexedDB immediately after finalization
   - Mark segment as "saved" in IndexedDB

2. **Modify `resumeRecording`** to:
   - Wait for previous segment to be saved to IndexedDB (not just uploaded)
   - Show visual feedback if previous segment is still processing

3. **Add IndexedDB storage** for:
   - Blob storage (already exists via `putShotBlob`)
   - Segment status tracking
   - Resume capability

4. **Add UI feedback**:
   - Progress indicator for each segment
   - Status indicator (recording, saving, uploading, complete)
   - Warning if leaving page with unsaved segments

