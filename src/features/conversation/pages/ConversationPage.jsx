import React from "react";
import { useLocation, useParams } from "react-router-dom";
import ConversationView from "../components/ConversationView";
import { getAccessToken } from "../../../api/http";

/** /conversation/:conversationId for a signed-in participant. */
export default function ConversationPage() {
  const { conversationId } = useParams();
  const location = useLocation();
  return (
    <ConversationView
      key={conversationId}
      conversationId={conversationId}
      getToken={getAccessToken}
      initialShare={location.state}
    />
  );
}
