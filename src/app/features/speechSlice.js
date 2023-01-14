import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  volume: 0.6,
};

export const speechSlice = createSlice({
  name: "speech",
  initialState,
  reducers: {
    setVolume: (state, action) => {
      state.volume = action.payload;
    },
  },
});

export const { setVolume } = speechSlice.actions;
export default speechSlice.reducer;
