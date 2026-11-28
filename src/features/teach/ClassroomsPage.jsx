import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Input, Segmented, Skeleton, Tag, Typography } from "antd";
import { BellOutlined, PlusOutlined, SearchOutlined, TeamOutlined, UsergroupAddOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import MetaDecorator from "../../components/MetaDecorator";
import { useListMyClassroomsQuery } from "./teachApi";
import useWaitingRequests, { waitingText } from "./useWaitingRequests";
import {
  ActionCard,
  LoadError,
  PageHeader,
  RoleTag,
  ServerUpdateNotice,
  TeachPage,
  useDebounced,
} from "./components";

export function ClassroomCard({ classroom, footer }) {
  const { t } = useTranslation();
  const staff = classroom.role === "owner" || classroom.role === "teacher";
  return (
    <Link to={`/classroom/${classroom.id}`} className="tm-card">
      <div className="tm-card__top">
        <span className="tm-card__title">{classroom.name}</span>
        <RoleTag role={classroom.role} />
      </div>
      {classroom.description && <span className="tm-card__desc">{classroom.description}</span>}
      <div className="tm-card__meta">
        <span>
          {t("teach.card.students", "{{count}} students", { count: classroom.studentCount })}
        </span>
        {classroom.teacherCount > 0 && (
          <span>{t("teach.card.teachers", "{{count}} teachers", { count: classroom.teacherCount })}</span>
        )}
        {staff && (
          <span>
            {classroom.isPublic
              ? t("teach.card.listed", "Anyone can ask to join")
              : t("teach.card.inviteOnly", "Invite only")}
          </span>
        )}
      </div>
      {(staff && classroom.requestCount > 0) || footer ? (
        <div className="tm-card__foot">
          {staff && classroom.requestCount > 0 && (
            <Tag color="orange" icon={<BellOutlined />}>
              {t("teach.card.requests", "{{count}} asking to join", { count: classroom.requestCount })}
            </Tag>
          )}
          {footer}
        </div>
      ) : null}
    </Link>
  );
}

/** The people waiting for an answer, as one line with a button. */
export function WaitingBanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const requests = useWaitingRequests();
  if (!requests.length) return null;
  return (
    <div className="tm-waiting" role="status">
      <span>
        <BellOutlined />{" "}
        {waitingText(t, requests.length)}
      </span>
      <Button type="primary" onClick={() => navigate("/classrooms/requests")}>
        {t("teach.waiting.review", "Review requests")}
      </Button>
    </div>
  );
}

const FILTERS = ["all", "teaching", "learning"];

export function filterClassrooms(rows, show) {
  if (show === "teaching") return rows.filter((c) => c.role === "owner" || c.role === "teacher");
  if (show === "learning") return rows.filter((c) => c.role === "student");
  return rows;
}

export default function ClassroomsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const show = FILTERS.includes(params.get("show")) ? params.get("show") : "all";
  const [text, setText] = useState("");
  const search = useDebounced(text.trim());
  const { data, error, isLoading, refetch } = useListMyClassroomsQuery({ search, limit: 200 });
  const rows = data?.rows || [];

  const teaching = useMemo(() => filterClassrooms(rows, "teaching").length, [rows]);
  const learning = useMemo(() => filterClassrooms(rows, "learning").length, [rows]);
  const visible = filterClassrooms(rows, show);
  const empty = !isLoading && !error && rows.length === 0 && !search;

  const setShow = (value) => {
    const next = new URLSearchParams(params);
    if (value === "all") next.delete("show");
    else next.set("show", value);
    setParams(next, { replace: true });
  };

  return (
    <TeachPage>
      <MetaDecorator title={t("teach.classrooms.metaTitle", "Classrooms - TalkMotion")} description={t("teach.classrooms.help", "Where you teach and learn with other people.")} />
      <PageHeader
        title={t("teach.classrooms.title", "Classrooms")}
        help={t("teach.classrooms.help", "Where you teach and learn with other people.")}
        actions={
          !empty && (
            <>
              <Button size="large" icon={<SearchOutlined />} onClick={() => navigate("/classrooms/find")}>
                {t("teach.classrooms.join", "Join a classroom")}
              </Button>
              <Button size="large" type="primary" icon={<PlusOutlined />} onClick={() => navigate("/classrooms/new")}>
                {t("teach.classrooms.start", "Start a classroom")}
              </Button>
            </>
          )
        }
      />
      <ServerUpdateNotice />
      <WaitingBanner />

      {error ? (
        <LoadError error={error} onRetry={refetch} fallback={t("teach.classrooms.loadFailed", "We couldn't load your classrooms.")} />
      ) : isLoading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : empty ? (
        <>
          <Typography.Paragraph className="tm-teach-help">
            {t("teach.classrooms.emptyLead", "You're not in any classrooms yet. What would you like to do?")}
          </Typography.Paragraph>
          <div className="tm-actions">
            <ActionCard
              primary
              icon={<TeamOutlined />}
              title={t("teach.classrooms.emptyStart", "Start my own classroom")}
              help={t("teach.classrooms.emptyStartHelp", "For teachers. Takes about a minute.")}
              onClick={() => navigate("/classrooms/new")}
            />
            <ActionCard
              icon={<UsergroupAddOutlined />}
              title={t("teach.classrooms.emptyJoin", "Join someone's classroom")}
              help={t("teach.classrooms.emptyJoinHelp", "Find a class and ask the teacher to let you in.")}
              onClick={() => navigate("/classrooms/find")}
            />
          </div>
        </>
      ) : (
        <>
          {(rows.length > 8 || search) && (
            <Input
              size="large"
              allowClear
              prefix={<SearchOutlined />}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("teach.classrooms.search", "Search your classrooms")}
              aria-label={t("teach.classrooms.search", "Search your classrooms")}
              className="tm-teach-block"
            />
          )}
          {teaching > 0 && learning > 0 && (
            <Segmented
              size="large"
              className="tm-teach-block"
              value={show}
              onChange={setShow}
              options={[
                { value: "all", label: t("teach.classrooms.all", "All ({{count}})", { count: rows.length }) },
                { value: "teaching", label: t("teach.classrooms.teaching", "I teach ({{count}})", { count: teaching }) },
                { value: "learning", label: t("teach.classrooms.learning", "I'm learning ({{count}})", { count: learning }) },
              ]}
            />
          )}
          {visible.length === 0 ? (
            <Typography.Paragraph className="tm-teach-muted">
              {search
                ? t("teach.classrooms.noMatch", "No classrooms match “{{search}}”.", { search })
                : t("teach.classrooms.noneHere", "Nothing here yet.")}
            </Typography.Paragraph>
          ) : (
            <div className="tm-card-grid">
              {visible.map((c) => (
                <ClassroomCard key={c.id} classroom={c} />
              ))}
            </div>
          )}
        </>
      )}
    </TeachPage>
  );
}
