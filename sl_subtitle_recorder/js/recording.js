class recording {
    constructor(title, description, original_video_url) {
        this.title = title;
        this.description = description;
        this.original_video_url = original_video_url;
        this.recording_shots = [];
        this.recording_id = null; // fill this with value from server
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
        this.original_video_currentTimeLastUpdated_ = original_video_currentTimeLastUpdated_;
        this.original_video_availablePlaybackRates = original_video_availablePlaybackRates;
        this.original_video_playbackRate = original_video_playbackRate;
        this.original_video_availableQualityLevels = original_video_availableQualityLevels;
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
        let previous_original_start = 0;
        let previous_original_end = 0;
        let plan = {};
        for (let i in current_recording.recording_shots) {
            let recording_shot = current_recording.recording_shots[i];
            let previous_recording_shot = null;
            if (i > 0) {
                previous_recording_shot = current_recording.recording_shots[i-1];
            }
            // 3 cases
            // case 1:
            // if current shot is completely after previous shot (non-overlapping)
            if (recording_shot.original_video_start >= previous_original_end) {
                plan[recording_shot.original_video_start] = {
                    'start': recording_shot.original_video_start,
                    'end': recording_shot.original_video_end,
                    'url': recording_shot.blob_url
                    };
            }
            // case 2:
            // if current shot is completely before previous shot (non-overlapping)
            else if (recording_shot.original_video_end <= previous_original_start) {
                plan[recording_shot.original_video_start] = {
                    'start': recording_shot.original_video_start,
                    'end': recording_shot.original_video_end,
                    'url': recording_shot.blob_url
                    };
            }
            // case 3:
            // if current shot starts in between previous shot but ends after (partial-overlapping)
            else if ((recording_shot.original_video_start > previous_original_start && recording_shot.original_video_start < previous_original_end) && (recording_shot.original_video_end > previous_original_end)) {
                plan[previous_original_start]['end'] = recording_shot.original_video_start;
                plan[recording_shot.original_video_start] = {
                    'start': recording_shot.original_video_start,
                    'end': recording_shot.original_video_end,
                    'url': recording_shot.blob_url
                    };
            }
            // case 4:
            // if current shot starts in before previous shot but ends in between previous shot (partial-overlapping)
            else if (recording_shot.original_video_start < previous_original_start && recording_shot.original_video_end < previous_original_end && recording_shot.original_video_end > previous_original_start) {
                plan[recording_shot.original_video_start] = {
                    'start': recording_shot.original_video_start,
                    'end': recording_shot.original_video_end,
                    'url': recording_shot.blob_url
                    };
                plan[recording_shot.original_video_end] = {
                    'start': recording_shot.original_video_end,
                    'end': previous_original_end,
                    'url': previous_recording_shot.blob_url
                    };
                delete plan[previous_original_start];
            }
            // case 5:
            // if current shot starts and ends in between previous shot (overlapping)
            else if ((recording_shot.original_video_start > previous_original_start && recording_shot.original_video_start < previous_original_end) && (recording_shot.original_video_end > previous_original_start && recording_shot.original_video_end < previous_original_end)) {
                plan[previous_original_start]['end'] = recording_shot.original_video_start;
                plan[recording_shot.original_video_start] = {
                    'start': recording_shot.original_video_start,
                    'end': recording_shot.original_video_end,
                    'url': recording_shot.blob_url
                    };
                if (previous_recording_shot === null) { alert('error - should never happen');}
                plan[recording_shot.original_video_end] = {
                    'start': recording_shot.original_video_end,
                    'end': previous_original_end,
                    'url': previous_recording_shot.blob_url
                    };
            }
            previous_original_start = recording_shot.original_video_start;
            previous_original_end = recording_shot.original_video_end;
        }
        return plan;
    }

    toString() {
        return `recording name is ${this.title}`;
    }
}

