import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  cartCount: 0,
  cartProducts: [],
  cartIds: [],
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
  },
});

export const { setCartCount, setCartProducts, setCartIds } =
  cartSlice.actions;
export default cartSlice.reducer;
