import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  volume: 0.6,
  isSpeaking: false,
  speakText: null,
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
  },
});

export const { setVolume, setIsSpeaking, setSpeakText } = speechSlice.actions;
export default speechSlice.reducer;
