class recording_state {
  constructor() {
    this.camcorder = null;
    this.previous_recording_end_time = 0;
    this.recordings = {};
    this.youtube_player = null;
    this.recording_button = null;
    this.is_recorder = false;
    this.on_ready_callback = null;
    this.on_player_state_changed_callback = null;
    this.in_pip = true;
  }

  set_camcorder(cam) {
    this.camcorder = cam;
  }

  set_previous_recording_end_time(time) {
    this.previous_recording_end_time = time;
  }

  set_is_recorder(is_recorder) {
    this.is_recorder = is_recorder;
  }

  set_on_ready_callback(on_ready_callback) {
    this.on_ready_callback = on_ready_callback;
  }

  set_on_player_state_changed_callback(on_player_state_changed_callback) {
    this.on_player_state_changed_callback = on_player_state_changed_callback;
  }

  set_in_pip(in_pip) {
    this.in_pip = in_pip;
  }

  toString() {
    return `recording state is ${this.title}`;
  }
}

export default recording_state;
