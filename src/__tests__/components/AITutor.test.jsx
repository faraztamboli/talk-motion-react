/**
 * Tests for AITutor component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AITutor from '../../components/ui/AITutor';

// Mock useLLM hook
vi.mock('../../hooks/useLLM', () => ({
  default: () => ({
    startAIConversation: vi.fn(() => Promise.resolve({
      success: true,
      conversationId: 123,
      initialMessage: 'Hello! How can I help?',
    })),
    sendAIConversationMessage: vi.fn(() => Promise.resolve({
      success: true,
      userMessage: {
        role: 'user',
        content: 'Test question',
        timestamp: new Date().toISOString(),
      },
      aiResponse: {
        role: 'assistant',
        content: 'Test answer',
        timestamp: new Date().toISOString(),
      },
    })),
    deleteAIConversation: vi.fn(() => Promise.resolve({
      success: true,
    })),
  }),
}));

// Mock useMessageApi
vi.mock('../../hooks/useMessageApi', () => ({
  default: () => ({
    contextHolder: <div data-testid="message-context" />,
    showMessage: vi.fn(),
  }),
}));

describe('AITutor', () => {
  const defaultProps = {
    conversationType: 'tutor',
    title: 'AI Tutor',
  };

  it('should render with correct title', async () => {
    render(<AITutor {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText(/AI Tutor/i)).toBeInTheDocument();
    });
  });

  it('should initialize conversation on mount', async () => {
    const { startAIConversation } = require('../../hooks/useLLM').default();
    
    render(<AITutor {...defaultProps} />);
    
    await waitFor(() => {
      expect(startAIConversation).toHaveBeenCalled();
    });
  });

  it('should display initial message', async () => {
    render(<AITutor {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Hello! How can I help?/i)).toBeInTheDocument();
    });
  });

  it('should send message when user types and clicks send', async () => {
    const { sendAIConversationMessage } = require('../../hooks/useLLM').default();
    
    render(<AITutor {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Ask a question/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/Ask a question/i);
    const sendButton = screen.getByText(/Send/i);

    fireEvent.change(input, { target: { value: 'Test question' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(sendAIConversationMessage).toHaveBeenCalledWith(123, 'Test question');
    });
  });

  it('should send message on Enter key press', async () => {
    const { sendAIConversationMessage } = require('../../hooks/useLLM').default();
    
    render(<AITutor {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Ask a question/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/Ask a question/i);
    
    fireEvent.change(input, { target: { value: 'Test question' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(sendAIConversationMessage).toHaveBeenCalled();
    });
  });

  it('should display user and AI messages', async () => {
    render(<AITutor {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Ask a question/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/Ask a question/i);
    const sendButton = screen.getByText(/Send/i);

    fireEvent.change(input, { target: { value: 'Test question' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/Test question/i)).toBeInTheDocument();
      expect(screen.getByText(/Test answer/i)).toBeInTheDocument();
    });
  });

  it('should be accessible', async () => {
    render(<AITutor {...defaultProps} />);
    
    await waitFor(() => {
      const input = screen.getByPlaceholderText(/Ask a question/i);
      expect(input).toHaveAttribute('aria-label');
      
      const sendButton = screen.getByText(/Send/i);
      expect(sendButton).toHaveAttribute('aria-label');
    });
  });
});

