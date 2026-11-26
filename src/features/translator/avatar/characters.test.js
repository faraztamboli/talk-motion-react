import { describe, expect, it } from "vitest";
import { Color, MeshBasicMaterial, Object3D, Mesh, BoxGeometry } from "three";
import { CHARACTERS, MODELS, PALETTES, applyLook, editableParts, findCharacter, resolveLook } from "./characters";

describe("characters", () => {
  it("every character points at a model or is the skeleton", () => {
    for (const c of CHARACTERS) expect(c.kind === "wireframe" || MODELS[c.model]).toBeTruthy();
    expect(new Set(CHARACTERS.map((c) => c.id)).size).toBe(CHARACTERS.length);
    expect(CHARACTERS.filter((c) => c.kind !== "wireframe").length).toBeGreaterThanOrEqual(4);
  });

  it("each default look uses real palette entries", () => {
    for (const c of CHARACTERS.filter((x) => x.model)) {
      for (const [part, id] of Object.entries(c.look)) expect(PALETTES[part].some((p) => p.id === id)).toBe(true);
    }
  });

  it("finds a character, falling back to the default", () => {
    expect(findCharacter("noor").name).toBe("Noor");
    expect(findCharacter("nobody").id).toBe("mika");
  });

  it("only offers the colour parts the model has", () => {
    expect(editableParts(findCharacter("mika"))).toEqual(["skin", "hair", "outfit"]);
    expect(editableParts(findCharacter("seed"))).toEqual(["hair"]);
    expect(editableParts(findCharacter("wireframe"))).toEqual([]);
  });

  it("resolves a saved look, ignoring unknown values", () => {
    const noor = findCharacter("noor");
    expect(resolveLook(noor, { skin: "deep", hair: "nonsense" })).toEqual({ skin: "deep", hair: "black", outfit: "teal" });
    expect(resolveLook(noor, null)).toEqual(noor.look);
  });
});

describe("applyLook", () => {
  const build = () => {
    const root = new Object3D();
    const mk = (name) => {
      const m = new MeshBasicMaterial({ color: new Color(0.8, 0.8, 0.8) });
      m.name = name;
      root.add(new Mesh(new BoxGeometry(), m));
      return m;
    };
    return { root, skin: mk("Body_00_SKIN"), hair: mk("Hair_00_HAIR"), other: mk("Eye") };
  };

  it("tints named parts and leaves the rest", () => {
    const { root, skin, hair, other } = build();
    applyLook(root, findCharacter("mika"), { skin: "deep", hair: "natural", outfit: "natural" });
    expect(skin.color.r).toBeLessThan(0.8 * 0.5);
    expect(hair.color.r).toBeCloseTo(0.8, 5);
    expect(other.color.r).toBeCloseTo(0.8, 5);
  });

  it("can change again from the original colour, not the tinted one", () => {
    const { root, skin } = build();
    applyLook(root, findCharacter("mika"), { skin: "deep" });
    applyLook(root, findCharacter("mika"), { skin: "light" });
    expect(skin.color.r).toBeCloseTo(0.8, 5);
  });
});
