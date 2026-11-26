import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Breadcrumb, Button, Input, Pagination, Skeleton, Tag, Typography, message } from "antd";
import { CheckOutlined, ClockCircleOutlined, SearchOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import MetaDecorator from "../../components/MetaDecorator";
import { rpcErrorMessage } from "../../api/rpc";
import { useBrowseClassroomsQuery, useRequestToJoinMutation } from "./teachApi";
import { LoadError, PageHeader, RoleTag, ServerUpdateNotice, TeachPage, useDebounced } from "./components";

const PAGE_SIZE = 24;

/** The one action a person can take on a listed classroom. */
export function joinState(classroom) {
  if (classroom.role) return "member";
  if (classroom.pending) return "pending";
  return "can-ask";
}

function JoinButton({ classroom }) {
  const { t } = useTranslation();
  const [requestToJoin, { isLoading }] = useRequestToJoinMutation();
  const [messageApi, contextHolder] = message.useMessage();
  const state = joinState(classroom);

  const ask = async () => {
    try {
      await requestToJoin({ classroomId: classroom.id, role: "student" }).unwrap();
      messageApi.success(t("teach.join.sentShort", "Request sent to the teacher."));
    } catch (err) {
      messageApi.error(rpcErrorMessage(err));
    }
  };

  if (state === "member") return <RoleTag role={classroom.role} />;
  if (state === "pending")
    return (
      <Tag icon={<ClockCircleOutlined />} color="gold">
        {t("teach.join.waiting", "Waiting for the teacher")}
      </Tag>
    );
  return (
    <>
      {contextHolder}
      <Button type="primary" loading={isLoading} onClick={ask}>
        {t("teach.join.ask", "Ask to join")}
      </Button>
    </>
  );
}

export default function FindClassroomsPage() {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [page, setPage] = useState(1);
  const search = useDebounced(text.trim());
  const { data, error, isLoading, isFetching, refetch } = useBrowseClassroomsQuery({
    search,
    offset: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
  });
  const rows = data?.rows || [];

  return (
    <TeachPage>
      <MetaDecorator title={t("teach.find.metaTitle", "Join a classroom - TalkMotion")} description={t("teach.find.help", "Find a class, ask to join, and the teacher lets you in.")} />
      <Breadcrumb
        className="tm-teach-block"
        items={[{ title: <Link to="/classrooms">{t("teach.classrooms.title", "Classrooms")}</Link> }, { title: t("teach.find.title", "Join a classroom") }]}
      />
      <PageHeader title={t("teach.find.title", "Join a classroom")} help={t("teach.find.help", "Find a class, ask to join, and the teacher lets you in.")} />
      <ServerUpdateNotice />
      <Input
        size="large"
        allowClear
        prefix={<SearchOutlined />}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setPage(1);
        }}
        placeholder={t("teach.find.search", "Search by class name or topic")}
        aria-label={t("teach.find.search", "Search by class name or topic")}
        className="tm-teach-block"
      />
      <Alert
        type="info"
        showIcon
        className="tm-teach-block"
        message={t("teach.find.private", "Can't find your class? Some classes are invite-only. Ask your teacher to add you by your username.")}
      />
      {error ? (
        <LoadError error={error} onRetry={refetch} />
      ) : isLoading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : rows.length === 0 ? (
        <Typography.Paragraph className="tm-teach-muted">
          {search
            ? t("teach.find.noMatch", "No classrooms match “{{search}}”.", { search })
            : t("teach.find.none", "There are no open classrooms right now.")}
        </Typography.Paragraph>
      ) : (
        <>
          <div className="tm-card-grid" aria-busy={isFetching}>
            {rows.map((c) => (
              <div key={c.id} className="tm-card">
                <Link to={`/classroom/${c.id}`} className="tm-card__title">
                  {c.name}
                </Link>
                {c.description && <span className="tm-card__desc">{c.description}</span>}
                <div className="tm-card__meta">
                  <span>{t("teach.card.students", "{{count}} students", { count: c.studentCount })}</span>
                  {c.owner && <span>{t("teach.find.by", "by {{name}}", { name: c.owner })}</span>}
                </div>
                <div className="tm-card__foot">
                  <JoinButton classroom={c} />
                </div>
              </div>
            ))}
          </div>
          {data.total > PAGE_SIZE && (
            <Pagination
              className="tm-teach-block tm-pager"
              current={page}
              pageSize={PAGE_SIZE}
              total={data.total}
              onChange={setPage}
              showSizeChanger={false}
            />
          )}
        </>
      )}
    </TeachPage>
  );
}
