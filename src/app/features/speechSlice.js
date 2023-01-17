import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  volume: 0.6,
  isSpeaking: false,
  speakText: null,
  voice: null,
};

export const speechSlice = createSlice({
  name: "speech",
  initialState,
  reducers: {
    setVolume: (state, action) => {
      state.volume = action.payload;
    },
    setIsSpeaking: (state, action) => {
      state.isSpeaking = action.payload;
    },
    setSpeakText: (state, action) => {
      state.speakText = action.payload;
    },
    setVoice: (state, action) => {
      state.voice = action.payload;
    },
  },
});

export const { setVolume, setIsSpeaking, setSpeakText, setVoice } =
  speechSlice.actions;
export default speechSlice.reducer;
