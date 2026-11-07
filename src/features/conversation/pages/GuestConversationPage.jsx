import React, { useCallback } from "react";
import { Navigate, useParams } from "react-router-dom";
import ConversationView from "../components/ConversationView";
import { loadGuestSession } from "../guestSession";

/** /join/live/:conversationId for someone who joined by code. */
export default function GuestConversationPage() {
  const { conversationId } = useParams();
  const session = loadGuestSession(conversationId);
  const token = session?.participant_token;
  const getToken = useCallback(() => token, [token]);

  if (!token) return <Navigate to="/join" replace />;
  return <ConversationView key={conversationId} conversationId={conversationId} getToken={getToken} guest />;
}
