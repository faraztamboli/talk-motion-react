import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./reducers";
import { classicApi } from "./classicApi";

export const store = configureStore({
  reducer: { ...rootReducer, [classicApi.reducerPath]: classicApi.reducer },
  middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }).concat(classicApi.middleware),
});
