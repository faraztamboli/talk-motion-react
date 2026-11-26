/** Dialogs used on the course page: add videos, share, move. */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Checkbox, Empty, Input, List, Modal, Popconfirm, Segmented, Select, Skeleton, Tag, Typography, message } from "antd";
import { CheckOutlined, PlayCircleOutlined, SearchOutlined, TeamOutlined, UserOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { rpcErrorMessage } from "../../api/rpc";
import { useListRecordingsQuery } from "../videoSubtitles/recordingsApi";
import {
  moveDestinations,
  useAddLessonsMutation,
  useGetCourseTreeQuery,
  useListMyClassroomsQuery,
  useMoveCourseMutation,
  useShareCourseMutation,
  useUnshareCourseMutation,
} from "./teachApi";
import { PeopleSearch, SectionTitle, useDebounced } from "./components";

export function AddVideosModal({ course, open, onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [scope, setScope] = useState("mine");
  const [text, setText] = useState("");
  const search = useDebounced(text.trim());
  const [picked, setPicked] = useState([]);
  const [error, setError] = useState(null);
  const [addLessons, { isLoading }] = useAddLessonsMutation();
  const { data, isFetching, error: loadError } = useListRecordingsQuery(
    { scope, search, page: 1, pageSize: 50 },
    { skip: !open }
  );
  const inCourse = new Set(course.lessons.filter((l) => l.type === "recording").map((l) => l.contentId));
  const rows = data?.rows || [];

  useEffect(() => {
    if (open) {
      setPicked([]);
      setError(null);
    }
  }, [open]);

  const toggle = (video) =>
    setPicked((list) => (list.some((v) => v.id === video.id) ? list.filter((v) => v.id !== video.id) : [...list, video]));

  const add = async () => {
    setError(null);
    try {
      await addLessons({
        courseId: course.id,
        items: picked.map((v) => ({ type: "recording", id: v.id, title: v.title })),
      }).unwrap();
      onClose(picked.length);
    } catch (err) {
      setError(rpcErrorMessage(err, t("teach.addVideos.failed", "We couldn't add those videos.")));
    }
  };

  return (
    <Modal
      open={open}
      onCancel={() => onClose(0)}
      title={t("teach.addVideos.title", "Add videos to “{{name}}”", { name: course.name })}
      width={640}
      destroyOnClose
      footer={[
        <Button key="cancel" size="large" onClick={() => onClose(0)}>
          {t("teach.cancel", "Cancel")}
        </Button>,
        <Button key="add" size="large" type="primary" disabled={!picked.length} loading={isLoading} onClick={add}>
          {picked.length
            ? t("teach.addVideos.addN", "Add {{count}} videos", { count: picked.length })
            : t("teach.addVideos.pick", "Pick videos to add")}
        </Button>,
      ]}
    >
      <Segmented
        className="tm-teach-block"
        value={scope}
        onChange={setScope}
        options={[
          { value: "mine", label: t("teach.addVideos.mine", "My videos") },
          { value: "shared", label: t("teach.addVideos.shared", "Shared with me") },
        ]}
      />
      <Input
        allowClear
        size="large"
        prefix={<SearchOutlined />}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("teach.addVideos.search", "Search videos")}
        aria-label={t("teach.addVideos.search", "Search videos")}
        className="tm-teach-block"
      />
      {loadError ? (
        <Alert type="error" showIcon message={rpcErrorMessage(loadError)} />
      ) : isFetching && !data ? (
        <Skeleton active />
      ) : rows.length === 0 ? (
        <Empty
          description={
            search
              ? t("teach.addVideos.noMatch", "No videos match.")
              : t("teach.addVideos.none", "You don't have any videos yet.")
          }
        >
          {!search && scope === "mine" && (
            <Button type="primary" onClick={() => navigate("/video-subtitles/designer")}>
              {t("teach.addVideos.make", "Make a captioned video")}
            </Button>
          )}
        </Empty>
      ) : (
        <List
          className="tm-list"
          dataSource={rows}
          rowKey="id"
          renderItem={(video) => {
            const already = inCourse.has(String(video.id));
            const checked = picked.some((v) => v.id === video.id);
            return (
              <List.Item>
                <Checkbox
                  checked={checked || already}
                  disabled={already}
                  onChange={() => toggle(video)}
                  className="tm-video-pick"
                >
                  <span className="tm-video-pick__row">
                    {video.thumbnailUrl ? (
                      <img src={video.thumbnailUrl} alt="" className="tm-video-pick__thumb" />
                    ) : (
                      <span className="tm-lesson-icon"><PlayCircleOutlined /></span>
                    )}
                    <span>
                      <span className="tm-video-pick__title">{video.title}</span>
                      {already && <Tag color="success">{t("teach.addVideos.already", "Already in this course")}</Tag>}
                    </span>
                  </span>
                </Checkbox>
              </List.Item>
            );
          }}
        />
      )}
      {error && <Alert type="error" showIcon message={error} className="tm-gap-sm" />}
    </Modal>
  );
}

export function ShareCourseModal({ course, open, onClose }) {
  const { t } = useTranslation();
  const [canEdit, setCanEdit] = useState(false);
  const [busy, setBusy] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();
  const { data: classrooms, isLoading } = useListMyClassroomsQuery({ show: "teaching", limit: 200 }, { skip: !open });
  const [share] = useShareCourseMutation();
  const [unshare] = useUnshareCourseMutation();
  const sharedWith = (type, id) => course.shares.find((s) => s.type === type && s.id === String(id));

  const doShare = async (type, id, name) => {
    setBusy(`${type}-${id}`);
    try {
      await share({ courseId: course.id, type, id, canEdit }).unwrap();
      messageApi.success(t("teach.shareCourse.done", "Shared with {{name}}.", { name }));
    } catch (err) {
      messageApi.error(rpcErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const doUnshare = async (s) => {
    setBusy(`${s.type}-${s.id}`);
    try {
      await unshare({ courseId: course.id, type: s.type, id: s.id }).unwrap();
    } catch (err) {
      messageApi.error(rpcErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const teaching = classrooms?.rows || [];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={t("teach.shareCourse.title", "Share “{{name}}”", { name: course.name })}
      width={640}
      destroyOnClose
      footer={
        <Button type="primary" size="large" onClick={onClose}>
          {t("teach.done", "Done")}
        </Button>
      }
    >
      {contextHolder}
      {course.shares.length > 0 && (
        <>
          <SectionTitle>{t("teach.shareCourse.current", "Shared with")}</SectionTitle>
          <List
            className="tm-list"
            dataSource={course.shares}
            rowKey={(s) => `${s.type}-${s.id}`}
            renderItem={(s) => (
              <List.Item
                actions={[
                  <Popconfirm
                    key="stop"
                    title={t("teach.shareCourse.stopConfirm", "Stop sharing with {{name}}?", { name: s.name })}
                    okText={t("teach.classroom.unshare", "Stop sharing")}
                    cancelText={t("teach.cancel", "Cancel")}
                    onConfirm={() => doUnshare(s)}
                  >
                    <Button loading={busy === `${s.type}-${s.id}`}>{t("teach.classroom.unshare", "Stop sharing")}</Button>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  avatar={s.type === "classroom" ? <TeamOutlined /> : <UserOutlined />}
                  title={s.name}
                  description={
                    s.canEdit ? t("teach.shareCourse.canEdit", "Can add and change videos") : t("teach.shareCourse.canView", "Can watch")
                  }
                />
              </List.Item>
            )}
          />
        </>
      )}

      <Checkbox checked={canEdit} onChange={(e) => setCanEdit(e.target.checked)} className="tm-teach-block tm-gap-md">
        {t("teach.shareCourse.allowEdit", "Let them add and change videos too (for other teachers)")}
      </Checkbox>

      <SectionTitle>{t("teach.shareCourse.withClass", "With a classroom you teach")}</SectionTitle>
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 2 }} title={false} />
      ) : teaching.length === 0 ? (
        <Typography.Text type="secondary">
          {t("teach.shareCourse.noClasses", "You don't teach any classrooms yet.")}
        </Typography.Text>
      ) : (
        <List
          className="tm-list"
          dataSource={teaching}
          rowKey="id"
          renderItem={(c) => {
            const existing = sharedWith("classroom", c.id);
            return (
              <List.Item
                actions={[
                  existing ? (
                    <Tag key="done" color="success" icon={<CheckOutlined />}>
                      {t("teach.share.shared", "Shared")}
                    </Tag>
                  ) : (
                    <Button key="share" type="primary" loading={busy === `classroom-${c.id}`} onClick={() => doShare("classroom", c.id, c.name)}>
                      {t("teach.share.share", "Share")}
                    </Button>
                  ),
                ]}
              >
                <List.Item.Meta
                  avatar={<TeamOutlined />}
                  title={c.name}
                  description={t("teach.card.students", "{{count}} students", { count: c.studentCount })}
                />
              </List.Item>
            );
          }}
        />
      )}

      <SectionTitle>{t("teach.shareCourse.withPerson", "With one person")}</SectionTitle>
      <PeopleSearch
        autoFocus={false}
        doneIds={course.shares.filter((s) => s.type === "user").map((s) => s.id)}
        renderAction={(person) => (
          <Button type="primary" loading={busy === `user-${person.userId}`} onClick={() => doShare("user", person.userId, person.name)}>
            {t("teach.share.share", "Share")}
          </Button>
        )}
      />
    </Modal>
  );
}

const TOP = "__top__";

export function MoveModal({ item, open, onClose, onMoved }) {
  const { t } = useTranslation();
  const { data: tree, isLoading } = useGetCourseTreeQuery(undefined, { skip: !open });
  const [move, { isLoading: moving }] = useMoveCourseMutation();
  const [destination, setDestination] = useState(null);
  const [error, setError] = useState(null);
  const options = [
    { value: TOP, label: t("teach.move.top", "Make it a course of its own") },
    ...moveDestinations(tree, item?.id).map((d) => ({ value: d.id, label: d.label })),
  ];

  useEffect(() => {
    if (open) {
      setDestination(null);
      setError(null);
    }
  }, [open]);

  const submit = async () => {
    setError(null);
    try {
      await move({ id: item.id, destinationId: destination === TOP ? null : destination }).unwrap();
      onMoved?.(destination === TOP ? null : destination);
    } catch (err) {
      setError(rpcErrorMessage(err, t("teach.move.failed", "We couldn't move it.")));
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={submit}
      okText={t("teach.move.ok", "Move")}
      cancelText={t("teach.cancel", "Cancel")}
      okButtonProps={{ disabled: !destination, size: "large" }}
      cancelButtonProps={{ size: "large" }}
      confirmLoading={moving}
      title={t("teach.move.title", "Move “{{name}}”", { name: item?.name })}
      destroyOnClose
    >
      <Typography.Paragraph className="tm-teach-help">
        {t("teach.move.help", "Where should it go? Everything inside it moves too.")}
      </Typography.Paragraph>
      <Select
        size="large"
        className="tm-full-width"
        loading={isLoading}
        showSearch
        optionFilterProp="label"
        placeholder={t("teach.move.placeholder", "Choose a course or section")}
        value={destination}
        onChange={setDestination}
        options={options}
        aria-label={t("teach.move.placeholder", "Choose a course or section")}
      />
      {error && <Alert type="error" showIcon message={error} className="tm-gap-sm" />}
    </Modal>
  );
}
