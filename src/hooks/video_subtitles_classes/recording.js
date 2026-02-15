// eslint-disable-next-line
class recording {
  constructor(title, description, original_video_url, recording_id=null) {
    this.title = title;
    this.description = description;
    this.original_video_url = original_video_url;
    this.recording_shots = [];
    this.recording_id = recording_id; // fill this with value from server
  }

  set_info(
    original_video_title,
    original_video_author,
    original_video_quality,
    original_video_duration,
    original_video_currentTimeLastUpdated_,
    original_video_availablePlaybackRates,
    original_video_playbackRate,
    original_video_availableQualityLevels,
    original_video_playbackQuality
  ) {
    this.original_video_title = original_video_title;
    this.original_video_author = original_video_author;
    this.original_video_quality = original_video_quality;
    this.original_video_duration = original_video_duration;
    this.original_video_currentTimeLastUpdated_ =
      original_video_currentTimeLastUpdated_;
    this.original_video_availablePlaybackRates =
      original_video_availablePlaybackRates;
    this.original_video_playbackRate = original_video_playbackRate;
    this.original_video_availableQualityLevels =
      original_video_availableQualityLevels;
    this.original_video_playbackQuality = original_video_playbackQuality;
  }

  add_shot(recording_shot) {
    this.recording_shots.push(recording_shot);
  }

  get_last_shot() {
    return this.recording_shots[this.recording_shots.length - 1];
  }

  get_active_shot() {
    return this.get_last_shot();
  }

  get_record_play_plan() {
    let current_recording = this;
    
    // CRITICAL: Sort shots by start time, then by array index (newer shots come later)
    // This ensures that when there are overlaps, newer shots (added later) will override older ones
    let sorted_shots = current_recording.recording_shots
      .map((shot, index) => ({ shot, index }))
      .filter(item => item.shot.original_video_start !== null && item.shot.original_video_start !== undefined &&
                      item.shot.original_video_end !== null && item.shot.original_video_end !== undefined)
      .sort((a, b) => {
        // First sort by start time
        if (a.shot.original_video_start !== b.shot.original_video_start) {
          return a.shot.original_video_start - b.shot.original_video_start;
        }
        // If start times are equal, sort by index (newer shots come later)
        return a.index - b.index;
      });
    
    // Build a timeline of segments, where newer shots override older ones for overlapping sections
    let segments = [];
    
    for (let i = 0; i < sorted_shots.length; i++) {
      let { shot } = sorted_shots[i];
      let start = shot.original_video_start;
      let end = shot.original_video_end;
      
      // Find all existing segments that overlap with this shot
      let overlappingSegments = segments.filter(seg => 
        !(seg.end <= start || seg.start >= end)
      );
      
      // Remove overlapping segments (newer shot takes precedence)
      for (let seg of overlappingSegments) {
        let segIndex = segments.indexOf(seg);
        segments.splice(segIndex, 1);
        
        // If the new shot doesn't completely cover the old segment, add back the non-overlapping parts
        if (seg.start < start) {
          // Add segment before the new shot
          segments.push({
            start: seg.start,
            end: Math.min(start, seg.end),
            url: seg.url
          });
        }
        if (seg.end > end) {
          // Add segment after the new shot
          segments.push({
            start: Math.max(end, seg.start),
            end: seg.end,
            url: seg.url
          });
        }
      }
      
      // Add the new shot segment
      segments.push({
        start: start,
        end: end,
        url: shot.blob_url
      });
    }
    
    // Sort segments by start time and merge adjacent segments with the same URL
    segments.sort((a, b) => a.start - b.start);
    let mergedSegments = [];
    for (let seg of segments) {
      if (mergedSegments.length === 0) {
        mergedSegments.push(seg);
      } else {
        let last = mergedSegments[mergedSegments.length - 1];
        if (last.end === seg.start && last.url === seg.url) {
          // Merge adjacent segments with same URL
          last.end = seg.end;
        } else {
          mergedSegments.push(seg);
        }
      }
    }
    
    // Convert to the expected plan format (object with start time as key)
    let plan = {};
    for (let seg of mergedSegments) {
      plan[seg.start] = {
        start: seg.start,
        end: seg.end,
        url: seg.url
      };
    }
    
    return plan;
  }

  toString() {
    return `recording name is ${this.title}`;
  }
}

// window.recording = recording;
