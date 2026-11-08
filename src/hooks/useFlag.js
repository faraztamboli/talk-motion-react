import { shallowEqual, useSelector } from "react-redux";

/** Current value of one feature flag (see src/config/flags.js). */
export function useFlag(name) {
  return useSelector((state) => Boolean(state.flags.values[name]));
}

/** All feature flag values. */
export function useFlags() {
  return useSelector((state) => state.flags.values, shallowEqual);
}

/**
 * False while the API session is still being established, so routes don't flash a
 * "hidden" state before the user's own flags arrive.
 */
export function useFlagsReady() {
  return useSelector((state) => state.apiAuth.status !== "authenticating");
}

export default useFlag;
