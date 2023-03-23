// eslint-disable-next-line
export default class camcorder {
  constructor(
    id_camera_video,
    recording,
    player,
    open_recording_shot,
    close_recording_shot
  ) {
    this.id = id_camera_video;
    this.recorder = null;
    this.camera_video = document.getElementById(this.id);
    this.mediaConstraints = {
      video: {
        width: 640,
        height: 390,
      },
      /*audio: {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 44100,
          },*/
    };
    this.recording = recording;
    this.player = player;
    this.open_recording_shot = open_recording_shot;
    this.close_recording_shot = close_recording_shot;
  }

  async captureMediaDevices() {
    const stream = await navigator.mediaDevices.getUserMedia(
      this.mediaConstraints
    );
    return stream;
  }

  async recordStream() {
    const stream = await this.captureMediaDevices();
    ///// PLAY CAMERA
    const camera_video = document.getElementById(this.id);
    camera_video.srcObject = stream;
    await camera_video.play();
    /*
        if (playPromise !== undefined) {
          playPromise.then(_ => {
            // Automatic playback started!
            // Show playing UI.
          })
          .catch(error => {
            // Auto-play was prevented
            // Show paused UI.
          });
        }
      */
    ///// PLAY CAMERA
    this.recorder = new MediaRecorder(stream);
    //recorder.stream.getTracks().forEach((track) => track.stop());
    let chunks = [];

    this.recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    this.recorder.onerror = () => {};

    this.recorder.onstart = () => {};

    this.recorder.onresume = () => {
      let session_id = null; // this must be from server. change this later
      let original_video_start = this.player.playerInfo.currentTime;
      let recording_start = 0;
      let js_start = new Date().getTime();
      // eslint-disable-next-line
      let shot = new recording_shot(
        session_id,
        original_video_start,
        recording_start,
        js_start
      );
      let current_recording = this.recording;
      current_recording.add_shot(shot);
      // openVideoRecordingShot: create recording_shot in database and use current_recording.recording_id
      this.open_recording_shot(
        current_recording.recording_id,
        original_video_start,
        recording_start,
        js_start
      );
    };

    this.recorder.onpause = () => {
      let original_video_end = this.player.playerInfo.currentTime;
      let js_end = new Date().getTime();
      record_blob_base64(this, original_video_end, js_end);
    };

    function total_chunk_size() {
      let total_size = 0;
      for (let i in chunks) {
        let chunk = chunks[i];
        total_size += chunk.size;
      }
      return total_size;
    }

    function record_blob_base64(me, original_video_end, js_end) {
      if (chunks.length <= 0) return;

      const blob = new Blob(chunks, {
        type: "video/webm;codecs=vp9",
      });
      let chunk_size = total_chunk_size();
      let recording_end = chunk_size; // / recorder.videoBitsPerSecond was causing division by 0
      chunks = [];
      const blob_url = URL.createObjectURL(blob);
      let current_recording = me.recording;
      // blob to base64
      var reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = function () {
        var base64data = reader.result;
        console.log(base64data);
        // TODO: write to server here
        let shot = base64data; // fill with blob
        let rshot = current_recording.get_active_shot();
        rshot.close(
          shot,
          blob_url,
          chunk_size,
          original_video_end,
          recording_end,
          js_end
        );
        // closeVideoRecordingShotWithVideo: update recording_shot in database and use current_recording.get_active_shot().recording_shot_id
        let video_recording_shot_id =
          current_recording.get_active_shot().recording_shot_id;
        let active_parts = null;
        me.close_recording_shot(
          video_recording_shot_id,
          chunk_size,
          original_video_end,
          recording_end,
          js_end,
          shot,
          active_parts
        );
        console.log(rshot);
      };
    }

    this.recorder.onstop = () => {
      console.log("onstop");
      return;
    };

    this.recorder.start(200);
    this.recorder.pause();
  }

  resumeRecording() {
    this.recorder.resume();
  }

  pauseRecording() {
    this.recorder.pause();
  }

  stopRecording() {
    if (this.recorder !== null) {
      this.recorder.stream.getTracks().forEach((track) => track.stop());
    }
  }

  toString() {
    return `camcorder id is ${this.id}`;
  }
}
