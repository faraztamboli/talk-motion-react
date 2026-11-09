import React, { useEffect, useState } from "react";
import { Alert, Card, Segmented, Skeleton, Space, Table, Typography } from "antd";
import { LineChartOutlined } from "@ant-design/icons";
import { apiFetch } from "../../api/http";
import "../locations/locations.css";
import "./admin.css";

const EVENT_LABELS = {
  pageview: "Page views",
  cta_signup: "Clicked Try a conversation",
  cta_pilot: "Clicked Ask about a pilot",
  demo_speak: "Pressed Speak in the home-page demo",
  onepager_open: "Opened a one-pager",
  feedback_sent: "Sent feedback",
  volunteer_signup: "Volunteer sign-ups",
};

function Bars({ series, label }) {
  const max = Math.max(1, ...series.map((d) => d.count));
  return (
    <div className="adm-bars" role="img" aria-label={`${label}: ${series.reduce((a, d) => a + d.count, 0)} in total`}>
      {series.map((d) => (
        <span
          key={d.day}
          className="adm-bar"
          style={{ height: `${Math.max(2, (d.count / max) * 100)}%` }}
          title={`${d.day}: ${d.count}`}
        />
      ))}
    </div>
  );
}

/** /admin/analytics: site counters (no visitor data) and product counts, for platform admins. */
export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setData(null);
    apiFetch(`/admin/analytics?days=${days}`)
      .then(setData)
      .catch((err) => setError(err.status === 403 ? "Platform admins only." : err.message));
  }, [days]);

  return (
    <div className="loc-root">
      <Card
        title={<><LineChartOutlined /> Site and product analytics</>}
        extra={
          <Segmented
            value={days}
            onChange={setDays}
            options={[
              { label: "7 days", value: 7 },
              { label: "30 days", value: 30 },
              { label: "90 days", value: 90 },
            ]}
          />
        }
      >
        {error && <Alert type="error" showIcon message={error} />}
        {!data && !error && <Skeleton active />}
        {data && (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Typography.Text type="secondary">
              {data.from} to {data.to}. {data.privacy}
            </Typography.Text>

            <section>
              <Typography.Title level={5}>Sign-up funnel</Typography.Title>
              <div className="adm-funnel">
                {data.funnel.map((f, i) => {
                  const prev = i > 0 ? data.funnel[i - 1].count : null;
                  const rate = prev ? Math.round((f.count / prev) * 100) : null;
                  return (
                    <div key={f.step} className="adm-funnel-step">
                      <div className="loc-stat-value">{f.count}</div>
                      <div className="loc-stat-label">{f.step}</div>
                      {rate !== null && <div className="loc-stat-hint">{rate}% of the step before</div>}
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <Typography.Title level={5}>Product</Typography.Title>
              <div className="loc-stats">
                <div className="loc-stat"><div className="loc-stat-value">{data.product.conversations}</div><div className="loc-stat-label">Conversations</div></div>
                <div className="loc-stat"><div className="loc-stat-value">{data.product.conversations_with_a_spoken_reply}</div><div className="loc-stat-label">With a spoken reply</div></div>
                <div className="loc-stat"><div className="loc-stat-value">{data.product.conversations_with_a_second_phone}</div><div className="loc-stat-label">With a second phone</div></div>
                <div className="loc-stat"><div className="loc-stat-value">{data.product.conversations_at_locations}</div><div className="loc-stat-label">At locations</div></div>
              </div>
              <Typography.Text strong>Conversations per day</Typography.Text>
              <Bars series={data.product.conversations_by_day} label="Conversations per day" />
              <Typography.Text strong>New accounts per day</Typography.Text>
              <Bars series={data.product.new_accounts_by_day} label="New accounts per day" />
            </section>

            <section>
              <Typography.Title level={5}>Public site</Typography.Title>
              <Bars series={data.site.pageviews_by_day} label="Page views per day" />
              <Table
                size="small"
                pagination={false}
                rowKey="event"
                dataSource={Object.entries(data.site.events).map(([event, count]) => ({ event, count }))}
                columns={[
                  { title: "Event", dataIndex: "event", render: (e) => EVENT_LABELS[e] || e },
                  { title: "Count", dataIndex: "count", align: "right" },
                ]}
              />
            </section>

            <div className="adm-two">
              <Table
                size="small"
                title={() => "Top pages"}
                pagination={false}
                rowKey="path"
                dataSource={data.site.top_pages}
                columns={[
                  { title: "Page", dataIndex: "path" },
                  { title: "Views", dataIndex: "count", align: "right" },
                ]}
              />
              <Table
                size="small"
                title={() => "Where visitors came from"}
                pagination={false}
                rowKey="host"
                dataSource={data.site.top_referrers}
                locale={{ emptyText: "No referring sites yet" }}
                columns={[
                  { title: "Site", dataIndex: "host" },
                  { title: "Visits", dataIndex: "count", align: "right" },
                ]}
              />
            </div>
          </Space>
        )}
      </Card>
    </div>
  );
}
