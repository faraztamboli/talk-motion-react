import { Color } from "three";

/**
 * The signing avatar's characters. A character is a model file plus a "look" (colours). Models
 * are VRM 1.0 files in /avatars (licences: public/avatars/LICENSES.md); looks are made at run time
 * by tinting materials, so one file gives several people.
 */

/** Material names (per model) that each colour setting changes. */
export const MODELS = {
  mika: {
    url: "/avatars/mika.vrm",
    credit: "Mika: VRM1_Constraint_Twist_Sample, (c) 2022 pixiv Inc., VRM Public License 1.0",
    parts: {
      skin: ["Body_00_SKIN", "Face_00_SKIN"],
      hair: ["Hair_00_HAIR", "HairBack_00_HAIR"],
      outfit: ["Tops_01_CLOTH", "Bottoms_01_CLOTH"],
    },
  },
  seed: {
    url: "/avatars/seed-san.vrm",
    credit: "Seed-san: (c) VirtualCast, Inc., VRM Public License 1.0",
    parts: { hair: ["hair"] },
  },
};

/** Colour choices: `mul` multiplies the material's own colour (so shading and detail survive). */
export const PALETTES = {
  skin: [
    { id: "light", name: "Light", mul: [1, 1, 1] },
    { id: "warm", name: "Warm", mul: [0.97, 0.84, 0.7] },
    { id: "tan", name: "Tan", mul: [0.86, 0.66, 0.5] },
    { id: "brown", name: "Brown", mul: [0.66, 0.46, 0.34] },
    { id: "deep", name: "Deep", mul: [0.44, 0.29, 0.22] },
  ],
  hair: [
    { id: "natural", name: "Natural", mul: [1, 1, 1] },
    { id: "black", name: "Black", mul: [0.22, 0.2, 0.22] },
    { id: "blond", name: "Blond", mul: [2.5, 2.1, 1.1] },
    { id: "red", name: "Red", mul: [1.6, 0.6, 0.4] },
    { id: "blue", name: "Blue", mul: [0.5, 0.9, 1.7] },
    { id: "grey", name: "Grey", mul: [1.2, 1.2, 1.25] },
  ],
  outfit: [
    { id: "natural", name: "Original", mul: [1, 1, 1] },
    { id: "teal", name: "Teal", mul: [0.3, 1, 1] },
    { id: "coral", name: "Coral", mul: [1.4, 0.65, 0.55] },
    { id: "violet", name: "Violet", mul: [0.9, 0.55, 1.3] },
    { id: "dark", name: "Dark", mul: [0.16, 0.18, 0.26] },
  ],
};

/** The pickable characters. `kind: "wireframe"` is the original skeleton drawing. */
export const CHARACTERS = [
  { id: "mika", name: "Mika", model: "mika", look: { skin: "light", hair: "natural", outfit: "natural" } },
  { id: "noor", name: "Noor", model: "mika", look: { skin: "tan", hair: "black", outfit: "teal" } },
  { id: "amara", name: "Amara", model: "mika", look: { skin: "deep", hair: "black", outfit: "coral" } },
  { id: "kai", name: "Kai", model: "mika", look: { skin: "warm", hair: "blond", outfit: "dark" } },
  { id: "seed", name: "Seed-san (robot)", model: "seed", look: { hair: "natural" } },
  { id: "wireframe", name: "Skeleton", kind: "wireframe" },
];

export const DEFAULT_CHARACTER = "mika";

export const findCharacter = (id) => CHARACTERS.find((c) => c.id === id) || CHARACTERS.find((c) => c.id === DEFAULT_CHARACTER);

const paletteEntry = (part, id) => PALETTES[part]?.find((p) => p.id === id) || PALETTES[part]?.[0];

/** Colour parts a character's model lets people change, e.g. ["skin", "hair", "outfit"]. */
export const editableParts = (character) => Object.keys(MODELS[character?.model]?.parts || {});

/** `look` with every setting valid for this character (unknown ids fall back to its own). */
export function resolveLook(character, saved) {
  const look = { ...(character?.look || {}) };
  for (const part of editableParts(character)) {
    if (saved && paletteEntry(part, saved[part])?.id === saved[part]) look[part] = saved[part];
    else look[part] = look[part] || PALETTES[part][0].id;
  }
  return look;
}

const tint = (color, mul) => color.clone().multiply(new Color(mul[0], mul[1], mul[2]));

/** Tint a loaded VRM's materials for `look`. Original colours are kept so looks can change again. */
export function applyLook(root, character, look) {
  const model = MODELS[character?.model];
  if (!model || !root) return;
  const byName = new Map();
  for (const [part, names] of Object.entries(model.parts)) for (const n of names) byName.set(n, part);
  root.traverse((obj) => {
    const mats = obj.material ? (Array.isArray(obj.material) ? obj.material : [obj.material]) : [];
    for (const mat of mats) {
      const part = byName.get(mat.name);
      if (!part || !mat.color) continue;
      mat.userData.tmOriginal ||= { color: mat.color.clone(), shade: mat.shadeColorFactor?.clone() || null };
      const mul = paletteEntry(part, look?.[part])?.mul || [1, 1, 1];
      mat.color.copy(tint(mat.userData.tmOriginal.color, mul));
      if (mat.shadeColorFactor && mat.userData.tmOriginal.shade) mat.shadeColorFactor.copy(tint(mat.userData.tmOriginal.shade, mul));
      mat.needsUpdate = true;
    }
  });
}
