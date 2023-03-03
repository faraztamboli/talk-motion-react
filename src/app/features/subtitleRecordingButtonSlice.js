import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isRecordingModeOn: false,
};

export const subtitleRecordingButtonSlice = createSlice({
  name: "subtitleRecordingButton",
  initialState,
  reducers: {
    setRecordingModeOn: (state) => {
      state.isRecordingModeOn = true;
    },
    setRecordingModeOff: (state) => {
      state.isRecordingModeOn = false;
    },
  },
});

export const { setRecordingModeOn, setRecordingModeOff } =
  subtitleRecordingButtonSlice.actions;
export default subtitleRecordingButtonSlice.reducer;
