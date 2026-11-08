import { describe, expect, it } from "vitest";
import {
  OVERRIDES_STORAGE_KEY,
  envDefaults,
  readLocalOverrides,
  resolveFlags,
  saveLocalOverrides,
} from "./flags";

const PROD = { DEV: false };

describe("feature flags", () => {
  it("keeps v1 models visible until told otherwise", () => {
    expect(envDefaults(PROD).legacy_models_visible).toBe(true);
    expect(envDefaults(PROD).conversation_v2).toBe(false);
  });

  it("reads build-time env defaults", () => {
    const env = { DEV: false, VITE_FLAG_LEGACY_MODELS_VISIBLE: "false", VITE_FLAG_CONVERSATION_V2: "true" };
    expect(envDefaults(env)).toMatchObject({ legacy_models_visible: false, conversation_v2: true });
  });

  it("server flags beat env defaults and overrides beat both", () => {
    const flags = resolveFlags({
      env: PROD,
      server: { legacy_models_visible: false, conversation_v2: false },
      overrides: { conversation_v2: true },
    });
    expect(flags.legacy_models_visible).toBe(false);
    expect(flags.conversation_v2).toBe(true);
  });

  it("ignores unknown flags and non-boolean values", () => {
    const flags = resolveFlags({ env: PROD, server: { conversation_v2: "yes", hacker_mode: true } });
    expect(flags.conversation_v2).toBe(false);
    expect(flags).not.toHaveProperty("hacker_mode");
  });

  it("only honours local overrides in dev builds", () => {
    window.localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify({ conversation_v2: true }));
    expect(readLocalOverrides(window.localStorage, { DEV: true })).toEqual({ conversation_v2: true });
    expect(readLocalOverrides(window.localStorage, PROD)).toEqual({});
    expect(readLocalOverrides(window.localStorage, { DEV: false, VITE_FLAG_OVERRIDES: "true" })).toEqual({
      conversation_v2: true,
    });
  });

  it("survives corrupt override storage", () => {
    window.localStorage.setItem(OVERRIDES_STORAGE_KEY, "{oops");
    expect(readLocalOverrides(window.localStorage, { DEV: true })).toEqual({});
  });

  it("saving an empty override set removes the key", () => {
    saveLocalOverrides({ conversation_v2: true });
    expect(window.localStorage.getItem(OVERRIDES_STORAGE_KEY)).not.toBeNull();
    saveLocalOverrides({});
    expect(window.localStorage.getItem(OVERRIDES_STORAGE_KEY)).toBeNull();
  });
});
