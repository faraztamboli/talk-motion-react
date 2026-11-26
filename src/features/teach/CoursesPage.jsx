import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Button, Form, Input, Modal, Skeleton, Tag, Typography } from "antd";
import { BookOutlined, PlusOutlined, VideoCameraAddOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import MetaDecorator from "../../components/MetaDecorator";
import { rpcErrorMessage } from "../../api/rpc";
import { useCreateCourseMutation, useListCoursesQuery } from "./teachApi";
import { ActionCard, LoadError, PageHeader, SectionTitle, ServerUpdateNotice, TeachPage } from "./components";

/** Name (and optional description) for a new course or section. */
export function NameModal({ open, title, okText, initial, onSubmit, onClose, nameLabel, help }) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      form.setFieldsValue({ name: initial?.name || "", description: initial?.description || "" });
      setError(null);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ name: values.name.trim(), description: (values.description || "").trim() });
    } catch (err) {
      setError(rpcErrorMessage(err, t("teach.saveFailed", "We couldn't save that. Please try again.")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={title}
      onCancel={onClose}
      onOk={submit}
      okText={okText}
      cancelText={t("teach.cancel", "Cancel")}
      confirmLoading={saving}
      okButtonProps={{ size: "large" }}
      cancelButtonProps={{ size: "large" }}
      destroyOnClose
    >
      {help && <Typography.Paragraph className="tm-teach-help">{help}</Typography.Paragraph>}
      <Form form={form} layout="vertical" size="large" requiredMark={false} onFinish={submit}>
        <Form.Item
          name="name"
          label={nameLabel || t("teach.courses.nameLabel", "Name")}
          rules={[
            { required: true, whitespace: true, message: t("teach.new.nameRequired", "Please type a name.") },
            { max: 100, message: t("teach.new.nameTooLong", "Please keep the name under 100 characters.") },
          ]}
        >
          <Input autoFocus maxLength={100} />
        </Form.Item>
        <Form.Item name="description" label={t("teach.courses.descLabel", "Short description (optional)")}>
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 5 }} maxLength={2000} />
        </Form.Item>
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </Form>
      {error && <Alert type="error" showIcon message={error} />}
    </Modal>
  );
}

const ACCESS_TEXT = { owner: "Yours", edit: "You can edit", view: "You can watch" };

export function CourseCard({ course }) {
  const { t } = useTranslation();
  return (
    <Link to={`/courses/${course.id}`} className="tm-card">
      <div className="tm-card__top">
        <span className="tm-card__title">
          <BookOutlined /> {course.name}
        </span>
        {course.access !== "owner" && (
          <Tag bordered={false} color={course.access === "edit" ? "geekblue" : "green"}>
            {t(`teach.courses.access.${course.access}`, ACCESS_TEXT[course.access])}
          </Tag>
        )}
      </div>
      {course.description && <span className="tm-card__desc">{course.description}</span>}
      <div className="tm-card__meta">
        <span>{t("teach.courses.videos", "{{count}} videos", { count: course.lessonCount })}</span>
        {course.sectionCount > 0 && (
          <span>{t("teach.courses.sections", "{{count}} sections", { count: course.sectionCount })}</span>
        )}
        {course.access !== "owner" && course.owner && <span>{t("teach.find.by", "by {{name}}", { name: course.owner })}</span>}
      </div>
    </Link>
  );
}

export default function CoursesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [creating, setCreating] = useState(params.get("new") === "1");
  const { data, error, isLoading, refetch } = useListCoursesQuery();
  const [createCourse] = useCreateCourseMutation();
  const mine = data?.mine || [];
  const shared = data?.shared || [];
  const empty = !isLoading && !error && mine.length === 0 && shared.length === 0;

  const close = () => {
    setCreating(false);
    if (params.get("new")) {
      const next = new URLSearchParams(params);
      next.delete("new");
      setParams(next, { replace: true });
    }
  };

  const create = async ({ name, description }) => {
    const res = await createCourse({ name, description }).unwrap();
    setCreating(false);
    navigate(`/courses/${res.id}`);
  };

  return (
    <TeachPage>
      <MetaDecorator title={t("teach.courses.metaTitle", "Courses - TalkMotion")} description={t("teach.courses.help", "A course is a set of videos in order. Share it with a classroom or with one person.")} />
      <PageHeader
        title={t("teach.courses.title", "Courses")}
        help={t("teach.courses.help", "A course is a set of videos in order. Share it with a classroom or with one person.")}
        actions={
          !empty && (
            <Button size="large" type="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)}>
              {t("teach.courses.new", "Make a course")}
            </Button>
          )
        }
      />
      <ServerUpdateNotice />
      {error ? (
        <LoadError error={error} onRetry={refetch} fallback={t("teach.courses.loadFailed", "We couldn't load your courses.")} />
      ) : isLoading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : empty ? (
        <>
          <Typography.Paragraph className="tm-teach-help">
            {t("teach.courses.emptyLead", "You don't have any courses yet.")}
          </Typography.Paragraph>
          <div className="tm-actions">
            <ActionCard
              primary
              icon={<BookOutlined />}
              title={t("teach.courses.emptyNew", "Make my first course")}
              help={t("teach.courses.emptyNewHelp", "Give it a name, then add your videos.")}
              onClick={() => setCreating(true)}
            />
            <ActionCard
              icon={<VideoCameraAddOutlined />}
              title={t("teach.courses.emptyVideo", "Make a video first")}
              help={t("teach.courses.emptyVideoHelp", "Courses are made of captioned videos. Make one in a few minutes.")}
              onClick={() => navigate("/video-subtitles/designer")}
            />
          </div>
        </>
      ) : (
        <>
          {mine.length > 0 && (
            <>
              <SectionTitle>{t("teach.courses.mine", "Your courses")}</SectionTitle>
              <div className="tm-card-grid">
                {mine.map((c) => (
                  <CourseCard key={c.id} course={c} />
                ))}
              </div>
            </>
          )}
          {shared.length > 0 && (
            <>
              <SectionTitle>{t("teach.courses.shared", "Shared with you")}</SectionTitle>
              <div className="tm-card-grid">
                {shared.map((c) => (
                  <CourseCard key={c.id} course={c} />
                ))}
              </div>
            </>
          )}
        </>
      )}
      <NameModal
        open={creating}
        title={t("teach.courses.newTitle", "Make a course")}
        okText={t("teach.courses.create", "Create course")}
        nameLabel={t("teach.courses.newName", "What is the course called?")}
        onSubmit={create}
        onClose={close}
      />
    </TeachPage>
  );
}
