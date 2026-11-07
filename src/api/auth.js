import { apiFetch, clearTokens, setTokens } from "./http";

/** Sign in to the TalkMotion 2.0 API. Resolves with the token pair. */
export async function apiLogin(emailOrUsername, password) {
  const tokens = await apiFetch("/auth/login", {
    method: "POST",
    body: { email_or_username: emailOrUsername, password },
    auth: false,
    timeoutMs: 6000,
  });
  setTokens(tokens);
  return tokens;
}

/** Current user, including resolved feature flags (`flags`). */
export function fetchMe() {
  return apiFetch("/me");
}

export function fetchMyFlags() {
  return apiFetch("/me/flags");
}

/** Tokens are stateless JWTs today, so signing out is client-side. */
export function apiLogout() {
  clearTokens();
}
