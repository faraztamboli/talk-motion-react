import { createSlice } from "@reduxjs/toolkit";

/**
 * Classic (RemotePy) session.
 *
 * checked: whether the session has been verified with the server since the app loaded.
 * Route guards wait for it instead of treating "not checked yet" as "signed out", which used
 * to send people to /login on every refresh before the socket had connected.
 */
const initialState = {
  isLoggedIn: false,
  token: null,
  checked: false,
  // A silent sign-in with the API token (single sign-in) is running.
  ssoInProgress: false,
};

export const loginSlice = createSlice({
  name: "login",
  initialState,
  reducers: {
    login: (state, action) => {
      state.isLoggedIn = true;
      state.token = action.payload?.token ?? state.token;
      state.checked = true;
    },
    logout: (state) => {
      state.isLoggedIn = false;
      state.token = null;
      state.checked = true;
    },
    ssoStarted: (state) => {
      state.ssoInProgress = true;
    },
    ssoFinished: (state) => {
      state.ssoInProgress = false;
    },
    sessionChecked: (state, action) => {
      state.isLoggedIn = Boolean(action.payload?.isLoggedIn);
      state.token = action.payload?.token ?? null;
      state.checked = true;
    },
  },
});

export const { login, logout, sessionChecked, ssoStarted, ssoFinished } = loginSlice.actions;

export default loginSlice.reducer;
