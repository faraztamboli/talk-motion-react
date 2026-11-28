import { useSelector } from "react-redux";
import { useGetMyClassroomRequestsQuery } from "./teachApi";

// Re-check now and then so a teacher sees new requests without reloading the page.
const CHECK_EVERY_MS = 2 * 60 * 1000;

/**
 * People asking to join the classrooms this person runs. Shared by the sidebar count, the
 * Home banner and My classrooms (one request, one cache). Nothing is asked while signed out.
 */
export default function useWaitingRequests() {
  const signedIn = useSelector((state) => Boolean(state.login?.isLoggedIn));
  const { data = [] } = useGetMyClassroomRequestsQuery(undefined, {
    skip: !signedIn,
    pollingInterval: CHECK_EVERY_MS,
  });
  return data;
}

/** "1 person is" / "3 people are" asking to join, as one sentence. */
export function waitingText(t, count) {
  return count === 1
    ? t("teach.waiting.one", "1 person is asking to join your classrooms.")
    : t("teach.waiting.text", "{{count}} people are asking to join your classrooms.", { count });
}
