import React from "react";
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import FlagRoute from "./FlagRoute";
import ModelLink from "./ModelLink";
import { flagsState, renderWithProviders } from "../../test/renderWithProviders";

function app() {
  return (
    <Routes>
      <Route path="/my-models" element={<FlagRoute flag="legacy_models_visible" auth="api" />}>
        <Route path="/my-models" element={<p>my models page</p>} />
      </Route>
      <Route path="/conversation" element={<p>conversation page</p>} />
      <Route path="/login" element={<p>login page</p>} />
    </Routes>
  );
}

const signedIn = { status: "authenticated", user: { id: "u1" }, error: null };

describe("FlagRoute", () => {
  it("renders the page when the flag is on", () => {
    renderWithProviders(app(), {
      route: "/my-models",
      preloadedState: { flags: flagsState({ legacy_models_visible: true }), apiAuth: signedIn },
    });
    expect(screen.getByText("my models page")).toBeInTheDocument();
  });

  it("sends users to Conversation Mode when the page is hidden", () => {
    renderWithProviders(app(), {
      route: "/my-models",
      preloadedState: {
        flags: flagsState({ legacy_models_visible: false, conversation_v2: true }),
        apiAuth: signedIn,
      },
    });
    expect(screen.getByText("conversation page")).toBeInTheDocument();
  });

  it("shows 404 when hidden and Conversation Mode is off", () => {
    renderWithProviders(app(), {
      route: "/my-models",
      preloadedState: { flags: flagsState({ legacy_models_visible: false }), apiAuth: signedIn },
    });
    expect(screen.getByText(/does not exist/i)).toBeInTheDocument();
    expect(screen.queryByText("my models page")).not.toBeInTheDocument();
  });

  it("waits for the user's flags before deciding", () => {
    renderWithProviders(app(), {
      route: "/my-models",
      preloadedState: {
        flags: flagsState({ legacy_models_visible: false }),
        apiAuth: { status: "authenticating", user: null, error: null },
      },
    });
    expect(screen.queryByText(/does not exist/i)).not.toBeInTheDocument();
    expect(screen.queryByText("my models page")).not.toBeInTheDocument();
  });

  it("still requires a session once visible", () => {
    renderWithProviders(app(), {
      route: "/my-models",
      preloadedState: {
        flags: flagsState({ legacy_models_visible: true }),
        apiAuth: { status: "unavailable", user: null, error: null },
      },
    });
    expect(screen.getByText("login page")).toBeInTheDocument();
  });
});

describe("ModelLink", () => {
  it("is plain text for models while they are hidden", () => {
    renderWithProviders(<ModelLink isModel to="/models/5">Fruit signs</ModelLink>, {
      preloadedState: { flags: flagsState({ legacy_models_visible: false }) },
    });
    expect(screen.getByText("Fruit signs").closest("a")).toBeNull();
  });

  it("stays a link for other content", () => {
    renderWithProviders(<ModelLink isModel={false} to="/video-subtitles/library/9">Lesson 1</ModelLink>, {
      preloadedState: { flags: flagsState({ legacy_models_visible: false }) },
    });
    expect(screen.getByText("Lesson 1").closest("a")).toHaveAttribute("href", "/video-subtitles/library/9");
  });
});
