import { createSlice } from "@reduxjs/toolkit";
import { hasStoredSession } from "../../api/http";

/**
 * Session with the TalkMotion 2.0 API (JWT), separate from the RemotePy session in
 * loginSlice. status:
 *   authenticating  stored tokens are being checked, or a login is in flight
 *   authenticated   /me succeeded; `user` is set
 *   unavailable     no API session (never signed in, signed out, or token expired)
 *   failed          the API could not be reached; tokens are kept for a later retry
 */
export const apiAuthSlice = createSlice({
  name: "apiAuth",
  initialState: () => ({
    status: hasStoredSession() ? "authenticating" : "unavailable",
    user: null,
    error: null,
  }),
  reducers: {
    apiAuthStarted: (state) => {
      state.status = "authenticating";
      state.error = null;
    },
    apiAuthSucceeded: (state, action) => {
      state.status = "authenticated";
      state.user = action.payload;
      state.error = null;
    },
    apiAuthUnavailable: (state) => {
      state.status = "unavailable";
      state.user = null;
    },
    apiAuthFailed: (state, action) => {
      state.status = "failed";
      state.error = action.payload || null;
    },
  },
});

export const { apiAuthStarted, apiAuthSucceeded, apiAuthUnavailable, apiAuthFailed } = apiAuthSlice.actions;

export default apiAuthSlice.reducer;
