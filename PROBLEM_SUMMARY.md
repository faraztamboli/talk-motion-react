# Video Recording Problem Summary

## Problem Description

When recording video segments (shots) with pause/resume functionality, only the **first shot** is successfully saved. Subsequent shots fail with "moov atom not found" errors, indicating incomplete WebM video files. Additionally, the **last shot** (when video ends) is never closed.

## Symptoms

1. **First shot (167)**: ✅ Works correctly - closes successfully
2. **Subsequent shots (168, 169)**: ❌ Fail with "Incomplete or corrupted video file: Video file is incomplete: missing metadata (moov atom not found)"
3. **Last shot (170)**: Created but never closed - the waiting loop times out after 25 seconds

## Root Cause Analysis

### Issue 1: Incomplete WebM Files
- **Problem**: WebM files write metadata (moov atom) at the **end** of the file
- **Current Behavior**: The blob is being sent to the server before MediaRecorder finishes writing the metadata
- **Why it happens**: 
  - When `recorder.stop()` is called, the `onstop` event fires immediately
  - However, MediaRecorder may still be finalizing the blob in the background
  - Our current wait mechanism (1500ms initial delay + up to 6 seconds of checks) is not sufficient
  - The blob appears complete (has chunks, correct size) but is missing the final metadata

### Issue 2: Last Shot Never Closes
- **Problem**: When the video ends, the recorder is stopped, but the blob processing never completes
- **Why it happens**:
  - The `onstop` handler starts blob processing with a 1500ms delay
  - The video end handler waits for the shot to close (checks `original_video_end`)
  - But the blob processing may not complete within the 25-second timeout
  - Or the blob processing fails silently

## Technical Details

### MediaRecorder Lifecycle
1. `recorder.start()` - Starts recording
2. `recorder.pause()` - Pauses recording (triggers `onpause`)
3. `recorder.stop()` - Stops recording (triggers `onstop`)
4. **After `onstop`**: MediaRecorder may still be writing metadata to the blob

### Current Implementation
- **Blob Processing**: Starts 1500ms after `onstop` event
- **Wait Mechanism**: Checks recorder state and chunk stability (up to 20 attempts × 300ms = 6 seconds)
- **Total Max Wait**: ~7.5 seconds before processing blob
- **Problem**: This is not enough time for WebM metadata to be written

### WebM Format Specifics
- WebM uses a "streaming" format where metadata can be written at the end
- The `moov` atom (metadata) contains essential information about the video
- Without it, the file is unplayable and appears "incomplete"
- MediaRecorder needs time to:
  1. Flush all buffered data
  2. Write the final metadata
  3. Finalize the blob

## Code Flow

### When User Pauses:
1. `onpause` event fires
2. Calls `recorder.requestData()` to flush buffered data
3. Waits 100ms, then calls `recorder.stop()`
4. `onstop` event fires
5. Waits 1500ms, then starts blob processing checks
6. After checks pass, converts blob to Base64
7. Calls `closeVideoRecordingShotWithVideo` with the blob

### When User Resumes:
1. `resumeRecording()` is called
2. Waits for pending recorders to complete (checks `pendingRecorders` array)
3. Creates new `MediaRecorder` instance
4. Creates new shot and calls `openVideoRecordingShot`
5. Waits for shot ID to be set
6. Resumes recording

### When Video Ends:
1. `YT.PlayerState.ENDED` event fires
2. Calls `recorder.stop()`
3. Waits up to 25 seconds for shot to close
4. **Problem**: Blob processing may not complete in time

## What Needs to Be Fixed

### Option 1: Increase Wait Times (Current Approach - Not Working)
- **Problem**: Even with 7.5 seconds wait, blobs are still incomplete
- **Why**: MediaRecorder behavior is unpredictable and browser-dependent

### Option 2: Use `timeslice` Parameter (Recommended)
- **Approach**: Use `recorder.start(timeslice)` to get data chunks at regular intervals
- **Benefit**: More control over when data is available
- **Challenge**: Need to handle chunked data differently

### Option 3: Wait for Specific MediaRecorder State
- **Approach**: Wait for a specific event or state that indicates blob is complete
- **Problem**: MediaRecorder API doesn't provide such an event

### Option 4: Client-Side Validation
- **Approach**: Validate the blob before sending (check for WebM metadata)
- **Challenge**: Need to parse WebM format or use a library

### Option 5: Server-Side Retry
- **Approach**: If server detects incomplete file, request client to resend
- **Problem**: Client may have already cleared the blob

## Recommended Solution

**Use `timeslice` parameter with `ondataavailable` to ensure all data is collected before stopping:**

```javascript
// Start recorder with timeslice (e.g., 100ms)
recorder.start(100);

// Collect all chunks in ondataavailable
recorder.ondataavailable = (event) => {
  if (event.data && event.data.size > 0) {
    chunks.push(event.data);
  }
};

// When stopping, request final data explicitly
recorder.stop();
recorder.requestData(); // Request any remaining data

// Wait longer (5-10 seconds) before processing blob
// This ensures all data chunks are collected and metadata is written
```

## Files to Review

1. `src/hooks/video_subtitles_classes/camcorder.js` - Main recording logic
2. `src/hooks/video_subtitles/useSlSubtitleDesigner.js` - Recording state management
3. Server-side validation (check for WebM metadata before processing)

## Questions for Expert

1. **What is the best way to ensure MediaRecorder has finished writing metadata before processing the blob?**
2. **Should we use `timeslice` parameter? If so, what interval is recommended?**
3. **Is there a way to detect when MediaRecorder has fully finalized the blob?**
4. **Should we validate the blob client-side before sending? If so, how?**
5. **Is there a better approach than waiting arbitrary amounts of time?**

## Browser Compatibility

- **Chrome/Edge**: Uses VP9 codec, WebM format
- **Firefox**: May use different codec/format
- **Safari**: May not support MediaRecorder API

## Current Wait Times

- Initial delay after `onstop`: 1500ms
- Max wait attempts: 20
- Wait interval: 300ms
- **Total max wait**: ~7.5 seconds
- **Still not enough** for WebM metadata to be written


