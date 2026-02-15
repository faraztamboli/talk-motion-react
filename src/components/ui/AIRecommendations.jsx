import React, { useState, useEffect } from "react";
import { Card, List, Button, Space, Typography, Tag, Empty, Spin, Tooltip } from "antd";
import { 
  ThunderboltOutlined, 
  RightOutlined,
  CloseOutlined,
  EyeOutlined
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import useLLM from "../../hooks/useLLM";
import useMessageApi from "../../hooks/useMessageApi";
import { handleKeyboardClick } from "../../utils/accessibility";

const { Text, Paragraph } = Typography;

/**
 * AI Recommendations Widget
 * Displays personalized content recommendations
 */
export default function AIRecommendations({
  recommendationType = null, // 'video', 'course', 'classroom', 'model'
  limit = 10,
  showTitle = true,
  onRecommendationClick,
  style = {},
}) {
  const { getRecommendations, generateRecommendations, trackRecommendationInteraction } = useLLM();
  const { contextHolder, showMessage } = useMessageApi();
  
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, [recommendationType, limit]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const result = await getRecommendations(recommendationType, limit);
      if (result && result.success) {
        setRecommendations(result.recommendations || []);
      }
    } catch (error) {
      console.error("Error loading recommendations:", error);
      // If no recommendations exist, try generating them
      if (recommendations.length === 0) {
        handleGenerateRecommendations();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRecommendations = async () => {
    setGenerating(true);
    try {
      const result = await generateRecommendations(recommendationType, limit);
      if (result && result.success) {
        setRecommendations(result.recommendations || []);
        showMessage("success", "Recommendations generated!");
      }
    } catch (error) {
      console.error("Error generating recommendations:", error);
      showMessage("error", "Failed to generate recommendations");
    } finally {
      setGenerating(false);
    }
  };

  const handleRecommendationClick = async (recommendation) => {
    // Track the click
    try {
      await trackRecommendationInteraction(recommendation.id, "clicked");
    } catch (error) {
      console.error("Error tracking interaction:", error);
    }

    if (onRecommendationClick) {
      onRecommendationClick(recommendation);
    } else {
      // Default navigation based on type
      const routes = {
        video: `/video-subtitles/library/${recommendation.recommendedId}`,
        course: `/courses/${recommendation.recommendedId}`,
        classroom: `/classroom/${recommendation.recommendedId}`,
        model: `/models/${recommendation.recommendedId}`,
      };
      
      if (routes[recommendation.recommendationType]) {
        window.location.href = routes[recommendation.recommendationType];
      }
    }
  };

  const handleDismiss = async (recommendationId) => {
    try {
      await trackRecommendationInteraction(recommendationId, "dismissed");
      setRecommendations((prev) => 
        prev.filter((rec) => rec.id !== recommendationId)
      );
      showMessage("success", "Recommendation dismissed");
    } catch (error) {
      console.error("Error dismissing recommendation:", error);
    }
  };

  const getRecommendationTitle = (recommendation) => {
    // This would come from the actual content data
    // For now, return a placeholder
    return `Recommended ${recommendation.recommendationType}`;
  };

  return (
    <>
      {contextHolder}
      <Card
        style={style}
        title={
          showTitle ? (
            <Space>
              <ThunderboltOutlined style={{ color: "var(--color-primary)" }} />
              <Text strong>AI Recommendations</Text>
              {recommendations.length > 0 && (
                <Tag color="blue">{recommendations.length}</Tag>
              )}
            </Space>
          ) : null
        }
        extra={
          recommendations.length === 0 && !loading && (
            <Button
              type="link"
              size="small"
              icon={<ThunderboltOutlined />}
              onClick={handleGenerateRecommendations}
              onKeyDown={(e) => handleKeyboardClick(e, handleGenerateRecommendations)}
              loading={generating}
              aria-label="Generate recommendations"
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
              <Text type="secondary">Loading recommendations...</Text>
            </div>
          </div>
        ) : recommendations.length === 0 ? (
          <Empty
            description="No recommendations available"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={handleGenerateRecommendations}
              onKeyDown={(e) => handleKeyboardClick(e, handleGenerateRecommendations)}
              loading={generating}
              aria-label="Generate recommendations"
            >
              Generate Recommendations
            </Button>
          </Empty>
        ) : (
          <List
            dataSource={recommendations}
            renderItem={(recommendation) => (
              <List.Item
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid var(--color-border)",
                }}
                actions={[
                  <Tooltip title="Dismiss">
                    <Button
                      type="text"
                      size="small"
                      icon={<CloseOutlined />}
                      onClick={() => handleDismiss(recommendation.id)}
                      onKeyDown={(e) => handleKeyboardClick(e, () => handleDismiss(recommendation.id))}
                      aria-label="Dismiss recommendation"
                    />
                  </Tooltip>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{getRecommendationTitle(recommendation)}</Text>
                      {recommendation.confidenceScore && (
                        <Tag color={recommendation.confidenceScore > 0.8 ? "green" : "blue"}>
                          {Math.round(recommendation.confidenceScore * 100)}% match
                        </Tag>
                      )}
                    </Space>
                  }
                  description={
                    <div>
                      <Paragraph
                        ellipsis={{ rows: 2, expandable: false }}
                        style={{ marginBottom: 8, fontSize: "13px" }}
                      >
                        {recommendation.recommendationReason}
                      </Paragraph>
                      <Button
                        type="link"
                        size="small"
                        icon={<RightOutlined />}
                        onClick={() => handleRecommendationClick(recommendation)}
                        onKeyDown={(e) => handleKeyboardClick(e, () => handleRecommendationClick(recommendation))}
                        aria-label={`View ${recommendation.recommendationType} recommendation`}
                      >
                        View {recommendation.recommendationType}
                      </Button>
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

