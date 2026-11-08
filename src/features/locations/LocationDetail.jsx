import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Form, Input, List, Popconfirm, Select, Skeleton, Space, Tag, Typography, message } from "antd";
import { PrinterOutlined, UserAddOutlined } from "@ant-design/icons";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { addMember, fetchSummary, listLocations, listMembers, monthLabel, recentMonths, removeMember } from "./api";
import { ROLE_LABEL } from "./LocationsPage";
import "./locations.css";

function Stat({ label, value, hint }) {
  return (
    <div className="loc-stat">
      <div className="loc-stat-value">{value ?? "–"}</div>
      <div className="loc-stat-label">{label}</div>
      {hint && <div className="loc-stat-hint">{hint}</div>}
    </div>
  );
}

/** The monthly accessibility summary. Counts only; printable for the location's records. */
export function SummaryView({ summary }) {
  const max = Math.max(1, ...summary.by_week.map((w) => w.conversations));
  return (
    <div className="loc-summary">
      <h2 className="loc-print-title">
        {summary.location_name}: accessibility summary for {monthLabel(summary.month)}
      </h2>
      <div className="loc-stats">
        <Stat label="Conversations" value={summary.conversations} />
        <Stat label="Minutes of conversation" value={summary.minutes} hint={summary.average_minutes ? `${summary.average_minutes} min on average` : null} />
        <Stat label="Replies spoken for customers" value={summary.replies_spoken} hint="Each one confirmed by the customer" />
        <Stat label="Captions shown" value={summary.captions_shown} />
        <Stat label="Customers on their own phone" value={summary.customers_on_own_phone} />
        <Stat label="Replies started from a suggestion" value={summary.replies_from_suggestions} />
        <Stat label="Conversations with plain language" value={summary.plain_language_conversations} />
        <Stat label="Staff who used it" value={summary.staff_active} />
      </div>
      {summary.busiest_weekday && (
        <Typography.Paragraph>
          Busiest day: <strong>{summary.busiest_weekday}</strong>
        </Typography.Paragraph>
      )}
      {summary.by_week.length > 0 && (
        <div className="loc-weeks" aria-label="Conversations by week">
          {summary.by_week.map((w) => (
            <div key={w.week_of} className="loc-week">
              <span className="loc-week-label">Week of {new Date(`${w.week_of}T00:00:00Z`).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" })}</span>
              <span className="loc-week-bar" style={{ width: `${(w.conversations / max) * 100}%` }} />
              <span className="loc-week-n">{w.conversations}</span>
            </div>
          ))}
        </div>
      )}
      <ul className="loc-notes">
        {summary.notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </div>
  );
}

/** /locations/:locationId: staff management and the monthly summary (location admins). */
export default function LocationDetail() {
  const { locationId } = useParams();
  const meId = useSelector((state) => state.apiAuth?.user?.id);
  const months = useMemo(() => recentMonths(12), []);
  const [name, setName] = useState("");
  const [members, setMembers] = useState(null);
  const [month, setMonth] = useState(months[0]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form] = Form.useForm();

  const loadMembers = useCallback(() => {
    listMembers(locationId).then(setMembers).catch((err) => setError(err.message));
  }, [locationId]);

  useEffect(() => {
    listLocations()
      .then((all) => setName(all.find((l) => l.id === locationId)?.name || ""))
      .catch(() => {});
    loadMembers();
  }, [locationId, loadMembers]);

  useEffect(() => {
    let alive = true; // a slow answer for an earlier month must not replace this one
    setSummary(null);
    fetchSummary(locationId, month)
      .then((s) => {
        if (!alive) return;
        setSummary(s);
        setError(null);
      })
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [locationId, month]);

  const add = async (values) => {
    setBusy(true);
    try {
      await addMember(locationId, values);
      message.success("Added");
      form.resetFields();
      loadMembers();
    } catch (err) {
      message.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (userId) => {
    try {
      await removeMember(locationId, userId);
      loadMembers();
    } catch (err) {
      message.error(err.message);
    }
  };

  return (
    <div className="loc-root">
      <Typography.Paragraph className="loc-noprint">
        <Link to="/locations">All locations</Link>
      </Typography.Paragraph>
      {error && <Alert type="error" showIcon message={error} closable onClose={() => setError(null)} />}

      <Card
        title={`Monthly summary${name ? `: ${name}` : ""}`}
        extra={
          <Space className="loc-noprint">
            <Select
              value={month}
              onChange={setMonth}
              aria-label="Month"
              options={months.map((m) => ({ value: m, label: monthLabel(m) }))}
              style={{ minWidth: 180 }}
            />
            <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
              Print
            </Button>
          </Space>
        }
      >
        {summary ? <SummaryView summary={summary} /> : <Skeleton active />}
      </Card>

      <Card title="Staff" className="loc-noprint" style={{ marginTop: 16 }}>
        <Typography.Paragraph type="secondary">
          Staff need a TalkMotion account first. They sign up for free, then you add them here by email or username.
        </Typography.Paragraph>
        <Form form={form} layout="inline" onFinish={add} disabled={busy} initialValues={{ role: "staff" }}>
          <Form.Item name="user" rules={[{ required: true, message: "Email or username" }]}>
            <Input placeholder="Email or username" aria-label="Email or username" style={{ minWidth: 240 }} />
          </Form.Item>
          <Form.Item name="role">
            <Select
              aria-label="Role"
              options={[
                { value: "staff", label: "Staff" },
                { value: "admin", label: "Admin" },
              ]}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" icon={<UserAddOutlined />} loading={busy}>
            Add
          </Button>
        </Form>
        {!members ? (
          <Skeleton active />
        ) : (
          <List
            style={{ marginTop: 16 }}
            dataSource={members}
            renderItem={(m) => (
              <List.Item
                actions={[
                  m.user_id !== meId && (
                    <Popconfirm key="rm" title={`Remove ${m.display_name}?`} okText="Remove" onConfirm={() => remove(m.user_id)}>
                      <Button danger size="small">
                        Remove
                      </Button>
                    </Popconfirm>
                  ),
                ].filter(Boolean)}
              >
                <Space>
                  <strong>{m.display_name}</strong>
                  <span className="loc-muted">@{m.username}</span>
                  <Tag>{ROLE_LABEL[m.role] || m.role}</Tag>
                </Space>
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
