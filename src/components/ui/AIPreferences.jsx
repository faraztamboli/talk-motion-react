import React, { useState, useEffect } from "react";
import { Card, Switch, Space, Typography, Button, Select, Divider, Alert } from "antd";
import { RobotOutlined, SaveOutlined } from "@ant-design/icons";
import useLLM from "../../hooks/useLLM";
import useMessageApi from "../../hooks/useMessageApi";
import { handleKeyboardClick } from "../../utils/accessibility";

const { Text, Title } = Typography;
const { Option } = Select;

/**
 * AI Preferences Component
 * User settings for AI features
 */
export default function AIPreferences({ style = {} }) {
  const { getUserAIPreferences, updateUserAIPreferences } = useLLM();
  const { contextHolder, showMessage } = useMessageApi();
  
  const [preferences, setPreferences] = useState({
    aiDescriptionsEnabled: true,
    aiSummariesEnabled: true,
    aiSubtitlesEnabled: true,
    aiRecommendationsEnabled: true,
    aiTutorEnabled: true,
    aiSearchEnabled: true,
    aiContentGenerationEnabled: true,
    aiAssistanceLevel: "moderate",
    shareDataForImprovement: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const result = await getUserAIPreferences();
      if (result && result.success) {
        setPreferences(result.preferences || preferences);
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
      showMessage("error", "Failed to load preferences");
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    setChanged(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateUserAIPreferences(preferences);
      if (result && result.success) {
        setChanged(false);
        showMessage("success", "Preferences saved successfully!");
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      showMessage("error", "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {contextHolder}
      <Card
        style={style}
        title={
          <Space>
            <RobotOutlined style={{ color: "var(--color-primary)" }} />
            <Title level={4} style={{ margin: 0 }}>
              AI Preferences
            </Title>
          </Space>
        }
        extra={
          changed && (
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              onKeyDown={(e) => handleKeyboardClick(e, handleSave)}
              loading={saving}
              aria-label="Save preferences"
            >
              Save Changes
            </Button>
          )
        }
        loading={loading}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <div>
            <Title level={5}>AI Feature Toggles</Title>
            <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
              Enable or disable specific AI features
            </Text>
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <Text strong>AI Descriptions</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    Auto-generate video and course descriptions
                  </Text>
                </div>
                <Switch
                  checked={preferences.aiDescriptionsEnabled}
                  onChange={(checked) => handlePreferenceChange("aiDescriptionsEnabled", checked)}
                  aria-label="Toggle AI descriptions"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <Text strong>AI Summaries</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    Generate content summaries
                  </Text>
                </div>
                <Switch
                  checked={preferences.aiSummariesEnabled}
                  onChange={(checked) => handlePreferenceChange("aiSummariesEnabled", checked)}
                  aria-label="Toggle AI summaries"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <Text strong>AI Subtitle Enhancement</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    Improve subtitles with AI
                  </Text>
                </div>
                <Switch
                  checked={preferences.aiSubtitlesEnabled}
                  onChange={(checked) => handlePreferenceChange("aiSubtitlesEnabled", checked)}
                  aria-label="Toggle AI subtitle enhancement"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <Text strong>AI Recommendations</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    Personalized content recommendations
                  </Text>
                </div>
                <Switch
                  checked={preferences.aiRecommendationsEnabled}
                  onChange={(checked) => handlePreferenceChange("aiRecommendationsEnabled", checked)}
                  aria-label="Toggle AI recommendations"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <Text strong>AI Tutor</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    Interactive AI learning assistant
                  </Text>
                </div>
                <Switch
                  checked={preferences.aiTutorEnabled}
                  onChange={(checked) => handlePreferenceChange("aiTutorEnabled", checked)}
                  aria-label="Toggle AI tutor"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <Text strong>AI Search</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    Semantic search capabilities
                  </Text>
                </div>
                <Switch
                  checked={preferences.aiSearchEnabled}
                  onChange={(checked) => handlePreferenceChange("aiSearchEnabled", checked)}
                  aria-label="Toggle AI search"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <Text strong>AI Content Generation</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    Generate course outlines and scripts
                  </Text>
                </div>
                <Switch
                  checked={preferences.aiContentGenerationEnabled}
                  onChange={(checked) => handlePreferenceChange("aiContentGenerationEnabled", checked)}
                  aria-label="Toggle AI content generation"
                />
              </div>
            </Space>
          </div>

          <Divider />

          <div>
            <Title level={5}>AI Assistance Level</Title>
            <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
              How much AI assistance do you want?
            </Text>
            <Select
              value={preferences.aiAssistanceLevel}
              onChange={(value) => handlePreferenceChange("aiAssistanceLevel", value)}
              style={{ width: "100%" }}
              aria-label="Select AI assistance level"
            >
              <Option value="minimal">Minimal - Only when I ask</Option>
              <Option value="moderate">Moderate - Helpful suggestions</Option>
              <Option value="aggressive">Aggressive - Proactive assistance</Option>
            </Select>
          </div>

          <Divider />

          <div>
            <Title level={5}>Privacy & Data</Title>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <Text strong>Share Data for Improvement</Text>
                <br />
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  Help improve AI by sharing anonymized usage data
                </Text>
              </div>
              <Switch
                checked={preferences.shareDataForImprovement}
                onChange={(checked) => handlePreferenceChange("shareDataForImprovement", checked)}
                aria-label="Toggle data sharing"
              />
            </div>
            {preferences.shareDataForImprovement && (
              <Alert
                message="Data Sharing Enabled"
                description="Your anonymized usage data will be used to improve AI features. No personal information is shared."
                type="info"
                showIcon
                style={{ marginTop: 12 }}
              />
            )}
          </div>
        </Space>
      </Card>
    </>
  );
}

