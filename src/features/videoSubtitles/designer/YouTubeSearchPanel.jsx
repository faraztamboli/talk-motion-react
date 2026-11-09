import React, { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Alert, Button, Empty, Input, Spin } from "antd";
import { PlayCircleOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { searchYouTube } from "./youtubeSearch";

/** Search YouTube (embeddable videos only) and pick one. */
export default function YouTubeSearchPanel({ apiKey, onSelect, selectedVideoId }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [results, setResults] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | searching | done | error
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const run = useCallback(
    async (text, pageToken = null) => {
      const q = (text || "").trim();
      if (!q) return;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStatus("searching");
      setError(null);
      try {
        const { videos, nextPageToken: token } = await searchYouTube({ apiKey, query: q, pageToken, signal: controller.signal });
        if (controller.signal.aborted) return;
        setResults((prev) => (pageToken ? [...prev, ...videos] : videos));
        setNextPageToken(token);
        setLastQuery(q);
        setStatus("done");
      } catch (err) {
        if (controller.signal.aborted || err?.name === "AbortError") return;
        setError(err.message);
        setStatus("error");
      }
    },
    [apiKey]
  );

  return (
    <div className="tm-sub-search">
      <Input.Search
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onSearch={(value) => run(value)}
        placeholder={t("subtitles.searchPlaceholder", "Search YouTube, e.g. \"ASL storytime\"")}
        enterButton={t("subtitles.search", "Search")}
        size="large"
        loading={status === "searching" && !results.length}
        allowClear
        aria-label={t("subtitles.searchLabel", "Search YouTube")}
      />
      {status === "error" && <Alert className="tm-sub-gap" type="warning" showIcon message={error} />}
      {status === "done" && !results.length && (
        <Empty className="tm-sub-gap" description={t("subtitles.noResults", "No videos that can be embedded matched. Try other words.")} />
      )}
      {results.length > 0 && (
        <ul className="tm-sub-results" aria-label={t("subtitles.results", "Search results")}>
          {results.map((video) => (
            <li key={video.videoId}>
              <button
                type="button"
                className={`tm-sub-result ${selectedVideoId === video.videoId ? "is-selected" : ""}`}
                onClick={() => onSelect(video)}
                aria-pressed={selectedVideoId === video.videoId}
              >
                <span className="tm-sub-result-thumb">
                  <img src={video.thumbnail} alt="" loading="lazy" />
                  <PlayCircleOutlined aria-hidden />
                </span>
                <span className="tm-sub-result-text">
                  <strong>{video.title}</strong>
                  <span>{video.channelTitle}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {nextPageToken && results.length > 0 && (
        <div className="tm-sub-more">
          <Button onClick={() => run(lastQuery, nextPageToken)} loading={status === "searching"}>
            {t("subtitles.moreResults", "More results")}
          </Button>
        </div>
      )}
      {status === "searching" && results.length > 0 && <Spin className="tm-sub-gap" />}
    </div>
  );
}

YouTubeSearchPanel.propTypes = {
  apiKey: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  selectedVideoId: PropTypes.string,
};
