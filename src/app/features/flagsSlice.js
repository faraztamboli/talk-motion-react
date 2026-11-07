import { createSlice } from "@reduxjs/toolkit";
import { readLocalOverrides, resolveFlags } from "../../config/flags";

function initialState() {
  const overrides = readLocalOverrides();
  return {
    server: null, // flags from the API for the signed-in user, or null
    overrides,
    values: resolveFlags({ server: null, overrides }),
    source: "env", // "env" | "server"
  };
}

export const flagsSlice = createSlice({
  name: "flags",
  initialState,
  reducers: {
    setServerFlags: (state, action) => {
      state.server = action.payload || {};
      state.source = "server";
      state.values = resolveFlags({ server: state.server, overrides: state.overrides });
    },
    clearServerFlags: (state) => {
      state.server = null;
      state.source = "env";
      state.values = resolveFlags({ server: null, overrides: state.overrides });
    },
    setOverrides: (state, action) => {
      state.overrides = action.payload || {};
      state.values = resolveFlags({ server: state.server, overrides: state.overrides });
    },
  },
});

export const { setServerFlags, clearServerFlags, setOverrides } = flagsSlice.actions;

export default flagsSlice.reducer;
