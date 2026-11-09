import React, { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Empty, Form, Input, List, Skeleton, Space, Tag, Typography, message } from "antd";
import { ShopOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { createLocation, listLocations } from "./api";
import "./locations.css";

const ROLE_LABEL = { admin: "Admin", owner: "Admin", staff: "Staff", platform_admin: "Platform admin" };

/**
 * /locations: the pharmacies and clinics this account works at. Platform admins also create
 * new pilot locations here and name each location's first admin.
 */
export default function LocationsPage() {
  const isPlatformAdmin = useSelector((state) => Boolean(state.apiAuth?.user?.is_platform_admin));
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(() => {
    listLocations()
      .then(setItems)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(load, [load]);

  const create = async (values) => {
    setBusy(true);
    try {
      await createLocation(values);
      message.success("Location created");
      form.resetFields();
      load();
    } catch (err) {
      message.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="loc-root">
      <Card title={<><ShopOutlined /> Locations</>}>
        <Typography.Paragraph type="secondary">
          A location is a pharmacy or clinic counter. Staff start conversations for it. Admins add staff and read the
          monthly summary, which counts conversations and never includes what anyone said.
        </Typography.Paragraph>
        {error && <Alert type="error" showIcon message={error} />}
        {!items && !error && <Skeleton active />}
        {items && items.length === 0 && <Empty description="You are not on the staff of any location yet." />}
        {items && items.length > 0 && (
          <List
            dataSource={items}
            renderItem={(l) => (
              <List.Item
                actions={[
                  l.can_manage ? (
                    <Link key="open" to={`/locations/${l.id}`}>
                      Staff and monthly summary
                    </Link>
                  ) : (
                    <Link key="talk" to="/conversation">
                      Start a conversation
                    </Link>
                  ),
                ]}
              >
                <Space>
                  <strong>{l.name}</strong>
                  <Tag>{ROLE_LABEL[l.role] || l.role}</Tag>
                </Space>
              </List.Item>
            )}
          />
        )}
      </Card>

      {isPlatformAdmin && (
        <Card title="Create a pilot location" style={{ marginTop: 16 }}>
          <Form form={form} layout="vertical" onFinish={create} disabled={busy}>
            <Form.Item name="name" label="Location name" rules={[{ required: true, message: "Name the location" }]}>
              <Input size="large" maxLength={120} placeholder="Main Street Pharmacy, Hamilton" />
            </Form.Item>
            <Form.Item
              name="admin"
              label="First admin (email or username of an existing TalkMotion account)"
              rules={[{ required: true, message: "Who manages this location?" }]}
            >
              <Input size="large" maxLength={320} />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={busy}>
              Create location
            </Button>
          </Form>
        </Card>
      )}
    </div>
  );
}

export { ROLE_LABEL };
