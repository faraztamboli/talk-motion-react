/**
 * Tests for AIContentGenerator component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect } from '@testing-library/jest-dom';
import AIContentGenerator from '../../components/ui/AIContentGenerator';

// Mock useLLM hook
vi.mock('../../hooks/useLLM', () => ({
  default: () => ({
    generateVideoDescription: vi.fn(() => Promise.resolve({
      success: true,
      contentId: 123,
      generatedDescription: 'AI generated description',
      model: 'gpt-4',
      tokensUsed: 150,
    })),
    approveAIGeneratedContent: vi.fn(() => Promise.resolve({
      success: true,
      contentId: 123,
      status: 'approved',
    })),
    rejectAIGeneratedContent: vi.fn(() => Promise.resolve({
      success: true,
      contentId: 123,
      status: 'rejected',
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

describe('AIContentGenerator', () => {
  const defaultProps = {
    targetType: 'video',
    targetId: 1,
    contentType: 'description',
    existingContent: '',
  };

  it('should render with correct title', () => {
    render(<AIContentGenerator {...defaultProps} />);
    expect(screen.getByText(/AI Description Generator/i)).toBeInTheDocument();
  });

  it('should show generate button initially', () => {
    render(<AIContentGenerator {...defaultProps} />);
    expect(screen.getByText(/Generate AI Description/i)).toBeInTheDocument();
  });

  it('should show existing content if provided', () => {
    render(
      <AIContentGenerator
        {...defaultProps}
        existingContent="Existing description"
      />
    );
    expect(screen.getByText(/Existing Content/i)).toBeInTheDocument();
    expect(screen.getByText(/Existing description/i)).toBeInTheDocument();
  });

  it('should handle generate button click', async () => {
    const { generateVideoDescription } = require('../../hooks/useLLM').default();
    
    render(<AIContentGenerator {...defaultProps} />);
    
    const generateButton = screen.getByText(/Generate AI Description/i);
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(generateVideoDescription).toHaveBeenCalledWith(1, expect.any(Object));
    });
  });

  it('should show approve and reject buttons after generation', async () => {
    render(<AIContentGenerator {...defaultProps} />);
    
    const generateButton = screen.getByText(/Generate AI Description/i);
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/Approve & Save/i)).toBeInTheDocument();
      expect(screen.getByText(/Reject/i)).toBeInTheDocument();
    });
  });

  it('should call onContentApproved when approved', async () => {
    const onContentApproved = vi.fn();
    
    render(
      <AIContentGenerator
        {...defaultProps}
        onContentApproved={onContentApproved}
      />
    );
    
    const generateButton = screen.getByText(/Generate AI Description/i);
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/Approve & Save/i)).toBeInTheDocument();
    });

    const approveButton = screen.getByText(/Approve & Save/i);
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(onContentApproved).toHaveBeenCalled();
    });
  });

  it('should be accessible with keyboard navigation', () => {
    render(<AIContentGenerator {...defaultProps} />);
    
    const generateButton = screen.getByText(/Generate AI Description/i);
    expect(generateButton).toHaveAttribute('aria-label');
    
    // Test keyboard interaction
    fireEvent.keyDown(generateButton, { key: 'Enter' });
    // Should trigger the same action as click
  });
});

