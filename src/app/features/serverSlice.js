import { createSlice } from "@reduxjs/toolkit";

/**
 * RemotePy connection state.
 *
 * phase:
 *   connecting    first connection attempt in progress
 *   connected     socket open and the server's function library loaded
 *   reconnecting  the socket dropped (or a first attempt failed); retrying with backoff
 *   offline       several attempts in a row failed; still retrying in the background
 *
 * everConnected lets the app keep pages mounted through a reconnect instead of unmounting
 * them (which used to lose the camera, microphone and in-flight uploads).
 */
const initialState = {
  phase: "connecting",
  everConnected: false,
  attempt: 0,
  nextRetryAt: null,
  // Kept for existing consumers.
  serverConnected: false,
  serverStatus: "Connecting...",
};

const STATUS_TEXT = {
  connecting: "Connecting...",
  connected: "Connected",
  reconnecting: "Reconnecting...",
  offline: "Offline",
};

export const serverSlice = createSlice({
  name: "server",
  initialState,
  reducers: {
    connectionPhaseChanged: (state, action) => {
      const { phase, attempt = state.attempt, nextRetryAt = null } = action.payload;
      state.phase = phase;
      state.attempt = attempt;
      state.nextRetryAt = nextRetryAt;
      state.serverConnected = phase === "connected";
      state.serverStatus = STATUS_TEXT[phase] || phase;
      if (phase === "connected") {
        state.everConnected = true;
        state.attempt = 0;
      }
    },
    // Legacy setters, still dispatched by a few places.
    setServerConnected: (state, action) => {
      state.serverConnected = action.payload;
    },
    setServerStatus: (state, action) => {
      state.serverStatus = action.payload;
    },
  },
});

export const { connectionPhaseChanged, setServerConnected, setServerStatus } = serverSlice.actions;

export default serverSlice.reducer;
