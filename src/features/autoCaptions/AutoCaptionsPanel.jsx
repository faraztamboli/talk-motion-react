import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Alert, Button, Card, Input, List, Progress, Space, Typography } from "antd";
import { AudioOutlined, DeleteOutlined, DownloadOutlined } from "@ant-design/icons";
import useAutoCaptions from "./useAutoCaptions";
import { formatClock, subtitlesToVtt } from "./cues";

const { Text } = Typography;

/**
 * "Auto-caption" for the Subtitle Designer. `media` is the current video's local file or
 * recorded Blob when there is one; otherwise the user picks a file. `onSubtitles` receives
 * the editable rows (again after each edit) so the designer can use them.
 */
export default function AutoCaptionsPanel({ media = null, onSubtitles }) {
  const { t } = useTranslation();
  const authenticated = useSelector((state) => state.apiAuth?.status === "authenticated");
  const captions = useAutoCaptions();
  const inputRef = useRef(null);
  const { status, progress, error, subtitles } = captions;
  const busy = status === "uploading" || status === "transcribing";

  useEffect(() => {
    onSubtitles?.(subtitles);
  }, [subtitles, onSubtitles]);

  if (!authenticated) return null;

  const start = (file) => file && captions.run(file);
  const download = () => {
    const url = URL.createObjectURL(new Blob([subtitlesToVtt(subtitles)], { type: "text/vtt" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "captions.vtt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card
      size="small"
      style={{ marginBottom: 24 }}
      title={
        <Space>
          <AudioOutlined />
          <span>{t("captions.title", "Auto-caption")}</span>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <Text type="secondary">
          {t("captions.help", "Create subtitles from speech. Up to 100 MB and 15 minutes per file.")}
        </Text>
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,video/*"
          hidden
          data-testid="auto-caption-file"
          onChange={(e) => {
            start(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <Space wrap>
          {media && (
            <Button type="primary" disabled={busy} onClick={() => start(media)}>
              {t("captions.useVideo", "Caption this video")}
            </Button>
          )}
          <Button type={media ? "default" : "primary"} disabled={busy} onClick={() => inputRef.current?.click()}>
            {media ? t("captions.pickOther", "Choose another file") : t("captions.pick", "Choose audio or video file")}
          </Button>
          {busy && <Button onClick={captions.cancel}>{t("captions.cancel", "Cancel")}</Button>}
        </Space>

        {status === "uploading" && (
          <Progress percent={Math.round(progress * 100)} aria-label={t("captions.uploading", "Uploading")} />
        )}
        {status === "transcribing" && (
          <>
            <Progress percent={100} status="active" showInfo={false} />
            <Text type="secondary">
              {t("captions.transcribing", "Listening to your file. This takes about as long as the recording.")}
            </Text>
          </>
        )}
        {status === "error" && error && <Alert type="error" showIcon message={t(error.key, error.fallback)} />}
        {status === "done" && subtitles.length === 0 && (
          <Alert type="info" showIcon message={t("captions.none", "No speech was found in this file.")} />
        )}

        {subtitles.length > 0 && (
          <>
            <List
              size="small"
              bordered
              dataSource={subtitles}
              renderItem={(s) => (
                <List.Item
                  key={s.id}
                  actions={[
                    <Button
                      key="del"
                      type="text"
                      icon={<DeleteOutlined />}
                      aria-label={t("captions.remove", "Remove subtitle")}
                      onClick={() => captions.removeSubtitle(s.id)}
                    />,
                  ]}
                >
                  <Text type="secondary" style={{ width: 90, flex: "none" }}>
                    {formatClock(s.startMs)}
                  </Text>
                  <Input
                    value={s.text}
                    aria-label={t("captions.edit", "Subtitle text")}
                    onChange={(e) => captions.updateSubtitle(s.id, { text: e.target.value })}
                  />
                </List.Item>
              )}
            />
            <Button icon={<DownloadOutlined />} onClick={download}>
              {t("captions.download", "Download .vtt")}
            </Button>
          </>
        )}
      </Space>
    </Card>
  );
}
