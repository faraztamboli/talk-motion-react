import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isRecording: true,
};

export const converterSlice = createSlice({
  name: "converter",
  initialState,
  reducers: {
    setIsRecording: (state, action) => {
      state.isRecording = action.payload;
    },
  },
});

export const { setIsRecording } = converterSlice.actions;
export default converterSlice.reducer;
