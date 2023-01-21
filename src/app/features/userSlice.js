import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  name: null,
  username: null,
  profileImg: null,
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
    setProfileImg: (state, action) => {
      state.profileImg = `${action.payload}?${Date.now()}`;
    },
  },
});

export const { setUser, removeUser, setProfileImg } = userSlice.actions;

export default userSlice.reducer;
