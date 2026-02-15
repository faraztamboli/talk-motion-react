# Editing Existing Subtitle Videos - Analysis

## Current Behavior

### ✅ Existing Shots Are Preserved
When editing an existing video:
1. `loadYouTubeURLOnRecordIdChange` is called with `withShots = true`
2. All existing shots are loaded from the server
3. Shots are added to `recording_shots` array using `add_shot()` which just pushes to the array
4. **All previous shots are preserved** - they are NOT deleted or replaced

### ⚠️ Overlap Handling Issue
The `get_record_play_plan()` method has a limitation:
- It only compares each shot with the **previous** shot in the array
- It doesn't handle cases where:
  - A new shot completely overlaps an older shot (not the previous one)
  - Shots are added out of chronological order
  - Multiple shots overlap the same time range

**Current Logic:**
- Processes shots in array order (not sorted by time)
- Only handles overlaps between consecutive shots
- For overlapping sections, it uses the **newer shot** (the one processed later)

## Issues to Fix

1. **Shots should be sorted by time** before processing overlaps
2. **Complete overlaps** should replace older shots entirely
3. **Multiple overlaps** should be handled correctly
4. **Newest shot wins** for overlapping sections (as intended)

## Recommended Fix

The `get_record_play_plan()` method should:
1. Sort shots by `original_video_start` time
2. Process all overlaps, not just consecutive ones
3. For complete overlaps, remove the older shot from the plan
4. For partial overlaps, split shots appropriately

