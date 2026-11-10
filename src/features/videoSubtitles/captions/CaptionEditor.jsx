import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { Alert, Button, Dropdown, Empty, Input, InputNumber, List, Modal, Popconfirm, Progress, Select, Space, Tooltip, Typography, message } from "antd";
import {
  AudioOutlined,
  CaretRightOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ImportOutlined,
  MinusOutlined,
  PlusOutlined,
  SaveOutlined,
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

/**
 * Text captions for a recording, timed against the YouTube video in the designer's player.
 *
 * Author by hand ("Add caption at the playhead", set start/end to now, nudge), import a .vtt or
 * .srt file, or create captions automatically from an audio or video file (speech recognition
 * on the TalkMotion API). Saved per language with saveRecordingCaptions.
 */
export default function CaptionEditor({ recordingId, tracks, captionsAvailable, canEdit, getTimeMs, playerTimeMs, onSeek, onPlay, onDirtyChange }) {
  const { t } = useTranslation();
  const apiSignedIn = useSelector((s) => s.apiAuth?.status === "authenticated");
  const [messageApi, contextHolder] = message.useMessage();
  const [language, setLanguage] = useState(tracks?.[0]?.language || "en");
  const track = useMemo(() => (tracks || []).find((tr) => tr.language === language) || null, [tracks, language]);
  const [cues, setCues] = useState(() => track?.cues || []);
  const [baseline, setBaseline] = useState(() => cuesSignature(track?.cues || []));
  const [shiftSeconds, setShiftSeconds] = useState(0);
  const [page, setPage] = useState(1);
  const fileRef = useRef(null);
  const mediaRef = useRef(null);
  const textRefs = useRef(new Map());
  const pendingFocus = useRef(null);

  const [saveCaptions, saveState] = useSaveCaptionsMutation();
  const [deleteCaptions, deleteState] = useDeleteCaptionsMutation();
  const auto = useAutoCaptions();

  const dirty = cuesSignature(cues) !== baseline;
  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);

  // A fresh server copy (after a save or a refetch) replaces the editor's copy unless edited.
  const serverSignature = cuesSignature(track?.cues || []);
  useEffect(() => {
    if (!dirty) {
      setCues(track?.cues || []);
      setBaseline(serverSignature);
    }
  }, [serverSignature, language]);

  useEffect(() => {
    if (pendingFocus.current && textRefs.current.get(pendingFocus.current)) {
      textRefs.current.get(pendingFocus.current).focus();
      pendingFocus.current = null;
    }
  });

  const activeIndex = findCueIndexAt(cues, playerTimeMs);
  const check = checkCues(cues);
  const pageSize = 50;

  // { incoming, source } while asking whether to replace or add to existing captions.
  const [mergePrompt, setMergePrompt] = useState(null);

  const merge = useCallback(
    (incoming, sourceLabel, mode) => {
      setCues((prev) => mergeCues(prev, incoming, mode));
      setPage(1);
      setMergePrompt(null);
      messageApi.success(t("subtitles.captions.loaded", "{{count}} captions added from {{source}}. Review them, then save.", { count: incoming.length, source: sourceLabel }));
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

  // Auto-captions finished: bring their cues into the editor.
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
    await applyIncoming(parsed, file.name);
  };

  const addAtPlayhead = () => {
    const { cues: next, cue } = addCueAt(cues, getTimeMs());
    setCues(next);
    pendingFocus.current = cue.id;
    const index = next.findIndex((c) => c.id === cue.id);
    setPage(Math.floor(index / pageSize) + 1);
  };

  const shiftAll = () => {
    const delta = Math.round((Number(shiftSeconds) || 0) * 1000);
    if (!delta) return;
    setCues((prev) =>
      sortCues(prev.map((c) => ({ ...c, startMs: Math.max(0, c.startMs + delta), endMs: Math.max(1, c.endMs + delta) })).filter((c) => c.endMs > c.startMs))
    );
    setShiftSeconds(0);
  };

  const save = async () => {
    if (check.errors.length) {
      messageApi.error(check.errors[0]);
      return;
    }
    const res = await saveCaptions({ recordingId, language, label: languageLabel(language), cues });
    if (res.error) {
      messageApi.error(rpcErrorMessage(res.error, t("subtitles.captions.saveFailed", "The captions couldn't be saved.")));
      return;
    }
    const saved = res.data?.track?.cues || cues;
    setCues(saved);
    setBaseline(cuesSignature(saved));
    if (res.data?.adjusted) {
      messageApi.info(t("subtitles.captions.adjusted", "Saved. {{count}} caption(s) were tidied: empty ones removed or overlaps shortened.", { count: res.data.adjusted }));
    } else {
      messageApi.success(t("subtitles.captions.saved", "Captions saved."));
    }
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

  const switchLanguage = (next) => {
    if (next === language) return;
    const go = () => {
      setLanguage(next);
      const nextTrack = (tracks || []).find((tr) => tr.language === next);
      setCues(nextTrack?.cues || []);
      setBaseline(cuesSignature(nextTrack?.cues || []));
      setPage(1);
    };
    if (!dirty) go();
    else
      Modal.confirm({
        title: t("subtitles.captions.discardTitle", "Discard unsaved changes?"),
        content: t("subtitles.captions.discardBody", "Your changes to the {{lang}} captions aren't saved.", { lang: languageLabel(language) }),
        okText: t("subtitles.captions.discard", "Discard"),
        okButtonProps: { danger: true },
        onOk: go,
      });
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

  const busyAuto = auto.status === "uploading" || auto.status === "transcribing";
  const languages = Array.from(new Set([...CAPTION_LANGUAGES.map((l) => l.value), ...(tracks || []).map((tr) => tr.language)]));

  return (
    <div className="tm-sub-captions">
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
      <div className="tm-sub-captions-toolbar">
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
        {canEdit && (
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={addAtPlayhead}>
              {t("subtitles.captions.addHere", "Add caption at playhead")}
            </Button>
            <Button icon={<ImportOutlined />} onClick={() => fileRef.current?.click()}>
              {t("subtitles.captions.import", "Import .vtt / .srt")}
            </Button>
            <Tooltip title={apiSignedIn ? "" : t("subtitles.captions.autoNeedsSignIn", "Sign in again to use automatic captions.")}>
              <Button icon={<AudioOutlined />} disabled={!apiSignedIn || busyAuto} onClick={() => mediaRef.current?.click()}>
                {t("subtitles.captions.auto", "Caption from audio file")}
              </Button>
            </Tooltip>
          </Space>
        )}
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
        <input ref={fileRef} type="file" accept=".vtt,.srt,text/vtt,application/x-subrip" hidden data-testid="caption-file" onChange={(e) => { onImportFile(e.target.files?.[0]); e.target.value = ""; }} />
        <input ref={mediaRef} type="file" accept="audio/*,video/*" hidden data-testid="caption-media" onChange={(e) => { const f = e.target.files?.[0]; if (f) auto.run(f, { language: language.split("-")[0] }); e.target.value = ""; }} />
      </div>

      {canEdit && (
        <Typography.Paragraph type="secondary" className="tm-sub-help">
          {t(
            "subtitles.captions.help",
            "Play the video and add a caption where someone speaks; set its start and end with the buttons, or use ± to fine-tune by a tenth of a second. Automatic captions work best with the same audio as the YouTube video, starting at 0:00."
          )}
        </Typography.Paragraph>
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

      {check.errors.length > 0 && <Alert className="tm-sub-gap" type="error" showIcon message={check.errors[0]} />}
      {!check.errors.length && check.overlaps > 0 && (
        <Alert className="tm-sub-gap" type="warning" showIcon message={t("subtitles.captions.overlaps", "{{count}} caption(s) overlap the next one. Saving will shorten them.", { count: check.overlaps })} />
      )}

      {cues.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={canEdit ? t("subtitles.captions.empty", "No captions yet. Add one at the playhead, import a file, or caption from an audio file.") : t("subtitles.captions.emptyViewer", "No captions in this language.")}
        />
      ) : (
        <List
          className="tm-sub-cues"
          dataSource={cues}
          pagination={cues.length > pageSize ? { current: page, pageSize, onChange: setPage, size: "small", showSizeChanger: false } : false}
          renderItem={(cue) => {
            const index = cues.indexOf(cue);
            const active = index === activeIndex;
            return (
              <List.Item key={cue.id} className={`tm-sub-cue ${active ? "is-active" : ""}`}>
                <div className="tm-sub-cue-times">
                  <TimeControl label={t("subtitles.captions.start", "Start")} ms={cue.startMs} disabled={!canEdit}
                    onNow={() => setCues((p) => setCueBoundary(p, cue.id, "startMs", getTimeMs()))}
                    onNudge={(d) => setCues((p) => nudgeCue(p, cue.id, "startMs", d))} t={t} />
                  <TimeControl label={t("subtitles.captions.end", "End")} ms={cue.endMs} disabled={!canEdit}
                    onNow={() => setCues((p) => setCueBoundary(p, cue.id, "endMs", getTimeMs()))}
                    onNudge={(d) => setCues((p) => nudgeCue(p, cue.id, "endMs", d))} t={t} />
                </div>
                <Input.TextArea
                  ref={(el) => {
                    if (el) textRefs.current.set(cue.id, el);
                    else textRefs.current.delete(cue.id);
                  }}
                  className="tm-sub-cue-text"
                  value={cue.text}
                  autoSize={{ minRows: 1, maxRows: 3 }}
                  maxLength={500}
                  readOnly={!canEdit}
                  placeholder={t("subtitles.captions.textPlaceholder", "What is said")}
                  aria-label={t("subtitles.captions.textLabel", "Caption {{n}} text", { n: index + 1 })}
                  onChange={(e) => setCues((p) => updateCue(p, cue.id, { text: e.target.value }))}
                />
                <Space size={0} className="tm-sub-cue-actions">
                  <Tooltip title={t("subtitles.captions.playFrom", "Play from this caption")}>
                    <Button type="text" icon={<CaretRightOutlined />} aria-label={t("subtitles.captions.playFrom", "Play from this caption")}
                      onClick={() => { onSeek(cue.startMs / 1000); onPlay?.(); }} />
                  </Tooltip>
                  {canEdit && (
                    <Button type="text" danger icon={<DeleteOutlined />} aria-label={t("subtitles.captions.remove", "Remove caption")} onClick={() => setCues((p) => removeCue(p, cue.id))} />
                  )}
                </Space>
              </List.Item>
            );
          }}
        />
      )}

      {canEdit && (
        <div className="tm-sub-captions-footer">
          <Space wrap>
            <label className="tm-sub-inline">
              <span>{t("subtitles.captions.shift", "Shift all by")}</span>
              <InputNumber value={shiftSeconds} onChange={setShiftSeconds} step={0.5} size="small" addonAfter="s" aria-label={t("subtitles.captions.shiftLabel", "Seconds to shift all captions")} />
            </label>
            <Button size="small" onClick={shiftAll} disabled={!cues.length || !Number(shiftSeconds)}>
              {t("subtitles.captions.applyShift", "Shift")}
            </Button>
          </Space>
          <Space wrap>
            {track && (
              <Popconfirm title={t("subtitles.captions.deleteTrackQ", "Delete the {{lang}} captions?", { lang: languageLabel(language) })} okText={t("subtitles.delete", "Delete")} okButtonProps={{ danger: true }} onConfirm={removeTrack}>
                <Button danger loading={deleteState.isLoading}>
                  {t("subtitles.captions.deleteTrack", "Delete captions")}
                </Button>
              </Popconfirm>
            )}
            <Button type="primary" icon={<SaveOutlined />} onClick={save} loading={saveState.isLoading} disabled={!dirty && Boolean(track)}>
              {dirty ? t("subtitles.captions.save", "Save captions") : t("subtitles.captions.savedState", "Saved")}
            </Button>
          </Space>
        </div>
      )}
    </div>
  );
}

function TimeControl({ label, ms, onNow, onNudge, disabled, t }) {
  return (
    <div className="tm-sub-time">
      <span className="tm-sub-time-label">{label}</span>
      <Space size={0}>
        <Button size="small" type="text" icon={<MinusOutlined />} disabled={disabled} onClick={() => onNudge(-NUDGE_MS)} aria-label={t("subtitles.captions.earlier", "{{label}} earlier", { label })} />
        <Tooltip title={disabled ? "" : t("subtitles.captions.setNow", "Set to the video's current time")}>
          <Button size="small" className="tm-sub-time-value" disabled={disabled} onClick={onNow} aria-label={t("subtitles.captions.setNowLabel", "{{label}} {{time}}, set to now", { label, time: formatClock(ms) })}>
            {formatClock(ms)}
          </Button>
        </Tooltip>
        <Button size="small" type="text" icon={<PlusOutlined />} disabled={disabled} onClick={() => onNudge(NUDGE_MS)} aria-label={t("subtitles.captions.later", "{{label}} later", { label })} />
      </Space>
    </div>
  );
}

TimeControl.propTypes = {
  label: PropTypes.string.isRequired,
  ms: PropTypes.number.isRequired,
  onNow: PropTypes.func.isRequired,
  onNudge: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  t: PropTypes.func.isRequired,
};

CaptionEditor.propTypes = {
  recordingId: PropTypes.string,
  tracks: PropTypes.array,
  captionsAvailable: PropTypes.bool,
  canEdit: PropTypes.bool,
  getTimeMs: PropTypes.func.isRequired,
  playerTimeMs: PropTypes.number,
  onSeek: PropTypes.func.isRequired,
  onPlay: PropTypes.func,
  onDirtyChange: PropTypes.func,
};

