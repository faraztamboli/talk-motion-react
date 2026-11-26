/**
 * What people can do from Home, in plain words. One card per goal, not per feature.
 * `flag` hides a card until that feature flag is on (see src/config/flags.js).
 */
export const HOME_TASKS = [
  {
    key: "talk",
    label: "Talk with someone",
    hint: "Start a live chat. Speech becomes text, and your typing can be spoken out loud.",
    path: "/conversation",
    icon: "message",
    color: "#1677ff",
    flag: "conversation_v2",
  },
  {
    key: "translate",
    label: "Translate signs and speech",
    hint: "Sign to the camera to hear it, or speak to see it signed.",
    path: "/converter",
    icon: "translate",
    color: "#fa8c16",
  },
  {
    key: "make-video",
    label: "Make a captioned video",
    hint: "Pick a YouTube video, add your signing and captions, and share it.",
    path: "/video-subtitles/designer",
    icon: "camera",
    color: "#eb2f96",
  },
  {
    key: "videos",
    label: "Watch my videos",
    hint: "Everything you made or that was shared with you.",
    path: "/video-subtitles/mylibrary",
    icon: "play",
    color: "#722ed1",
  },
  {
    key: "classrooms",
    label: "Go to my classrooms",
    hint: "See your classes, join one, or start your own.",
    path: "/classrooms",
    icon: "team",
    color: "#52c41a",
  },
  {
    key: "courses",
    label: "Open my courses",
    hint: "Lessons organised in folders, ready to learn or teach.",
    path: "/courses",
    icon: "book",
    color: "#13a8a8",
  },
  {
    key: "models",
    label: "Teach the app a new sign",
    hint: "Record a sign a few times and train your own sign model.",
    path: "/models",
    icon: "model",
    color: "#d46b08",
    flag: "legacy_models_visible",
  },
];

export function visibleTasks(flags = {}) {
  return HOME_TASKS.filter((t) => !t.flag || Boolean(flags[t.flag]));
}
