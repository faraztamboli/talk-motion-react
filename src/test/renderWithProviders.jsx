import React from "react";
import { render } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import rootReducer from "../app/reducers";
import { resolveFlags } from "../config/flags";

export function makeStore(preloadedState = {}) {
  return configureStore({ reducer: rootReducer, preloadedState });
}

/** Preloaded `flags` state for the given values (on top of build defaults). */
export function flagsState(values = {}) {
  return { server: values, overrides: {}, values: resolveFlags({ server: values }), source: "server" };
}

export function renderWithProviders(ui, { preloadedState = {}, route = "/", store } = {}) {
  const theStore = store || makeStore(preloadedState);
  const result = render(
    <Provider store={theStore}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </Provider>
  );
  return { ...result, store: theStore };
}
