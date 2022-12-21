import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  name: null,
  username: null,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.name = action.payload.name;
      state.username = action.payload.username;
    },
    removeUser: (state) => {
      state.name = null;
      state.username = null;
    },
  },
});

export const { setUser, removeUser } = userSlice.actions;

export default userSlice.reducer;
