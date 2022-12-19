import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  deviceConnected: false,
  deviceStatus: "Disconnected",
};

export const deviceSlice = createSlice({
  name: "device",
  initialState,
  reducers: {
    deviceConnected: (state) => {
      state.isConnected = true;
      state.status = "Connected";
    },
    deviceDisconnected: (state) => {
      state.isConnected = false;
      state.status = "Disconnected";
    },
  },
});

export const { deviceConnected, deviceDisconnected } = deviceSlice.actions;

export default deviceSlice.reducer;
