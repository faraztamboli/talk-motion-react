import React, { useState, useEffect, useRef } from "react";
import { Card, Input, Button, Space, Typography, Spin, Avatar, List, Empty } from "antd";
import { 
  SendOutlined, 
  RobotOutlined, 
  UserOutlined,
  DeleteOutlined,
  MessageOutlined
} from "@ant-design/icons";
import useLLM from "../../hooks/useLLM";
import useMessageApi from "../../hooks/useMessageApi";
import { handleKeyboardClick } from "../../utils/accessibility";

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

/**
 * AI Tutor Component
 * Interactive AI tutor/chatbot for learning assistance
 */
export default function AITutor({
  conversationType = "tutor", // 'tutor', 'chatbot', 'qa'
  contextType = null, // 'course', 'video', 'classroom'
  contextId = null,
  title = "AI Tutor",
  onConversationStart,
  style = {},
}) {
  const { 
    startAIConversation, 
    sendAIConversationMessage, 
    getAIConversationMessages,
    deleteAIConversation 
  } = useLLM();
  const { contextHolder, showMessage } = useMessageApi();
  
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    initializeConversation();
  }, [conversationType, contextType, contextId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeConversation = async () => {
    setInitializing(true);
    try {
      const result = await startAIConversation(conversationType, contextType, contextId);
      if (result && result.success) {
        setConversationId(result.conversationId);
        setMessages([
          {
            role: "assistant",
            content: result.initialMessage || "Hello! I'm your AI tutor. How can I help you today?",
            timestamp: new Date().toISOString(),
          },
        ]);
        
        if (onConversationStart) {
          onConversationStart(result.conversationId);
        }
      }
    } catch (error) {
      console.error("Error initializing conversation:", error);
      showMessage("error", "Failed to start conversation");
    } finally {
      setInitializing(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || sending || !conversationId) return;

    const userMessage = {
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setSending(true);

    try {
      const result = await sendAIConversationMessage(conversationId, userMessage.content);
      if (result && result.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: result.aiResponse.content,
            timestamp: result.aiResponse.timestamp,
          },
        ]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      showMessage("error", "Failed to send message. Please try again.");
      // Remove the user message on error
      setMessages((prev) => prev.filter((msg) => msg !== userMessage));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDeleteConversation = async () => {
    if (!conversationId) return;
    
    try {
      await deleteAIConversation(conversationId);
      setConversationId(null);
      setMessages([]);
      showMessage("success", "Conversation deleted");
      initializeConversation();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      showMessage("error", "Failed to delete conversation");
    }
  };

  if (initializing) {
    return (
      <Card style={style} title={<><RobotOutlined /> {title}</>}>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Initializing AI tutor...</Text>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      {contextHolder}
      <Card
        style={{
          ...style,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
        title={
          <Space>
            <RobotOutlined style={{ color: "var(--color-primary)" }} />
            <Text strong>{title}</Text>
          </Space>
        }
        extra={
          conversationId && (
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={handleDeleteConversation}
              onKeyDown={(e) => handleKeyboardClick(e, handleDeleteConversation)}
              aria-label="Delete conversation"
            >
              New Chat
            </Button>
          )
        }
        bodyStyle={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: "16px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            marginBottom: "16px",
            minHeight: "300px",
            maxHeight: "500px",
            padding: "8px",
          }}
        >
          {messages.length === 0 ? (
            <Empty
              description="Start a conversation with your AI tutor"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <List
              dataSource={messages}
              renderItem={(message) => (
                <List.Item
                  style={{
                    border: "none",
                    padding: "12px 0",
                    alignItems: "flex-start",
                  }}
                >
                  <Space align="start" style={{ width: "100%" }}>
                    <Avatar
                      icon={
                        message.role === "user" ? <UserOutlined /> : <RobotOutlined />
                      }
                      style={{
                        backgroundColor:
                          message.role === "user"
                            ? "var(--color-primary)"
                            : "var(--color-success)",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        strong
                        style={{
                          display: "block",
                          marginBottom: "4px",
                          fontSize: "12px",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {message.role === "user" ? "You" : "AI Tutor"}
                      </Text>
                      <Paragraph
                        style={{
                          marginBottom: 0,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {message.content}
                      </Paragraph>
                    </div>
                  </Space>
                </List.Item>
              )}
            />
          )}
          {sending && (
            <div style={{ padding: "12px 0" }}>
              <Space>
                <Avatar icon={<RobotOutlined />} style={{ backgroundColor: "var(--color-success)" }} />
                <Spin size="small" />
                <Text type="secondary">AI is thinking...</Text>
              </Space>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <Space.Compact style={{ width: "100%" }}>
          <TextArea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question or type a message..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            disabled={sending || !conversationId}
            style={{ flex: 1 }}
            aria-label="Message input"
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            onKeyDown={(e) => handleKeyboardClick(e, handleSend)}
            loading={sending}
            disabled={!inputValue.trim() || sending || !conversationId}
            aria-label="Send message"
          >
            Send
          </Button>
        </Space.Compact>
      </Card>
    </>
  );
}

