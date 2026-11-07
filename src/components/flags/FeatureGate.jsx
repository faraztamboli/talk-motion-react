import { useFlag } from "../../hooks/useFlag";

/** Render children only when `flag` is on. */
export default function FeatureGate({ flag, fallback = null, children }) {
  return useFlag(flag) ? children : fallback;
}
