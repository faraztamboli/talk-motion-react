# Editing Existing Subtitle Videos - Summary

## Answers to Your Questions

### ✅ Q1: Will I be able to record segments without losing previous ones?

**YES!** When you edit an existing subtitle video:

1. **All existing shots are preserved** - They are loaded from the server and added to the `recording_shots` array
2. **New shots are added** - When you record new segments, they are added to the array using `add_shot()`
3. **Nothing is deleted** - Previous shots remain in the array and are available for playback

**How it works:**
- When editing, `loadYouTubeURLOnRecordIdChange` is called with `withShots = true`
- All existing shots from the database are loaded and added to `state.recordings[original_video_url].recording_shots`
- New shots are simply pushed to the end of this array
- All shots (old and new) are preserved

### ✅ Q2: If there is an overlap, will it take the latest one only for the overlapped section?

**YES!** The overlap handling has been **improved** to ensure this works correctly:

**Previous Behavior (Fixed):**
- Only compared consecutive shots in the array
- Didn't handle complete overlaps properly
- Didn't sort shots by time

**New Behavior:**
1. **Shots are sorted by time** - All shots are sorted by `original_video_start` time (and by array index if times are equal, so newer shots come later)
2. **Newer shots override older ones** - When there's an overlap, the newer shot (added later) takes precedence for the overlapping section
3. **Complete overlaps are handled** - If a new shot completely covers an older shot, the older shot is replaced entirely
4. **Partial overlaps are split** - If a new shot partially overlaps an older shot, the older shot is split and only the non-overlapping parts remain

**Example:**
- Old shot: 0-10 seconds
- New shot: 5-15 seconds (overlaps 5-10)
- Result: Old shot plays 0-5 seconds, new shot plays 5-15 seconds

## Technical Details

### Shot Storage
- All shots are stored in `recording.recording_shots` array
- Each shot has:
  - `original_video_start` - Start time in YouTube video
  - `original_video_end` - End time in YouTube video
  - `blob_url` - URL to the video file
  - `recording_shot_id` - Database ID

### Playback Plan Generation
The `get_record_play_plan()` method:
1. Sorts all shots by start time (newer shots come later if times are equal)
2. Processes each shot in order
3. For overlapping sections, removes older segments and replaces with newer ones
4. Splits segments appropriately for partial overlaps
5. Merges adjacent segments with the same URL
6. Returns a plan object mapping start times to segments

### Database Behavior
- When you record a new segment, `openVideoRecordingShot` creates a new database record
- Existing shot records are NOT deleted
- The playback system uses the plan to determine which shot to play at each time

## Benefits

1. **No Data Loss** - All previous recordings are preserved
2. **Easy Editing** - You can re-record any section without losing other sections
3. **Smart Overlaps** - Newer recordings automatically override older ones for overlapping sections
4. **Flexible** - You can record segments in any order, and they'll be sorted correctly for playback

