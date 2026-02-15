# Expert Review Package: MediaRecorder WebM Blob Finalization Issue

## Problem Statement

When recording video segments with pause/resume functionality using MediaRecorder API, only the **first shot** is successfully saved. Subsequent shots fail with **"moov atom not found"** errors, indicating incomplete WebM video files. The last shot (when video ends) is never closed.

## Key Files

### 1. Main Recording Class: `camcorder.js`
**Location**: `src/hooks/video_subtitles_classes/camcorder.js`

**Key Methods**:
- `startNewRecordingSession()` - Creates new MediaRecorder instance
- `onstop` handler - Processes blob after recording stops
- `record_blob_base64()` - Converts blob to Base64 and sends to server
- `resumeRecording()` - Resumes recording after pause

### 2. Recording State Management: `useSlSubtitleDesigner.js`
**Location**: `src/hooks/video_subtitles/useSlSubtitleDesigner.js`

**Key Functions**:
- `openRecordingShot()` - Creates new shot on server
- `closeRecordingShot()` - Closes shot with video blob
- `onPlayerStateChangedCallback()` - Handles video end event

## Current Implementation Details

### MediaRecorder Setup
```javascript
// In startNewRecordingSession()
this.recorder = new MediaRecorder(this.stream);
this.recorder.start(200); // Start with 200ms timeslice
this.recorder.pause(); // Pause immediately
```

### onstop Handler (Current Implementation)
```javascript
this.recorder.onstop = () => {
  // Request final data
  me.recorder.requestData();
  
  // Wait 1500ms, then check recorder state and chunk stability
  setTimeout(() => {
    // Check if recorder is inactive
    // Check if chunks are stable (not changing)
    // After checks pass, process blob
    record_blob_base64(me, original_video_end, js_end);
  }, 1500);
  
  // Additional checks: up to 20 attempts × 300ms = 6 seconds
  // Total max wait: ~7.5 seconds
};
```

### Blob Processing
```javascript
function record_blob_base64(me, original_video_end, js_end, recorderId) {
  // Create blob from chunks
  const blob = new Blob(chunks, { type: "video/webm;codecs=vp9" });
  
  // Validate blob size
  if (blob.size < 1024) {
    console.error("Blob too small, likely incomplete");
    return;
  }
  
  // Convert to Base64
  reader.readAsDataURL(blob);
  reader.onloadend = function() {
    // Wait for shot ID (retry mechanism)
    // Then call closeVideoRecordingShotWithVideo
  };
}
```

## The Problem

### What's Happening
1. **First shot works**: Blob is complete, metadata is written, server accepts it
2. **Subsequent shots fail**: Blob is sent before MediaRecorder finishes writing WebM metadata
3. **Last shot never closes**: Blob processing doesn't complete before timeout

### Why It Fails
- **WebM format**: Metadata (moov atom) is written at the **end** of the file
- **MediaRecorder behavior**: After `recorder.stop()`, the `onstop` event fires immediately, but MediaRecorder may still be writing metadata in the background
- **Current wait time**: 7.5 seconds is not enough for some browsers/devices
- **No completion event**: MediaRecorder API doesn't provide an event that fires when metadata is fully written

## Evidence from Logs

```
Shot 167: ✅ Success - "Recording shot closed successfully"
Shot 168: ❌ Error - "moov atom not found" (incomplete file)
Shot 169: ❌ Error - "moov atom not found" (incomplete file)
Shot 170: ⏳ Timeout - Never closes (blob processing doesn't complete)
```

## Questions for Expert

1. **What is the best way to ensure MediaRecorder has finished writing metadata before processing the blob?**
   - Is there a reliable way to detect when the blob is complete?
   - Should we use a different approach than waiting arbitrary amounts of time?

2. **Should we use `timeslice` parameter differently?**
   - Currently using `recorder.start(200)` - is this optimal?
   - Should we request data more frequently before stopping?

3. **Is there a way to validate the blob client-side before sending?**
   - Can we check for WebM metadata presence?
   - Should we use a library like `webm-writer` or similar?

4. **Should we change the recording approach?**
   - Use a different codec/format?
   - Record to a different format that writes metadata at the beginning?

5. **Browser compatibility concerns:**
   - Does this issue affect all browsers equally?
   - Are there browser-specific workarounds?

## Recommended Solutions to Consider

### Option 1: Increase Wait Time (Current - Not Working)
- **Problem**: Even 7.5 seconds isn't enough
- **Why it fails**: Unpredictable MediaRecorder behavior

### Option 2: Use `timeslice` with More Frequent Data Requests
```javascript
recorder.start(100); // More frequent chunks
// Before stopping, request data multiple times
for (let i = 0; i < 5; i++) {
  recorder.requestData();
  await new Promise(resolve => setTimeout(resolve, 200));
}
recorder.stop();
```

### Option 3: Client-Side WebM Validation
```javascript
// Use a library to validate WebM file before sending
import { WebMFile } from 'webm-writer';
// Check if metadata is present
```

### Option 4: Server-Side Retry Mechanism
- Server detects incomplete file
- Requests client to resend
- **Problem**: Client may have already cleared the blob

### Option 5: Different Recording Format
- Use MP4 instead of WebM (if supported)
- MP4 can write metadata at the beginning

## Code Snippets for Expert Review

### Critical Section: onstop Handler
```javascript
this.recorder.onstop = () => {
  console.log("=== onstop event triggered ===");
  
  // Mark this recorder as processing
  const recorderId = Date.now() + Math.random();
  me.pendingRecorders.push({ recorder: me.recorder, id: recorderId });
  
  // Request final data
  try {
    me.recorder.requestData();
  } catch (e) {
    console.warn("requestData() failed:", e);
  }
  
  // Wait 1500ms, then check state and chunks
  let waitAttempts = 0;
  const maxWaitAttempts = 20;
  const waitInterval = 300;
  
  const checkAndProcess = () => {
    waitAttempts++;
    
    // Check 1: Recorder must be inactive
    if (me.recorder.state !== 'inactive') {
      if (waitAttempts < maxWaitAttempts) {
        setTimeout(checkAndProcess, waitInterval);
        return;
      }
    }
    
    // Check 2: Chunks must be stable
    const currentChunksLength = chunks.length;
    const currentTotalSize = total_chunk_size();
    
    if (currentChunksLength !== previousChunksLength || 
        currentTotalSize !== previousTotalSize) {
      if (waitAttempts < maxWaitAttempts) {
        setTimeout(checkAndProcess, waitInterval);
        return;
      }
    }
    
    // All checks passed - process blob
    record_blob_base64(me, original_video_end, js_end, recorderId);
  };
  
  setTimeout(checkAndProcess, 1500);
};
```

### Critical Section: Blob Processing
```javascript
function record_blob_base64(me, original_video_end, js_end, recorderId) {
  // Create blob
  const blob = new Blob(chunks, { type: "video/webm;codecs=vp9" });
  
  // Validate
  if (blob.size < 1024) {
    console.error("Blob too small");
    return;
  }
  
  // Convert to Base64
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  reader.onloadend = function() {
    const base64data = reader.result;
    
    // Wait for shot ID (retry mechanism)
    function tryCloseRecordingShot(maxRetries = 200) {
      const shot_to_close = /* find correct shot */;
      const video_recording_shot_id = shot_to_close.recording_shot_id;
      
      if (video_recording_shot_id !== null) {
        // Close shot
        me.close_recording_shot(video_recording_shot_id, ...);
      } else if (maxRetries > 0) {
        setTimeout(() => tryCloseRecordingShot(maxRetries - 1), 100);
      } else {
        console.error("Shot ID not available after all retries");
      }
    }
    
    tryCloseRecordingShot();
  };
}
```

## Server-Side Error
```
[mov,mp4,m4a,3gp,3g2,mj2 @ 0x56433c8c8780] moov atom not found
/talkmotion/store/media/subtitles/168_input_sl.mp4: Invalid data found when processing input
```

The server is trying to convert WebM to MP4 using FFmpeg, but the WebM file is incomplete (missing metadata).

## Environment
- **Browser**: Chrome/Edge (VP9 codec, WebM format)
- **MediaRecorder API**: Standard implementation
- **Recording**: Camera stream (640x390, no audio)
- **Format**: WebM with VP9 codec
- **Server**: Python/FFmpeg for conversion

## Expected Behavior
1. User starts recording → Shot 1 created
2. User pauses → Shot 1 blob finalized and sent
3. User resumes → Shot 2 created
4. User pauses → Shot 2 blob finalized and sent
5. Video ends → Shot 3 blob finalized and sent

## Actual Behavior
1. User starts recording → Shot 1 created ✅
2. User pauses → Shot 1 blob finalized and sent ✅
3. User resumes → Shot 2 created ✅
4. User pauses → Shot 2 blob sent but incomplete ❌
5. Video ends → Shot 3 never closes ❌

## Next Steps
Please review the code and provide recommendations on:
1. Best approach to ensure blob completeness
2. Whether to change recording strategy
3. Client-side validation options
4. Browser compatibility considerations


