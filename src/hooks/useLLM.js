import JS2Py from "../remotepyjs";
import useLocalStorage from "./useLocalStorage";

function useLLM() {
  const [token] = useLocalStorage("token");

  // ============================================================================
  // CONTENT GENERATION
  // ============================================================================

  function generateVideoDescription(videoId, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.generateVideoDescription(
          token,
          videoId,
          options,
          function (res) {
            if (res && res.success) {
              resolve(res);
            } else {
              reject(res?.error || { message: "Failed to generate description" });
            }
          }
        );
      } catch (err) {
        console.error("Error generating video description:", err);
        reject(err);
      }
    });
  }

  function generateVideoSummary(videoId, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.generateVideoSummary(
          token,
          videoId,
          options,
          function (res) {
            if (res && res.success) {
              resolve(res);
            } else {
              reject(res?.error || { message: "Failed to generate summary" });
            }
          }
        );
      } catch (err) {
        console.error("Error generating video summary:", err);
        reject(err);
      }
    });
  }

  function generateCourseDescription(folderId, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.generateCourseDescription(
          token,
          folderId,
          options,
          function (res) {
            if (res && res.success) {
              resolve(res);
            } else {
              reject(res?.error || { message: "Failed to generate course description" });
            }
          }
        );
      } catch (err) {
        console.error("Error generating course description:", err);
        reject(err);
      }
    });
  }

  function generateCourseOutline(folderId, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.generateCourseOutline(
          token,
          folderId,
          options,
          function (res) {
            if (res && res.success) {
              resolve(res);
            } else {
              reject(res?.error || { message: "Failed to generate course outline" });
            }
          }
        );
      } catch (err) {
        console.error("Error generating course outline:", err);
        reject(err);
      }
    });
  }

  function enhanceSubtitles(videoId, subtitleId = null, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.enhanceSubtitles(
          token,
          videoId,
          subtitleId,
          options,
          function (res) {
            if (res && res.success) {
              resolve(res);
            } else {
              reject(res?.error || { message: "Failed to enhance subtitles" });
            }
          }
        );
      } catch (err) {
        console.error("Error enhancing subtitles:", err);
        reject(err);
      }
    });
  }

  // ============================================================================
  // CONTENT APPROVAL & MANAGEMENT
  // ============================================================================

  function approveAIGeneratedContent(contentId) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.approveAIGeneratedContent(
          token,
          contentId,
          function (res) {
            if (res && res.success) {
              resolve(res);
            } else {
              reject(res?.error || { message: "Failed to approve content" });
            }
          }
        );
      } catch (err) {
        console.error("Error approving AI content:", err);
        reject(err);
      }
    });
  }

  function rejectAIGeneratedContent(contentId, reason = "") {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.rejectAIGeneratedContent(
          token,
          contentId,
          reason,
          function (res) {
            if (res && res.success) {
              resolve(res);
            } else {
              reject(res?.error || { message: "Failed to reject content" });
            }
          }
        );
      } catch (err) {
        console.error("Error rejecting AI content:", err);
        reject(err);
      }
    });
  }

  function getAIGeneratedContent(targetType, targetId, contentType = null) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getAIGeneratedContent(
          token,
          targetType,
          targetId,
          contentType,
          function (res) {
            if (res && res.success) {
              resolve(res);
            } else {
              reject(res?.error || { message: "Failed to get AI content" });
            }
          }
        );
      } catch (err) {
        console.error("Error getting AI content:", err);
        reject(err);
      }
    });
  }

  // ============================================================================
  // LLM API USAGE TRACKING
  // ============================================================================

  function getLLMUsageStats(startDate = null, endDate = null) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getLLMUsageStats(
          token,
          startDate,
          endDate,
          function (res) {
            if (res && res.success) {
              resolve(res);
            } else {
              reject(res?.error || { message: "Failed to get usage stats" });
            }
          }
        );
      } catch (err) {
        console.error("Error getting LLM usage stats:", err);
        reject(err);
      }
    });
  }

  function getLLMUsageHistory(limit = 50, offset = 0) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getLLMUsageHistory(
          token,
          limit,
          offset,
          function (res) {
            if (res && res.success) {
              resolve(res);
            } else {
              reject(res?.error || { message: "Failed to get usage history" });
            }
          }
        );
      } catch (err) {
        console.error("Error getting LLM usage history:", err);
        reject(err);
      }
    });
  }

  // ============================================================================
  // AI CONVERSATIONS
  // ============================================================================

  function startAIConversation(conversationType, contextType = null, contextId = null) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.startAIConversation(
          token,
          conversationType,
          contextType,
          contextId,
          function (res) {
            if (res && res.success) {
              resolve(res);
            } else {
              reject(res?.error || { message: "Failed to start conversation" });
            }
          }
        );
      } catch (err) {
        console.error("Error starting AI conversation:", err);
        reject(err);
      }
    });
  }

  function sendAIConversationMessage(conversationId, message) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.sendAIConversationMessage(
          token,
          conversationId,
          message,
          function (res) {
            if (res && res.success) {
              resolve(res);
            } else {
              reject(res?.error || { message: "Failed to send message" });
            }
          }
        );
      } catch (err) {
        console.error("Error sending AI message:", err);
        reject(err);
      }
    });
  }

  function getAIConversations(conversationType = null, limit = 20, offset = 0) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getAIConversations(
          token,
          conversationType,
          limit,
          offset,
          function (res) {
            if (res && res.success) {
              resolve(res);
            } else {
              reject(res?.error || { message: "Failed to get conversations" });
            }
          }
        );
      } catch (err) {
        console.error("Error getting AI conversations:", err);
        reject(err);
      }
    });
  }

  function getAIConversationMessages(conversationId) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getAIConversationMessages(
          token,
          conversationId,
          function (res) {
            if (res && res.success) {
              resolve(res);
            } else {
              reject(res?.error || { message: "Failed to get conversation messages" });
            }
          }
        );
      } catch (err) {
        console.error("Error getting conversation messages:", err);
        reject(err);
      }
    });
  }

  function deleteAIConversation(conversationId) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.deleteAIConversation(
          token,
          conversationId,
          function (res) {
            if (res && res.success) {
              resolve(res);
            } else {
              reject(res?.error || { message: "Failed to delete conversation" });
            }
          }
        );
      } catch (err) {
        console.error("Error deleting AI conversation:", err);
        reject(err);
      }
    });
  }

  // ============================================================================
  // RECOMMENDATIONS
  // ============================================================================

  function generateRecommendations(recommendationType, limit = 10) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.generateRecommendations(
          token,
          recommendationType,
          limit,
          function (res) {
            if (res && res.success) {
              resolve(res);
            } else {
              reject(res?.error || { message: "Failed to generate recommendations" });
            }
          }
        );
      } catch (err) {
        console.error("Error generating recommendations:", err);
        reject(err);
      }
    });
  }

  function getRecommendations(recommendationType = null, limit = 10) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getRecommendations(
          token,
          recommendationType,
          limit,
          function (res) {
            if (res && res.success) {
              resolve(res);
            } else {
              reject(res?.error || { message: "Failed to get recommendations" });
            }
          }
        );
      } catch (err) {
        console.error("Error getting recommendations:", err);
        reject(err);
      }
    });
  }

  function trackRecommendationInteraction(recommendationId, action) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.trackRecommendationInteraction(
          token,
          recommendationId,
          action,
          function (res) {
            if (res && res.success) {
              resolve(res);
            } else {
              reject(res?.error || { message: "Failed to track interaction" });
            }
          }
        );
      } catch (err) {
        console.error("Error tracking recommendation interaction:", err);
        reject(err);
      }
    });
  }

  // ============================================================================
  // LEARNING INSIGHTS
  // ============================================================================

  function generateLearningInsights() {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.generateLearningInsights(
          token,
          function (res) {
            if (res && res.success) {
              resolve(res);
            } else {
              reject(res?.error || { message: "Failed to generate learning insights" });
            }
          }
        );
      } catch (err) {
        console.error("Error generating learning insights:", err);
        reject(err);
      }
    });
  }

  function getLearningInsights(unacknowledgedOnly = false, limit = 10) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getLearningInsights(
          token,
          unacknowledgedOnly,
          limit,
          function (res) {
            if (res && res.success) {
              resolve(res);
            } else {
              reject(res?.error || { message: "Failed to get learning insights" });
            }
          }
        );
      } catch (err) {
        console.error("Error getting learning insights:", err);
        reject(err);
      }
    });
  }

  function acknowledgeLearningInsight(insightId) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.acknowledgeLearningInsight(
          token,
          insightId,
          function (res) {
            if (res && res.success) {
              resolve(res);
            } else {
              reject(res?.error || { message: "Failed to acknowledge insight" });
            }
          }
        );
      } catch (err) {
        console.error("Error acknowledging learning insight:", err);
        reject(err);
      }
    });
  }

  // ============================================================================
  // USER PREFERENCES
  // ============================================================================

  function getUserAIPreferences() {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getUserAIPreferences(
          token,
          function (res) {
            if (res && res.success) {
              resolve(res);
            } else {
              reject(res?.error || { message: "Failed to get AI preferences" });
            }
          }
        );
      } catch (err) {
        console.error("Error getting AI preferences:", err);
        reject(err);
      }
    });
  }

  function updateUserAIPreferences(preferences) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.updateUserAIPreferences(
          token,
          preferences,
          function (res) {
            if (res && res.success) {
              resolve(res);
            } else {
              reject(res?.error || { message: "Failed to update AI preferences" });
            }
          }
        );
      } catch (err) {
        console.error("Error updating AI preferences:", err);
        reject(err);
      }
    });
  }

  // ============================================================================
  // FEEDBACK
  // ============================================================================

  function submitAIFeedback(contentId, feedbackType, rating = null, feedbackText = "", correctedContent = "") {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.submitAIFeedback(
          token,
          contentId,
          feedbackType,
          rating,
          feedbackText,
          correctedContent,
          function (res) {
            if (res && res.success) {
              resolve(res);
            } else {
              reject(res?.error || { message: "Failed to submit feedback" });
            }
          }
        );
      } catch (err) {
        console.error("Error submitting AI feedback:", err);
        reject(err);
      }
    });
  }

  function getAIFeedback(contentId) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getAIFeedback(
          token,
          contentId,
          function (res) {
            if (res && res.success) {
              resolve(res);
            } else {
              reject(res?.error || { message: "Failed to get feedback" });
            }
          }
        );
      } catch (err) {
        console.error("Error getting AI feedback:", err);
        reject(err);
      }
    });
  }

  // ============================================================================
  // CONTENT SUMMARIZATION
  // ============================================================================

  function summarizeContent(contentType, contentId, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.summarizeContent(
          token,
          contentType,
          contentId,
          options,
          function (res) {
            if (res && res.success) {
              resolve(res);
            } else {
              reject(res?.error || { message: "Failed to summarize content" });
            }
          }
        );
      } catch (err) {
        console.error("Error summarizing content:", err);
        reject(err);
      }
    });
  }

  return {
    // Content Generation
    generateVideoDescription,
    generateVideoSummary,
    generateCourseDescription,
    generateCourseOutline,
    enhanceSubtitles,
    // Content Management
    approveAIGeneratedContent,
    rejectAIGeneratedContent,
    getAIGeneratedContent,
    // Usage Tracking
    getLLMUsageStats,
    getLLMUsageHistory,
    // Conversations
    startAIConversation,
    sendAIConversationMessage,
    getAIConversations,
    getAIConversationMessages,
    deleteAIConversation,
    // Recommendations
    generateRecommendations,
    getRecommendations,
    trackRecommendationInteraction,
    // Learning Insights
    generateLearningInsights,
    getLearningInsights,
    acknowledgeLearningInsight,
    // Preferences
    getUserAIPreferences,
    updateUserAIPreferences,
    // Feedback
    submitAIFeedback,
    getAIFeedback,
    // Summarization
    summarizeContent,
  };
}

export default useLLM;

