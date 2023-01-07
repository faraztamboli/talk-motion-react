import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  modelId: null,
  concept: null,
  modelPaginationSize: 10,
  currentModelPage: 1,
};

export const modelSlice = createSlice({
  name: "model",
  initialState,
  reducers: {
    selectModel: (state, action) => {
      state.modelId = action.payload;
    },
    useConcept: (state, action) => {
      state.concept = action.payload;
    },
    setModelPaginationSize: (state, action) => {
      state.modelPaginationSize = action.payload;
    },
    setCurrentModelPage: (state, action) => {
      state.currentModelPage = action.payload;
    },
  },
});

export const {
  selectModel,
  useConcept,
  setModelPaginationSize,
  setCurrentModelPage,
} = modelSlice.actions;
export default modelSlice.reducer;
