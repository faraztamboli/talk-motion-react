/**
 * Participant tokens for people who joined by code. Kept per conversation in
 * sessionStorage, so a reload keeps you in the conversation but closing the tab ends it.
 */

const key = (conversationId) => `tm_conv_guest:${conversationId}`;

export function saveGuestSession(conversationId, session) {
  try {
    sessionStorage.setItem(key(conversationId), JSON.stringify(session));
  } catch {
    // storage unavailable: the guest stays connected until reload
  }
}

export function loadGuestSession(conversationId) {
  try {
    const raw = sessionStorage.getItem(key(conversationId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearGuestSession(conversationId) {
  try {
    sessionStorage.removeItem(key(conversationId));
  } catch {
    // ignore
  }
}
