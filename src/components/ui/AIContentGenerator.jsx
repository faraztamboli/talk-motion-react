import React, { useState } from "react";
import { Button, Card, Space, Typography, Spin, Alert, Select, Tooltip, Tag } from "antd";
import { 
  ThunderboltOutlined, 
  CheckOutlined, 
  CloseOutlined,
  EditOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  RobotOutlined
} from "@ant-design/icons";
import useLLM from "../../hooks/useLLM";
import useMessageApi from "../../hooks/useMessageApi";
import { handleKeyboardClick } from "../../utils/accessibility";

const { Text, Paragraph } = Typography;
const { Option } = Select;

/**
 * AI Content Generator Component
 * Generates AI descriptions, summaries, and other content for videos/courses
 */
export default function AIContentGenerator({
  targetType, // 'video' or 'course'
  targetId,
  contentType, // 'description', 'summary', 'outline'
  existingContent = "",
  onContentGenerated,
  onContentApproved,
  style = {},
}) {
  const { generateVideoDescription, generateVideoSummary, generateCourseDescription, generateCourseOutline, approveAIGeneratedContent, rejectAIGeneratedContent } = useLLM();
  const { contextHolder, showMessage } = useMessageApi();
  
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [contentId, setContentId] = useState(null);
  const [status, setStatus] = useState("idle"); // 'idle', 'generating', 'generated', 'approved', 'rejected'
  const [styleOption, setStyleOption] = useState("medium");
  const [modelOption, setModelOption] = useState("gpt-4");

  const contentTypeLabels = {
    description: "Description",
    summary: "Summary",
    outline: "Outline",
  };

  const handleGenerate = async () => {
    setLoading(true);
    setStatus("generating");

    try {
      let result;
      const options = {
        model: modelOption,
        style: styleOption,
      };

      switch (contentType) {
        case "description":
          if (targetType === "video") {
            result = await generateVideoDescription(targetId, options);
          } else if (targetType === "course") {
            result = await generateCourseDescription(targetId, options);
          }
          break;
        case "summary":
          result = await generateVideoSummary(targetId, options);
          break;
        case "outline":
          result = await generateCourseOutline(targetId, options);
          break;
        default:
          throw new Error("Invalid content type");
      }

      if (result && result.success) {
        let content = "";
        if (result.generatedDescription) {
          content = result.generatedDescription;
        } else if (result.generatedSummary) {
          content = result.generatedSummary;
        } else if (result.generatedOutline) {
          // Format the outline object into a readable string
          if (typeof result.generatedOutline === "object") {
            const outline = result.generatedOutline;
            const parts = [];
            
            if (outline.CourseTitle) {
              parts.push(`Course Title: ${outline.CourseTitle}`);
            }
            
            if (outline.Prerequisites && Array.isArray(outline.Prerequisites) && outline.Prerequisites.length > 0) {
              parts.push(`\nPrerequisites:\n${outline.Prerequisites.map((p, i) => `  ${i + 1}. ${p}`).join("\n")}`);
            } else if (outline.prerequisites && Array.isArray(outline.prerequisites) && outline.prerequisites.length > 0) {
              parts.push(`\nPrerequisites:\n${outline.prerequisites.map((p, i) => `  ${i + 1}. ${p}`).join("\n")}`);
            }
            
            if (outline.Modules && Array.isArray(outline.Modules) && outline.Modules.length > 0) {
              parts.push(`\nModules:`);
              outline.Modules.forEach((module, i) => {
                if (typeof module === "string") {
                  parts.push(`  ${i + 1}. ${module}`);
                } else if (module.title) {
                  parts.push(`  ${i + 1}. ${module.title}`);
                  if (module.lessons && Array.isArray(module.lessons)) {
                    module.lessons.forEach((lesson, j) => {
                      parts.push(`     ${j + 1}. ${lesson}`);
                    });
                  }
                  if (module.objectives && Array.isArray(module.objectives)) {
                    parts.push(`     Objectives:`);
                    module.objectives.forEach((obj, j) => {
                      parts.push(`       - ${obj}`);
                    });
                  }
                }
              });
            } else if (outline.modules && Array.isArray(outline.modules) && outline.modules.length > 0) {
              parts.push(`\nModules:`);
              outline.modules.forEach((module, i) => {
                if (typeof module === "string") {
                  parts.push(`  ${i + 1}. ${module}`);
                } else if (module.title) {
                  parts.push(`  ${i + 1}. ${module.title}`);
                  if (module.lessons && Array.isArray(module.lessons)) {
                    module.lessons.forEach((lesson, j) => {
                      parts.push(`     ${j + 1}. ${lesson}`);
                    });
                  }
                  if (module.objectives && Array.isArray(module.objectives)) {
                    parts.push(`     Objectives:`);
                    module.objectives.forEach((obj, j) => {
                      parts.push(`       - ${obj}`);
                    });
                  }
                }
              });
            }
            
            if (outline.estimatedDuration) {
              parts.push(`\nEstimated Duration: ${outline.estimatedDuration}`);
            }
            
            content = parts.join("\n");
          } else {
            content = result.generatedOutline;
          }
        }
        
        setGeneratedContent(content);
        setContentId(result.contentId);
        setStatus("generated");
        showMessage("success", `AI ${contentTypeLabels[contentType]} generated successfully!`);
        
        if (onContentGenerated) {
          onContentGenerated(result);
        }
      }
    } catch (error) {
      console.error("Error generating content:", error);
      setStatus("idle");
      showMessage("error", error.message || `Failed to generate ${contentTypeLabels[contentType]}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!contentId) return;

    setLoading(true);
    try {
      const result = await approveAIGeneratedContent(contentId);
      if (result && result.success) {
        setStatus("approved");
        showMessage("success", "Content approved and saved!");
        
        if (onContentApproved) {
          onContentApproved(generatedContent);
        }
      }
    } catch (error) {
      console.error("Error approving content:", error);
      showMessage("error", "Failed to approve content");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!contentId) return;

    setLoading(true);
    try {
      const result = await rejectAIGeneratedContent(contentId, "User rejected");
      if (result && result.success) {
        setStatus("rejected");
        setGeneratedContent("");
        setContentId(null);
        showMessage("info", "Content rejected");
      }
    } catch (error) {
      console.error("Error rejecting content:", error);
      showMessage("error", "Failed to reject content");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    // Allow user to edit the generated content
    setStatus("editing");
  };

  return (
    <>
      {contextHolder}
      <Card
        style={{
          ...style,
          border: status === "generated" ? "2px solid var(--color-primary)" : undefined,
        }}
        title={
          <Space>
            <RobotOutlined style={{ color: "var(--color-primary)", fontSize: 18 }} />
            <Text strong>AI {contentTypeLabels[contentType]} Generator</Text>
            {status === "generated" && (
              <Tag color="blue" icon={<ThunderboltOutlined />}>
                Generated
              </Tag>
            )}
          </Space>
        }
        extra={
          <Space>
            <Select
              value={modelOption}
              onChange={setModelOption}
              size="small"
              style={{ width: 120 }}
              disabled={loading}
            >
              <Option value="gpt-4">GPT-4</Option>
              <Option value="gpt-3.5-turbo">GPT-3.5</Option>
              <Option value="claude-3">Claude 3</Option>
            </Select>
            {contentType === "description" && (
              <Select
                value={styleOption}
                onChange={setStyleOption}
                size="small"
                style={{ width: 100 }}
                disabled={loading}
              >
                <Option value="short">Short</Option>
                <Option value="medium">Medium</Option>
                <Option value="detailed">Detailed</Option>
              </Select>
            )}
          </Space>
        }
      >
        {existingContent && status === "idle" && (
          <Alert
            message="Existing Content"
            description={
              <Paragraph
                ellipsis={{ rows: 2, expandable: true }}
                style={{ marginBottom: 0 }}
              >
                {existingContent}
              </Paragraph>
            }
            type="info"
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: 16 }}
            showIcon
          />
        )}

        {status === "generated" && (
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              Generated {contentTypeLabels[contentType]}:
            </Text>
            <Card
              size="small"
              style={{
                backgroundColor: "var(--color-bg-secondary)",
                border: "1px solid var(--color-border)",
              }}
            >
              <Paragraph
                style={{
                  whiteSpace: "pre-wrap",
                  marginBottom: 0,
                  maxHeight: "300px",
                  overflowY: "auto",
                }}
              >
                {generatedContent}
              </Paragraph>
            </Card>
          </div>
        )}

        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          {status === "idle" && (
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={handleGenerate}
              onKeyDown={(e) => handleKeyboardClick(e, handleGenerate)}
              loading={loading}
              block
              size="large"
              aria-label={`Generate AI ${contentTypeLabels[contentType]}`}
            >
              Generate AI {contentTypeLabels[contentType]}
            </Button>
          )}

          {status === "generating" && (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">Generating {contentTypeLabels[contentType]}...</Text>
              </div>
            </div>
          )}

          {status === "generated" && (
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Tooltip title="Edit the generated content">
                <Button
                  icon={<EditOutlined />}
                  onClick={handleEdit}
                  onKeyDown={(e) => handleKeyboardClick(e, handleEdit)}
                  aria-label="Edit generated content"
                >
                  Edit
                </Button>
              </Tooltip>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleGenerate}
                onKeyDown={(e) => handleKeyboardClick(e, handleGenerate)}
                disabled={loading}
                aria-label="Regenerate content"
              >
                Regenerate
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={handleReject}
                onKeyDown={(e) => handleKeyboardClick(e, handleReject)}
                disabled={loading}
                aria-label="Reject generated content"
              >
                Reject
              </Button>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleApprove}
                onKeyDown={(e) => handleKeyboardClick(e, handleApprove)}
                loading={loading}
                aria-label="Approve and save generated content"
              >
                Approve & Save
              </Button>
            </Space>
          )}

          {status === "approved" && (
            <Alert
              message="Content Approved"
              description="The AI-generated content has been approved and saved."
              type="success"
              showIcon
            />
          )}
        </Space>
      </Card>
    </>
  );
}

