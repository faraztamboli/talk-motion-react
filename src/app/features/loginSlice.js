import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isLoggedIn: false,
  token: null,
};

// create login action with redux-toolkit
export const loginSlice = createSlice({
  name: "login",
  initialState,
  reducers: {
    login: (state, action) => {
      state.isLoggedIn = true;
      state.token = action.payload.token;
    },
    logout: (state) => {
      state.isLoggedIn = false;
      state.token = null;
    },
  },
});

// Action creators are generated from the reducer automatically
export const { login, logout } = loginSlice.actions;

export default loginSlice.reducer;
