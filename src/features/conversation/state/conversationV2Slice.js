import { createSlice } from "@reduxjs/toolkit";

const MAX_UTTERANCES = 300;

const initialState = {
  conversationId: null,
  socket: "idle", // idle | connecting | open | reconnecting | closed
  ended: false,
  error: null, // { code, message } of the last server error
  me: null, // { participantId, role, displayName, isOwner }
  info: null, // { mode, spoken_language, sign_language, settings }
  asrProvider: null,
  asrServerSide: false,
  ttsProvider: null,
  llmAvailable: false,
  participants: {}, // participantId -> { participantId, role, displayName, online }
  utterances: [], // final utterances, oldest first
  partials: {}, // participantId -> text still being recognised
  typing: {}, // participantId -> true
  suggestions: null, // { draftId, kind, items: [{ text }], requestId, available, error }
  speaking: null, // { utteranceId, text } while this device is playing speech
};

function upsertParticipant(state, p) {
  state.participants[p.participant_id] = {
    participantId: p.participant_id,
    role: p.role,
    displayName: p.display_name,
    online: p.online ?? state.participants[p.participant_id]?.online ?? false,
  };
}

function addUtterances(state, list) {
  const known = new Set(state.utterances.map((u) => u.id));
  for (const u of list) {
    if (!known.has(u.id)) {
      state.utterances.push(u);
      known.add(u.id);
    }
  }
  state.utterances.sort((a, b) => a.id - b.id);
  if (state.utterances.length > MAX_UTTERANCES) {
    state.utterances.splice(0, state.utterances.length - MAX_UTTERANCES);
  }
}

export const conversationV2Slice = createSlice({
  name: "conversationV2",
  initialState,
  reducers: {
    conversationOpened: (state, action) => ({ ...initialState, conversationId: action.payload }),
    socketChanged: (state, action) => {
      state.socket = action.payload;
    },
    helloAck: (state, action) => {
      const p = action.payload;
      state.me = {
        participantId: p.participant_id,
        role: p.role,
        displayName: p.display_name,
        isOwner: Boolean(p.is_owner),
      };
      state.info = p.conversation;
      state.asrProvider = p.asr_provider;
      state.asrServerSide = Boolean(p.asr_server_side);
      state.ttsProvider = p.tts_provider;
      state.llmAvailable = Boolean(p.llm_available);
      state.participants = {};
      (p.participants || []).forEach((participant) => upsertParticipant(state, participant));
    },
    participantJoined: (state, action) => {
      upsertParticipant(state, { ...action.payload, online: true });
    },
    participantLeft: (state, action) => {
      upsertParticipant(state, { ...action.payload, online: false });
      delete state.partials[action.payload.participant_id];
      delete state.typing[action.payload.participant_id];
    },
    utterancePartial: (state, action) => {
      const { participant_id: pid, text } = action.payload;
      state.partials[pid] = text;
    },
    utteranceFinal: (state, action) => {
      addUtterances(state, [action.payload]);
      delete state.partials[action.payload.participant_id];
    },
    utterancesLoaded: (state, action) => {
      addUtterances(state, action.payload || []);
    },
    utteranceEnriched: (state, action) => {
      const { utterance_id: id, gloss, plain_text: plainText } = action.payload;
      const u = state.utterances.find((item) => item.id === id);
      if (!u) return;
      if (gloss) u.gloss = gloss;
      if (plainText) u.plain_text = plainText;
    },
    typingChanged: (state, action) => {
      const { participant_id: pid, is_typing: isTyping } = action.payload;
      if (isTyping) state.typing[pid] = true;
      else delete state.typing[pid];
    },
    suggestionsReceived: (state, action) => {
      const p = action.payload;
      state.suggestions = {
        draftId: p.draft_id || null,
        kind: p.kind,
        items: p.items || [],
        requestId: p.request_id || null,
        available: p.available !== false,
        error: p.error || null,
      };
    },
    suggestionsCleared: (state) => {
      state.suggestions = null;
    },
    speakingStarted: (state, action) => {
      state.speaking = action.payload;
    },
    speakingEnded: (state) => {
      state.speaking = null;
    },
    conversationEnded: (state) => {
      state.ended = true;
      state.partials = {};
      state.typing = {};
    },
    serverError: (state, action) => {
      state.error = action.payload;
    },
    errorCleared: (state) => {
      state.error = null;
    },
  },
});

export const {
  conversationOpened,
  socketChanged,
  helloAck,
  participantJoined,
  participantLeft,
  utterancePartial,
  utteranceFinal,
  utterancesLoaded,
  utteranceEnriched,
  typingChanged,
  suggestionsReceived,
  suggestionsCleared,
  speakingStarted,
  speakingEnded,
  conversationEnded,
  serverError,
  errorCleared,
} = conversationV2Slice.actions;

export default conversationV2Slice.reducer;
