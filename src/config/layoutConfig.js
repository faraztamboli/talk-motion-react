// Enter the pathname of the pages in which you want header and siderbar (LOWERCASE)
const noAuthLayoutPages = [
  "", // home route
  "dashboard",
  "converter",
  "trainer",
  "trainer/collect",
  "trainer/train",
  "trainer/upload",
  "models",
  "profile",
  "my-models",
  "setting",
  "my-subscriptions",
  "uploadvideo",
  "video-subtitles",
  "store",
  "courses",
  "classrooms",
  "classroom",
  "staff-rooms",
  // TalkMotion 2.0 Conversation Mode (signed-in owner). Guest pages (/join, /c) render
  // without app chrome on purpose: the person joining may have no account.
  "conversation",
];

// First path segments of pages that work without the RemotePy socket (they use the
// TalkMotion 2.0 API instead).
const remotePyOptionalPages = ["conversation", "join", "c"];

function isRemotePyOptionalPath(pathname = "") {
  const first = (pathname.split("/")[1] || "").toLowerCase();
  return remotePyOptionalPages.includes(first);
}

export { remotePyOptionalPages, isRemotePyOptionalPath };

export { noAuthLayoutPages };
