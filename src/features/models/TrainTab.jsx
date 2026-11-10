import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Button, Card, Col, Descriptions, Empty, List, Modal, Progress, Result, Row, Space, Statistic, Steps, Tag, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { rpcErrorMessage } from "../../api/rpc";
import { useModelContext } from "./ModelPage";
import { useCancelTrainingMutation, useGetTrainingReadinessQuery, useListTrainingJobsQuery, useStartTrainingMutation } from "./modelsApi";
import useTrainingJob from "./train/useTrainingJob";
import { STAGES, isTerminal, parseProgress, percent, progressPercent } from "./train/trainingProgress";

const JOB_TAG = {
  queued: { color: "default", label: "Waiting" },
  running: { color: "processing", label: "Training" },
  complete: { color: "success", label: "Finished" },
  failed: { color: "error", label: "Failed" },
  cancelled: { color: "default", label: "Cancelled" },
};

function friendlyFailure(job, progress) {
  const raw = progress.failure || job?.error_message || "";
  if (/stopped responding/i.test(raw)) return raw;
  if (/at least|needs at least/i.test(raw)) return raw;
  if (/out of memory|OOM|ResourceExhausted/i.test(raw)) return "The server ran out of memory while training. Try again later.";
  return "Something went wrong while training. Try again, and contact support if it keeps happening.";
}

export default function TrainTab() {
  const { t } = useTranslation();
  const { model, modelId } = useModelContext();
  const { data: readiness, isLoading: loadingReadiness, refetch: refetchReadiness } = useGetTrainingReadinessQuery(modelId);
  const { data: jobs = [], isLoading: loadingJobs } = useListTrainingJobsQuery(modelId);
  const [startTraining, startState] = useStartTrainingMutation();
  const [cancelTraining, cancelState] = useCancelTrainingMutation();
  const [jobId, setJobId] = useState(null);
  const [startError, setStartError] = useState(null);
  const [modal, modalHolder] = Modal.useModal();
  const logRef = useRef(null);

  // Re-attach to a job that is still running (after a reload or coming back to the tab).
  useEffect(() => {
    if (jobId || !jobs.length) return;
    const live = jobs.find((j) => j.status === "queued" || j.status === "running");
    setJobId(live ? live.id : jobs[0].id);
  }, [jobs, jobId]);

  const { job, messages, error: pollError } = useTrainingJob(modelId, jobId);
  const status = job?.status || (jobId ? "queued" : null);
  const progress = useMemo(() => parseProgress(messages, status || "queued"), [messages, status]);
  const live = status === "queued" || status === "running";

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages.length]);

  useEffect(() => {
    if (isTerminal(status)) refetchReadiness();
  }, [status, refetchReadiness]);

  const start = async () => {
    setStartError(null);
    try {
      const res = await startTraining(modelId).unwrap();
      setJobId(res.job_id);
    } catch (err) {
      setStartError(rpcErrorMessage(err, t("models.train.startFailed", "Training couldn't start.")));
    }
  };

  const cancel = () =>
    modal.confirm({
      title: t("models.train.cancelTitle", "Stop training?"),
      content: t("models.train.cancelBody", "The model keeps its previous version. You can start again any time."),
      okText: t("models.train.cancelOk", "Stop training"),
      okButtonProps: { danger: true },
      onOk: () => cancelTraining({ modelId, jobId }).unwrap().catch(() => {}),
    });

  const metrics = job?.metrics || null;
  const finalValidation = progress.finalValidation ?? (typeof metrics?.val_metrics === "number" ? metrics.val_metrics : null);
  const finalTest = progress.finalTest ?? (typeof metrics?.test_metrics === "number" ? metrics.test_metrics : null);
  const stageIndex = Math.max(0, STAGES.findIndex((s) => s.key === progress.stage));

  return (
    <div className="tm-tab">
      {modalHolder}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title={t("models.train.title", "Train this model")}>
            {loadingReadiness ? (
              <Progress percent={0} showInfo={false} status="active" />
            ) : readiness && !readiness.ready && !live ? (
              <Alert
                type="warning"
                showIcon
                message={t("models.train.notReady", "Not ready to train yet")}
                description={
                  <ul className="tm-plain-list">
                    {readiness.problems.map((p) => (
                      <li key={p.code}>
                        {p.message}
                        {p.concepts?.length > 0 && <span className="tm-help"> ({p.concepts.slice(0, 8).join(", ")}{p.concepts.length > 8 ? "…" : ""})</span>}
                      </li>
                    ))}
                  </ul>
                }
                action={
                  <Link to={`/models/${modelId}/collect`}>
                    <Button size="small" type="primary">
                      {t("models.next.recordCta", "Record samples")}
                    </Button>
                  </Link>
                }
              />
            ) : null}

            {readiness && (
              <Descriptions size="small" column={{ xs: 1, sm: 3 }} className="tm-block">
                <Descriptions.Item label={t("models.train.words", "Words & phrases with samples")}>{readiness.trainable_concepts}</Descriptions.Item>
                <Descriptions.Item label={t("models.train.samples", "Samples")}>{readiness.total_samples}</Descriptions.Item>
                {readiness.pending_samples > 0 && (
                  <Descriptions.Item label={t("models.train.processing", "Still processing")}>{readiness.pending_samples}</Descriptions.Item>
                )}
              </Descriptions>
            )}
            {readiness?.warnings?.map((w) => (
              <Alert key={w.code} type="info" showIcon message={w.message} className="tm-block-sm" />
            ))}

            {!live && (
              <Space className="tm-block" wrap>
                <Button type="primary" size="large" onClick={start} loading={startState.isLoading} disabled={!readiness?.ready}>
                  {model.trained ? t("models.train.retrain", "Train again") : t("models.train.start", "Start training")}
                </Button>
                <Typography.Text type="secondary">
                  {t("models.train.duration", "Usually takes a few minutes. You can leave this page; training continues.")}
                </Typography.Text>
              </Space>
            )}
            {startError && <Alert type="error" showIcon message={startError} className="tm-block-sm" />}

            {jobId && status && (
              <div className="tm-block">
                {live && (
                  <>
                    <Steps size="small" current={stageIndex} items={STAGES.filter((s) => s.key !== "done").map((s) => ({ title: t(`models.train.stage.${s.key}`, s.label) }))} />
                    <Progress percent={progressPercent(progress, status)} status="active" className="tm-block-sm" />
                    <Space wrap>
                      {progress.stage === "learning" && (
                        <Typography.Text>
                          {t("models.train.epoch", "Round {{n}}", { n: progress.epoch })}
                          {progress.accuracy != null && ` · ${t("models.train.accuracyNow", "accuracy {{a}}", { a: percent(progress.accuracy) })}`}
                          {progress.validation != null && ` · ${t("models.train.validationNow", "on unseen samples {{v}}", { v: percent(progress.validation) })}`}
                        </Typography.Text>
                      )}
                      <Button danger onClick={cancel} loading={cancelState.isLoading}>
                        {t("models.train.stop", "Stop training")}
                      </Button>
                    </Space>
                    {pollError && (
                      <Alert type="warning" showIcon className="tm-block-sm" message={t("models.train.pollTrouble", "Having trouble reaching the server; still trying…")} />
                    )}
                  </>
                )}
                {status === "complete" && (
                  <Result
                    status="success"
                    title={t("models.train.done", "Training finished")}
                    subTitle={
                      progress.browserExport === false
                        ? t("models.train.doneServer", "Recognition will run on the server.")
                        : t("models.train.doneBrowser", "The model is ready, and can run right in the browser.")
                    }
                    extra={[
                      <Link key="try" to={`/converter?model=${modelId}`}>
                        <Button type="primary">{t("models.tryInTranslator", "Try it in the Translator")}</Button>
                      </Link>,
                    ]}
                  >
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic title={t("models.train.valAccuracy", "Accuracy on held-back samples")} value={percent(finalValidation)} />
                      </Col>
                      <Col span={12}>
                        <Statistic title={t("models.train.testAccuracy", "Accuracy on test samples")} value={percent(finalTest)} />
                      </Col>
                    </Row>
                    {finalTest != null && finalTest < 0.7 && (
                      <Alert
                        className="tm-block"
                        type="info"
                        showIcon
                        message={t("models.train.lowAccuracy", "To improve accuracy, record more samples of each word, especially ones that look alike.")}
                      />
                    )}
                  </Result>
                )}
                {status === "failed" && (
                  <Result
                    status="error"
                    title={t("models.train.failed", "Training didn't finish")}
                    subTitle={friendlyFailure(job, progress)}
                    extra={
                      <Button type="primary" onClick={start} disabled={!readiness?.ready} loading={startState.isLoading}>
                        {t("models.train.tryAgain", "Try again")}
                      </Button>
                    }
                  />
                )}
                {status === "cancelled" && (
                  <Alert type="info" showIcon message={t("models.train.cancelled", "Training was stopped. The model keeps its previous version.")} />
                )}
                {messages.length > 0 && (
                  <details className="tm-block">
                    <summary>{t("models.train.details", "Training details")}</summary>
                    <pre ref={logRef} className="tm-log" aria-live="off">
                      {messages.map((m) => m.message).join("\n")}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title={t("models.train.history", "Training history")}>
            {loadingJobs ? null : jobs.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("models.train.noHistory", "Not trained yet.")} />
            ) : (
              <List
                size="small"
                dataSource={jobs}
                renderItem={(j) => (
                  <List.Item
                    className={`tm-job-row ${j.id === jobId ? "is-active" : ""}`}
                    onClick={() => setJobId(j.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === "Enter" ? setJobId(j.id) : null)}
                  >
                    <Space direction="vertical" size={0}>
                      <Typography.Text>{j.create_time ? new Date(j.create_time.replace(" ", "T")).toLocaleString() : `#${j.id}`}</Typography.Text>
                      <Typography.Text type="secondary">{j.requested_by}</Typography.Text>
                    </Space>
                    <Tag color={JOB_TAG[j.status]?.color}>{t(`models.train.job.${j.status}`, JOB_TAG[j.status]?.label || j.status)}</Tag>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
