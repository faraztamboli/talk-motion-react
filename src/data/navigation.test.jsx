import { describe, expect, it } from "vitest";
import { accountFlags, buildSidebarItems, collapsedSidebarItems, selectedSidebarKey, sidebarKeys } from "./sidebarNav";
import { buildUserMenu } from "./userMenuList";

const MODEL_KEYS = ["/models", "/models?show=trainable", "/store/models"];

describe("sidebar", () => {
  it("is flat: sections hold links, never nested menus", () => {
    const items = buildSidebarItems({ legacy_models_visible: true, conversation_v2: true });
    for (const entry of items) {
      for (const child of entry.children || []) expect(child.children).toBeUndefined();
    }
    expect(items.every((entry) => !("flag" in entry))).toBe(true);
  });

  it("shows sign models when v1 models are visible", () => {
    const keys = sidebarKeys(buildSidebarItems({ legacy_models_visible: true }));
    expect(keys).toEqual(expect.arrayContaining(MODEL_KEYS));
  });

  it("hides sign models, but keeps videos, teaching and the translator", () => {
    const keys = sidebarKeys(buildSidebarItems({ legacy_models_visible: false }));
    for (const key of MODEL_KEYS) expect(keys).not.toContain(key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "/dashboard",
        "/converter",
        "/video-subtitles/mylibrary",
        "/video-subtitles/designer",
        "/classrooms",
        "/courses",
        "/classrooms/find",
        "/video-subtitles/library",
      ])
    );
    const built = buildSidebarItems({ legacy_models_visible: false });
    expect(built.find((entry) => entry.key === "g-models")).toBeUndefined();
  });

  it("adds Talk with someone when conversation_v2 is on", () => {
    expect(sidebarKeys(buildSidebarItems({ conversation_v2: false }))).not.toContain("/conversation");
    expect(sidebarKeys(buildSidebarItems({ conversation_v2: true }))).toEqual(
      expect.arrayContaining(["/conversation", "/conversation/history"])
    );
  });

  it("shows Locations to venue staff and Site analytics to platform admins only", () => {
    const staff = accountFlags({ orgs: [{ kind: "personal" }, { kind: "venue" }], is_platform_admin: false });
    expect(staff).toEqual({ has_locations: true, platform_admin: false });
    const staffKeys = sidebarKeys(buildSidebarItems(staff));
    expect(staffKeys).toContain("/locations");
    expect(staffKeys).not.toContain("/admin/analytics");

    const personal = sidebarKeys(buildSidebarItems(accountFlags({ orgs: [{ kind: "personal" }] })));
    expect(personal).not.toContain("/locations");
    expect(personal.some((k) => k.startsWith("/admin"))).toBe(false);

    const admin = sidebarKeys(buildSidebarItems(accountFlags({ orgs: [], is_platform_admin: true })));
    expect(admin).toEqual(expect.arrayContaining(["/locations", "/admin/analytics"]));
  });
});

describe("collapsed sidebar", () => {
  it("swaps section names for dividers and keeps every link", () => {
    const built = buildSidebarItems({ legacy_models_visible: true, conversation_v2: true });
    const flat = collapsedSidebarItems(built);
    expect(flat.some((e) => e.type === "group")).toBe(false);
    expect(flat.filter((e) => e.type !== "divider").map((e) => e.key)).toEqual(sidebarKeys(built));
  });
});

describe("selectedSidebarKey", () => {
  const built = buildSidebarItems({ legacy_models_visible: true, conversation_v2: true });

  it("highlights the page you are on", () => {
    expect(selectedSidebarKey(built, "/classrooms")).toBe("/classrooms");
    expect(selectedSidebarKey(built, "/")).toBe("/dashboard");
  });

  it("keeps a section lit on its sub-pages, choosing the most specific match", () => {
    expect(selectedSidebarKey(built, "/models/42/train")).toBe("/models");
    expect(selectedSidebarKey(built, "/conversation/history")).toBe("/conversation/history");
    expect(selectedSidebarKey(built, "/conversation/abc")).toBe("/conversation");
    expect(selectedSidebarKey(built, "/video-subtitles/library/7")).toBe("/video-subtitles/library");
  });

  it("tells the two model lists apart by their query", () => {
    expect(selectedSidebarKey(built, "/models", "?show=trainable")).toBe("/models?show=trainable");
    expect(selectedSidebarKey(built, "/models", "")).toBe("/models");
  });

  it("keeps My classrooms lit inside a classroom and on its sub-pages", () => {
    expect(selectedSidebarKey(built, "/classroom/12")).toBe("/classrooms");
    expect(selectedSidebarKey(built, "/classrooms/new")).toBe("/classrooms");
    expect(selectedSidebarKey(built, "/classrooms/find")).toBe("/classrooms/find");
    expect(selectedSidebarKey(built, "/courses/4")).toBe("/courses");
  });

  it("selects nothing for an unknown page", () => {
    expect(selectedSidebarKey(built, "/profile")).toBeNull();
  });
});

describe("user menu", () => {
  it("hides My Models and My Subscriptions with the store", () => {
    const hidden = buildUserMenu({ legacy_models_visible: false }).map((item) => item.key);
    expect(hidden).not.toContain("myModels");
    expect(hidden).not.toContain("mySubscriptions");
    expect(hidden).toEqual(expect.arrayContaining(["user_details", "setting", "logout"]));

    const shown = buildUserMenu({ legacy_models_visible: true }).map((item) => item.key);
    expect(shown).toEqual(expect.arrayContaining(["myModels", "mySubscriptions"]));
  });
});
