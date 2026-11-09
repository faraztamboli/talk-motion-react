import React from "react";
import RecordingLibrary from "../features/videoSubtitles/library/RecordingLibrary";

/** /video-subtitles/mylibrary — the user's recordings and recordings shared with them. */
export default function VideoSubtitlesMyLibrary() {
  return <RecordingLibrary mode="personal" />;
}
