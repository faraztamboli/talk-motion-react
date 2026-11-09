import { createSlice } from "@reduxjs/toolkit";

// Unified conversation feed for the Converter page: entries from both
// directions (signed input -> text, spoken input -> transcript) in order,
// so a mixed speaking/signing conversation reads as one thread.
let nextId = 1;

const conversationSlice = createSlice({
  name: "conversation",
  initialState: {
    entries: [], // { id, source: 'sign' | 'voice', text, time }
  },
  reducers: {
    addConversationEntry: (state, action) => {
      const { source, text } = action.payload;
      if (!text || !text.trim()) return;
      const last = state.entries[state.entries.length - 1];
      // consecutive duplicates from the same side are prediction repeats
      if (last && last.source === source && last.text === text) return;
      state.entries.push({
        id: nextId++,
        source,
        text,
        time: Date.now(),
      });
      // keep the feed bounded for long sessions
      if (state.entries.length > 200) {
        state.entries.splice(0, state.entries.length - 200);
      }
    },
    clearConversation: (state) => {
      state.entries = [];
    },
  },
});

export const { addConversationEntry, clearConversation } =
  conversationSlice.actions;
export default conversationSlice.reducer;
