import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Breadcrumb, Button, List, Skeleton, message } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import MetaDecorator from "../../components/MetaDecorator";
import { rpcErrorMessage } from "../../api/rpc";
import { useAnswerRequestMutation, useGetMyClassroomRequestsQuery } from "./teachApi";
import { LoadError, PageHeader, PersonAvatar, TeachPage } from "./components";

/** Every request to join that waits for this person, across all their classrooms. */
export default function RequestsPage() {
  const { t } = useTranslation();
  const { data: requests = [], error, isLoading, refetch } = useGetMyClassroomRequestsQuery();
  const [answer] = useAnswerRequestMutation();
  const [busy, setBusy] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();

  const respond = async (person, approve) => {
    setBusy(`${person.role}-${person.requestId}-${approve}`);
    try {
      await answer({ requestId: person.requestId, role: person.role, approve, classroomId: person.classroomId }).unwrap();
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

  return (
    <TeachPage narrow>
      <MetaDecorator title={t("teach.requests.metaTitle", "Requests to join - TalkMotion")} description={t("teach.requests.help", "Say yes or no to the people who want to join your classrooms.")} />
      {contextHolder}
      <Breadcrumb
        className="tm-teach-block"
        items={[{ title: <Link to="/classrooms">{t("teach.classrooms.title", "Classrooms")}</Link> }, { title: t("teach.requests.page", "Requests") }]}
      />
      <PageHeader title={t("teach.requests.page", "Requests")} help={t("teach.requests.help", "Say yes or no to the people who want to join your classrooms.")} />
      {error ? (
        <LoadError error={error} onRetry={refetch} />
      ) : isLoading ? (
        <Skeleton active />
      ) : requests.length === 0 ? (
        <Alert type="success" showIcon icon={<CheckOutlined />} message={t("teach.requests.none", "You're all caught up. Nobody is waiting.")} />
      ) : (
        <List
          className="tm-list"
          dataSource={requests}
          rowKey={(p) => `${p.role}-${p.requestId}`}
          renderItem={(person) => (
            <List.Item
              actions={[
                <Button
                  key="yes"
                  type="primary"
                  icon={<CheckOutlined />}
                  loading={busy === `${person.role}-${person.requestId}-true`}
                  onClick={() => respond(person, true)}
                >
                  {t("teach.requests.letIn", "Let in")}
                </Button>,
                <Button
                  key="no"
                  icon={<CloseOutlined />}
                  loading={busy === `${person.role}-${person.requestId}-false`}
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
                    ? t("teach.requests.wantsTeach", "Wants to help teach {{name}}", { name: person.classroomName })
                    : t("teach.requests.wantsJoin", "Wants to join {{name}}", { name: person.classroomName })
                }
              />
            </List.Item>
          )}
        />
      )}
    </TeachPage>
  );
}
