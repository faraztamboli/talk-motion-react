import React, { useState } from "react";
import { Button, message } from "antd";
import { ReadOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useFlag } from "../../../hooks/useFlag";
import { createLesson } from "../api";

/**
 * "Start captioned lesson" for a teacher on a classroom page. Hidden unless the user has an
 * API session and the conversation_v2 flag.
 */
export default function StartLessonButton({ classroomName }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const enabled = useFlag("conversation_v2");
  const apiAuthed = useSelector((state) => state.apiAuth.status === "authenticated");
  const [busy, setBusy] = useState(false);

  if (!enabled || !apiAuthed) return null;

  const start = async () => {
    setBusy(true);
    try {
      const conversation = await createLesson(classroomName);
      navigate(`/conversation/${conversation.id}`, {
        state: { joinCode: conversation.join_code, expiresAt: conversation.join_code_expires_at },
      });
    } catch (err) {
      message.error(err.message);
      setBusy(false);
    }
  };

  return (
    <Button type="primary" icon={<ReadOutlined />} loading={busy} onClick={start}>
      {t("lesson.start", "Start captioned lesson")}
    </Button>
  );
}
