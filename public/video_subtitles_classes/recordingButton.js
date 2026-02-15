// eslint-disable-next-line
class recording_button {
  constructor(id, state) {
    console.log(`🔴 Initializing recording button with id: "${id}"`);
    this.id = id;
    this.button = document.getElementById(id);
    this.state = state;

    if (!this.button) {
      console.error(`❌ Recording button with id "${id}" not found in DOM`);
      return;
    }

    // Start with button enabled (red/flashing) by default
    this.button.classList.add("Rec");
    this.button.classList.remove("notRec");
    console.log(`✅ Recording button found, starting in enabled state (red), adding click listener`);

    this.button.addEventListener("click", (e) => {
      console.log("🔴 Recording button clicked!", e);
      if (!this.button) {
        console.error("Recording button not found");
        return;
      }
      
      console.log("Button classes:", this.button.classList.toString());
      if (this.button.classList.contains("notRec")) {
        // Enable recording - button state
        console.log("=== Recording button clicked - ENABLE ===");
        
        // Update button visual state immediately for user feedback
        this.button.classList.remove("notRec");
        this.button.classList.add("Rec");
        
        if (state !== null && state.youtube_player !== null) {
          state.youtube_player.player.seekTo(state.previous_recording_end_time);
        }
        
        // Start recording only when button is enabled AND video is playing
        if (state !== null && state.camcorder !== null) {
          console.log("Camcorder exists, checking recorder state...");
          
          // Check if YouTube video is playing before starting recording
          const youtubePlayer = state.youtube_player?.get_player();
          const playerState = youtubePlayer?.getPlayerState?.();
          const isPlaying = playerState === YT.PlayerState.PLAYING;
          
          console.log("YouTube player state:", playerState, "isPlaying:", isPlaying);
          
          if (!isPlaying) {
            console.log("⚠️ Video is not playing - recording will start when video plays");
            // Button state is already set to "Rec" - recording will start automatically when video plays
            // (handled in onPlayerStateChangedCallback when state becomes PLAYING)
            // LED will update when recording actually starts
            return;
          }
          
          // Use camcorder's resumeRecording method which handles all the logic
          // This method waits for pending recorders, starts new sessions, and handles state properly
          if (!state.camcorder.stream) {
            // No stream, get it first
            console.log("No stream, calling recordStream to get media devices");
            state.camcorder.recordStream().then(() => {
              // After stream is ready, call resumeRecording which will start a new session
              console.log("Stream ready, calling resumeRecording...");
              // Check again if video is still playing before starting
              const currentState = state.youtube_player?.get_player()?.getPlayerState?.();
              if (currentState === YT.PlayerState.PLAYING) {
                state.camcorder.resumeRecording();
                // LED will be updated when recording actually starts (in MediaRecorder onstart event)
              } else {
                console.log("⚠️ Video stopped playing while getting stream - recording will start when video plays");
              }
            }).catch(err => {
              console.error("Error getting media stream:", err);
              // Reset button state on error
              this.button.classList.remove("Rec");
              this.button.classList.add("notRec");
            });
          } else {
            // Stream exists, just call resumeRecording
            console.log("Stream exists, calling resumeRecording...");
            state.camcorder.resumeRecording();
            // LED will be updated when recording actually starts (in MediaRecorder onstart event)
          }
        } else {
          console.error("Camcorder or state is null - cannot start recording");
          console.error("State:", state, "Camcorder:", state?.camcorder);
          // Reset button state on error
          this.button.classList.remove("Rec");
          this.button.classList.add("notRec");
        }
      } else {
        // Stop recording
        console.log("=== Recording button clicked - STOP ===");
        
        // Update button visual state immediately
        this.button.classList.remove("Rec");
        this.button.classList.add("notRec");
        
        if (state !== null && state.youtube_player !== null) {
          state.previous_recording_end_time =
            state.youtube_player.player.playerInfo.currentTime;
        }
        
        // Stop the actual recording
        if (state !== null && state.camcorder !== null) {
          // Check if recorder exists and is actually recording
          if (state.camcorder.recorder) {
            const recorderState = state.camcorder.recorder.state;
            console.log("Recorder state:", recorderState);
            if (recorderState === 'recording') {
              // Pause recording (which will trigger stop to save the segment)
              console.log("Pausing recording to save segment");
              state.camcorder.pauseRecording();
              console.log("pauseRecording() called, recorder state should change to paused");
              // LED will be updated when recording actually stops
            } else if (recorderState === 'paused') {
              console.log("Recorder is already paused");
              // LED already updated above
            } else {
              console.log("Recorder state is:", recorderState, "- no action needed");
            }
          } else {
            // No recorder exists - this is fine if recording never started
            console.log("No recorder exists - recording may not have started yet (video wasn't playing when button was clicked)");
            // Button state and LED already updated above
          }
        } else {
          console.warn("Camcorder is null - cannot stop recording");
        }
      }
    });
  }

  is_recording_mode_on() {
    if (!this.button) {
      return false;
    }
    return this.button.classList.contains("Rec");
  }


  toString() {
    return `recording button state is ${this.is_recording_mode_on()}`;
  }
}

// Make available globally (required for script tag loading)
if (typeof window !== 'undefined') {
  window.recording_button = recording_button;
}
