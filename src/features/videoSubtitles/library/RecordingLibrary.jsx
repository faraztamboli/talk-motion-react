import React, { useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { Button, Empty, Input, Pagination, Result, Segmented, Skeleton, Typography, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import RecordingCard from "./RecordingCard";
import { useDeleteRecordingMutation, useListRecordingsQuery, useSetRecordingPrivacyMutation } from "../recordingsApi";
import { rpcErrorMessage } from "../../../api/rpc";
import ErrorBoundary from "../../../components/ErrorBoundary";
import "../videoSubtitles.css";

const PAGE_SIZE = 24;

/**
 * A searchable, paginated grid of recordings.
 *   mode "public":   the public library
 *   mode "personal": My Videos, with "Made by me" (owner actions) and "Shared with me"
 */
export default function RecordingLibrary({ mode }) {
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();
  const [scope, setScope] = useState(mode === "public" ? "public" : "mine");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState({}); // id -> "privacy" | "delete"
  const { data, error, isFetching, isLoading, refetch } = useListRecordingsQuery({ scope, search, page, pageSize: PAGE_SIZE });
  const [setPrivacy] = useSetRecordingPrivacyMutation();
  const [deleteRecording] = useDeleteRecordingMutation();
  const rows = data?.rows || [];
  const owner = scope === "mine";

  const withBusy = async (id, kind, fn) => {
    setBusy((b) => ({ ...b, [id]: kind }));
    try {
      await fn();
    } finally {
      setBusy((b) => {
        const next = { ...b };
        delete next[id];
        return next;
      });
    }
  };

  const onTogglePrivacy = (recording, isPublic) =>
    withBusy(recording.id, "privacy", async () => {
      const res = await setPrivacy({ id: recording.id, isPublic });
      if (res.error) messageApi.error(rpcErrorMessage(res.error));
      else messageApi.success(isPublic ? t("subtitles.library.nowPublic", "“{{title}}” is public now.", { title: recording.title }) : t("subtitles.library.nowPrivate", "“{{title}}” is private now.", { title: recording.title }));
    });

  const onDelete = (recording) =>
    withBusy(recording.id, "delete", async () => {
      const res = await deleteRecording(recording.id);
      if (res.error) messageApi.error(rpcErrorMessage(res.error, t("subtitles.library.deleteFailed", "The recording couldn't be deleted.")));
      else {
        messageApi.success(t("subtitles.library.deleted", "Recording deleted."));
        if (rows.length === 1 && page > 1) setPage(page - 1);
      }
    });

  const heading =
    mode === "public"
      ? { title: t("subtitles.library.publicTitle", "Video library"), intro: t("subtitles.library.publicIntro", "YouTube videos with sign-language interpretation and captions, shared by the community.") }
      : { title: t("subtitles.library.mineTitle", "My videos"), intro: t("subtitles.library.mineIntro", "Your sign-language recordings, and recordings shared with you.") };

  let body;
  if (isLoading) {
    body = (
      <div className="tm-lib-grid">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} active className="tm-lib-skeleton" />
        ))}
      </div>
    );
  } else if (error) {
    body = (
      <Result
        status="warning"
        title={t("subtitles.library.loadFailed", "Recordings couldn't be loaded")}
        subTitle={rpcErrorMessage(error)}
        extra={
          <Button type="primary" onClick={refetch}>
            {t("subtitles.tryAgain", "Try again")}
          </Button>
        }
      />
    );
  } else if (!rows.length) {
    body = (
      <Empty
        description={
          search
            ? t("subtitles.library.noMatch", "Nothing matches “{{search}}”.", { search })
            : scope === "mine"
            ? t("subtitles.library.emptyMine", "You haven't made a recording yet.")
            : scope === "shared"
            ? t("subtitles.library.emptyShared", "Nothing has been shared with you yet.")
            : t("subtitles.library.emptyPublic", "No public recordings yet.")
        }
      >
        {scope === "mine" && !search && (
          <Link to="/video-subtitles/designer">
            <Button type="primary" icon={<PlusOutlined />}>
              {t("subtitles.library.createFirst", "Make your first recording")}
            </Button>
          </Link>
        )}
      </Empty>
    );
  } else {
    body = (
      <>
        <div className={`tm-lib-grid ${isFetching ? "is-fetching" : ""}`} aria-busy={isFetching}>
          {rows.map((recording) => (
            <ErrorBoundary key={recording.id} compact>
              <RecordingCard recording={recording} ownerActions={owner} busy={busy[recording.id]} onTogglePrivacy={onTogglePrivacy} onDelete={onDelete} />
            </ErrorBoundary>
          ))}
        </div>
        {data.total > PAGE_SIZE && (
          <Pagination className="tm-lib-pagination" current={page} pageSize={PAGE_SIZE} total={data.total} onChange={setPage} showSizeChanger={false} />
        )}
      </>
    );
  }

  return (
    <div className="tm-sub-page">
      {contextHolder}
      <header className="tm-lib-header">
        <div>
          <Typography.Title level={2}>{heading.title}</Typography.Title>
          <Typography.Text type="secondary">{heading.intro}</Typography.Text>
        </div>
        {mode !== "public" && (
          <Link to="/video-subtitles/designer">
            <Button type="primary" icon={<PlusOutlined />}>
              {t("subtitles.library.new", "New recording")}
            </Button>
          </Link>
        )}
      </header>
      <div className="tm-lib-filters">
        {mode !== "public" && (
          <Segmented
            value={scope}
            onChange={(value) => {
              setScope(value);
              setPage(1);
            }}
            options={[
              { value: "mine", label: t("subtitles.library.madeByMe", "Made by me") },
              { value: "shared", label: t("subtitles.library.shared", "Shared with me") },
            ]}
          />
        )}
        <Input.Search
          className="tm-lib-search"
          placeholder={t("subtitles.library.search", "Search by title")}
          allowClear
          enterButton
          loading={isFetching && Boolean(search)}
          onSearch={(value) => {
            setSearch(value.trim());
            setPage(1);
          }}
          aria-label={t("subtitles.library.search", "Search by title")}
        />
      </div>
      {body}
    </div>
  );
}

RecordingLibrary.propTypes = {
  mode: PropTypes.oneOf(["public", "personal"]).isRequired,
};
