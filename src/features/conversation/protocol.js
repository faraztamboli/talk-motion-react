/**
 * Conversation WebSocket protocol (docs: server/docs/architecture/11-phase1-conversation-mode.md).
 * Envelope: { id, type, conversation_id, author_id, ts, payload }.
 */
import {
  conversationEnded,
  helloAck,
  participantJoined,
  participantLeft,
  serverError,
  suggestionsReceived,
  typingChanged,
  utteranceEnriched,
  utteranceFinal,
  utterancePartial,
} from "./state/conversationV2Slice";

export function newId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function envelope(type, payload = {}) {
  return { id: newId(), type, payload };
}

const ACTIONS = {
  "hello.ack": helloAck,
  "participant.joined": participantJoined,
  "participant.left": participantLeft,
  "utterance.partial": utterancePartial,
  "utterance.final": utteranceFinal,
  "utterance.enrich": utteranceEnriched,
  "typing.state": typingChanged,
  "draft.suggestions": suggestionsReceived,
  "conversation.ended": conversationEnded,
  error: serverError,
};

/** Route a server envelope to the store. Returns true if it was a state message. */
export function dispatchEnvelope(dispatch, message) {
  const action = ACTIONS[message?.type];
  if (!action) return false;
  dispatch(action(message.payload || {}));
  return true;
}

/** Hex of a UUID string or of the first 16 bytes of a binary frame. */
export function speechIdHex(value) {
  if (typeof value === "string") return value.replace(/-/g, "").toLowerCase();
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  return Array.from(bytes.slice(0, 16), (b) => b.toString(16).padStart(2, "0")).join("");
}
