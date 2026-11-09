/**
 * What to tell people when speech recognition fails, and what to do about it.
 *
 * describeWebSpeechError(code) / describeWhisperError(code) ->
 *   { message, action }   action: "ignore" (keep listening), "fallback" (try the other engine),
 *                         or "stop" (stop listening and show the message)
 */

const MIC_BLOCKED =
  "Microphone access is blocked. Allow the microphone for this site in your browser's address bar, then try again.";
const MIC_MISSING = "No microphone was found. Connect a microphone and try again.";

export function describeWebSpeechError(code) {
  switch (code) {
    case "no-speech":
    case "aborted":
      return { message: null, action: "ignore" };
    case "not-allowed":
    case "service-not-allowed":
      return { message: MIC_BLOCKED, action: "stop" };
    case "audio-capture":
      return { message: MIC_MISSING, action: "stop" };
    case "network":
      return {
        message: "Your browser's speech service can't be reached (some browsers, like Brave, block it).",
        action: "fallback",
      };
    case "language-not-supported":
      return { message: "Your browser can't recognize speech in this language.", action: "fallback" };
    default:
      return { message: "Speech recognition stopped unexpectedly.", action: "fallback" };
  }
}

export function describeWhisperError(code) {
  switch (code) {
    case "not_configured":
      return { message: "Server speech recognition isn't set up.", action: "fallback" };
    case "audio_missing_or_too_large":
      return { message: "That was too long to recognize. Try shorter sentences.", action: "ignore" };
    case "invalid_base64":
    case "transcription_failed":
      return { message: "The server couldn't recognize that speech.", action: "fallback" };
    case "mic-denied":
      return { message: MIC_BLOCKED, action: "stop" };
    case "mic-missing":
      return { message: MIC_MISSING, action: "stop" };
    default:
      return { message: "Speech recognition on the server failed.", action: "fallback" };
  }
}

/** getUserMedia error -> whisper error code */
export function micErrorCode(err) {
  const name = err?.name || "";
  if (name === "NotAllowedError" || name === "SecurityError" || name === "PermissionDeniedError") return "mic-denied";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "mic-missing";
  return "mic-failed";
}
