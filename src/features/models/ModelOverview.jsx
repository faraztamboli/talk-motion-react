import React from "react";
import { Link } from "react-router-dom";
import { Alert, Button, Card, Col, Row, Statistic, Steps, Tag, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { useModelContext } from "./ModelPage";
import { useGetTrainingReadinessQuery, useListConceptsQuery } from "./modelsApi";
import { modelStatus } from "./modelStatus";

/** Where the model stands and what to do next. */
export default function ModelOverview() {
  const { t } = useTranslation();
  const { model, modelId } = useModelContext();
  const canTrain = model.permissions.train;
  const { data: concepts = [] } = useListConceptsQuery(modelId);
  const { data: readiness } = useGetTrainingReadinessQuery(modelId, { skip: !canTrain });

  const atTarget = concepts.filter((c) => c.sampleCount >= c.target).length;
  const status = modelStatus(model);
  const base = `/models/${modelId}`;

  let current = 0;
  if (concepts.length) current = 1;
  if (readiness?.ready) current = 2;
  if (model.trained) current = 3;

  const next = !concepts.length
    ? { text: t("models.next.addWords", "Add the words and phrases this model should know"), to: `${base}/concepts`, cta: t("models.next.addWordsCta", "Add words") }
    : readiness && !readiness.ready
      ? { text: readiness.problems[0]?.message, to: `${base}/collect`, cta: t("models.next.recordCta", "Record samples") }
      : !model.trained || status.key === "failed"
        ? { text: t("models.next.train", "You have enough samples to train."), to: `${base}/train`, cta: t("models.next.trainCta", "Train the model") }
        : null;

  return (
    <div className="tm-tab">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title={t("models.overview.concepts", "Words & phrases")} value={concepts.length} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={t("models.overview.samples", "Samples recorded")}
              value={concepts.reduce((n, c) => n + c.sampleCount, 0)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={t("models.overview.atTarget", "At their sample target")}
              value={atTarget}
              suffix={`/ ${concepts.length}`}
            />
          </Card>
        </Col>
      </Row>

      {canTrain && (
        <Card className="tm-block" title={t("models.overview.steps", "Getting this model ready")}>
          <Steps
            direction="vertical"
            size="small"
            current={current}
            items={[
              {
                title: t("models.steps.words", "Add words and phrases"),
                description: t("models.steps.wordsBody", "Each one becomes something the model can recognise."),
              },
              {
                title: t("models.steps.record", "Record samples"),
                description: t("models.steps.recordBody", "Sign each word several times, in good light, with both hands in view."),
              },
              {
                title: t("models.steps.train", "Train"),
                description: t("models.steps.trainBody", "The model learns from your samples. It takes a few minutes."),
              },
              {
                title: t("models.steps.translate", "Translate"),
                description: t("models.steps.translateBody", "Use the model in the Translator to turn signs into speech."),
              },
            ]}
          />
          {next && (
            <Alert
              className="tm-block"
              type="info"
              showIcon
              message={next.text}
              action={
                <Link to={next.to}>
                  <Button type="primary" size="small">
                    {next.cta}
                  </Button>
                </Link>
              }
            />
          )}
          {readiness?.warnings?.map((w) => (
            <Alert key={w.code} className="tm-block" type="warning" showIcon message={w.message} />
          ))}
        </Card>
      )}

      {model.trained && model.labels?.length > 0 && (
        <Card className="tm-block" title={t("models.overview.knows", "This model recognises")}>
          <div className="tm-tag-cloud">
            {model.labels.map((l) => (
              <Tag key={l}>{l}</Tag>
            ))}
          </div>
          {model.trainedAt && (
            <Typography.Text type="secondary">
              {t("models.overview.trainedAt", "Last trained {{date}}", { date: new Date(model.trainedAt).toLocaleString() })}
            </Typography.Text>
          )}
        </Card>
      )}
    </div>
  );
}
