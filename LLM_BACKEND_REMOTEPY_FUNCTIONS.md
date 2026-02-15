# LLM Integration - Backend Remotepy Functions Specification

## Overview
This document specifies all remotepy functions needed to support LLM (Large Language Model) integration in TalkMotion. Functions follow the pattern: `TalkMotionServer.functionName(token, ...params, callback)`

**Database Tables Required**: See `llm_database_migration_mysql.sql` for schema
- `ai_generated_content`
- `llm_api_usage`
- `user_ai_preferences`
- `ai_conversations`
- `ai_recommendations`
- `ai_feedback`
- `ai_learning_insights`

---

## 📊 **PHASE 1: Core LLM Functions (High Priority)**

### **1. Content Generation**

#### `generateVideoDescription(token, videoId, options, callback)`
**Purpose**: Generate AI description for a video
**Parameters**:
- `token` (string): User authentication token
- `videoId` (int): Video ID from `video_recording` table
- `options` (dict, optional): 
  - `model` (string): LLM model to use (default: 'gpt-4')
  - `style` (string): 'short', 'medium', 'detailed' (default: 'medium')
  - `language` (string): Target language code (default: 'en')
- `callback` (function): Callback with result

**Returns**:
```json
{
  "success": true,
  "contentId": 123,
  "generatedDescription": "This video teaches basic ASL greetings...",
  "model": "gpt-4",
  "tokensUsed": 150,
  "cost": 0.002,
  "status": "pending"
}
```

**Implementation Notes**:
- Get video details from `video_recording` table (title, existing description, transcript if available)
- Call LLM API (OpenAI, Anthropic, etc.) with prompt
- Insert into `ai_generated_content` table with:
  - `content_type = 'video_description'`
  - `target_type = 'video'`
  - `target_id = videoId`
  - `status = 'pending'`
- Log API usage in `llm_api_usage` table
- Check `user_ai_preferences` for user's AI settings
- Return generated content ID for approval workflow

---

#### `generateVideoSummary(token, videoId, options, callback)`
**Purpose**: Generate AI summary for a video
**Parameters**:
- `token` (string): User authentication token
- `videoId` (int): Video ID
- `options` (dict, optional):
  - `model` (string): LLM model (default: 'gpt-4')
  - `length` (string): 'short', 'medium', 'long' (default: 'medium')
- `callback` (function): Callback with result

**Returns**:
```json
{
  "success": true,
  "contentId": 124,
  "generatedSummary": "Key points: 1. Basic greetings...",
  "model": "gpt-4",
  "tokensUsed": 200,
  "cost": 0.003
}
```

**Implementation Notes**:
- Similar to `generateVideoDescription` but with summary-focused prompt
- Use video transcript, description, or metadata as input
- Store in `ai_generated_content` with `content_type = 'video_summary'`

---

#### `generateCourseDescription(token, folderId, options, callback)`
**Purpose**: Generate AI description for a course/folder
**Parameters**:
- `token` (string): User authentication token
- `folderId` (int): Folder ID from `folder` table
- `options` (dict, optional): Same as video description
- `callback` (function): Callback with result

**Returns**:
```json
{
  "success": true,
  "contentId": 125,
  "generatedDescription": "This course covers...",
  "model": "gpt-4",
  "tokensUsed": 180
}
```

**Implementation Notes**:
- Get folder details from `folder` table
- Consider folder contents (videos, subfolders) for context
- Store in `ai_generated_content` with `content_type = 'course_description'`

---

#### `generateCourseOutline(token, folderId, options, callback)`
**Purpose**: Generate course outline/structure
**Parameters**:
- `token` (string): User authentication token
- `folderId` (int): Folder ID
- `options` (dict, optional):
  - `includeObjectives` (bool): Include learning objectives (default: true)
  - `includePrerequisites` (bool): Include prerequisites (default: true)
- `callback` (function): Callback with result

**Returns**:
```json
{
  "success": true,
  "contentId": 126,
  "generatedOutline": {
    "modules": [
      {
        "title": "Module 1: Introduction",
        "lessons": ["Lesson 1.1", "Lesson 1.2"],
        "objectives": ["Learn basic signs", "Understand grammar"]
      }
    ],
    "prerequisites": ["Basic ASL knowledge"],
    "estimatedDuration": "4 weeks"
  },
  "model": "gpt-4",
  "tokensUsed": 300
}
```

**Implementation Notes**:
- Analyze existing folder structure and content
- Generate structured outline based on content
- Store as JSON in `ai_generated_content` with `content_type = 'course_outline'`

---

#### `enhanceSubtitles(token, videoId, subtitleId, options, callback)`
**Purpose**: Enhance/improve existing subtitles using AI
**Parameters**:
- `token` (string): User authentication token
- `videoId` (int): Video ID
- `subtitleId` (int, optional): Specific subtitle ID to enhance
- `options` (dict, optional):
  - `improveClarity` (bool): Simplify complex sentences (default: true)
  - `fixGrammar` (bool): Fix grammar and spelling (default: true)
  - `addContext` (bool): Add contextual information (default: false)
- `callback` (function): Callback with result

**Returns**:
```json
{
  "success": true,
  "contentId": 127,
  "enhancedSubtitles": [
    {
      "id": 1,
      "original": "The person is doing sign language",
      "enhanced": "The person demonstrates sign language gestures",
      "improvements": ["clarity", "grammar"]
    }
  ],
  "model": "gpt-4",
  "tokensUsed": 250
}
```

**Implementation Notes**:
- Get subtitles from video (check `video_recording_shot` or subtitle table)
- Process each subtitle through LLM for enhancement
- Store enhanced version in `ai_generated_content` with `content_type = 'subtitle'`
- Link to original subtitle

---

### **2. Content Approval & Management**

#### `approveAIGeneratedContent(token, contentId, callback)`
**Purpose**: Approve AI-generated content for use
**Parameters**:
- `token` (string): User authentication token
- `contentId` (int): AI generated content ID from `ai_generated_content`
- `callback` (function): Callback with result

**Returns**:
```json
{
  "success": true,
  "contentId": 123,
  "status": "approved",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Implementation Notes**:
- Update `ai_generated_content.status = 'approved'`
- Set `approved_at = NOW()`
- Set `approved_by = current_user_id`
- If content_type is 'video_description', update `video_recording.ai_description`
- If content_type is 'video_summary', update `video_recording.ai_summary`
- If content_type is 'course_description', update `folder.ai_description`

---

#### `rejectAIGeneratedContent(token, contentId, reason, callback)`
**Purpose**: Reject AI-generated content
**Parameters**:
- `token` (string): User authentication token
- `contentId` (int): AI generated content ID
- `reason` (string, optional): Reason for rejection
- `callback` (function): Callback with result

**Returns**:
```json
{
  "success": true,
  "contentId": 123,
  "status": "rejected"
}
```

**Implementation Notes**:
- Update `ai_generated_content.status = 'rejected'`
- Store rejection reason in metadata

---

#### `getAIGeneratedContent(token, targetType, targetId, contentType, callback)`
**Purpose**: Get AI-generated content for a resource
**Parameters**:
- `token` (string): User authentication token
- `targetType` (string): 'video', 'course', 'classroom', etc.
- `targetId` (int): Resource ID
- `contentType` (string, optional): Filter by content type
- `callback` (function): Callback with result

**Returns**:
```json
{
  "success": true,
  "contents": [
    {
      "id": 123,
      "contentType": "video_description",
      "generatedContent": "This video teaches...",
      "status": "approved",
      "model": "gpt-4",
      "createdAt": "2024-01-15T10:00:00Z",
      "approvedAt": "2024-01-15T10:05:00Z"
    }
  ]
}
```

**Implementation Notes**:
- Query `ai_generated_content` table
- Filter by `target_type` and `target_id`
- Optionally filter by `content_type`
- Return all matching records

---

### **3. LLM API Usage Tracking**

#### `getLLMUsageStats(token, startDate, endDate, callback)`
**Purpose**: Get LLM API usage statistics
**Parameters**:
- `token` (string): User authentication token
- `startDate` (string, optional): Start date (ISO format)
- `endDate` (string, optional): End date (ISO format)
- `callback` (function): Callback with result

**Returns**:
```json
{
  "success": true,
  "stats": {
    "totalCalls": 150,
    "totalTokens": 45000,
    "totalCost": 12.50,
    "byModel": {
      "gpt-4": {"calls": 100, "tokens": 30000, "cost": 10.00},
      "gpt-3.5-turbo": {"calls": 50, "tokens": 15000, "cost": 2.50}
    },
    "byEndpoint": {
      "chat": {"calls": 120, "tokens": 36000},
      "completion": {"calls": 30, "tokens": 9000}
    },
    "averageResponseTime": 1250,
    "errorRate": 0.02
  },
  "period": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  }
}
```

**Implementation Notes**:
- Query `llm_api_usage` table
- Aggregate by model, endpoint, date range
- Calculate totals, averages, error rates
- Filter by user_id if not admin

---

#### `getLLMUsageHistory(token, limit, offset, callback)`
**Purpose**: Get detailed LLM API usage history
**Parameters**:
- `token` (string): User authentication token
- `limit` (int, optional): Number of records (default: 50)
- `offset` (int, optional): Pagination offset (default: 0)
- `callback` (function): Callback with result

**Returns**:
```json
{
  "success": true,
  "history": [
    {
      "id": 1,
      "apiProvider": "openai",
      "model": "gpt-4",
      "endpoint": "chat",
      "promptTokens": 100,
      "completionTokens": 50,
      "totalTokens": 150,
      "cost": 0.002,
      "responseTime": 1200,
      "status": "success",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

**Implementation Notes**:
- Query `llm_api_usage` table
- Order by `created_at DESC`
- Paginate results
- Filter by user_id if not admin

---

## 📚 **PHASE 2: Learning & Recommendations (Medium Priority)**

### **4. AI Conversations (Tutor/Chatbot)**

#### `startAIConversation(token, conversationType, contextType, contextId, callback)`
**Purpose**: Start a new AI conversation (tutor, chatbot, etc.)
**Parameters**:
- `token` (string): User authentication token
- `conversationType` (string): 'tutor', 'chatbot', 'qa', 'content_help'
- `contextType` (string, optional): 'course', 'video', 'classroom', 'general'
- `contextId` (int, optional): Context resource ID
- `callback` (function): Callback with result

**Returns**:
```json
{
  "success": true,
  "conversationId": 123,
  "conversationType": "tutor",
  "contextType": "course",
  "contextId": 456,
  "initialMessage": "Hello! I'm your AI tutor. How can I help you with this course?",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

**Implementation Notes**:
- Create new record in `ai_conversations` table
- Initialize `messages` JSON array with system message
- Set conversation metadata
- Return conversation ID for subsequent messages

---

#### `sendAIConversationMessage(token, conversationId, message, callback)`
**Purpose**: Send a message in an AI conversation
**Parameters**:
- `token` (string): User authentication token
- `conversationId` (int): Conversation ID
- `message` (string): User's message
- `callback` (function): Callback with result

**Returns**:
```json
{
  "success": true,
  "conversationId": 123,
  "userMessage": {
    "role": "user",
    "content": "What is ASL?",
    "timestamp": "2024-01-15T10:05:00Z"
  },
  "aiResponse": {
    "role": "assistant",
    "content": "ASL stands for American Sign Language...",
    "timestamp": "2024-01-15T10:05:02Z"
  },
  "tokensUsed": 150,
  "cost": 0.002
}
```

**Implementation Notes**:
- Get conversation from `ai_conversations` table
- Add user message to `messages` JSON array
- Call LLM API with conversation history
- Add AI response to `messages` array
- Update `updated_at` timestamp
- Log API usage in `llm_api_usage`
- Return both messages

---

#### `getAIConversations(token, conversationType, limit, offset, callback)`
**Purpose**: Get user's AI conversations
**Parameters**:
- `token` (string): User authentication token
- `conversationType` (string, optional): Filter by type
- `limit` (int, optional): Number of conversations (default: 20)
- `offset` (int, optional): Pagination offset (default: 0)
- `callback` (function): Callback with result

**Returns**:
```json
{
  "success": true,
  "conversations": [
    {
      "id": 123,
      "conversationType": "tutor",
      "contextType": "course",
      "contextId": 456,
      "title": "ASL Basics Course Help",
      "summary": "Discussed basic greetings and introductions",
      "messageCount": 10,
      "lastMessageAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 5,
  "limit": 20,
  "offset": 0
}
```

**Implementation Notes**:
- Query `ai_conversations` table filtered by `user_id`
- Optionally filter by `conversation_type`
- Return conversation metadata (not full messages)
- Include message count and last message timestamp

---

#### `getAIConversationMessages(token, conversationId, callback)`
**Purpose**: Get all messages in a conversation
**Parameters**:
- `token` (string): User authentication token
- `conversationId` (int): Conversation ID
- `callback` (function): Callback with result

**Returns**:
```json
{
  "success": true,
  "conversationId": 123,
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful ASL tutor...",
      "timestamp": "2024-01-15T10:00:00Z"
    },
    {
      "role": "user",
      "content": "What is ASL?",
      "timestamp": "2024-01-15T10:05:00Z"
    },
    {
      "role": "assistant",
      "content": "ASL stands for...",
      "timestamp": "2024-01-15T10:05:02Z"
    }
  ]
}
```

**Implementation Notes**:
- Get conversation from `ai_conversations` table
- Verify user owns the conversation
- Return `messages` JSON array

---

#### `deleteAIConversation(token, conversationId, callback)`
**Purpose**: Delete an AI conversation
**Parameters**:
- `token` (string): User authentication token
- `conversationId` (int): Conversation ID
- `callback` (function): Callback with result

**Returns**:
```json
{
  "success": true,
  "conversationId": 123,
  "deleted": true
}
```

**Implementation Notes**:
- Verify user owns the conversation
- Delete from `ai_conversations` table

---

### **5. Recommendations**

#### `generateRecommendations(token, recommendationType, limit, callback)`
**Purpose**: Generate personalized content recommendations
**Parameters**:
- `token` (string): User authentication token
- `recommendationType` (string): 'video', 'course', 'classroom', 'model', 'collaborator'
- `limit` (int, optional): Number of recommendations (default: 10)
- `callback` (function): Callback with result

**Returns**:
```json
{
  "success": true,
  "recommendations": [
    {
      "id": 1,
      "recommendationId": 123,
      "recommendationType": "video",
      "recommendedId": 456,
      "recommendationReason": "Based on your interest in basic ASL, you might enjoy this video on greetings",
      "confidenceScore": 0.85,
      "ranking": 1,
      "metadata": {
        "basedOn": "viewing_history",
        "similarityScore": 0.82
      }
    }
  ],
  "generatedAt": "2024-01-15T10:00:00Z"
}
```

**Implementation Notes**:
- Analyze user's viewing history, course progress, preferences
- Use LLM to generate personalized recommendations with explanations
- Store in `ai_recommendations` table
- Use ML/AI algorithms or LLM to score and rank recommendations
- Consider user's learning goals, interests, skill level

---

#### `getRecommendations(token, recommendationType, limit, callback)`
**Purpose**: Get stored recommendations for user
**Parameters**:
- `token` (string): User authentication token
- `recommendationType` (string, optional): Filter by type
- `limit` (int, optional): Number to return (default: 10)
- `callback` (function): Callback with result

**Returns**:
```json
{
  "success": true,
  "recommendations": [
    {
      "id": 1,
      "recommendationType": "video",
      "recommendedId": 456,
      "recommendationReason": "Based on your interest...",
      "confidenceScore": 0.85,
      "ranking": 1,
      "shownAt": "2024-01-15T10:00:00Z",
      "clickedAt": null,
      "dismissedAt": null
    }
  ]
}
```

**Implementation Notes**:
- Query `ai_recommendations` table
- Filter by `user_id` and optionally `recommendation_type`
- Filter out dismissed recommendations
- Order by `ranking` and `created_at DESC`

---

#### `trackRecommendationInteraction(token, recommendationId, action, callback)`
**Purpose**: Track user interaction with recommendation (click, dismiss)
**Parameters**:
- `token` (string): User authentication token
- `recommendationId` (int): Recommendation ID
- `action` (string): 'shown', 'clicked', 'dismissed'
- `callback` (function): Callback with result

**Returns**:
```json
{
  "success": true,
  "recommendationId": 1,
  "action": "clicked",
  "timestamp": "2024-01-15T10:05:00Z"
}
```

**Implementation Notes**:
- Update `ai_recommendations` table
- Set `shown_at`, `clicked_at`, or `dismissed_at` based on action
- Used for improving recommendation algorithms

---

### **6. Learning Insights**

#### `generateLearningInsights(token, callback)`
**Purpose**: Generate AI-powered learning insights for user
**Parameters**:
- `token` (string): User authentication token
- `callback` (function): Callback with result

**Returns**:
```json
{
  "success": true,
  "insights": [
    {
      "id": 1,
      "insightType": "strength",
      "category": "gestures",
      "insightText": "You're excelling at basic greetings! You've completed 90% of greeting-related content.",
      "confidenceScore": 0.92,
      "supportingData": {
        "coursesCompleted": 3,
        "videosWatched": 15,
        "completionRate": 0.90
      },
      "actionableItems": [
        {
          "action": "Try advanced greeting variations",
          "priority": "medium"
        }
      ]
    },
    {
      "id": 2,
      "insightType": "recommendation",
      "category": "vocabulary",
      "insightText": "Focus on numbers next - you've completed greetings but haven't started numbers yet.",
      "confidenceScore": 0.85,
      "actionableItems": [
        {
          "action": "Start 'ASL Numbers' course",
          "priority": "high"
        }
      ]
    }
  ],
  "generatedAt": "2024-01-15T10:00:00Z"
}
```

**Implementation Notes**:
- Analyze user's learning data (course progress, video views, model training, etc.)
- Use LLM to generate personalized insights
- Store in `ai_learning_insights` table
- Identify strengths, weaknesses, patterns, recommendations
- Generate actionable next steps

---

#### `getLearningInsights(token, unacknowledgedOnly, limit, callback)`
**Purpose**: Get learning insights for user
**Parameters**:
- `token` (string): User authentication token
- `unacknowledgedOnly` (bool, optional): Only return unacknowledged insights (default: false)
- `limit` (int, optional): Number to return (default: 10)
- `callback` (function): Callback with result

**Returns**:
```json
{
  "success": true,
  "insights": [
    {
      "id": 1,
      "insightType": "strength",
      "category": "gestures",
      "insightText": "You're excelling at basic greetings!",
      "confidenceScore": 0.92,
      "shownAt": "2024-01-15T10:00:00Z",
      "acknowledgedAt": null
    }
  ]
}
```

**Implementation Notes**:
- Query `ai_learning_insights` table
- Filter by `user_id`
- Optionally filter by `acknowledged_at IS NULL`
- Order by `created_at DESC`

---

#### `acknowledgeLearningInsight(token, insightId, callback)`
**Purpose**: Mark learning insight as acknowledged
**Parameters**:
- `token` (string): User authentication token
- `insightId` (int): Learning insight ID
- `callback` (function): Callback with result

**Returns**:
```json
{
  "success": true,
  "insightId": 1,
  "acknowledgedAt": "2024-01-15T10:05:00Z"
}
```

**Implementation Notes**:
- Update `ai_learning_insights.acknowledged_at = NOW()`
- Verify user owns the insight

---

## ⚙️ **PHASE 3: User Preferences & Feedback (Lower Priority)**

### **7. User AI Preferences**

#### `getUserAIPreferences(token, callback)`
**Purpose**: Get user's AI feature preferences
**Parameters**:
- `token` (string): User authentication token
- `callback` (function): Callback with result

**Returns**:
```json
{
  "success": true,
  "preferences": {
    "aiDescriptionsEnabled": true,
    "aiSummariesEnabled": true,
    "aiSubtitlesEnabled": true,
    "aiRecommendationsEnabled": true,
    "aiTutorEnabled": true,
    "aiSearchEnabled": true,
    "aiContentGenerationEnabled": true,
    "aiAssistanceLevel": "moderate",
    "customSettings": {
      "autoApproveDescriptions": false,
      "reviewBeforePublish": true
    },
    "shareDataForImprovement": false
  }
}
```

**Implementation Notes**:
- Query `user_ai_preferences` table
- If no record exists, return defaults
- Return all preference flags and settings

---

#### `updateUserAIPreferences(token, preferences, callback)`
**Purpose**: Update user's AI feature preferences
**Parameters**:
- `token` (string): User authentication token
- `preferences` (dict): Preference updates
- `callback` (function): Callback with result

**Returns**:
```json
{
  "success": true,
  "preferences": {
    "aiDescriptionsEnabled": false,
    "aiSummariesEnabled": true,
    ...
  },
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

**Implementation Notes**:
- Update or insert into `user_ai_preferences` table
- Validate preference values
- Update `updated_at` timestamp

---

### **8. Feedback System**

#### `submitAIFeedback(token, contentId, feedbackType, rating, feedbackText, correctedContent, callback)`
**Purpose**: Submit feedback on AI-generated content
**Parameters**:
- `token` (string): User authentication token
- `contentId` (int): AI generated content ID
- `feedbackType` (string): 'thumbs_up', 'thumbs_down', 'helpful', 'not_helpful', 'correction', 'suggestion'
- `rating` (int, optional): Rating 1-5
- `feedbackText` (string, optional): Written feedback
- `correctedContent` (string, optional): Corrected version if providing correction
- `callback` (function): Callback with result

**Returns**:
```json
{
  "success": true,
  "feedbackId": 1,
  "contentId": 123,
  "feedbackType": "thumbs_up",
  "rating": 5,
  "createdAt": "2024-01-15T10:00:00Z"
}
```

**Implementation Notes**:
- Insert into `ai_feedback` table
- Link to `ai_generated_content` via `content_id`
- Store feedback type, rating, text, and corrections
- Used for improving AI outputs

---

#### `getAIFeedback(token, contentId, callback)`
**Purpose**: Get feedback for AI-generated content
**Parameters**:
- `token` (string): User authentication token
- `contentId` (int): AI generated content ID
- `callback` (function): Callback with result

**Returns**:
```json
{
  "success": true,
  "feedback": [
    {
      "id": 1,
      "feedbackType": "thumbs_up",
      "rating": 5,
      "feedbackText": "Great description!",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**Implementation Notes**:
- Query `ai_feedback` table
- Filter by `content_id`
- Return all feedback for the content

---

## 🔍 **PHASE 4: Advanced Features (Future)**

### **9. Semantic Search**

#### `semanticSearch(token, query, contentTypes, limit, callback)`
**Purpose**: Perform semantic search using embeddings
**Parameters**:
- `token` (string): User authentication token
- `query` (string): Search query
- `contentTypes` (list, optional): Filter by types ['video', 'course', 'classroom']
- `limit` (int, optional): Number of results (default: 20)
- `callback` (function): Callback with result

**Returns**:
```json
{
  "success": true,
  "results": [
    {
      "contentType": "video",
      "contentId": 123,
      "title": "Introduction to ASL",
      "relevanceScore": 0.92,
      "matchReason": "This video matches because it covers basic ASL greetings"
    }
  ],
  "query": "videos about basic greetings"
}
```

**Implementation Notes**:
- Generate embedding for search query using LLM
- Compare with stored embeddings in `content_embeddings` table
- Use vector similarity search
- Return ranked results with relevance scores

---

### **10. Content Summarization**

#### `summarizeContent(token, contentType, contentId, options, callback)`
**Purpose**: Generate summary of content (video, course, etc.)
**Parameters**:
- `token` (string): User authentication token
- `contentType` (string): 'video', 'course', 'classroom'
- `contentId` (int): Content ID
- `options` (dict, optional):
  - `length` (string): 'short', 'medium', 'long' (default: 'medium')
  - `includeKeyPoints` (bool): Include bullet points (default: true)
- `callback` (function): Callback with result

**Returns**:
```json
{
  "success": true,
  "contentId": 123,
  "summary": "This video teaches basic ASL greetings...",
  "keyPoints": [
    "Covers hello, goodbye, and thank you",
    "Includes cultural context",
    "Duration: 10 minutes"
  ],
  "model": "gpt-4",
  "tokensUsed": 200
}
```

**Implementation Notes**:
- Get content details (transcript, description, etc.)
- Use LLM to generate summary
- Store in `ai_generated_content` with `content_type = 'summary'`
- Return summary and key points

---

## 📋 **Implementation Priority**

### **Phase 1: Core (Start Here)**
1. ✅ `generateVideoDescription`
2. ✅ `generateVideoSummary`
3. ✅ `approveAIGeneratedContent`
4. ✅ `getAIGeneratedContent`
5. ✅ `getLLMUsageStats`

### **Phase 2: Enhanced Features**
6. ✅ `startAIConversation`
7. ✅ `sendAIConversationMessage`
8. ✅ `generateRecommendations`
9. ✅ `generateLearningInsights`

### **Phase 3: User Control**
10. ✅ `getUserAIPreferences`
11. ✅ `updateUserAIPreferences`
12. ✅ `submitAIFeedback`

### **Phase 4: Advanced**
13. ✅ `semanticSearch`
14. ✅ `summarizeContent`

---

## 🔧 **Technical Requirements**

### **LLM API Integration**
- Support multiple providers: OpenAI, Anthropic, Google, Azure
- Implement retry logic for API failures
- Handle rate limiting
- Implement cost tracking
- Support streaming responses (for conversations)

### **Database Operations**
- All functions interact with LLM-related tables
- Use transactions for multi-step operations
- Implement proper error handling
- Log all API calls for auditing

### **Error Handling**
- Return consistent error format:
```json
{
  "success": false,
  "error": {
    "code": "LLM_API_ERROR",
    "message": "Failed to generate description",
    "details": "..."
  }
}
```

### **Security**
- Verify user authentication on all functions
- Check user permissions (e.g., can they modify this content?)
- Validate input parameters
- Sanitize user inputs before sending to LLM
- Implement rate limiting per user

### **Performance**
- Cache frequently accessed data
- Batch API calls when possible
- Use async processing for long-running operations
- Implement request queuing for high-volume scenarios

---

## 📊 **Database Tables Reference**

### **Tables Used**
- `ai_generated_content` - Stores all AI-generated content
- `llm_api_usage` - Tracks API calls and costs
- `user_ai_preferences` - User AI settings
- `ai_conversations` - Chat/conversation history
- `ai_recommendations` - Personalized recommendations
- `ai_feedback` - User feedback on AI outputs
- `ai_learning_insights` - Learning analytics
- `video_recording` - Videos (modified with AI columns)
- `folder` - Courses/folders (modified with AI columns)
- `user` - Users (modified with AI flag)

### **Key Relationships**
- `ai_generated_content.target_id` → `video_recording.id` or `folder.id`
- `ai_conversations.user_id` → `user.id`
- `ai_recommendations.user_id` → `user.id`
- `ai_feedback.content_id` → `ai_generated_content.id`

---

## 🧪 **Testing Requirements**

For each function, test:
1. ✅ Successful execution with valid inputs
2. ✅ Error handling (invalid token, missing parameters)
3. ✅ Permission checks (user can only access their own data)
4. ✅ Database transaction integrity
5. ✅ LLM API error handling
6. ✅ Rate limiting behavior
7. ✅ Cost tracking accuracy

---

## 📝 **Notes for Developer**

1. **LLM API Keys**: Store securely in environment variables
2. **Cost Management**: Implement daily/monthly cost limits per user
3. **Caching**: Cache LLM responses when appropriate (e.g., same video description)
4. **Queue System**: Consider using a job queue for expensive operations
5. **Monitoring**: Log all LLM API calls for debugging and cost analysis
6. **Fallbacks**: Have fallback models if primary LLM API fails
7. **Privacy**: Ensure user data sent to LLM APIs is handled according to privacy policy

---

**Status**: ✅ Specification Complete
**Next Steps**: Implement Phase 1 functions, test with frontend, iterate

