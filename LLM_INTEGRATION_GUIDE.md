# LLM Integration Guide - Frontend Implementation

## Overview
This guide shows how to integrate LLM features into existing TalkMotion pages using the new hooks and components.

---

## 📦 **Components Created**

### **1. Hooks**
- `src/hooks/useLLM.js` - Main hook for all LLM functions

### **2. UI Components**
- `src/components/ui/AIContentGenerator.jsx` - Generate descriptions, summaries, outlines
- `src/components/ui/AITutor.jsx` - Interactive AI tutor/chatbot
- `src/components/ui/AIRecommendations.jsx` - Personalized recommendations widget
- `src/components/ui/AILearningInsights.jsx` - Learning insights widget
- `src/components/ui/AIPreferences.jsx` - AI preferences settings

---

## 🚀 **Integration Examples**

### **Example 1: Add AI Description Generator to Video Page**

```jsx
import React, { useState } from "react";
import { Row, Col, Card, Tabs } from "antd";
import AIContentGenerator from "../components/ui/AIContentGenerator";
import useLLM from "../hooks/useLLM";

function VideoDetailPage({ videoId, video }) {
  const [description, setDescription] = useState(video.description || "");

  const handleContentApproved = (content) => {
    setDescription(content);
    // Optionally refresh video data
  };

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Tabs>
          <Tabs.TabPane tab="Video Details" key="details">
            {/* Existing video details */}
          </Tabs.TabPane>
          
          <Tabs.TabPane tab="AI Assistant" key="ai">
            <AIContentGenerator
              targetType="video"
              targetId={videoId}
              contentType="description"
              existingContent={video.description}
              onContentApproved={handleContentApproved}
            />
            
            <div style={{ marginTop: 16 }}>
              <AIContentGenerator
                targetType="video"
                targetId={videoId}
                contentType="summary"
                existingContent={video.summary}
              />
            </div>
          </Tabs.TabPane>
        </Tabs>
      </Col>
    </Row>
  );
}
```

---

### **Example 2: Add AI Tutor to Course Page**

```jsx
import React from "react";
import { Row, Col } from "antd";
import AITutor from "../components/ui/AITutor";

function CourseDetailPage({ courseId }) {
  return (
    <Row gutter={[16, 16]}>
      <Col span={16}>
        {/* Existing course content */}
      </Col>
      
      <Col span={8}>
        <AITutor
          conversationType="tutor"
          contextType="course"
          contextId={courseId}
          title="Course AI Tutor"
          style={{ height: "600px" }}
        />
      </Col>
    </Row>
  );
}
```

---

### **Example 3: Add Recommendations to Dashboard**

```jsx
import React from "react";
import { Row, Col } from "antd";
import AIRecommendations from "../components/ui/AIRecommendations";

function DashboardNew() {
  return (
    <Row gutter={[16, 16]}>
      {/* Existing dashboard widgets */}
      
      <Col span={24} md={12}>
        <AIRecommendations
          recommendationType="video"
          limit={5}
          showTitle={true}
        />
      </Col>
      
      <Col span={24} md={12}>
        <AIRecommendations
          recommendationType="course"
          limit={5}
          showTitle={true}
        />
      </Col>
    </Row>
  );
}
```

---

### **Example 4: Add Learning Insights to Dashboard**

```jsx
import React from "react";
import { Row, Col } from "antd";
import AILearningInsights from "../components/ui/AILearningInsights";

function DashboardNew() {
  return (
    <Row gutter={[16, 16]}>
      <Col span={24} md={12}>
        <AILearningInsights
          unacknowledgedOnly={true}
          limit={5}
          showTitle={true}
        />
      </Col>
    </Row>
  );
}
```

---

### **Example 5: Add AI Preferences to Settings Page**

```jsx
import React from "react";
import { Card } from "antd";
import AIPreferences from "../components/ui/AIPreferences";

function Setting() {
  return (
    <div>
      {/* Existing settings */}
      
      <AIPreferences style={{ marginTop: 24 }} />
    </div>
  );
}
```

---

### **Example 6: Enhance Video Subtitles Designer**

```jsx
import React, { useState } from "react";
import { Card, Button, Space } from "antd";
import { ThunderboltOutlined } from "@ant-design/icons";
import AIContentGenerator from "../components/ui/AIContentGenerator";
import useLLM from "../hooks/useLLM";

function VideoSubtitlesDesigner({ recordingId, title, description }) {
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  return (
    <div>
      {/* Existing video designer UI */}
      
      <Card style={{ marginTop: 16 }}>
        <Space>
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={() => setShowAIGenerator(!showAIGenerator)}
          >
            {showAIGenerator ? "Hide" : "Show"} AI Assistant
          </Button>
        </Space>
        
        {showAIGenerator && (
          <div style={{ marginTop: 16 }}>
            <AIContentGenerator
              targetType="video"
              targetId={recordingId}
              contentType="description"
              existingContent={description}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
```

---

### **Example 7: Add AI Features to Course Creation**

```jsx
import React, { useState } from "react";
import { Card, Tabs } from "antd";
import AIContentGenerator from "../components/ui/AIContentGenerator";
import AITutor from "../components/ui/AITutor";

function NewCourseModal({ folderId }) {
  const [activeTab, setActiveTab] = useState("basic");

  return (
    <Tabs activeKey={activeTab} onChange={setActiveTab}>
      <Tabs.TabPane tab="Basic Info" key="basic">
        {/* Existing form */}
      </Tabs.TabPane>
      
      <Tabs.TabPane tab="AI Assistant" key="ai">
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <AIContentGenerator
            targetType="course"
            targetId={folderId}
            contentType="description"
          />
          
          <AIContentGenerator
            targetType="course"
            targetId={folderId}
            contentType="outline"
          />
        </Space>
      </Tabs.TabPane>
    </Tabs>
  );
}
```

---

## 🎨 **UI/UX Best Practices Implemented**

### **1. Progressive Disclosure**
- AI features are optional and can be toggled
- Components are collapsible/expandable
- Advanced options hidden by default

### **2. Clear Visual Feedback**
- Loading states for all async operations
- Success/error messages via `useMessageApi`
- Status indicators (generated, approved, etc.)
- Visual distinction for AI-generated content

### **3. Accessibility**
- All interactive elements have ARIA labels
- Keyboard navigation support
- Screen reader friendly
- High contrast support

### **4. User Control**
- Users can approve/reject AI content
- Preferences allow opt-in/opt-out
- Easy to dismiss recommendations
- Clear undo/redo options

### **5. Performance**
- Lazy loading of AI components
- Debounced API calls
- Cached preferences
- Optimistic UI updates

---

## 📝 **Integration Checklist**

### **For Video Pages**
- [ ] Add `AIContentGenerator` for descriptions
- [ ] Add `AIContentGenerator` for summaries
- [ ] Add `AITutor` in sidebar or modal
- [ ] Show AI-generated content with clear labels

### **For Course Pages**
- [ ] Add `AIContentGenerator` for course descriptions
- [ ] Add `AIContentGenerator` for course outlines
- [ ] Add `AITutor` for course-specific help
- [ ] Show AI-generated objectives

### **For Dashboard**
- [ ] Add `AIRecommendations` widget
- [ ] Add `AILearningInsights` widget
- [ ] Show AI usage stats (optional)

### **For Settings**
- [ ] Add `AIPreferences` component
- [ ] Link to AI preferences from main settings

### **For Content Creation**
- [ ] Add AI generation buttons to forms
- [ ] Show AI suggestions inline
- [ ] Allow easy approval/rejection

---

## 🔧 **Customization**

### **Styling**
All components use CSS variables for theming:
- `var(--color-primary)`
- `var(--color-bg-secondary)`
- `var(--color-border)`
- `var(--spacing-*)`

### **Configuration**
Components accept `style` prop for custom styling:
```jsx
<AIContentGenerator
  style={{ marginTop: 24, border: "2px solid blue" }}
/>
```

### **Callbacks**
Most components support callbacks for custom behavior:
```jsx
<AIRecommendations
  onRecommendationClick={(rec) => {
    // Custom navigation or action
    console.log("Clicked:", rec);
  }}
/>
```

---

## 🚨 **Error Handling**

All components handle errors gracefully:
- Network errors show user-friendly messages
- Invalid inputs are validated
- Fallbacks for missing data
- Retry mechanisms for failed operations

---

## 📊 **Performance Tips**

1. **Lazy Load**: Only load AI components when needed
2. **Cache**: Cache user preferences and recommendations
3. **Debounce**: Debounce user inputs for AI generation
4. **Batch**: Batch multiple AI requests when possible
5. **Optimize**: Use pagination for large lists

---

## ✅ **Testing Checklist**

- [ ] Test all AI generation features
- [ ] Test approval/rejection workflows
- [ ] Test conversation flows
- [ ] Test preferences saving
- [ ] Test error scenarios
- [ ] Test accessibility (keyboard, screen reader)
- [ ] Test responsive design
- [ ] Test performance with large datasets

---

## 🎯 **Next Steps**

1. Integrate components into existing pages
2. Test with real backend API
3. Gather user feedback
4. Iterate on UI/UX
5. Add more AI features based on usage

---

**Status**: ✅ Components ready for integration
**Last Updated**: 2024-01-15

