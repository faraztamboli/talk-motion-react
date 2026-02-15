import React, { useState, useEffect } from "react";
import { Card, List, Button, Space, Typography, Tag, Empty, Spin, Alert, Badge } from "antd";
import { 
  BulbOutlined, 
  CheckOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  WarningOutlined,
  InfoCircleOutlined
} from "@ant-design/icons";
import useLLM from "../../hooks/useLLM";
import useMessageApi from "../../hooks/useMessageApi";
import { handleKeyboardClick } from "../../utils/accessibility";

const { Text, Paragraph } = Typography;

/**
 * AI Learning Insights Widget
 * Displays personalized learning insights and recommendations
 */
export default function AILearningInsights({
  unacknowledgedOnly = false,
  limit = 5,
  showTitle = true,
  onInsightClick,
  style = {},
}) {
  const { getLearningInsights, generateLearningInsights, acknowledgeLearningInsight } = useLLM();
  const { contextHolder, showMessage } = useMessageApi();
  
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadInsights();
  }, [unacknowledgedOnly, limit]);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const result = await getLearningInsights(unacknowledgedOnly, limit);
      if (result && result.success) {
        setInsights(result.insights || []);
      }
    } catch (error) {
      console.error("Error loading insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsights = async () => {
    setGenerating(true);
    try {
      const result = await generateLearningInsights();
      if (result && result.success) {
        setInsights(result.insights || []);
        showMessage("success", "Learning insights generated!");
        loadInsights(); // Reload to get updated list
      }
    } catch (error) {
      console.error("Error generating insights:", error);
      showMessage("error", "Failed to generate insights");
    } finally {
      setGenerating(false);
    }
  };

  const handleAcknowledge = async (insightId) => {
    try {
      await acknowledgeLearningInsight(insightId);
      setInsights((prev) => 
        prev.map((insight) => 
          insight.id === insightId 
            ? { ...insight, acknowledgedAt: new Date().toISOString() }
            : insight
        )
      );
      showMessage("success", "Insight acknowledged");
    } catch (error) {
      console.error("Error acknowledging insight:", error);
      showMessage("error", "Failed to acknowledge insight");
    }
  };

  const getInsightIcon = (insightType) => {
    switch (insightType) {
      case "strength":
        return <TrophyOutlined style={{ color: "var(--color-success)" }} />;
      case "weakness":
        return <WarningOutlined style={{ color: "var(--color-warning)" }} />;
      case "recommendation":
        return <BulbOutlined style={{ color: "var(--color-primary)" }} />;
      default:
        return <InfoCircleOutlined style={{ color: "var(--color-info)" }} />;
    }
  };

  const getInsightColor = (insightType) => {
    switch (insightType) {
      case "strength":
        return "success";
      case "weakness":
        return "warning";
      case "recommendation":
        return "blue";
      default:
        return "default";
    }
  };

  const unacknowledgedCount = insights.filter(
    (insight) => !insight.acknowledgedAt
  ).length;

  return (
    <>
      {contextHolder}
      <Card
        style={style}
        title={
          showTitle ? (
            <Space>
              <BulbOutlined style={{ color: "var(--color-primary)" }} />
              <Text strong>Learning Insights</Text>
              {unacknowledgedCount > 0 && (
                <Badge count={unacknowledgedCount} showZero={false} />
              )}
            </Space>
          ) : null
        }
        extra={
          insights.length === 0 && !loading && (
            <Button
              type="link"
              size="small"
              icon={<ThunderboltOutlined />}
              onClick={handleGenerateInsights}
              onKeyDown={(e) => handleKeyboardClick(e, handleGenerateInsights)}
              loading={generating}
              aria-label="Generate learning insights"
            >
              Generate
            </Button>
          )
        }
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Spin />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">Loading insights...</Text>
            </div>
          </div>
        ) : insights.length === 0 ? (
          <Empty
            description="No learning insights available"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={handleGenerateInsights}
              onKeyDown={(e) => handleKeyboardClick(e, handleGenerateInsights)}
              loading={generating}
              aria-label="Generate learning insights"
            >
              Generate Insights
            </Button>
          </Empty>
        ) : (
          <List
            dataSource={insights}
            renderItem={(insight) => (
              <List.Item
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid var(--color-border)",
                  backgroundColor: !insight.acknowledgedAt 
                    ? "var(--color-bg-secondary)" 
                    : "transparent",
                }}
                actions={
                  !insight.acknowledgedAt
                    ? [
                        <Button
                          type="text"
                          size="small"
                          icon={<CheckOutlined />}
                          onClick={() => handleAcknowledge(insight.id)}
                          onKeyDown={(e) => handleKeyboardClick(e, () => handleAcknowledge(insight.id))}
                          aria-label="Acknowledge insight"
                        >
                          Got it
                        </Button>,
                      ]
                    : []
                }
              >
                <List.Item.Meta
                  avatar={getInsightIcon(insight.insightType)}
                  title={
                    <Space>
                      <Text strong>{insight.category || "Learning"}</Text>
                      <Tag color={getInsightColor(insight.insightType)}>
                        {insight.insightType}
                      </Tag>
                      {insight.confidenceScore && (
                        <Tag color="default">
                          {Math.round(insight.confidenceScore * 100)}% confidence
                        </Tag>
                      )}
                    </Space>
                  }
                  description={
                    <div>
                      <Paragraph style={{ marginBottom: 8 }}>
                        {insight.insightText}
                      </Paragraph>
                      {insight.actionableItems && insight.actionableItems.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary" style={{ fontSize: "12px" }}>
                            Suggested actions:
                          </Text>
                          <ul style={{ marginTop: 4, marginBottom: 0, paddingLeft: 20 }}>
                            {insight.actionableItems.map((item, index) => (
                              <li key={index} style={{ fontSize: "12px" }}>
                                <Text type="secondary">{item.action}</Text>
                                {item.priority && (
                                  <Tag
                                    size="small"
                                    color={
                                      item.priority === "high"
                                        ? "red"
                                        : item.priority === "medium"
                                        ? "orange"
                                        : "default"
                                    }
                                    style={{ marginLeft: 8 }}
                                  >
                                    {item.priority}
                                  </Tag>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </>
  );
}

