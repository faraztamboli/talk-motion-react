import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isRecording: true,
  isModelLoading: true,
};

export const converterSlice = createSlice({
  name: "converter",
  initialState,
  reducers: {
    setIsRecording: (state, action) => {
      state.isRecording = action.payload;
    },
    setIsModelLoading: (state, action) => {
      state.isModelLoading = action.payload;
    },
  },
});

export const { setIsRecording, setIsModelLoading } = converterSlice.actions;
export default converterSlice.reducer;
