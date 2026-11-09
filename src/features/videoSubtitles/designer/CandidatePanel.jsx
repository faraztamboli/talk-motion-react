import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Alert, Button, Input, Spin, Typography } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

/**
 * Step 1 side panel: what the chosen video is, whether it can be used, and the recording's own
 * title and description. Nothing is created on the server until "Use this video".
 */
export default function CandidatePanel({ candidate, creating, onCommit }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [touched, setTouched] = useState(false);

  // Prefill the title from YouTube until the author types their own.
  useEffect(() => {
    if (!touched) setTitle(candidate?.meta?.title || "");
  }, [candidate?.meta?.title, touched]);

  if (!candidate) return null;
  const { status, meta, error } = candidate;

  return (
    <div className="tm-sub-candidate">
      {(status === "checking" || status === "loading") && (
        <div className="tm-sub-center">
          <Spin />
          <Typography.Text type="secondary">
            {status === "checking" ? t("subtitles.checking", "Checking the video with YouTube…") : t("subtitles.loadingPlayer", "Loading the player…")}
          </Typography.Text>
        </div>
      )}
      {status === "error" && (
        <Alert
          type="error"
          showIcon
          message={t("subtitles.cantUse", "This video can't be used")}
          description={`${error} ${t("subtitles.pickAnother", "Choose another video.")}`}
        />
      )}
      {status === "ready" && (
        <>
          <Typography.Title level={5} className="tm-sub-candidate-title">
            <CheckCircleOutlined className="tm-sub-ok" aria-hidden /> {meta?.title || t("subtitles.untitledVideo", "YouTube video")}
          </Typography.Title>
          {meta?.author && <Typography.Text type="secondary">{meta.author}</Typography.Text>}
          <form
            className="tm-sub-form"
            onSubmit={(e) => {
              e.preventDefault();
              onCommit({ title, description });
            }}
          >
            <label htmlFor="tm-sub-title" className="tm-sub-label">
              {t("subtitles.titleLabel", "Title of your recording")}
            </label>
            <Input
              id="tm-sub-title"
              value={title}
              maxLength={250}
              showCount
              onChange={(e) => {
                setTouched(true);
                setTitle(e.target.value);
              }}
            />
            <label htmlFor="tm-sub-description" className="tm-sub-label">
              {t("subtitles.descriptionLabel", "Description (optional)")}
            </label>
            <Input.TextArea
              id="tm-sub-description"
              value={description}
              maxLength={5000}
              rows={3}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Button type="primary" size="large" htmlType="submit" loading={creating} disabled={!title.trim()} block>
              {t("subtitles.useVideo", "Use this video")}
            </Button>
            <Typography.Text type="secondary" className="tm-sub-help">
              {t("subtitles.useVideoHelp", "Next you'll turn on your camera and record your signing as the video plays.")}
            </Typography.Text>
          </form>
        </>
      )}
    </div>
  );
}

CandidatePanel.propTypes = {
  candidate: PropTypes.object,
  creating: PropTypes.bool,
  onCommit: PropTypes.func.isRequired,
};
