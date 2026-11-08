import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import PrivateRoute from "./PrivateRoute";

const session = vi.hoisted(() => ({ loggedIn: false }));
vi.mock("../hooks/useAuthStatus", () => ({
  default: () => ({ checkingStatus: false, loggedIn: session.loggedIn }),
}));

function renderAt(apiStatus) {
  const store = configureStore({ reducer: { apiAuth: () => ({ status: apiStatus }) } });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/subtitles"]}>
        <Routes>
          <Route path="/subtitles" element={<PrivateRoute />}>
            <Route path="/subtitles" element={<p>Subtitle Designer</p>} />
          </Route>
          <Route path="/login" element={<p>Login page</p>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe("PrivateRoute for classic pages", () => {
  it("shows the page with a classic session", () => {
    session.loggedIn = true;
    renderAt("unavailable");
    expect(screen.getByText("Subtitle Designer")).toBeInTheDocument();
  });

  it("explains instead of bouncing to login when only Conversation Mode is signed in", () => {
    session.loggedIn = false;
    renderAt("authenticated");
    expect(screen.queryByText("Login page")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /conversation/i })).toHaveAttribute("href", "/conversation");
  });

  it("still sends a signed-out visitor to login", () => {
    session.loggedIn = false;
    renderAt("unavailable");
    expect(screen.getByText("Login page")).toBeInTheDocument();
  });
});
