import { describe, expect, it } from "vitest";
import { buildSidebarItems } from "./sidebarNav";
import { buildUserMenu } from "./userMenuList";

function keys(items) {
  return items.flatMap((item) => [item.key, ...(item.children ? keys(item.children) : [])]);
}

const LEGACY_KEYS = ["2", "21", "22", "61", "31", "32", "33"];

describe("sidebar", () => {
  it("shows everything as today when v1 models are visible", () => {
    const items = buildSidebarItems({ legacy_models_visible: true, conversation_v2: false });
    expect(keys(items)).toEqual(expect.arrayContaining([...LEGACY_KEYS, "42", "62", "63", "64"]));
    expect(keys(items)).not.toContain("7");
    expect(items.every((item) => !("flag" in item))).toBe(true);
  });

  it("hides models, model store and trainer, but keeps subtitles and content", () => {
    const items = buildSidebarItems({ legacy_models_visible: false, conversation_v2: false });
    const all = keys(items);
    for (const key of LEGACY_KEYS) expect(all).not.toContain(key);
    // Store keeps Videos, Classrooms and Courses.
    const store = items.find((item) => item.key === "5");
    expect(store.children.map((c) => c.key)).toEqual(["62", "63", "64"]);
    // Trainer is left with only the Subtitle Designer, which moves to the top level.
    expect(items.find((item) => item.key === "3")).toBeUndefined();
    const designer = items.find((item) => item.key === "42");
    expect(designer.path).toBe("/video-subtitles/designer");
    // Translator stays.
    expect(all).toContain("1");
  });

  it("adds Conversation when conversation_v2 is on", () => {
    const items = buildSidebarItems({ legacy_models_visible: false, conversation_v2: true });
    const conversation = items.find((item) => item.key === "7");
    expect(conversation.path).toBe("/conversation");
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
