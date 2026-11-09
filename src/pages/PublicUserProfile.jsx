import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Alert, Avatar, Card, Col, Descriptions, Empty, Row, Skeleton, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import MetaDecorator from "../components/MetaDecorator";
import ErrorBoundary from "../components/ErrorBoundary";
import useProfile from "../hooks/useProfile";
import { rpc, rpcErrorMessage, sessionToken, unwrapList } from "../api/rpc";
import { normalizeModel } from "../features/models/normalizeModel";
import { ModelCard } from "../features/models/ModelsPage";
import "../features/models/models.css";

/** Someone's public profile: who they are and the models they made. */
export default function PublicUserProfile() {
  const { t } = useTranslation();
  const { username } = useParams();
  const { getUserInfo } = useProfile();
  const [profile, setProfile] = useState(null);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      getUserInfo(username).catch(() => null),
      rpc("getUsersModelsByUserName", [sessionToken(), username, "", 0, 60]).then(unwrapList),
    ])
      .then(([info, list]) => {
        if (cancelled) return;
        setProfile(info);
        setModels(list.rows.map(normalizeModel).filter(Boolean));
      })
      .catch((err) => !cancelled && setError(err))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [username]);

  const fullName = [profile?.first, profile?.middle, profile?.last].filter(Boolean).join(" ") || profile?.fullname;

  return (
    <div className="tm-page">
      <MetaDecorator title={fullName || username} description={t("profile.publicDescription", "TalkMotion profile")} />
      <Card loading={loading && !profile}>
        <Card.Meta
          avatar={<Avatar size={72} src={profile?.sm_img || undefined} icon={!profile?.sm_img && <UserOutlined />} />}
          title={<Typography.Title level={1} className="tm-page-title">{fullName || username}</Typography.Title>}
          description={`@${username}`}
        />
        {profile && (
          <Descriptions className="tm-block" column={{ xs: 1, sm: 3 }} size="small">
            {profile.first && <Descriptions.Item label={t("profile.first", "First name")}>{profile.first}</Descriptions.Item>}
            {profile.last && <Descriptions.Item label={t("profile.last", "Last name")}>{profile.last}</Descriptions.Item>}
          </Descriptions>
        )}
      </Card>
      <Typography.Title level={2} className="tm-section-title tm-block">
        {t("profile.models", "Models")}
      </Typography.Title>
      {error && <Alert type="error" showIcon message={rpcErrorMessage(error, t("profile.modelsFailed", "Their models didn't load."))} />}
      {loading ? (
        <Skeleton active />
      ) : models.length === 0 ? (
        <Card>
          <Empty description={t("profile.noModels", "No public models yet.")} />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {models.map((m) => (
            <Col key={m.id} xs={24} sm={12} xl={8}>
              <ErrorBoundary compact>
                <ModelCard model={m} />
              </ErrorBoundary>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
