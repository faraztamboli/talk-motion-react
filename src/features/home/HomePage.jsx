import React, { useEffect, useState } from "react";
import { Typography } from "antd";
import {
  BookOutlined,
  ExperimentOutlined,
  MessageOutlined,
  PlayCircleOutlined,
  TeamOutlined,
  TranslationOutlined,
  VideoCameraAddOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import useProfile from "../../hooks/useProfile";
import { useFlags } from "../../hooks/useFlag";
import ErrorBoundary from "../../components/ErrorBoundary";
import NotificationsPanel from "../../components/ui/NotificationsPanel";
import RecentVideosWidget from "../../components/ui/RecentVideosWidget";
import GettingStarted, { markTried } from "./GettingStarted";
import { ClassroomCard, WaitingBanner } from "../teach/ClassroomsPage";
import { useListMyClassroomsQuery } from "../teach/teachApi";
import MetaDecorator from "../../components/MetaDecorator";
import { visibleTasks } from "./tasks";
import "./home.css";

const { Title, Text } = Typography;

const ICONS = {
  message: <MessageOutlined />,
  translate: <TranslationOutlined />,
  camera: <VideoCameraAddOutlined />,
  play: <PlayCircleOutlined />,
  team: <TeamOutlined />,
  book: <BookOutlined />,
  model: <ExperimentOutlined />,
};

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return "Hello";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function TaskCard({ task, onOpen }) {
  return (
    <button
      type="button"
      className="tm-task"
      style={{ "--tm-accent": task.color }}
      onClick={() => onOpen(task.path)}
    >
      <span className="tm-task__icon" aria-hidden="true">{ICONS[task.icon]}</span>
      <span>
        <span className="tm-task__label">{task.label}</span>
        <span className="tm-task__hint">{task.hint}</span>
      </span>
    </button>
  );
}

/** Up to four of the person's classrooms; nothing when they have none or the server can't say. */
function YourClassrooms() {
  const { data, error } = useListMyClassroomsQuery({ limit: 4 });
  if (error || !data?.rows?.length) return null;
  return (
    <>
      <div className="tm-home__row">
        <Title level={2} className="tm-home__section">Your classrooms</Title>
        <Link to="/classrooms">See all</Link>
      </div>
      <div className="tm-card-grid">
        {data.rows.slice(0, 4).map((c) => (
          <ClassroomCard key={c.id} classroom={c} />
        ))}
      </div>
    </>
  );
}

/** Home: one question, "What would you like to do?", answered with big plain-language cards. */
export default function HomePage({ sm }) {
  const navigate = useNavigate();
  const flags = useFlags();
  const { getUserProfile } = useProfile();
  const [first, setFirst] = useState("");

  useEffect(() => {
    let alive = true;
    Promise.resolve(getUserProfile())
      .then((p) => alive && setFirst(p?.first || ""))
      .catch(() => {}); // the greeting works without a name
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tasks = visibleTasks(flags);
  const open = (path) => {
    if (path === "/converter") markTried("translate");
    navigate(path);
  };

  return (
    <>
      <MetaDecorator title="Home - TalkMotion" description="Choose what you want to do with TalkMotion" />
      <div className="layout-bg mh-100vh" style={{ padding: sm ? 12 : 24 }}>
        <div className="tm-home">
          <header className="tm-home__hello">
            <div>
              <Title level={1} className="tm-home__title">
                {greeting()}{first ? `, ${first}` : ""}
              </Title>
              <Text className="tm-home__sub">What would you like to do today?</Text>
            </div>
            <NotificationsPanel />
          </header>

          <ErrorBoundary compact>
            <WaitingBanner />
          </ErrorBoundary>

          <ErrorBoundary compact>
            <GettingStarted />
          </ErrorBoundary>

          <nav aria-label="Things you can do" className="tm-tasks">
            {tasks.map((task) => (
              <TaskCard key={task.key} task={task} onOpen={open} />
            ))}
          </nav>

          <Title level={2} className="tm-home__section">Pick up where you left off</Title>
          <ErrorBoundary compact>
            <RecentVideosWidget type="created" limit={4} sm={sm} />
          </ErrorBoundary>
          <ErrorBoundary compact>
            <YourClassrooms />
          </ErrorBoundary>
        </div>
      </div>
    </>
  );
}
