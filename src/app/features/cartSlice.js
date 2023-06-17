import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  cartCount: 0,
  cartProducts: [],
  cartIds: [],
  clientSecret: null,
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCartCount: (state, action) => {
      state.cartCount = action.payload;
    },
    setCartProducts: (state, action) => {
      state.cartProducts = action.payload;
    },
    setCartIds: (state, action) => {
      state.cartIds = action.payload;
    },
    setClientSecret: (state, action) => {
      state.clientSecret = action.payload;
    },
  },
});

export const {
  setCartCount,
  setCartProducts,
  setCartIds,
  setClientSecret,
} = cartSlice.actions;
export default cartSlice.reducer;
