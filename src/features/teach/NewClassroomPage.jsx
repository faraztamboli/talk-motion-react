import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Form, Input, Segmented, Steps, Typography, message } from "antd";
import { GlobalOutlined, LockOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import MetaDecorator from "../../components/MetaDecorator";
import { rpcErrorMessage } from "../../api/rpc";
import { useAddClassroomMemberMutation, useCreateClassroomMutation } from "./teachApi";
import { BigChoice, PageHeader, PeopleSearch, ServerUpdateNotice, TeachPage } from "./components";

/**
 * Start a classroom in three short steps. The classroom is created when the person leaves
 * step 2, so step 3 (adding people) can be skipped and done later from the classroom page.
 */
export default function NewClassroomPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);
  const [details, setDetails] = useState({ name: "", description: "" });
  const [isPublic, setIsPublic] = useState(false);
  const [created, setCreated] = useState(null);
  const [error, setError] = useState(null);
  const [addAs, setAddAs] = useState("student");
  const [added, setAdded] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [createClassroom, { isLoading: creating }] = useCreateClassroomMutation();
  const [addMember] = useAddClassroomMemberMutation();

  const next = async () => {
    setError(null);
    if (step === 0) {
      let values;
      try {
        values = await form.validateFields();
      } catch {
        return; // the form shows what's missing
      }
      setDetails({ name: values.name.trim(), description: (values.description || "").trim() });
      setStep(1);
      return;
    }
    if (step === 1) {
      try {
        const res = await createClassroom({ ...details, isPublic }).unwrap();
        setCreated(res);
        setStep(2);
      } catch (err) {
        setError(rpcErrorMessage(err, t("teach.new.failed", "We couldn't create the classroom. Please try again.")));
      }
    }
  };

  const add = async (person) => {
    setBusyId(person.userId);
    try {
      await addMember({ classroomId: created.id, userId: person.userId, role: addAs }).unwrap();
      setAdded((list) => [...list, person.userId]);
      messageApi.success(
        addAs === "teacher"
          ? t("teach.new.addedTeacher", "{{name}} can now teach in this classroom.", { name: person.name })
          : t("teach.new.addedStudent", "{{name}} is now in your classroom.", { name: person.name })
      );
    } catch (err) {
      messageApi.error(rpcErrorMessage(err, t("teach.people.addFailed", "We couldn't add that person.")));
    } finally {
      setBusyId(null);
    }
  };

  const steps = [
    { title: t("teach.new.step1", "Name it") },
    { title: t("teach.new.step2", "Who can join") },
    { title: t("teach.new.step3", "Add people") },
  ];

  return (
    <TeachPage narrow>
      <MetaDecorator title={t("teach.new.metaTitle", "Start a classroom - TalkMotion")} description={t("teach.new.help", "Three quick steps. You can change everything later.")} />
      {contextHolder}
      <PageHeader
        title={t("teach.new.title", "Start a classroom")}
        help={t("teach.new.help", "Three quick steps. You can change everything later.")}
      />
      <ServerUpdateNotice />
      <Steps current={step} items={steps} className="tm-steps" responsive={false} size="small" />

      <div className="tm-step-body">
        {step === 0 && (
          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            initialValues={details}
            onFinish={next}
            size="large"
          >
            <Form.Item
              name="name"
              label={t("teach.new.nameLabel", "What is your classroom called?")}
              extra={t("teach.new.nameHelp", "For example: “ASL for beginners” or “Room 4, Tuesday group”.")}
              rules={[
                { required: true, whitespace: true, message: t("teach.new.nameRequired", "Please type a name.") },
                { max: 100, message: t("teach.new.nameTooLong", "Please keep the name under 100 characters.") },
              ]}
            >
              <Input autoFocus maxLength={100} />
            </Form.Item>
            <Form.Item
              name="description"
              label={t("teach.new.descLabel", "What will people learn here? (optional)")}
              rules={[{ max: 2000 }]}
            >
              <Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} maxLength={2000} />
            </Form.Item>
            <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
          </Form>
        )}

        {step === 1 && (
          <div role="radiogroup" aria-label={t("teach.new.whoLabel", "Who can join?")} className="tm-choices">
            <Typography.Title level={2} className="tm-teach-section__title">
              {t("teach.new.whoLabel", "Who can join?")}
            </Typography.Title>
            <BigChoice
              name="who"
              value={false}
              selected={!isPublic}
              onSelect={() => setIsPublic(false)}
              icon={<LockOutlined />}
              title={t("teach.new.private", "Only people I add")}
              help={t("teach.new.privateHelp", "Nobody else can see this classroom. Best for a class you already know.")}
            />
            <BigChoice
              name="who"
              value
              selected={isPublic}
              onSelect={() => setIsPublic(true)}
              icon={<GlobalOutlined />}
              title={t("teach.new.public", "Anyone can find it and ask to join")}
              help={t("teach.new.publicHelp", "It shows up in “Join a classroom”. You say yes or no to each person. It's free.")}
            />
            {error && <Alert type="error" showIcon message={error} />}
          </div>
        )}

        {step === 2 && created && (
          <>
            <Typography.Title level={2} className="tm-teach-section__title">
              {t("teach.new.addTitle", "“{{name}}” is ready. Who should be in it?", { name: created.name || details.name })}
            </Typography.Title>
            <Typography.Paragraph className="tm-teach-help">
              {t("teach.new.addHelp", "Find people by name and add them. You can also skip this and add people later.")}
            </Typography.Paragraph>
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
            <PeopleSearch
              doneIds={added}
              renderAction={(person) => (
                <Button type="primary" loading={busyId === person.userId} onClick={() => add(person)}>
                  {t("teach.people.add", "Add")}
                </Button>
              )}
            />
          </>
        )}
      </div>

      <div className="tm-step-nav">
        {step === 0 && (
          <Button size="large" onClick={() => navigate("/classrooms")}>
            {t("teach.cancel", "Cancel")}
          </Button>
        )}
        {step === 1 && (
          <Button size="large" onClick={() => setStep(0)} disabled={creating}>
            {t("teach.back", "Back")}
          </Button>
        )}
        {step < 2 && (
          <Button size="large" type="primary" onClick={next} loading={creating}>
            {step === 1 ? t("teach.new.create", "Create classroom") : t("teach.next", "Next")}
          </Button>
        )}
        {step === 2 && (
          <>
            <span />
            <Button size="large" type="primary" onClick={() => navigate(`/classroom/${created.id}`)}>
              {added.length
                ? t("teach.new.done", "Done: open my classroom")
                : t("teach.new.skip", "Skip for now: open my classroom")}
            </Button>
          </>
        )}
      </div>
    </TeachPage>
  );
}
