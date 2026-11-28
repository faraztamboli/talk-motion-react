import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Alert, Card, Skeleton, Table, Typography } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { apiFetch } from "../../api/http";

const MODALITY_LABELS = {
  sign: "Signing",
  fingerspell: "Fingerspelling",
  llm_suggestion: "Suggested replies",
};

const ms = (v) => (v === null || v === undefined ? "–" : v >= 1000 ? `${(v / 1000).toFixed(1)} s` : `${v} ms`);
const pct = (v) => (v === null || v === undefined ? "–" : `${Math.round(v * 100)}%`);

function Latency({ value }) {
  if (!value || (value.p50 === null && value.p90 === null)) return <span>–</span>;
  return (
    <span title={`Median ${ms(value.p50)}; 9 in 10 within ${ms(value.p90)}`}>
      {ms(value.p50)} <Typography.Text type="secondary">/ {ms(value.p90)}</Typography.Text>
    </span>
  );
}

Latency.propTypes = { value: PropTypes.object };

/**
 * How often machine drafts (signing, suggested replies) are spoken as they are, edited first or
 * turned down, per model version (doc 13, M0). Acceptance by Deaf users is the number every
 * recognition change is judged by.
 */
export default function DraftsReport({ days }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setData(null);
    setError(null);
    apiFetch(`/admin/drafts?days=${days}`)
      .then(setData)
      .catch((err) => setError(err.status === 403 ? "Platform admins only." : err.message));
  }, [days]);

  return (
    <Card title={<><CheckCircleOutlined /> Drafts: spoken as they are, edited or turned down</>}>
      {error && <Alert type="error" showIcon message={error} />}
      {!data && !error && <Skeleton active />}
      {data && (
        <>
          <Typography.Paragraph type="secondary">
            Every draft the app offered and what the person did with it. Latency is the median, then the time 9 in 10
            were within. Counts and timings only; no conversation text.
          </Typography.Paragraph>
          <Table
            size="small"
            pagination={false}
            rowKey={(g) => `${g.modality}|${g.model_version}`}
            dataSource={data.groups}
            locale={{ emptyText: "No drafts in this period yet" }}
            scroll={{ x: true }}
            columns={[
              { title: "Input", dataIndex: "modality", render: (m) => MODALITY_LABELS[m] || m },
              { title: "Model", dataIndex: "model_version" },
              { title: "Drafts", dataIndex: "total", align: "right" },
              { title: "Spoken as is", dataIndex: "acceptance_rate", align: "right", render: pct },
              {
                title: "Edited",
                align: "right",
                render: (_, g) => pct(g.total ? g.edited / g.total : null),
              },
              {
                title: "Turned down",
                align: "right",
                render: (_, g) => pct(g.total ? g.rejected / g.total : null),
              },
              { title: "Sign → word", render: (_, g) => <Latency value={g.latency_ms.recognize_ms} /> },
              { title: "Signs → English", render: (_, g) => <Latency value={g.latency_ms.english_ms} /> },
              { title: "Time to decide", render: (_, g) => <Latency value={g.latency_ms.decide_ms} /> },
              { title: "Tap → voice", render: (_, g) => <Latency value={g.latency_ms.tts_ms} /> },
            ]}
          />
        </>
      )}
    </Card>
  );
}

DraftsReport.propTypes = { days: PropTypes.number.isRequired };
