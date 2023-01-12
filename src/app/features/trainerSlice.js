import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  status: false,
  statusText: "Collection Stopped",
  trainingStatus: "",
};

export const trainerSlice = createSlice({
  name: "trainer",
  initialState,
  reducers: {
    setTrainingStatusOn: (state) => {
      state.status = true;
      state.statusText = "Collecting sample";
    },
    setTrainingStatusOff: (state) => {
      state.status = false;
      state.statusText = "Collection Stopped";
    },
    setTrainingStatus: (state, action) => {
      state.trainingStatus = action.payload;
    },
  },
});

export const { setTrainingStatusOn, setTrainingStatusOff, setTrainingStatus } =
  trainerSlice.actions;
export default trainerSlice.reducer;
