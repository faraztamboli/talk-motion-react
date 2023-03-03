import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  camcorder: null,
  previousRecordingEndTime: 0,
  recordings: {},
  youtubePlayer: null,
  recordingButton: null,
  isRecorder: false,
  onReadyCallback: null,
  onPlayerStateChangedCallback: null,
  inPip: true,
};

export const subtitleRecordingSlice = createSlice({
  name: "subtitleRecording",
  initialState,
  reducers: {
    setCamcorder: (state, action) => {
      state.camcorder = action.payload;
    },
    setPreviousRecordingEndTime: (state, action) => {
      state.previousRecordingEndTime = action.payload;
    },
    setRecordings: (state, action) => {
      state.recordings = action.payload;
    },
    setYoutubePlayer: (state, action) => {
      state.youtubePlayer = action.payload;
    },
    setRecordingButton: (state, action) => {
      state.recordingButton = action.payload;
    },
    setIsRecorder: (state, action) => {
      state.isRecorder = action.payload;
    },
    setOnReadyCallback: (state, action) => {
      state.onReadyCallback = action.payload;
    },
    setOnPlayerStateChangedCallback: (state, action) => {
      state.onPlayerStateChangedCallback = action.payload;
    },
    setInPip: (state, action) => {
      state.inPip = action.payload;
    },
  },
});

export const {
  setCamcorder,
  setPreviousRecordingEndTime,
  setRecordings,
  setYoutubePlayer,
  setRecordingButton,
  setIsRecorder,
  setOnReadyCallback,
  setOnPlayerStateChangedCallback,
  setInPip,
} = subtitleRecordingSlice.actions;

export default subtitleRecordingSlice.reducer;
