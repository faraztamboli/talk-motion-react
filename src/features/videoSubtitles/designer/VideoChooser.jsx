import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Alert, Input, Tabs, Typography } from "antd";
import { LinkOutlined, SearchOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import YouTubeSearchPanel from "./YouTubeSearchPanel";
import { isValidYouTubeUrl } from "../../../utils/youtubeUrl";

/** Step 1: find a YouTube video by search or by pasting its link. */
export default function VideoChooser({ onChoose, selectedVideoId }) {
  const { t } = useTranslation();
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  const [url, setUrl] = useState("");
  const valid = isValidYouTubeUrl(url);
  const checkedRef = useRef("");
  const onChooseRef = useRef(onChoose);
  onChooseRef.current = onChoose;

  // Check a pasted link shortly after typing stops (once per link).
  useEffect(() => {
    const trimmed = url.trim();
    if (!valid || checkedRef.current === trimmed) return undefined;
    const id = setTimeout(() => {
      checkedRef.current = trimmed;
      onChooseRef.current(trimmed, {});
    }, 400);
    return () => clearTimeout(id);
  }, [url, valid]);

  const paste = (
    <div className="tm-sub-paste">
      <label htmlFor="tm-sub-url" className="tm-sub-label">
        {t("subtitles.pasteLabel", "YouTube video link")}
      </label>
      <Input
        id="tm-sub-url"
        size="large"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://www.youtube.com/watch?v=…"
        status={url && !valid ? "error" : undefined}
        aria-describedby="tm-sub-url-help"
        allowClear
      />
      <Typography.Text id="tm-sub-url-help" type={url && !valid ? "danger" : "secondary"} className="tm-sub-help">
        {url && !valid
          ? t("subtitles.pasteInvalid", "That doesn't look like a YouTube video link yet.")
          : t("subtitles.pasteHelp", "Copy the link from YouTube's address bar or its Share button.")}
      </Typography.Text>
    </div>
  );

  const items = [
    {
      key: "search",
      label: (
        <span>
          <SearchOutlined /> {t("subtitles.tabSearch", "Search YouTube")}
        </span>
      ),
      children: apiKey ? (
        <YouTubeSearchPanel apiKey={apiKey} selectedVideoId={selectedVideoId} onSelect={(v) => onChoose(v.videoId, v)} />
      ) : (
        <Alert
          type="info"
          showIcon
          message={t("subtitles.searchOff", "YouTube search isn't set up on this site.")}
          description={t("subtitles.searchOffHelp", "Use the “Paste a link” tab instead.")}
        />
      ),
    },
    {
      key: "url",
      label: (
        <span>
          <LinkOutlined /> {t("subtitles.tabPaste", "Paste a link")}
        </span>
      ),
      children: paste,
    },
  ];

  return <Tabs defaultActiveKey={apiKey ? "search" : "url"} items={items} />;
}

VideoChooser.propTypes = {
  onChoose: PropTypes.func.isRequired,
  selectedVideoId: PropTypes.string,
};
