import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import PrivateRoute from "./PrivateRoute";

function LoginProbe() {
  const location = useLocation();
  return <p>Login page from {location.state?.from || "nowhere"}</p>;
}

function renderAt({
  apiStatus = "unavailable",
  login = { checked: true, isLoggedIn: false, ssoInProgress: false },
  server = { phase: "connected", everConnected: true },
  path = "/subtitles?id=3",
} = {}) {
  const store = configureStore({
    reducer: {
      apiAuth: () => ({ status: apiStatus }),
      login: () => login,
      server: () => server,
    },
  });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/subtitles" element={<PrivateRoute />}>
            <Route path="/subtitles" element={<p>Subtitle Designer</p>} />
          </Route>
          <Route path="/login" element={<LoginProbe />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe("PrivateRoute for classic pages", () => {
  it("shows the page with a classic session", () => {
    renderAt({ login: { checked: true, isLoggedIn: true } });
    expect(screen.getByText("Subtitle Designer")).toBeInTheDocument();
  });

  it("waits instead of redirecting while the session has not been checked", () => {
    renderAt({ login: { checked: false, isLoggedIn: false }, server: { phase: "connecting", everConnected: false } });
    expect(screen.queryByText(/Login page/)).not.toBeInTheDocument();
    expect(screen.queryByText("Subtitle Designer")).not.toBeInTheDocument();
  });

  it("says the server is unreachable rather than sending people to login", () => {
    renderAt({ login: { checked: false, isLoggedIn: false }, server: { phase: "offline", everConnected: false } });
    expect(screen.getByText(/can't reach the TalkMotion server/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("waits while single sign-in is running", () => {
    renderAt({ apiStatus: "authenticated", login: { checked: true, isLoggedIn: false, ssoInProgress: true } });
    expect(screen.queryByText(/Login page/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /conversation/i })).not.toBeInTheDocument();
  });

  it("explains instead of bouncing to login when only Conversation Mode is signed in", () => {
    renderAt({ apiStatus: "authenticated" });
    expect(screen.queryByText(/Login page/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /conversation/i })).toHaveAttribute("href", "/conversation");
  });

  it("sends a signed-out visitor to login and remembers the page", () => {
    renderAt();
    expect(screen.getByText("Login page from /subtitles?id=3")).toBeInTheDocument();
  });
});
