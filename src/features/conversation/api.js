import { apiFetch, getAccessToken } from "../../api/http";

/** REST calls for Conversation Mode (server/api/app/routers/conversations.py). */

export function createConversation(body) {
  return apiFetch("/conversations", { method: "POST", body });
}

/** Start a captioned lesson (settings.kind="lesson"): students join one code as readers. */
export function createLesson(classroomName) {
  return createConversation({
    title: `${classroomName} lesson`,
    mode: "two_device",
    owner_role: "partner",
    settings: { kind: "lesson", plain_language: true },
  });
}

/** Conversations this account owns or joined, newest first (at most 50). */
export function listConversations() {
  return apiFetch("/conversations");
}

/** Owner only: deletes the conversation and everything said in it. */
export function deleteConversation(conversationId) {
  return apiFetch(`/conversations/${conversationId}`, { method: "DELETE" });
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

/** Saves the transcript as a .txt file on this device. */
export async function downloadTranscript(conversationId, { token, startedAt } = {}) {
  const res = await fetchTranscript(conversationId, { token });
  const blob = new Blob([transcriptToText(res.cues)], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `conversation-${String(startedAt || new Date().toISOString()).slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
