import React, { useEffect, useState } from 'react';
import { CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { announceToScreenReader } from '../../utils/accessibility';

/**
 * Visual Notification Component
 * Provides visual feedback for Deaf users (no audio cues)
 */
const VisualNotification = ({
  type = 'info', // 'success' | 'error' | 'warning' | 'info'
  title,
  message,
  duration = 5000,
  onClose,
  position = 'top-right', // 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  showIcon = true,
  closable = true,
}) => {
  const [visible, setVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Announce to screen readers
    const announcement = `${title ? title + '. ' : ''}${message}`;
    announceToScreenReader(announcement, type === 'error' ? 'assertive' : 'polite');

    // Auto-close after duration
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, 300);
  };

  if (!visible) return null;

  const icons = {
    success: <CheckCircleOutlined style={{ color: 'var(--color-success)' }} />,
    error: <CloseCircleOutlined style={{ color: 'var(--color-error)' }} />,
    warning: <ExclamationCircleOutlined style={{ color: 'var(--color-warning)' }} />,
    info: <InfoCircleOutlined style={{ color: 'var(--color-info)' }} />,
  };

  const colors = {
    success: {
      bg: 'var(--color-success-light)',
      border: 'var(--color-success)',
      text: 'var(--color-success)',
    },
    error: {
      bg: 'var(--color-error-light)',
      border: 'var(--color-error)',
      text: 'var(--color-error)',
    },
    warning: {
      bg: 'var(--color-warning-light)',
      border: 'var(--color-warning)',
      text: 'var(--color-warning)',
    },
    info: {
      bg: 'var(--color-info-light)',
      border: 'var(--color-info)',
      text: 'var(--color-info)',
    },
  };

  const positionStyles = {
    'top-right': { top: 'var(--spacing-lg)', right: 'var(--spacing-lg)' },
    'top-left': { top: 'var(--spacing-lg)', left: 'var(--spacing-lg)' },
    'bottom-right': { bottom: 'var(--spacing-lg)', right: 'var(--spacing-lg)' },
    'bottom-left': { bottom: 'var(--spacing-lg)', left: 'var(--spacing-lg)' },
  };

  return (
    <div
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={`visual-notification ${isExiting ? 'exiting' : ''}`}
      style={{
        position: 'fixed',
        ...positionStyles[position],
        zIndex: 1000,
        minWidth: '300px',
        maxWidth: '400px',
        backgroundColor: colors[type].bg,
        border: `2px solid ${colors[type].border}`,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-md)',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--spacing-sm)',
        opacity: isExiting ? 0 : 1,
        transform: isExiting 
          ? `translateX(${position.includes('right') ? '100%' : '-100%'})` 
          : 'translateX(0)',
        transition: 'all var(--transition-base)',
      }}
    >
      {showIcon && (
        <div style={{ fontSize: '24px', flexShrink: 0 }}>
          {icons[type]}
        </div>
      )}
      <div style={{ flex: 1 }}>
        {title && (
          <div
            style={{
              fontWeight: 600,
              fontSize: 'var(--font-size-base)',
              color: colors[type].text,
              marginBottom: '4px',
            }}
          >
            {title}
          </div>
        )}
        <div
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-neutral-700)',
            lineHeight: 'var(--line-height-normal)',
          }}
        >
          {message}
        </div>
      </div>
      {closable && (
        <button
          onClick={handleClose}
          aria-label="Close notification"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: 'var(--color-neutral-600)',
            fontSize: '18px',
            lineHeight: 1,
            flexShrink: 0,
            borderRadius: 'var(--radius-sm)',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
            e.currentTarget.style.color = 'var(--color-neutral-900)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--color-neutral-600)';
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClose();
            }
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default VisualNotification;

