import React from "react";
import { Navigate } from "react-router-dom";
import { Skeleton } from "antd";
import PrivateRoute from "../PrivateRoute";
import NotFound from "../../pages/Errors/404Error";
import { useFlag, useFlagsReady } from "../../hooks/useFlag";

/**
 * Route element for a feature behind a flag. When the flag is off the page is hidden:
 * the user goes to Conversation Mode if they have it, otherwise sees the 404 page.
 * Use as: <Route path="/x" element={<FlagRoute flag="..." />}> ...children </Route>
 *
 * @param {string} flag
 * @param {"remotepy"|"api"} auth session the page needs once visible
 * @param {"auto"|"404"} fallback
 */
export default function FlagRoute({ flag, auth = "remotepy", fallback = "auto" }) {
  const enabled = useFlag(flag);
  const conversationEnabled = useFlag("conversation_v2");
  const ready = useFlagsReady();

  if (!ready) return <Skeleton active style={{ padding: "24px", height: "90vh" }} />;
  if (!enabled) {
    if (fallback === "auto" && conversationEnabled && flag !== "conversation_v2") {
      return <Navigate to="/conversation" replace />;
    }
    return <NotFound />;
  }
  return <PrivateRoute auth={auth} />;
}
