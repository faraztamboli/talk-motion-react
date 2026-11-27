import { useCallback, useMemo, useState } from "react";
import { readPref, writePref } from "../prefs";
import { DEFAULT_CHARACTER, findCharacter, resolveLook } from "./characters";

function readLooks() {
  try {
    const parsed = JSON.parse(readPref("avatarLooks", "{}"));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Which character the avatar shows and its colours, remembered on this device. Each character
 * keeps its own colour choices, so changing Noor's hair doesn't change Mika's.
 */
export default function useAvatarLook() {
  const [id, setId] = useState(() => findCharacter(readPref("avatarCharacter", DEFAULT_CHARACTER)).id);
  const [looks, setLooks] = useState(readLooks);
  const [skeleton, setSkeletonState] = useState(() => readPref("avatarSkeleton", "") === "1");
  const character = findCharacter(id);
  const look = useMemo(() => resolveLook(character, looks[character.id]), [character, looks]);

  const chooseCharacter = useCallback((next) => {
    const c = findCharacter(next);
    setId(c.id);
    writePref("avatarCharacter", c.id);
  }, []);

  const setPart = useCallback(
    (part, value) => {
      setLooks((prev) => {
        const next = { ...prev, [character.id]: { ...resolveLook(character, prev[character.id]), [part]: value } };
        writePref("avatarLooks", JSON.stringify(next));
        return next;
      });
    },
    [character]
  );

  const resetLook = useCallback(() => {
    setLooks((prev) => {
      const next = { ...prev };
      delete next[character.id];
      writePref("avatarLooks", JSON.stringify(next));
      return next;
    });
  }, [character]);

  /** Draw the skeleton (the raw tracking) in a corner of the character's picture. */
  const setSkeleton = useCallback((on) => {
    setSkeletonState(Boolean(on));
    writePref("avatarSkeleton", on ? "1" : "");
  }, []);

  return { character, look, skeleton, chooseCharacter, setPart, resetLook, setSkeleton };
}
