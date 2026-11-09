import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Alert, Badge, Button, Card, Col, Empty, Input, List, Progress, Row, Segmented, Space, Tag, Typography, message } from "antd";
import { CheckOutlined, DeleteOutlined, PlusOutlined, UndoOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { rpcErrorMessage } from "../../api/rpc";
import useLandmarker from "../landmarks/useLandmarker";
import LandmarkerView from "../landmarks/LandmarkerView";
import { useModelContext } from "./ModelPage";
import { useCreateConceptMutation, useDeleteCaptureMutation, useListConceptsQuery, useSubmitSampleMutation } from "./modelsApi";
import useCaptureSession from "./collect/useCaptureSession";
import SampleReplay from "./SampleReplay";

const LENGTHS = [
  { label: "1 s", value: 1 },
  { label: "2 s", value: 2 },
  { label: "3 s", value: 3 },
  { label: "4 s", value: 4 },
];

function CaptureOverlay({ session }) {
  const { t } = useTranslation();
  if (session.phase === "countdown") {
    return (
      <div className="tm-capture-overlay" aria-live="assertive">
        <span className="tm-capture-count">{session.countdown}</span>
        <span>{t("models.collect.getReady", "Get ready")}</span>
      </div>
    );
  }
  if (session.phase === "recording") {
    const pct = Math.min(100, Math.round((session.elapsed / session.maxMs) * 100));
    return (
      <div className="tm-capture-rec" aria-live="polite">
        <Badge status="error" text={t("models.collect.recording", "Recording – sign now")} />
        <Progress percent={pct} showInfo={false} size="small" strokeColor="#ef4444" />
      </div>
    );
  }
  return null;
}

export default function CollectTab() {
  const { t } = useTranslation();
  const { model, modelId } = useModelContext();
  const [params, setParams] = useSearchParams();
  const { data: concepts = [], isLoading } = useListConceptsQuery(modelId);
  const [submitSample] = useSubmitSampleMutation();
  const [deleteCapture] = useDeleteCaptureMutation();
  const [createConcept, createState] = useCreateConceptMutation();
  const [messageApi, contextHolder] = message.useMessage();
  const [maxSeconds, setMaxSeconds] = useState(2);
  const [newWord, setNewWord] = useState("");

  const conceptKey = params.get("concept") || "";
  const concept = concepts.find((c) => c.concept === conceptKey) || null;

  const save = useCallback(
    async (frames) => {
      try {
        const res = await submitSample({ modelId, concept: conceptKey, frames }).unwrap();
        return { sampleCount: res?.sample_count, captureId: res?.capture_id };
      } catch (err) {
        throw Object.assign(new Error(err?.message), { userMessage: rpcErrorMessage(err, t("models.collect.saveFailed", "We couldn't save that take.")) });
      }
    },
    [conceptKey, modelId, submitSample, t]
  );
  const undo = useCallback(
    async (captureId) => {
      try {
        await deleteCapture({ modelId, concept: conceptKey, captureId }).unwrap();
      } catch (err) {
        throw Object.assign(new Error(err?.message), { userMessage: rpcErrorMessage(err) });
      }
    },
    [conceptKey, deleteCapture, modelId]
  );

  const session = useCaptureSession({ save, undo, maxSeconds });
  const lm = useLandmarker({ onFrame: session.onFrame });
  const cameraReady = lm.status === "running";

  // A new word starts a new session list.
  useEffect(() => {
    session.resetSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conceptKey]);

  const choose = (key) => {
    if (session.busy) return;
    const next = new URLSearchParams(params);
    next.set("concept", key);
    setParams(next, { replace: true });
  };

  // Pick the first word still under its target when none is chosen.
  useEffect(() => {
    if (conceptKey || !concepts.length) return;
    const first = concepts.find((c) => c.sampleCount < c.target) || concepts[0];
    choose(first.concept);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concepts, conceptKey]);

  const count = session.lastCount ?? concept?.sampleCount ?? 0;
  const target = concept?.target ?? 20;
  const reached = concept && count >= target;
  const nextConcept = useMemo(
    () => concepts.find((c) => c.concept !== conceptKey && c.sampleCount < c.target),
    [concepts, conceptKey]
  );

  const keep = async () => {
    const ok = await session.keep();
    if (ok) messageApi.success({ content: t("models.collect.saved", "Saved."), duration: 1 });
  };

  // Keyboard: Space records, Enter keeps, Escape discards (not while typing).
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || e.target?.isContentEditable) return;
      if (e.code === "Space" && cameraReady && concept && session.phase === "idle") {
        e.preventDefault();
        session.start();
      } else if (e.key === "Enter" && session.phase === "review" && !session.take?.review.problems.length) {
        e.preventDefault();
        keep();
      } else if (e.key === "Escape" && (session.phase === "review" || session.phase === "countdown" || session.phase === "recording")) {
        e.preventDefault();
        session.cancel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const addWord = async () => {
    if (!newWord.trim()) return;
    try {
      const c = await createConcept({ modelId, text: newWord }).unwrap();
      setNewWord("");
      choose(c.concept);
    } catch (err) {
      messageApi.error(rpcErrorMessage(err));
    }
  };

  if (!model.permissions.train) {
    return <Alert type="info" showIcon message={t("models.collect.noAccess", "Only the model's owner and trainers can record samples.")} />;
  }

  const recordDisabled = !cameraReady || !concept || session.phase !== "idle";

  return (
    <div className="tm-tab">
      {contextHolder}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={15}>
          <Card className="tm-capture-card">
            {session.phase === "review" || session.phase === "saving" ? (
              <div>
                <SampleReplay frames={session.take?.frames || []} label={t("models.collect.reviewLabel", "Replay of your take")} />
                {session.take?.review.problems.map((p) => (
                  <Alert key={p} type="warning" showIcon message={p} className="tm-block-sm" />
                ))}
                {session.take?.review.tips.map((p) => (
                  <Alert key={p} type="info" showIcon message={p} className="tm-block-sm" />
                ))}
                {session.notice?.type === "error" && <Alert type="error" showIcon message={session.notice.text} className="tm-block-sm" />}
                <Space className="tm-block-sm" wrap>
                  <Button
                    type="primary"
                    size="large"
                    icon={<CheckOutlined />}
                    onClick={keep}
                    loading={session.phase === "saving"}
                    disabled={Boolean(session.take?.review.problems.length)}
                  >
                    {t("models.collect.keep", "Keep")} <kbd className="tm-kbd">Enter</kbd>
                  </Button>
                  <Button size="large" icon={<DeleteOutlined />} onClick={session.discard} disabled={session.phase === "saving"}>
                    {t("models.collect.discard", "Discard")} <kbd className="tm-kbd">Esc</kbd>
                  </Button>
                </Space>
              </div>
            ) : (
              <>
                <LandmarkerView
                  lm={lm}
                  idleTitle={t("models.collect.cameraOff", "Turn on the camera to record")}
                  idleHint={t("models.collect.cameraHint", "Sit so your hands and face are in view, in good light.")}
                  overlay={<CaptureOverlay session={session} />}
                />
                {session.notice && session.phase === "idle" && (
                  <Alert type={session.notice.type === "error" ? "error" : "info"} showIcon message={session.notice.text} className="tm-block-sm" />
                )}
                <div className="tm-capture-actions">
                  <Space wrap>
                    {session.phase === "idle" ? (
                      <Button type="primary" size="large" danger onClick={session.start} disabled={recordDisabled}>
                        {concept
                          ? t("models.collect.recordWord", "Record “{{label}}”", { label: concept.label })
                          : t("models.collect.chooseFirst", "Choose a word first")}{" "}
                        <kbd className="tm-kbd">Space</kbd>
                      </Button>
                    ) : (
                      <Button size="large" onClick={session.cancel}>
                        {t("common.cancel", "Cancel")} <kbd className="tm-kbd">Esc</kbd>
                      </Button>
                    )}
                    {lm.isActive && session.phase === "idle" && (
                      <Button onClick={lm.stop}>{t("models.collect.cameraStop", "Turn camera off")}</Button>
                    )}
                  </Space>
                  <Space>
                    <Typography.Text type="secondary">{t("models.collect.takeLength", "Take length")}</Typography.Text>
                    <Segmented size="small" value={maxSeconds} onChange={setMaxSeconds} options={LENGTHS} disabled={session.busy} />
                  </Space>
                </div>
                <Typography.Paragraph type="secondary" className="tm-help">
                  {t(
                    "models.collect.howTo",
                    "After the countdown, sign once. Recording stops when you lower your hands or when the time is up. Vary your position a little between takes."
                  )}
                </Typography.Paragraph>
              </>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={9}>
          <Card
            title={concept ? concept.label : t("models.collect.words", "Words and phrases")}
            extra={concept && <Tag color={reached ? "success" : "default"}>{`${count} / ${target}`}</Tag>}
            className="tm-block-sm"
          >
            {concept && (
              <>
                <Progress percent={Math.min(100, Math.round((count / target) * 100))} status={reached ? "success" : "active"} />
                {reached && (
                  <Alert
                    type="success"
                    showIcon
                    className="tm-block-sm"
                    message={t("models.collect.reached", "Target reached for “{{label}}”.", { label: concept.label })}
                    action={
                      nextConcept ? (
                        <Button size="small" onClick={() => choose(nextConcept.concept)}>
                          {t("models.collect.next", "Next: {{label}}", { label: nextConcept.label })}
                        </Button>
                      ) : (
                        <Link to={`/models/${modelId}/train`}>
                          <Button size="small" type="primary">
                            {t("models.collect.goTrain", "Train the model")}
                          </Button>
                        </Link>
                      )
                    }
                  />
                )}
              </>
            )}
            {session.kept.length > 0 && (
              <List
                size="small"
                className="tm-block-sm"
                header={<Typography.Text strong>{t("models.collect.thisSession", "This session")}</Typography.Text>}
                dataSource={session.kept}
                renderItem={(k) => (
                  <List.Item
                    actions={[
                      k.undone ? (
                        <Typography.Text type="secondary" key="u">
                          {t("models.collect.undone", "Removed")}
                        </Typography.Text>
                      ) : (
                        <Button key="u" size="small" type="link" icon={<UndoOutlined />} onClick={() => session.undoTake(k.id)} disabled={!k.captureId}>
                          {t("models.collect.undo", "Undo")}
                        </Button>
                      ),
                    ]}
                  >
                    <SampleReplay frames={k.frames} compact label={t("models.collect.keptLabel", "Kept take")} />
                  </List.Item>
                )}
              />
            )}
          </Card>

          <Card title={t("models.collect.allWords", "Choose a word or phrase")}>
            <Space.Compact style={{ width: "100%" }} className="tm-block-sm">
              <Input
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                onPressEnter={addWord}
                placeholder={t("models.collect.addWord", "Add a word or phrase")}
                aria-label={t("models.collect.addWord", "Add a word or phrase")}
              />
              <Button icon={<PlusOutlined />} onClick={addWord} loading={createState.isLoading} aria-label={t("models.concepts.add", "Add")} />
            </Space.Compact>
            {!isLoading && !concepts.length ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("models.collect.noWords", "Add the first word to record.")} />
            ) : (
              <List
                size="small"
                dataSource={concepts}
                loading={isLoading}
                className="tm-concept-pick"
                renderItem={(c) => (
                  <List.Item
                    onClick={() => choose(c.concept)}
                    className={`tm-concept-pick-item ${c.concept === conceptKey ? "is-active" : ""}`}
                    aria-current={c.concept === conceptKey}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === "Enter" ? choose(c.concept) : null)}
                  >
                    <span>{c.label}</span>
                    <Tag color={c.sampleCount >= c.target ? "success" : "default"}>{`${c.sampleCount}/${c.target}`}</Tag>
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
