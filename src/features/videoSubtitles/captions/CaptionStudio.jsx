import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { Alert, Button, Checkbox, Collapse, Dropdown, Input, InputNumber, Modal, Popconfirm, Progress, Select, Space, Tooltip, Typography, message } from "antd";
import {
  AudioOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ExclamationCircleFilled,
  ImportOutlined,
  LoadingOutlined,
  MinusOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { cuesToSrt, cuesToVtt, formatClock, parseCaptionFile } from "./cueFormats";
import { addCueAt, checkCues, cuesSignature, findCueIndexAt, mergeCues, nudgeCue, removeCue, setCueBoundary, sortCues, updateCue } from "./cueOps";
import useAutoCaptions from "../../autoCaptions/useAutoCaptions";
import { useDeleteCaptionsMutation, useSaveCaptionsMutation } from "../recordingsApi";
import { rpcErrorMessage } from "../../../api/rpc";

export const CAPTION_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "pt", label: "Português" },
  { value: "ar", label: "العربية" },
  { value: "ur", label: "اردو" },
  { value: "hi", label: "हिन्दी" },
  { value: "zh", label: "中文" },
];

const languageLabel = (code) => CAPTION_LANGUAGES.find((l) => l.value === code)?.label || code;
const NUDGE_MS = 100;
export const AUTOSAVE_MS = 1200;
const PAUSE_KEY = "tm_captions_pause_while_typing";

/** How long a new caption shows: about the time it takes to read it. */
export function readingTimeMs(text) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.min(7000, Math.max(1500, 600 + words * 400));
}

function download(text, filename, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function loadPausePref() {
  try {
    return localStorage.getItem(PAUSE_KEY) !== "0";
  } catch {
    return true;
  }
}

/**
 * Text captions, made the simple way: play the video, type what is said, press Enter. The
 * caption starts where you began typing (the video pauses while you type, if you like) and
 * lasts about as long as it takes to read. Everything saves by itself.
 *
 * Fine timing, other languages, caption files and automatic captions from an audio file are
 * under "More options".
 */
export default function CaptionStudio({ recordingId, tracks, captionsAvailable, getTimeMs, playerTimeMs, playing, onSeek, onPlay, onPause, onDirtyChange, onSaveStateChange }) {
  const { t } = useTranslation();
  const apiSignedIn = useSelector((s) => s.apiAuth?.status === "authenticated");
  const [messageApi, contextHolder] = message.useMessage();
  const [language, setLanguage] = useState(tracks?.[0]?.language || "en");
  const track = useMemo(() => (tracks || []).find((tr) => tr.language === language) || null, [tracks, language]);
  const [cues, setCues] = useState(() => track?.cues || []);
  const [baseline, setBaseline] = useState(() => cuesSignature(track?.cues || []));
  const [saveState, setSaveState] = useState({ status: "idle", error: null }); // idle | saving | saved | error
  const [draft, setDraft] = useState("");
  const [pauseWhileTyping, setPauseWhileTyping] = useState(loadPausePref);
  const [timingOpen, setTimingOpen] = useState(null); // cue id
  const [shiftSeconds, setShiftSeconds] = useState(0);
  const [mergePrompt, setMergePrompt] = useState(null); // { incoming, source }
  const draftStart = useRef(null);
  const resumeAfter = useRef(false);
  const fileRef = useRef(null);
  const mediaRef = useRef(null);
  const saveSeq = useRef(0);

  const [saveCaptions] = useSaveCaptionsMutation();
  const [deleteCaptions, deleteState] = useDeleteCaptionsMutation();
  const auto = useAutoCaptions();

  const signature = cuesSignature(cues);
  const dirty = signature !== baseline;
  const check = checkCues(cues);
  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);
  useEffect(() => onSaveStateChange?.(saveState.status), [saveState.status, onSaveStateChange]);

  // A fresh server copy (another tab, a refetch) replaces ours only when ours has no unsaved
  // edits and really differs, so the text box being typed in is never swapped out.
  const serverSignature = cuesSignature(track?.cues || []);
  useEffect(() => {
    if (!dirty && serverSignature !== signature) {
      setCues(track?.cues || []);
      setBaseline(serverSignature);
    }
  }, [serverSignature, language]);

  const save = useCallback(
    async (toSave) => {
      const seq = ++saveSeq.current;
      setSaveState({ status: "saving", error: null });
      const res = await saveCaptions({ recordingId, language, label: languageLabel(language), cues: toSave });
      if (seq !== saveSeq.current) return !res.error;
      if (res.error) {
        setSaveState({ status: "error", error: rpcErrorMessage(res.error, t("subtitles.captions.saveFailed", "The captions couldn't be saved.")) });
        return false;
      }
      setBaseline(cuesSignature(toSave));
      setSaveState({ status: "saved", error: null });
      return true;
    },
    [language, recordingId, saveCaptions, t]
  );

  // Save by itself a moment after each change.
  useEffect(() => {
    if (!dirty || check.errors.length) return undefined;
    const timer = setTimeout(() => save(cues), AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [signature, dirty, check.errors.length]);

  // ---------------------------------------------------------------- typing new captions

  const onDraftChange = (value) => {
    if (!draft && value) {
      draftStart.current = getTimeMs();
      if (pauseWhileTyping && playing) {
        onPause?.();
        resumeAfter.current = true;
      }
    }
    if (!value) draftStart.current = null;
    setDraft(value);
  };

  const commitDraft = () => {
    const text = draft.trim();
    if (!text) return;
    const start = draftStart.current ?? getTimeMs();
    const { cues: next } = addCueAt(cues, start, { durationMs: readingTimeMs(text), text });
    setCues(next);
    setDraft("");
    draftStart.current = null;
    if (resumeAfter.current) {
      resumeAfter.current = false;
      onPlay?.();
    }
  };

  const togglePause = (on) => {
    setPauseWhileTyping(on);
    try {
      localStorage.setItem(PAUSE_KEY, on ? "1" : "0");
    } catch {
      // per-browser convenience only
    }
  };

  // ---------------------------------------------------------------- files and automatic captions

  const merge = useCallback(
    (incoming, sourceLabel, mode) => {
      setCues((prev) => mergeCues(prev, incoming, mode));
      setMergePrompt(null);
      messageApi.success(t("subtitles.captions.loadedAuto", "{{count}} captions added from {{source}}.", { count: incoming.length, source: sourceLabel }));
    },
    [messageApi, t]
  );

  const applyIncoming = useCallback(
    (incoming, sourceLabel) => {
      if (!incoming.length) {
        messageApi.warning(t("subtitles.captions.noneFound", "No captions were found in {{source}}.", { source: sourceLabel }));
        return;
      }
      if (cues.length) setMergePrompt({ incoming, source: sourceLabel });
      else merge(incoming, sourceLabel, "replace");
    },
    [cues.length, merge, messageApi, t]
  );

  const autoHandled = useRef(null);
  useEffect(() => {
    if (auto.status === "done" && autoHandled.current !== auto.subtitles) {
      autoHandled.current = auto.subtitles;
      applyIncoming(sortCues(auto.subtitles.map((s) => ({ ...s }))), t("subtitles.captions.autoSource", "speech recognition"));
    }
  }, [auto.status, auto.subtitles, applyIncoming, t]);

  const onImportFile = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      messageApi.error(t("subtitles.captions.fileTooBig", "Caption files can be up to 5 MB."));
      return;
    }
    const text = await file.text();
    const { cues: parsed, errors, format } = parseCaptionFile(text, file.name);
    if (!format) {
      messageApi.error(errors[0]);
      return;
    }
    if (errors.length) messageApi.warning(t("subtitles.captions.skipped", "{{count}} part(s) of the file couldn't be read and were skipped.", { count: errors.length }));
    applyIncoming(parsed, file.name);
  };

  const shiftAll = () => {
    const delta = Math.round((Number(shiftSeconds) || 0) * 1000);
    if (!delta) return;
    setCues((prev) =>
      sortCues(prev.map((c) => ({ ...c, startMs: Math.max(0, c.startMs + delta), endMs: Math.max(1, c.endMs + delta) })).filter((c) => c.endMs > c.startMs))
    );
    setShiftSeconds(0);
  };

  const removeTrack = async () => {
    const res = await deleteCaptions({ recordingId, language });
    if (res.error) {
      messageApi.error(rpcErrorMessage(res.error));
      return;
    }
    setCues([]);
    setBaseline(cuesSignature([]));
    messageApi.success(t("subtitles.captions.deleted", "Captions deleted."));
  };

  const switchLanguage = async (next) => {
    if (next === language) return;
    if (dirty && !check.errors.length) await save(cues);
    const nextTrack = (tracks || []).find((tr) => tr.language === next);
    setLanguage(next);
    setCues(nextTrack?.cues || []);
    setBaseline(cuesSignature(nextTrack?.cues || []));
    setSaveState({ status: "idle", error: null });
  };

  if (!captionsAvailable) {
    return (
      <Alert
        type="info"
        showIcon
        message={t("subtitles.captions.unavailable", "Text captions aren't available on this server yet.")}
        description={t("subtitles.captions.unavailableHelp", "Your sign-language recording works as usual. Captions can be added once the server is updated.")}
      />
    );
  }

  const activeIndex = findCueIndexAt(cues, playerTimeMs);
  const busyAuto = auto.status === "uploading" || auto.status === "transcribing";
  const languages = Array.from(new Set([...CAPTION_LANGUAGES.map((l) => l.value), ...(tracks || []).map((tr) => tr.language)]));
  const at = formatClock(draftStart.current ?? playerTimeMs ?? 0);

  return (
    <div className="tm-cc">
      {contextHolder}
      <Modal
        open={Boolean(mergePrompt)}
        title={t("subtitles.captions.mergeTitle", "You already have captions")}
        onCancel={() => setMergePrompt(null)}
        footer={[
          <Button key="cancel" onClick={() => setMergePrompt(null)}>
            {t("subtitles.captions.cancel", "Cancel")}
          </Button>,
          <Button key="add" onClick={() => merge(mergePrompt.incoming, mergePrompt.source, "append")}>
            {t("subtitles.captions.add", "Add to them")}
          </Button>,
          <Button key="replace" type="primary" danger onClick={() => merge(mergePrompt.incoming, mergePrompt.source, "replace")}>
            {t("subtitles.captions.replace", "Replace them")}
          </Button>,
        ]}
      >
        {mergePrompt &&
          t("subtitles.captions.mergeBody", "Replace your {{existing}} captions with the {{count}} new ones, or add the new ones to them?", {
            existing: cues.length,
            count: mergePrompt.incoming.length,
          })}
      </Modal>

      <div className="tm-cc-head">
        <div>
          <Typography.Title level={4} className="tm-cc-title">
            {t("subtitles.captions.title", "Captions")} <span className="tm-cc-optional">{t("subtitles.captions.optional", "optional")}</span>
          </Typography.Title>
          <Typography.Text type="secondary">
            {t("subtitles.captions.intro", "Play the video. When someone speaks, type what they say and press Enter.")}
          </Typography.Text>
        </div>
        <span className={`tm-cc-save is-${saveState.status}`} role="status" aria-live="polite">
          {saveState.status === "saving" && (
            <>
              <LoadingOutlined aria-hidden /> {t("subtitles.captions.saving", "Saving…")}
            </>
          )}
          {saveState.status === "saved" && !dirty && (
            <>
              <CheckCircleFilled aria-hidden /> {t("subtitles.captions.savedState", "Saved")}
            </>
          )}
          {saveState.status === "error" && (
            <>
              <ExclamationCircleFilled aria-hidden /> {t("subtitles.captions.notSaved", "Not saved")}{" "}
              <Button size="small" type="link" onClick={() => save(cues)}>
                {t("subtitles.tryAgain", "Try again")}
              </Button>
            </>
          )}
        </span>
      </div>

      <div className="tm-cc-type">
        <span className="tm-cc-at" aria-hidden>
          {at}
        </span>
        <Input
          size="large"
          value={draft}
          maxLength={500}
          onChange={(e) => onDraftChange(e.target.value)}
          onPressEnter={(e) => {
            e.preventDefault();
            commitDraft();
          }}
          placeholder={t("subtitles.captions.typePlaceholder", "Type what is said here, then press Enter")}
          aria-label={t("subtitles.captions.typeLabel", "New caption at {{time}}", { time: at })}
        />
        <Button size="large" type="primary" icon={<PlusOutlined />} onClick={commitDraft} disabled={!draft.trim()}>
          {t("subtitles.captions.addButton", "Add")}
        </Button>
      </div>
      <Checkbox className="tm-cc-pause" checked={pauseWhileTyping} onChange={(e) => togglePause(e.target.checked)}>
        {t("subtitles.captions.pauseWhileTyping", "Pause the video while I type")}
      </Checkbox>

      {saveState.status === "error" && <Alert className="tm-sub-gap" type="error" showIcon message={saveState.error} />}
      {check.errors.length > 0 && <Alert className="tm-sub-gap" type="error" showIcon message={check.errors[0]} />}

      {cues.length === 0 ? (
        <div className="tm-takes-empty tm-cc-empty">
          <strong>{t("subtitles.captions.emptyTitle", "No captions yet")}</strong>
          <p>{t("subtitles.captions.emptyBody", "Captions help people who read rather than sign. You can skip this step.")}</p>
        </div>
      ) : (
        <ol className="tm-cc-list" aria-label={t("subtitles.captions.listLabel", "Your captions")}>
          {cues.map((cue, index) => (
            <li key={cue.id} className={`tm-cc-item ${index === activeIndex ? "is-active" : ""}`}>
              <div className="tm-cc-row">
                <Tooltip title={t("subtitles.captions.playFrom", "Play from this caption")}>
                  <Button
                    size="small"
                    className="tm-cc-time"
                    onClick={() => {
                      onSeek(cue.startMs / 1000);
                      onPlay?.();
                    }}
                    aria-label={t("subtitles.captions.playFromAt", "Play from {{time}}", { time: formatClock(cue.startMs) })}
                  >
                    {formatClock(cue.startMs)}
                  </Button>
                </Tooltip>
                <Input
                  className="tm-cc-text"
                  value={cue.text}
                  maxLength={500}
                  onChange={(e) => setCues((p) => updateCue(p, cue.id, { text: e.target.value }))}
                  aria-label={t("subtitles.captions.textLabel", "Caption {{n}} text", { n: index + 1 })}
                />
                <Tooltip title={t("subtitles.captions.adjustTiming", "Adjust timing")}>
                  <Button
                    size="small"
                    type={timingOpen === cue.id ? "primary" : "text"}
                    icon={<ClockCircleOutlined />}
                    aria-expanded={timingOpen === cue.id}
                    aria-label={t("subtitles.captions.adjustTimingN", "Adjust timing of caption {{n}}", { n: index + 1 })}
                    onClick={() => setTimingOpen((open) => (open === cue.id ? null : cue.id))}
                  />
                </Tooltip>
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  aria-label={t("subtitles.captions.remove", "Remove caption {{n}}", { n: index + 1 })}
                  onClick={() => setCues((p) => removeCue(p, cue.id))}
                />
              </div>
              {timingOpen === cue.id && (
                <div className="tm-cc-timing">
                  <TimeControl
                    label={t("subtitles.captions.start", "Starts")}
                    ms={cue.startMs}
                    onNow={() => setCues((p) => setCueBoundary(p, cue.id, "startMs", getTimeMs()))}
                    onNudge={(d) => setCues((p) => nudgeCue(p, cue.id, "startMs", d))}
                    t={t}
                  />
                  <TimeControl
                    label={t("subtitles.captions.end", "Ends")}
                    ms={cue.endMs}
                    onNow={() => setCues((p) => setCueBoundary(p, cue.id, "endMs", getTimeMs()))}
                    onNudge={(d) => setCues((p) => nudgeCue(p, cue.id, "endMs", d))}
                    t={t}
                  />
                  <Typography.Text type="secondary" className="tm-sub-help">
                    {t("subtitles.captions.timingHelp", "Press a time to set it to where the video is now, or use − and + to move it by a tenth of a second.")}
                  </Typography.Text>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}

      {busyAuto && (
        <div className="tm-sub-gap">
          <Progress percent={auto.status === "uploading" ? Math.round(auto.progress * 100) : 100} status={auto.status === "transcribing" ? "active" : undefined} />
          <Space>
            <Typography.Text type="secondary">
              {auto.status === "uploading" ? t("subtitles.captions.uploadingAudio", "Uploading the audio…") : t("subtitles.captions.listening", "Listening to the audio. This takes about as long as the recording.")}
            </Typography.Text>
            <Button size="small" onClick={auto.cancel}>
              {t("subtitles.captions.cancel", "Cancel")}
            </Button>
          </Space>
        </div>
      )}
      {auto.status === "error" && auto.error && <Alert className="tm-sub-gap" type="error" showIcon message={t(auto.error.key, auto.error.fallback)} closable onClose={auto.reset} />}

      <Collapse
        ghost
        className="tm-cc-more"
        items={[
          {
            key: "more",
            label: t("subtitles.captions.more", "More options: language, caption files, automatic captions"),
            children: (
              <div className="tm-cc-more-body">
                <label className="tm-sub-inline">
                  <span>{t("subtitles.captions.language", "Language")}</span>
                  <Select
                    value={language}
                    onChange={switchLanguage}
                    options={languages.map((code) => ({
                      value: code,
                      label: `${languageLabel(code)}${(tracks || []).some((tr) => tr.language === code) ? " ✓" : ""}`,
                    }))}
                    className="tm-sub-lang"
                    aria-label={t("subtitles.captions.language", "Language")}
                  />
                </label>
                <Space wrap>
                  <Button icon={<ImportOutlined />} onClick={() => fileRef.current?.click()}>
                    {t("subtitles.captions.import", "Import a caption file (.vtt, .srt)")}
                  </Button>
                  <Tooltip title={apiSignedIn ? t("subtitles.captions.autoHelp", "Works best with the same audio as the YouTube video, starting at 0:00.") : t("subtitles.captions.autoNeedsSignIn", "Sign in again to use automatic captions.")}>
                    <Button icon={<AudioOutlined />} disabled={!apiSignedIn || busyAuto} onClick={() => mediaRef.current?.click()}>
                      {t("subtitles.captions.auto", "Make captions from an audio file")}
                    </Button>
                  </Tooltip>
                  <Dropdown
                    disabled={!cues.length}
                    menu={{
                      items: [
                        { key: "vtt", label: "WebVTT (.vtt)" },
                        { key: "srt", label: "SubRip (.srt)" },
                      ],
                      onClick: ({ key }) =>
                        key === "vtt" ? download(cuesToVtt(cues), `captions-${language}.vtt`, "text/vtt") : download(cuesToSrt(cues), `captions-${language}.srt`, "application/x-subrip"),
                    }}
                  >
                    <Button icon={<DownloadOutlined />}>{t("subtitles.captions.export", "Download")}</Button>
                  </Dropdown>
                </Space>
                <Space wrap>
                  <label className="tm-sub-inline">
                    <span>{t("subtitles.captions.shift", "Move all captions by")}</span>
                    <InputNumber value={shiftSeconds} onChange={setShiftSeconds} step={0.5} size="small" addonAfter="s" aria-label={t("subtitles.captions.shiftLabel", "Seconds to move all captions")} />
                  </label>
                  <Button size="small" onClick={shiftAll} disabled={!cues.length || !Number(shiftSeconds)}>
                    {t("subtitles.captions.applyShift", "Move")}
                  </Button>
                  {track && (
                    <Popconfirm title={t("subtitles.captions.deleteTrackQ", "Delete the {{lang}} captions?", { lang: languageLabel(language) })} okText={t("subtitles.delete", "Delete")} okButtonProps={{ danger: true }} onConfirm={removeTrack}>
                      <Button size="small" danger loading={deleteState.isLoading}>
                        {t("subtitles.captions.deleteTrack", "Delete all {{lang}} captions", { lang: languageLabel(language) })}
                      </Button>
                    </Popconfirm>
                  )}
                </Space>
              </div>
            ),
          },
        ]}
      />
      <input ref={fileRef} type="file" accept=".vtt,.srt,text/vtt,application/x-subrip" hidden data-testid="caption-file" onChange={(e) => { onImportFile(e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={mediaRef} type="file" accept="audio/*,video/*" hidden data-testid="caption-media" onChange={(e) => { const f = e.target.files?.[0]; if (f) auto.run(f, { language: language.split("-")[0] }); e.target.value = ""; }} />
    </div>
  );
}

function TimeControl({ label, ms, onNow, onNudge, t }) {
  return (
    <div className="tm-sub-time">
      <span className="tm-sub-time-label">{label}</span>
      <Space size={0}>
        <Button size="small" type="text" icon={<MinusOutlined />} onClick={() => onNudge(-NUDGE_MS)} aria-label={t("subtitles.captions.earlier", "{{label}} earlier", { label })} />
        <Tooltip title={t("subtitles.captions.setNow", "Set to the video's current time")}>
          <Button size="small" className="tm-sub-time-value" onClick={onNow} aria-label={t("subtitles.captions.setNowLabel", "{{label}} {{time}}, set to now", { label, time: formatClock(ms) })}>
            {formatClock(ms)}
          </Button>
        </Tooltip>
        <Button size="small" type="text" icon={<PlusOutlined />} onClick={() => onNudge(NUDGE_MS)} aria-label={t("subtitles.captions.later", "{{label}} later", { label })} />
      </Space>
    </div>
  );
}

TimeControl.propTypes = {
  label: PropTypes.string.isRequired,
  ms: PropTypes.number.isRequired,
  onNow: PropTypes.func.isRequired,
  onNudge: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

CaptionStudio.propTypes = {
  recordingId: PropTypes.string,
  tracks: PropTypes.array,
  captionsAvailable: PropTypes.bool,
  getTimeMs: PropTypes.func.isRequired,
  playerTimeMs: PropTypes.number,
  playing: PropTypes.bool,
  onSeek: PropTypes.func.isRequired,
  onPlay: PropTypes.func,
  onPause: PropTypes.func,
  onDirtyChange: PropTypes.func,
  onSaveStateChange: PropTypes.func,
};
