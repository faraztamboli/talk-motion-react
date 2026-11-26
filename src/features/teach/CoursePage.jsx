import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Breadcrumb, Button, Dropdown, List, Modal, Popconfirm, Skeleton, Tag, Typography, message } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  ExperimentOutlined,
  FolderOutlined,
  MoreOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ShareAltOutlined,
  SwapOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import MetaDecorator from "../../components/MetaDecorator";
import { rpcErrorMessage } from "../../api/rpc";
import {
  useCreateCourseMutation,
  useDeleteCourseMutation,
  useGetCourseQuery,
  useRemoveLessonMutation,
  useRenameCourseMutation,
} from "./teachApi";
import { ActionCard, LoadError, PageHeader, SectionTitle, ServerUpdateNotice, TeachPage } from "./components";
import { NameModal } from "./CoursesPage";
import { AddVideosModal, MoveModal, ShareCourseModal } from "./courseModals";

/** Where a lesson opens. */
export function lessonLink(lesson) {
  if (lesson.type === "model") return `/models/${lesson.contentId}`;
  return `/video-subtitles/library/${lesson.contentId}`;
}

const ACCESS_NOTE = {
  edit: "You can add and change videos in this course.",
  view: "You can watch this course.",
};

export default function CoursePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { data: course, error, isLoading, refetch } = useGetCourseQuery(courseId);
  const [createCourse] = useCreateCourseMutation();
  const [renameCourse] = useRenameCourseMutation();
  const [deleteCourse] = useDeleteCourseMutation();
  const [removeLesson] = useRemoveLessonMutation();
  const [dialog, setDialog] = useState(null); // add | section | share | rename | move
  const [target, setTarget] = useState(null); // section being renamed or moved
  const [messageApi, contextHolder] = message.useMessage();
  const [modal, modalHolder] = Modal.useModal();

  const crumbs = (
    <Breadcrumb
      className="tm-teach-block"
      items={[
        { title: <Link to="/courses">{t("teach.courses.title", "Courses")}</Link> },
        ...(course?.path || []).map((p, i, all) => ({
          title: i === all.length - 1 ? p.name : <Link to={`/courses/${p.id}`}>{p.name}</Link>,
        })),
      ]}
    />
  );

  if (isLoading) {
    return (
      <TeachPage>
        <Skeleton active paragraph={{ rows: 6 }} />
      </TeachPage>
    );
  }
  if (error || !course) {
    return (
      <TeachPage>
        {crumbs}
        <ServerUpdateNotice />
        <LoadError error={error} onRetry={refetch} fallback={t("teach.course.loadFailed", "We couldn't open this course.")} />
        <Button onClick={() => navigate("/courses")}>{t("teach.course.back", "Back to courses")}</Button>
      </TeachPage>
    );
  }

  const canEdit = course.access === "owner" || course.access === "edit";
  const isOwner = course.access === "owner";
  const isSection = course.path.length > 1;
  const parent = isSection ? course.path[course.path.length - 2] : null;
  const close = () => {
    setDialog(null);
    setTarget(null);
  };

  const addSection = async ({ name, description }) => {
    const res = await createCourse({ name, description, parentId: course.id }).unwrap();
    close();
    messageApi.success(t("teach.course.sectionAdded", "Section added."));
    return res;
  };

  const rename = async ({ name, description }) => {
    await renameCourse({ id: target?.id || course.id, name, description }).unwrap();
    close();
  };

  const remove = async (item) => {
    try {
      await deleteCourse(item.id).unwrap();
      if (item.id === course.id) navigate(parent ? `/courses/${parent.id}` : "/courses", { replace: true });
      else messageApi.success(t("teach.course.deleted", "Deleted."));
    } catch (err) {
      messageApi.error(rpcErrorMessage(err));
    }
  };

  const takeOut = async (lesson) => {
    try {
      await removeLesson({ courseId: course.id, lessonId: lesson.id }).unwrap();
    } catch (err) {
      messageApi.error(rpcErrorMessage(err));
    }
  };

  const itemMenu = (item, self = false) => ({
    items: [
      { key: "rename", icon: <EditOutlined />, label: t("teach.course.rename", "Rename") },
      { key: "move", icon: <SwapOutlined />, label: t("teach.course.move", "Move") },
      { type: "divider" },
      { key: "delete", danger: true, icon: <DeleteOutlined />, label: t("teach.course.delete", "Delete") },
    ],
    onClick: ({ key, domEvent }) => {
      domEvent.stopPropagation();
      if (key === "rename") {
        setTarget(self ? null : item);
        setDialog("rename");
      } else if (key === "move") {
        setTarget(item);
        setDialog("move");
      } else if (key === "delete") {
        modal.confirm({
          title: self
            ? t("teach.course.deleteSelf", "Delete “{{name}}” and everything in it?", { name: item.name })
            : t("teach.course.deleteSection", "Delete the section “{{name}}” and everything in it?", { name: item.name }),
          content: t("teach.course.deleteHelp", "The videos themselves are not deleted."),
          okText: t("teach.course.delete", "Delete"),
          okButtonProps: { danger: true },
          cancelText: t("teach.cancel", "Cancel"),
          onOk: () => remove(item),
        });
      }
    },
  });

  const empty = course.sections.length === 0 && course.lessons.length === 0;

  return (
    <TeachPage>
      <MetaDecorator title={`${course.name} - TalkMotion`} description={course.description || course.name} />
      {contextHolder}
      {modalHolder}
      {crumbs}
      <PageHeader
        above={
          !isOwner && (
            <Tag bordered={false} color={course.access === "edit" ? "geekblue" : "green"}>
              {t(`teach.course.access.${course.access}`, ACCESS_NOTE[course.access])}
            </Tag>
          )
        }
        title={course.name}
        help={course.description || null}
        actions={
          canEdit && (
            <>
              <Button size="large" type="primary" icon={<PlusOutlined />} onClick={() => setDialog("add")}>
                {t("teach.course.addVideos", "Add videos")}
              </Button>
              <Button size="large" icon={<FolderOutlined />} onClick={() => setDialog("section")}>
                {t("teach.course.addSection", "Add a section")}
              </Button>
              {isOwner && !isSection && (
                <Button size="large" icon={<ShareAltOutlined />} onClick={() => setDialog("share")}>
                  {t("teach.course.share", "Share")}
                </Button>
              )}
              {isOwner && (
                <Dropdown menu={itemMenu(course, true)} trigger={["click"]}>
                  <Button size="large" icon={<MoreOutlined />} aria-label={t("teach.course.more", "More options")} />
                </Dropdown>
              )}
            </>
          )
        }
      />

      {isOwner && !isSection && (
        <Typography.Paragraph className="tm-teach-muted">
          {course.shares.length === 0 ? (
            t("teach.course.notShared", "Only you can see this course. Use Share to give it to a classroom or a person.")
          ) : (
            <>
              {t("teach.course.sharedWith", "Shared with:")}{" "}
              {course.shares.map((s) => (
                <Tag key={`${s.type}-${s.id}`} icon={s.type === "classroom" ? <TeamOutlined /> : <UserOutlined />}>
                  {s.name}
                </Tag>
              ))}
            </>
          )}
        </Typography.Paragraph>
      )}

      {empty ? (
        canEdit ? (
          <>
            <Typography.Paragraph className="tm-teach-help">
              {t("teach.course.emptyLead", "This course is empty. Start by adding videos.")}
            </Typography.Paragraph>
            <div className="tm-actions">
              <ActionCard
                primary
                icon={<PlayCircleOutlined />}
                title={t("teach.course.emptyAdd", "Add my first videos")}
                help={t("teach.course.emptyAddHelp", "Pick from the captioned videos you've made.")}
                onClick={() => setDialog("add")}
              />
              <ActionCard
                icon={<FolderOutlined />}
                title={t("teach.course.emptySection", "Split it into sections")}
                help={t("teach.course.emptySectionHelp", "For example “Week 1”, “Week 2”. Optional.")}
                onClick={() => setDialog("section")}
              />
            </div>
          </>
        ) : (
          <Typography.Paragraph className="tm-teach-muted">
            {t("teach.course.emptyView", "Nothing here yet. Check back soon.")}
          </Typography.Paragraph>
        )
      ) : (
        <>
          {course.sections.length > 0 && (
            <>
              <SectionTitle>{t("teach.course.sectionsTitle", "Sections")}</SectionTitle>
              <List
                className="tm-list"
                dataSource={course.sections}
                rowKey="id"
                renderItem={(s) => (
                  <List.Item
                    actions={[
                      <Button key="open" type="primary" onClick={() => navigate(`/courses/${s.id}`)}>
                        {t("teach.classroom.openCourse", "Open")}
                      </Button>,
                      ...(canEdit
                        ? [
                            <Dropdown key="more" menu={itemMenu(s)} trigger={["click"]}>
                              <Button icon={<MoreOutlined />} aria-label={t("teach.course.moreFor", "More options for {{name}}", { name: s.name })} />
                            </Dropdown>,
                          ]
                        : []),
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<span className="tm-lesson-icon tm-section-icon"><FolderOutlined /></span>}
                      title={<Link to={`/courses/${s.id}`}>{s.name}</Link>}
                      description={[
                        t("teach.courses.videos", "{{count}} videos", { count: s.lessonCount }),
                        s.sectionCount ? t("teach.courses.sections", "{{count}} sections", { count: s.sectionCount }) : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    />
                  </List.Item>
                )}
              />
            </>
          )}

          {course.lessons.length > 0 && (
            <>
              <SectionTitle>{t("teach.course.videosTitle", "Videos ({{count}})", { count: course.lessons.length })}</SectionTitle>
              <List
                className="tm-list"
                dataSource={course.lessons}
                rowKey="id"
                renderItem={(lesson, index) => (
                  <List.Item
                    actions={[
                      <Button key="watch" type="primary" icon={<PlayCircleOutlined />} onClick={() => navigate(lessonLink(lesson))}>
                        {lesson.type === "model" ? t("teach.course.open", "Open") : t("teach.course.watch", "Watch")}
                      </Button>,
                      ...(canEdit
                        ? [
                            <Popconfirm
                              key="remove"
                              title={t("teach.course.removeConfirm", "Take “{{name}}” out of this course?", { name: lesson.title })}
                              description={t("teach.course.removeHelp", "The video itself is not deleted.")}
                              okText={t("teach.course.remove", "Take out")}
                              cancelText={t("teach.cancel", "Cancel")}
                              onConfirm={() => takeOut(lesson)}
                            >
                              <Button>{t("teach.course.remove", "Take out")}</Button>
                            </Popconfirm>,
                          ]
                        : []),
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <span className="tm-lesson-icon">
                          {lesson.type === "model" ? <ExperimentOutlined /> : index + 1}
                        </span>
                      }
                      title={<Link to={lessonLink(lesson)}>{lesson.title}</Link>}
                      description={lesson.description || null}
                    />
                  </List.Item>
                )}
              />
            </>
          )}
        </>
      )}

      {canEdit && (
        <AddVideosModal
          course={course}
          open={dialog === "add"}
          onClose={(added) => {
            close();
            if (added) messageApi.success(t("teach.addVideos.done", "{{count}} videos added.", { count: added }));
          }}
        />
      )}
      <NameModal
        open={dialog === "section"}
        title={t("teach.course.sectionTitle", "Add a section to “{{name}}”", { name: course.name })}
        nameLabel={t("teach.course.sectionName", "Section name")}
        help={t("teach.course.sectionHelp", "Sections keep a long course tidy, for example “Week 1” or “Greetings”.")}
        okText={t("teach.course.sectionCreate", "Add section")}
        onSubmit={addSection}
        onClose={close}
      />
      <NameModal
        open={dialog === "rename"}
        title={t("teach.course.renameTitle", "Rename")}
        okText={t("teach.save", "Save")}
        initial={target || course}
        onSubmit={rename}
        onClose={close}
      />
      {isOwner && <ShareCourseModal course={course} open={dialog === "share"} onClose={close} />}
      <MoveModal
        item={target}
        open={dialog === "move"}
        onClose={close}
        onMoved={(destinationId) => {
          const movedSelf = target?.id === course.id;
          close();
          messageApi.success(t("teach.move.done", "Moved."));
          if (movedSelf) navigate(`/courses/${course.id}`, { replace: true });
          else if (destinationId) refetch();
        }}
      />
    </TeachPage>
  );
}
