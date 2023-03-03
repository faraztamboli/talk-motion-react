class recording_shot {
  constructor(session_id, original_video_start, recording_start, js_start) {
    this.session_id = session_id;
    this.original_video_start = original_video_start;
    this.recording_start = recording_start;
    this.js_start = js_start;
    this.recording_shot_id = null; // fill this with value from server
  }

  close(shot, blob_url, chunk_size, original_video_end, recording_end, js_end) {
    this.shot = shot;
    this.original_video_end = original_video_end;
    this.recording_end = recording_end;
    this.js_end = js_end;
    this.blob_url = blob_url;
    this.chunk_size = chunk_size;
  }

  set_active_part(active_parts) {
    this.active_parts = active_parts;
  }

  set_video_url(url) {
    this.blob_url = url;
  }

  is_open() {
    return (
      this.original_video_end === undefined || this.original_video_end === null
    );
  }

  toString() {
    return `recording shot name is ${this.name}`;
  }
}

export default recording_shot;
