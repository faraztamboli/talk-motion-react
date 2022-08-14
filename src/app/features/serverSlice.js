import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  serverConnected: false,
  serverStatus: 'Connecting...',
  serverInstance: [],
};

export const serverSlice = createSlice({
  name: 'server',
  initialState,
  reducers: {
    setServerConnected: (state, action) => {
      state.serverConnected = action.payload;
    },
    setServerStatus: (state, action) => {
      state.serverStatus = action.payload;
    },
    setServerInstance: (state, action) => {
      state.serverInstance = action.payload;
    },
  },
});

export const { setServerConnected, setServerStatus } = serverSlice.actions;

export default serverSlice.reducer;
