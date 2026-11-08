import { apiFetch, getAccessToken } from "../../api/http";

/** REST calls for Conversation Mode (server/api/app/routers/conversations.py). */

export function createConversation(body) {
  return apiFetch("/conversations", { method: "POST", body });
}

export function getConversation(conversationId, token) {
  return apiFetch(`/conversations/${conversationId}`, { token });
}

/** Owner: issue a fresh 30-minute join code so a second device can join. */
export function shareConversation(conversationId) {
  return apiFetch(`/conversations/${conversationId}/join-code`, { method: "POST" });
}

export function endConversation(conversationId) {
  return apiFetch(`/conversations/${conversationId}/end`, { method: "POST" });
}

/** Anyone with a code can join; a signed-in user is linked to their account. */
export function joinConversation({ joinCode, displayName, role }) {
  return apiFetch("/conversations/join", {
    method: "POST",
    body: { join_code: joinCode, display_name: displayName, role },
    auth: Boolean(getAccessToken()),
  });
}

export function listUtterances(conversationId, { afterId = 0, token } = {}) {
  return apiFetch(`/conversations/${conversationId}/utterances?after_id=${afterId}`, { token });
}

/** Transcript cues: [{ start_ms, end_ms, speaker, text, gloss, plain_text, source }]. */
export function fetchTranscript(conversationId, { token } = {}) {
  return apiFetch(`/conversations/${conversationId}/transcript?format=json`, { token });
}

/** Plain-text transcript a person can read or save. */
export function transcriptToText(cues) {
  const stamp = (ms) => {
    const s = Math.floor(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  };
  return cues.map((c) => `[${stamp(c.start_ms)}] ${c.speaker}: ${c.text}`).join("\n");
}
