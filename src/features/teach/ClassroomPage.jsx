import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Alert,
  Breadcrumb,
  Button,
  Drawer,
  Form,
  Input,
  List,
  Modal,
  Popconfirm,
  Segmented,
  Skeleton,
  Tag,
  Typography,
  message,
} from "antd";
import {
  BookOutlined,
  CheckOutlined,
  CloseOutlined,
  CopyOutlined,
  GlobalOutlined,
  LockOutlined,
  SettingOutlined,
  ShareAltOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import MetaDecorator from "../../components/MetaDecorator";
import ErrorBoundary from "../../components/ErrorBoundary";
import StartLessonButton from "../conversation/components/StartLessonButton";
import { rpcErrorMessage } from "../../api/rpc";
import {
  useAddClassroomMemberMutation,
  useAnswerRequestMutation,
  useArchiveClassroomMutation,
  useGetClassroomQuery,
  useListCoursesQuery,
  useRemoveClassroomMemberMutation,
  useRequestToJoinMutation,
  useShareCourseMutation,
  useUnshareCourseMutation,
  useUpdateClassroomMutation,
} from "./teachApi";
import {
  BigChoice,
  LoadError,
  PageHeader,
  PeopleSearch,
  PersonAvatar,
  RoleTag,
  SectionTitle,
  ServerUpdateNotice,
  TeachPage,
} from "./components";

/** Whether `myRole` may remove a person with `role` (mirrors the server's rule). */
export function canRemove(myRole, role, isSelf) {
  if (role === "owner") return false;
  if (isSelf) return myRole === "teacher" || myRole === "student";
  if (role === "teacher") return myRole === "owner";
  if (role === "student") return myRole === "owner" || myRole === "teacher";
  return false;
}

const ROLE_WORD = { owner: "Runs this classroom", teacher: "Teacher", student: "Student" };

function PeopleList({ people, classroom, me, onRemove, busyId }) {
  const { t } = useTranslation();
  if (!people.length) return null;
  return (
    <List
      className="tm-list"
      dataSource={people}
      rowKey={(p) => `${p.role}-${p.userId}`}
      renderItem={(person) => {
        const isSelf = person.username === me;
        const removable = !isSelf && canRemove(classroom.role, person.role, false);
        return (
          <List.Item
            actions={
              removable
                ? [
                    <Popconfirm
                      key="remove"
                      title={t("teach.people.removeConfirm", "Remove {{name}} from this classroom?", { name: person.name })}
                      okText={t("teach.people.remove", "Remove")}
                      cancelText={t("teach.cancel", "Cancel")}
                      okButtonProps={{ danger: true }}
                      onConfirm={() => onRemove(person)}
                    >
                      <Button loading={busyId === person.userId}>{t("teach.people.remove", "Remove")}</Button>
                    </Popconfirm>,
                  ]
                : []
            }
          >
            <List.Item.Meta
              avatar={<PersonAvatar person={person} />}
              title={
                <>
                  {person.name} {isSelf && <Tag bordered={false}>{t("teach.people.you", "You")}</Tag>}
                </>
              }
              description={t(`teach.people.role.${person.role}`, ROLE_WORD[person.role] || "")}
            />
          </List.Item>
        );
      }}
    />
  );
}

function RequestsList({ classroom }) {
  const { t } = useTranslation();
  const [answer] = useAnswerRequestMutation();
  const [busy, setBusy] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();

  const respond = async (person, approve) => {
    setBusy(`${person.requestId}-${approve}`);
    try {
      await answer({ requestId: person.requestId, role: person.role, approve, classroomId: classroom.id }).unwrap();
      messageApi.success(
        approve
          ? t("teach.requests.approved", "{{name}} is in.", { name: person.name })
          : t("teach.requests.declined", "Request from {{name}} declined.", { name: person.name })
      );
    } catch (err) {
      messageApi.error(rpcErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  if (!classroom.requests.length) return null;
  return (
    <>
      {contextHolder}
      <SectionTitle>{t("teach.requests.title", "Asking to join ({{count}})", { count: classroom.requests.length })}</SectionTitle>
      <List
        className="tm-list"
        dataSource={classroom.requests}
        rowKey={(p) => `${p.role}-${p.requestId}`}
        renderItem={(person) => (
          <List.Item
            actions={[
              <Button
                key="yes"
                type="primary"
                icon={<CheckOutlined />}
                loading={busy === `${person.requestId}-true`}
                onClick={() => respond(person, true)}
              >
                {t("teach.requests.letIn", "Let in")}
              </Button>,
              <Button
                key="no"
                icon={<CloseOutlined />}
                loading={busy === `${person.requestId}-false`}
                onClick={() => respond(person, false)}
              >
                {t("teach.requests.decline", "Decline")}
              </Button>,
            ]}
          >
            <List.Item.Meta
              avatar={<PersonAvatar person={person} />}
              title={person.name}
              description={
                person.role === "teacher"
                  ? t("teach.requests.asTeacher", "Wants to help teach")
                  : t("teach.requests.asStudent", "Wants to join as a student")
              }
            />
          </List.Item>
        )}
      />
    </>
  );
}

function AddPeopleModal({ classroom, open, onClose }) {
  const { t } = useTranslation();
  const [addAs, setAddAs] = useState("student");
  const [added, setAdded] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [addMember] = useAddClassroomMemberMutation();
  const [messageApi, contextHolder] = message.useMessage();
  const memberIds = classroom.people.map((p) => p.userId);
  const link = `${window.location.origin}/classroom/${classroom.id}`;

  const add = async (person) => {
    setBusyId(person.userId);
    try {
      await addMember({ classroomId: classroom.id, userId: person.userId, role: addAs }).unwrap();
      setAdded((list) => [...list, person.userId]);
    } catch (err) {
      messageApi.error(rpcErrorMessage(err, t("teach.people.addFailed", "We couldn't add that person.")));
    } finally {
      setBusyId(null);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      messageApi.success(t("teach.people.linkCopied", "Link copied. Send it to the people you want in your class."));
    } catch {
      messageApi.info(link);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={t("teach.people.addTitle", "Add people to {{name}}", { name: classroom.name })}
      footer={
        <Button type="primary" size="large" onClick={onClose}>
          {t("teach.done", "Done")}
        </Button>
      }
      destroyOnClose
      width={600}
    >
      {contextHolder}
      {classroom.can.add_teacher && (
        <div className="tm-teach-block">
          <Typography.Text strong>{t("teach.new.addAs", "Add them as")} </Typography.Text>
          <Segmented
            value={addAs}
            onChange={setAddAs}
            options={[
              { value: "student", label: t("teach.people.asStudent", "Students") },
              { value: "teacher", label: t("teach.people.asTeacher", "Teachers") },
            ]}
          />
        </div>
      )}
      <PeopleSearch
        doneIds={[...added, ...memberIds]}
        renderAction={(person) => (
          <Button type="primary" loading={busyId === person.userId} onClick={() => add(person)}>
            {t("teach.people.add", "Add")}
          </Button>
        )}
      />
      {classroom.isPublic && (
        <div className="tm-teach-block tm-gap-lg">
          <Typography.Text strong>{t("teach.people.orLink", "Or send them this link")}</Typography.Text>
          <Typography.Paragraph type="secondary" className="tm-tight">
            {t("teach.people.linkHelp", "They'll see your classroom and can ask to join. You'll let them in.")}
          </Typography.Paragraph>
          <Input.Group compact className="tm-copy-row">
            <Input readOnly value={link} aria-label={t("teach.people.linkLabel", "Classroom link")} />
            <Button icon={<CopyOutlined />} onClick={copy}>
              {t("teach.people.copy", "Copy")}
            </Button>
          </Input.Group>
        </div>
      )}
    </Modal>
  );
}

function ShareCourseModal({ classroom, open, onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading } = useListCoursesQuery(undefined, { skip: !open });
  const [share] = useShareCourseMutation();
  const [busy, setBusy] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();
  const sharedIds = classroom.courses.map((c) => c.id);
  const mine = data?.mine || [];

  const doShare = async (course) => {
    setBusy(course.id);
    try {
      await share({ courseId: course.id, type: "classroom", id: classroom.id, canEdit: false }).unwrap();
      messageApi.success(t("teach.share.done", "Everyone in {{name}} can now open “{{course}}”.", { name: classroom.name, course: course.name }));
    } catch (err) {
      messageApi.error(rpcErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={t("teach.share.title", "Share a course with {{name}}", { name: classroom.name })}
      footer={
        <Button type="primary" size="large" onClick={onClose}>
          {t("teach.done", "Done")}
        </Button>
      }
      destroyOnClose
      width={600}
    >
      {contextHolder}
      {isLoading ? (
        <Skeleton active />
      ) : mine.length === 0 ? (
        <Alert
          type="info"
          showIcon
          message={t("teach.share.noCourses", "You haven't made a course yet.")}
          description={t("teach.share.noCoursesHelp", "A course is a set of videos in order. Make one, then share it here.")}
          action={
            <Button type="primary" onClick={() => navigate("/courses?new=1")}>
              {t("teach.share.makeCourse", "Make a course")}
            </Button>
          }
        />
      ) : (
        <List
          className="tm-list"
          dataSource={mine}
          rowKey="id"
          renderItem={(course) => (
            <List.Item
              actions={[
                sharedIds.includes(course.id) ? (
                  <Tag key="done" color="success" icon={<CheckOutlined />}>
                    {t("teach.share.shared", "Shared")}
                  </Tag>
                ) : (
                  <Button key="share" type="primary" loading={busy === course.id} onClick={() => doShare(course)}>
                    {t("teach.share.share", "Share")}
                  </Button>
                ),
              ]}
            >
              <List.Item.Meta
                avatar={<span className="tm-lesson-icon"><BookOutlined /></span>}
                title={course.name}
                description={t("teach.courses.counts", "{{lessons}} videos", { lessons: course.lessonCount })}
              />
            </List.Item>
          )}
        />
      )}
    </Modal>
  );
}

function SettingsDrawer({ classroom, open, onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isPublic, setIsPublic] = useState(classroom.isPublic);
  const [error, setError] = useState(null);
  const [update, { isLoading: saving }] = useUpdateClassroomMutation();
  const [archive, { isLoading: deleting }] = useArchiveClassroomMutation();
  const [messageApi, contextHolder] = message.useMessage();

  const save = async () => {
    setError(null);
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    try {
      await update({ id: classroom.id, name: values.name.trim(), description: values.description || "", isPublic }).unwrap();
      messageApi.success(t("teach.settings.saved", "Saved."));
      onClose();
    } catch (err) {
      setError(rpcErrorMessage(err, t("teach.settings.saveFailed", "We couldn't save your changes.")));
    }
  };

  const remove = async () => {
    try {
      await archive(classroom.id).unwrap();
      navigate("/classrooms", { replace: true });
    } catch (err) {
      setError(rpcErrorMessage(err));
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={520}
      title={t("teach.settings.title", "Classroom settings")}
      destroyOnClose
      extra={
        <Button type="primary" loading={saving} onClick={save}>
          {t("teach.save", "Save")}
        </Button>
      }
    >
      {contextHolder}
      <Form
        form={form}
        layout="vertical"
        size="large"
        requiredMark={false}
        initialValues={{ name: classroom.name, description: classroom.description }}
      >
        <Form.Item
          name="name"
          label={t("teach.settings.name", "Name")}
          rules={[{ required: true, whitespace: true, message: t("teach.new.nameRequired", "Please type a name.") }, { max: 100 }]}
        >
          <Input maxLength={100} />
        </Form.Item>
        <Form.Item name="description" label={t("teach.settings.description", "What people learn here")}>
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} maxLength={2000} />
        </Form.Item>
      </Form>
      <Typography.Text strong>{t("teach.new.whoLabel", "Who can join?")}</Typography.Text>
      <div className="tm-choices tm-gap-sm" role="radiogroup">
        <BigChoice
          name="who-settings"
          value={false}
          selected={!isPublic}
          onSelect={() => setIsPublic(false)}
          icon={<LockOutlined />}
          title={t("teach.new.private", "Only people I add")}
        />
        <BigChoice
          name="who-settings"
          value
          selected={isPublic}
          onSelect={() => setIsPublic(true)}
          icon={<GlobalOutlined />}
          title={t("teach.new.public", "Anyone can find it and ask to join")}
        />
      </div>
      {error && <Alert type="error" showIcon message={error} className="tm-gap-md" />}
      <div className="tm-danger-zone">
        <Typography.Text strong>{t("teach.settings.deleteTitle", "Delete this classroom")}</Typography.Text>
        <Typography.Paragraph type="secondary">
          {t("teach.settings.deleteHelp", "Nobody will be able to open it any more. Courses and videos are not deleted.")}
        </Typography.Paragraph>
        <Popconfirm
          title={t("teach.settings.deleteConfirm", "Delete “{{name}}”?", { name: classroom.name })}
          okText={t("teach.settings.delete", "Delete classroom")}
          cancelText={t("teach.cancel", "Cancel")}
          okButtonProps={{ danger: true, loading: deleting }}
          onConfirm={remove}
        >
          <Button danger>{t("teach.settings.delete", "Delete classroom")}</Button>
        </Popconfirm>
      </div>
    </Drawer>
  );
}

function JoinPanel({ classroom }) {
  const { t } = useTranslation();
  const [requestToJoin, { isLoading }] = useRequestToJoinMutation();
  const [error, setError] = useState(null);
  const ask = async (role) => {
    setError(null);
    try {
      await requestToJoin({ classroomId: classroom.id, role }).unwrap();
    } catch (err) {
      setError(rpcErrorMessage(err));
    }
  };
  if (classroom.pending) {
    return (
      <Alert
        type="success"
        showIcon
        className="tm-teach-block"
        message={t("teach.join.sent", "Your request has been sent.")}
        description={t("teach.join.sentHelp", "The teacher will let you in. This classroom will then appear in your Classrooms.")}
      />
    );
  }
  return (
    <div className="tm-teach-block">
      <Typography.Paragraph className="tm-teach-help">
        {t("teach.join.lead", "You're not in this classroom yet. Ask to join and the teacher will let you in.")}
      </Typography.Paragraph>
      <Button size="large" type="primary" icon={<UserAddOutlined />} loading={isLoading} onClick={() => ask("student")}>
        {t("teach.join.ask", "Ask to join")}
      </Button>{" "}
      <Button type="link" onClick={() => ask("teacher")} disabled={isLoading}>
        {t("teach.join.askTeacher", "I'd like to help teach")}
      </Button>
      {error && <Alert type="error" showIcon message={error} className="tm-gap-sm" />}
    </div>
  );
}

export default function ClassroomPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { classroomId } = useParams();
  const me = useSelector((state) => state.user?.username);
  const { data: classroom, error, isLoading, refetch } = useGetClassroomQuery(classroomId);
  const [removeMember] = useRemoveClassroomMemberMutation();
  const [unshare] = useUnshareCourseMutation();
  const [adding, setAdding] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [settings, setSettings] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();

  const crumbs = (
    <Breadcrumb
      className="tm-teach-block"
      items={[{ title: <Link to="/classrooms">{t("teach.classrooms.title", "Classrooms")}</Link> }, { title: classroom?.name || "…" }]}
    />
  );

  if (isLoading) {
    return (
      <TeachPage>
        <Skeleton active paragraph={{ rows: 6 }} />
      </TeachPage>
    );
  }
  if (error || !classroom) {
    return (
      <TeachPage>
        {crumbs}
        <ServerUpdateNotice />
        <LoadError error={error} onRetry={refetch} fallback={t("teach.classroom.loadFailed", "We couldn't open this classroom.")} />
        <Button onClick={() => navigate("/classrooms")}>{t("teach.classroom.back", "Back to classrooms")}</Button>
      </TeachPage>
    );
  }

  const staff = classroom.role === "owner" || classroom.role === "teacher";
  const teachers = classroom.people.filter((p) => p.role === "owner" || p.role === "teacher");
  const students = classroom.people.filter((p) => p.role === "student");
  const myself = classroom.people.find((p) => p.username === me);

  const remove = async (person) => {
    setBusyId(person.userId);
    try {
      await removeMember({ classroomId: classroom.id, userId: person.userId, role: person.role }).unwrap();
      messageApi.success(t("teach.people.removed", "{{name}} was removed.", { name: person.name }));
    } catch (err) {
      messageApi.error(rpcErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const leave = async () => {
    try {
      await removeMember({ classroomId: classroom.id, userId: myself.userId, role: classroom.role }).unwrap();
      navigate("/classrooms", { replace: true });
    } catch (err) {
      messageApi.error(rpcErrorMessage(err));
    }
  };

  const stopSharing = async (course) => {
    try {
      await unshare({ courseId: course.id, type: "classroom", id: classroom.id }).unwrap();
    } catch (err) {
      messageApi.error(rpcErrorMessage(err));
    }
  };

  return (
    <TeachPage>
      <MetaDecorator title={`${classroom.name} - TalkMotion`} description={classroom.description || classroom.name} />
      {contextHolder}
      {crumbs}
      <PageHeader
        above={<RoleTag role={classroom.role} />}
        title={classroom.name}
        help={classroom.description || null}
        actions={
          staff && (
            <>
              <Button size="large" type="primary" icon={<UserAddOutlined />} onClick={() => setAdding(true)}>
                {t("teach.classroom.addPeople", "Add people")}
              </Button>
              <StartLessonButton classroomName={classroom.name} />
              {classroom.can.edit && (
                <Button size="large" icon={<SettingOutlined />} onClick={() => setSettings(true)}>
                  {t("teach.classroom.settings", "Settings")}
                </Button>
              )}
            </>
          )
        }
      />

      {!classroom.role && <JoinPanel classroom={classroom} />}

      {staff && (
        <ErrorBoundary compact>
          <RequestsList classroom={classroom} />
        </ErrorBoundary>
      )}

      {classroom.role && (
        <>
          <SectionTitle
            extra={
              staff && (
                <Button icon={<ShareAltOutlined />} onClick={() => setSharing(true)}>
                  {t("teach.classroom.shareCourse", "Share a course")}
                </Button>
              )
            }
          >
            {t("teach.classroom.courses", "Courses")}
          </SectionTitle>
          {classroom.courses.length === 0 ? (
            <Typography.Paragraph className="tm-teach-muted">
              {staff
                ? t("teach.classroom.noCoursesStaff", "Share a course so your students have videos to learn from.")
                : t("teach.classroom.noCourses", "Your teacher hasn't shared any courses yet.")}
            </Typography.Paragraph>
          ) : (
            <div className="tm-card-grid">
              {classroom.courses.map((course) => (
                <div key={course.id} className="tm-card">
                  <Link to={`/courses/${course.id}`} className="tm-card__title">
                    <BookOutlined /> {course.name}
                  </Link>
                  {course.description && <span className="tm-card__desc">{course.description}</span>}
                  <div className="tm-card__foot">
                    <Button type="primary" onClick={() => navigate(`/courses/${course.id}`)}>
                      {t("teach.classroom.openCourse", "Open")}
                    </Button>
                    {staff && course.owner === me && (
                      <Popconfirm
                        title={t("teach.classroom.unshareConfirm", "Stop sharing “{{name}}” with this classroom?", { name: course.name })}
                        okText={t("teach.classroom.unshare", "Stop sharing")}
                        cancelText={t("teach.cancel", "Cancel")}
                        onConfirm={() => stopSharing(course)}
                      >
                        <Button>{t("teach.classroom.unshare", "Stop sharing")}</Button>
                      </Popconfirm>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <SectionTitle>{t("teach.classroom.teachers", "Teachers")}</SectionTitle>
          <PeopleList people={teachers} classroom={classroom} me={me} onRemove={remove} busyId={busyId} />

          <SectionTitle
            extra={
              staff && (
                <Button icon={<UserAddOutlined />} onClick={() => setAdding(true)}>
                  {t("teach.classroom.addStudents", "Add students")}
                </Button>
              )
            }
          >
            {t("teach.classroom.students", "Students ({{count}})", { count: students.length })}
          </SectionTitle>
          {students.length === 0 ? (
            <Typography.Paragraph className="tm-teach-muted">
              {staff
                ? t("teach.classroom.noStudentsStaff", "No students yet. Use “Add people” to bring them in.")
                : t("teach.classroom.noStudents", "No other students yet.")}
            </Typography.Paragraph>
          ) : (
            <PeopleList people={students} classroom={classroom} me={me} onRemove={remove} busyId={busyId} />
          )}

          {myself && canRemove(classroom.role, classroom.role, true) && (
            <div className="tm-gap-xl">
              <Popconfirm
                title={t("teach.classroom.leaveConfirm", "Leave “{{name}}”?", { name: classroom.name })}
                description={t("teach.classroom.leaveHelp", "You'll need to ask again to come back.")}
                okText={t("teach.classroom.leave", "Leave classroom")}
                cancelText={t("teach.cancel", "Cancel")}
                okButtonProps={{ danger: true }}
                onConfirm={leave}
              >
                <Button danger type="text">
                  {t("teach.classroom.leave", "Leave classroom")}
                </Button>
              </Popconfirm>
            </div>
          )}
        </>
      )}

      {staff && <AddPeopleModal classroom={classroom} open={adding} onClose={() => setAdding(false)} />}
      {staff && <ShareCourseModal classroom={classroom} open={sharing} onClose={() => setSharing(false)} />}
      {classroom.can.edit && settings && <SettingsDrawer classroom={classroom} open={settings} onClose={() => setSettings(false)} />}
    </TeachPage>
  );
}
