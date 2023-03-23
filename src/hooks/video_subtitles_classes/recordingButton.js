// eslint-disable-next-line
class recording_button {
  constructor(id, state) {
    this.id = id;
    this.button = document.getElementById(id);
    this.state = state;

    this.button.classList.add("notRec");

    this.button.addEventListener("click", () => {
      if (this.button.classList.contains("notRec")) {
        this.button.classList.remove("notRec");
        this.button.classList.add("Rec");
        if (state !== null && state.youtube_player !== null) {
          state.youtube_player.player.seekTo(state.previous_recording_end_time);
        }
      } else {
        this.button.classList.remove("Rec");
        this.button.classList.add("notRec");
        if (state !== null && state.youtube_player !== null) {
          state.previous_recording_end_time =
            state.youtube_player.player.playerInfo.currentTime;
        }
      }
    });
  }

  is_recording_mode_on() {
    return this.button.classList.contains("Rec");
  }

  toString() {
    return `recording button state is ${this.is_recording_mode_on()}`;
  }
}

// window.recording_button = recording_button;
