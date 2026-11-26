import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Progress, Typography } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useListRecordingsQuery } from "../videoSubtitles/recordingsApi";
import { useListCoursesQuery, useListMyClassroomsQuery } from "../teach/teachApi";
import "../teach/teach.css";

const HIDDEN_KEY = "tm.gettingStarted.hidden";
const TRIED_KEY = "tm.gettingStarted.tried";

function readTried() {
  try {
    return JSON.parse(localStorage.getItem(TRIED_KEY) || "[]");
  } catch {
    return [];
  }
}

/** Remember that the person opened a step that can't be checked on the server (the translator). */
export function markTried(key) {
  try {
    const tried = new Set(readTried());
    tried.add(key);
    localStorage.setItem(TRIED_KEY, JSON.stringify([...tried]));
  } catch {
    /* private mode: the step just stays open */
  }
}

/**
 * The first things worth doing in TalkMotion, each done when it really happened:
 * a video exists, the person is in a classroom, a course exists or was shared with them.
 */
export function checklistSteps({ videos = 0, classrooms = 0, courses = 0, tried = [] }) {
  return [
    {
      key: "translate",
      label: "Try the translator",
      button: "Try it",
      path: "/converter",
      done: tried.includes("translate"),
    },
    {
      key: "video",
      label: "Make your first captioned video",
      button: "Make one",
      path: "/video-subtitles/designer",
      done: videos > 0,
    },
    {
      key: "classroom",
      label: "Start or join a classroom",
      button: "Go to classrooms",
      path: "/classrooms",
      done: classrooms > 0,
    },
    {
      key: "course",
      label: "Put your videos into a course",
      button: "Make a course",
      path: "/courses?new=1",
      done: courses > 0,
    },
  ];
}

export default function GettingStarted() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(HIDDEN_KEY) === "1";
    } catch {
      return false;
    }
  });
  const videos = useListRecordingsQuery({ scope: "mine", page: 1, pageSize: 1 }, { skip: hidden });
  const classrooms = useListMyClassroomsQuery({ limit: 1 }, { skip: hidden });
  const courses = useListCoursesQuery(undefined, { skip: hidden });

  if (hidden) return null;
  // Wait for the answers so the list doesn't flash steps that are already done.
  if (videos.isLoading || classrooms.isLoading || courses.isLoading) return null;

  const steps = checklistSteps({
    videos: videos.data?.total || 0,
    classrooms: classrooms.data?.total || 0,
    courses: (courses.data?.mine?.length || 0) + (courses.data?.shared?.length || 0),
    tried: readTried(),
  });
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;

  const hide = () => {
    try {
      localStorage.setItem(HIDDEN_KEY, "1");
    } catch {
      /* ignore */
    }
    setHidden(true);
  };

  const open = (step) => {
    if (step.key === "translate") markTried("translate");
    navigate(step.path);
  };

  return (
    <section className="tm-checklist" aria-labelledby="tm-getting-started">
      <div className="tm-checklist__head">
        <Typography.Title level={2} id="tm-getting-started" className="tm-checklist__title">
          {t("home.start.title", "Getting started")}{" "}
          <span className="tm-checklist__count">
            {t("home.start.progress", "{{done}} of {{total}} done", { done, total: steps.length })}
          </span>
        </Typography.Title>
        <Button type="text" onClick={hide}>
          {t("home.start.hide", "Hide this")}
        </Button>
      </div>
      <Progress percent={Math.round((done / steps.length) * 100)} showInfo={false} aria-hidden="true" />
      <ol className="tm-checklist__steps">
        {steps.map((step) => (
          <li key={step.key} className={`tm-checklist__step ${step.done ? "is-done" : ""}`}>
            <span className="tm-checklist__mark" aria-hidden="true">
              {step.done && <CheckOutlined />}
            </span>
            <span className="tm-checklist__label">
              {t(`home.start.${step.key}`, step.label)}
              {step.done && <span className="tm-visually-hidden"> {t("home.start.doneSr", "(done)")}</span>}
            </span>
            {!step.done && (
              <Button type="primary" onClick={() => open(step)}>
                {t(`home.start.${step.key}Button`, step.button)}
              </Button>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
