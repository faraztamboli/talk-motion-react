/**
 * Tests for useLLM hook
 * 
 * Note: These tests require the backend API to be available.
 * For unit testing without backend, mock JS2Py.PythonFunctions.TalkMotionServer
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useLLM from '../../hooks/useLLM';

// Mock JS2Py
vi.mock('../../remotepyjs', () => ({
  default: {
    PythonFunctions: {
      TalkMotionServer: {
        generateVideoDescription: vi.fn(),
        generateVideoSummary: vi.fn(),
        generateCourseDescription: vi.fn(),
        generateCourseOutline: vi.fn(),
        approveAIGeneratedContent: vi.fn(),
        rejectAIGeneratedContent: vi.fn(),
        getAIGeneratedContent: vi.fn(),
        getLLMUsageStats: vi.fn(),
        getLLMUsageHistory: vi.fn(),
        startAIConversation: vi.fn(),
        sendAIConversationMessage: vi.fn(),
        getAIConversations: vi.fn(),
        getAIConversationMessages: vi.fn(),
        deleteAIConversation: vi.fn(),
        generateRecommendations: vi.fn(),
        getRecommendations: vi.fn(),
        trackRecommendationInteraction: vi.fn(),
        generateLearningInsights: vi.fn(),
        getLearningInsights: vi.fn(),
        acknowledgeLearningInsight: vi.fn(),
        getUserAIPreferences: vi.fn(),
        updateUserAIPreferences: vi.fn(),
        submitAIFeedback: vi.fn(),
        getAIFeedback: vi.fn(),
        summarizeContent: vi.fn(),
      },
    },
  },
}));

// Mock useLocalStorage
vi.mock('../../hooks/useLocalStorage', () => ({
  default: vi.fn(() => ['mock-token']),
}));

describe('useLLM', () => {
  let hook;

  beforeEach(() => {
    vi.clearAllMocks();
    hook = renderHook(() => useLLM());
  });

  describe('Content Generation', () => {
    it('should generate video description', async () => {
      const mockResponse = {
        success: true,
        contentId: 123,
        generatedDescription: 'Test description',
        model: 'gpt-4',
        tokensUsed: 150,
        cost: 0.002,
      };

      const { generateVideoDescription } = hook.result.current;
      
      // Mock the callback
      const mockCallback = vi.fn((callback) => {
        callback(mockResponse);
      });
      
      vi.mocked(require('../../remotepyjs').default.PythonFunctions.TalkMotionServer.generateVideoDescription)
        .mockImplementation(mockCallback);

      const result = await generateVideoDescription(1, { model: 'gpt-4' });
      
      expect(result).toEqual(mockResponse);
      expect(result.success).toBe(true);
    });

    it('should handle errors in video description generation', async () => {
      const mockError = {
        success: false,
        error: { message: 'API Error' },
      };

      const { generateVideoDescription } = hook.result.current;
      
      const mockCallback = vi.fn((callback) => {
        callback(mockError);
      });
      
      vi.mocked(require('../../remotepyjs').default.PythonFunctions.TalkMotionServer.generateVideoDescription)
        .mockImplementation(mockCallback);

      await expect(generateVideoDescription(1)).rejects.toEqual(
        expect.objectContaining({ message: 'API Error' })
      );
    });
  });

  describe('Content Approval', () => {
    it('should approve AI generated content', async () => {
      const mockResponse = {
        success: true,
        contentId: 123,
        status: 'approved',
      };

      const { approveAIGeneratedContent } = hook.result.current;
      
      const mockCallback = vi.fn((callback) => {
        callback(mockResponse);
      });
      
      vi.mocked(require('../../remotepyjs').default.PythonFunctions.TalkMotionServer.approveAIGeneratedContent)
        .mockImplementation(mockCallback);

      const result = await approveAIGeneratedContent(123);
      
      expect(result.success).toBe(true);
      expect(result.status).toBe('approved');
    });
  });

  describe('Conversations', () => {
    it('should start AI conversation', async () => {
      const mockResponse = {
        success: true,
        conversationId: 456,
        conversationType: 'tutor',
        initialMessage: 'Hello! How can I help?',
      };

      const { startAIConversation } = hook.result.current;
      
      const mockCallback = vi.fn((callback) => {
        callback(mockResponse);
      });
      
      vi.mocked(require('../../remotepyjs').default.PythonFunctions.TalkMotionServer.startAIConversation)
        .mockImplementation(mockCallback);

      const result = await startAIConversation('tutor', 'course', 1);
      
      expect(result.success).toBe(true);
      expect(result.conversationId).toBe(456);
    });
  });

  describe('Recommendations', () => {
    it('should get recommendations', async () => {
      const mockResponse = {
        success: true,
        recommendations: [
          {
            id: 1,
            recommendationType: 'video',
            recommendedId: 789,
            recommendationReason: 'Based on your interests',
            confidenceScore: 0.85,
          },
        ],
      };

      const { getRecommendations } = hook.result.current;
      
      const mockCallback = vi.fn((callback) => {
        callback(mockResponse);
      });
      
      vi.mocked(require('../../remotepyjs').default.PythonFunctions.TalkMotionServer.getRecommendations)
        .mockImplementation(mockCallback);

      const result = await getRecommendations('video', 10);
      
      expect(result.success).toBe(true);
      expect(result.recommendations).toHaveLength(1);
    });
  });

  describe('Preferences', () => {
    it('should get user AI preferences', async () => {
      const mockResponse = {
        success: true,
        preferences: {
          aiDescriptionsEnabled: true,
          aiSummariesEnabled: true,
          aiAssistanceLevel: 'moderate',
        },
      };

      const { getUserAIPreferences } = hook.result.current;
      
      const mockCallback = vi.fn((callback) => {
        callback(mockResponse);
      });
      
      vi.mocked(require('../../remotepyjs').default.PythonFunctions.TalkMotionServer.getUserAIPreferences)
        .mockImplementation(mockCallback);

      const result = await getUserAIPreferences();
      
      expect(result.success).toBe(true);
      expect(result.preferences.aiDescriptionsEnabled).toBe(true);
    });
  });
});

