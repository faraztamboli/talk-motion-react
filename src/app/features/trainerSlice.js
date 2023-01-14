import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  status: false,
  statusText: "Collection Stopped",
  trainingStatus: "",
  currentProgress: 0,
  totalProgress: 100,
  isTrainingComplete: false,
  showProgress: false,
  testAccuracy: "Test accuracy: ...",
  validationAccuracy: "Validation accuracy: ...",
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
      state.trainingStatus =
        action.payload === ""
          ? ""
          : state.trainingStatus + "\n" + action.payload;
    },
    setCurrentProgress: (state, action) => {
      state.currentProgress = action.payload;
    },
    setTotalProgress: (state, action) => {
      state.totalProgress = action.payload;
    },
    setIsTrainingComplete: (state, action) => {
      state.isTrainingComplete = action.payload;
    },
    setShowProgress: (state, action) => {
      state.showProgress = action.payload;
    },
    setTestAccuracy: (state, action) => {
      state.testAccuracy = action.payload;
    },
    setValidationAccuracy: (state, action) => {
      state.validationAccuracy = action.payload;
    },
  },
});

export const {
  setTrainingStatusOn,
  setTrainingStatusOff,
  setTrainingStatus,
  setCurrentProgress,
  setTotalProgress,
  setIsTrainingComplete,
  setShowProgress,
  setTestAccuracy,
  setValidationAccuracy,
} = trainerSlice.actions;
export default trainerSlice.reducer;
