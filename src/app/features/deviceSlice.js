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
      state.deviceConnected = true;
      state.deviceStatus = "Connected";
    },
    deviceDisconnected: (state) => {
      state.deviceConnected = false;
      state.deviceStatus = "Disconnected";
    },
  },
});

export const { deviceConnected, deviceDisconnected } = deviceSlice.actions;

export default deviceSlice.reducer;
