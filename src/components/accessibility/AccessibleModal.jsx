import React, { useEffect, useRef } from 'react';
import { Modal } from 'antd';
import { trapFocus, announceToScreenReader } from '../../utils/accessibility';

/**
 * Accessible Modal Component
 * Wraps Ant Design Modal with focus trap and screen reader announcements
 */
const AccessibleModal = ({
  open,
  onClose,
  title,
  children,
  okText,
  cancelText,
  onOk,
  onCancel,
  destroyOnClose = true,
  ...props
}) => {
  const previousFocusRef = useRef(null);
  const cleanupRef = useRef(null);

  // Store previous focus when modal opens
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement;
      
      // Announce modal opening to screen readers
      if (title) {
        announceToScreenReader(`${title} dialog opened`, 'polite');
      }
    } else {
      // Return focus when modal closes
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    }
  }, [open, title]);

  // Trap focus when modal is open
  useEffect(() => {
    if (open) {
      // Wait for modal to render
      const timer = setTimeout(() => {
        const modalElement = document.querySelector('.ant-modal-content');
        if (modalElement) {
          cleanupRef.current = trapFocus(modalElement, previousFocusRef.current);
        }
      }, 100);

      return () => {
        clearTimeout(timer);
        if (cleanupRef.current) {
          cleanupRef.current();
        }
      };
    }
  }, [open]);

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (onClose) {
      onClose();
    }
  };

  const handleOk = () => {
    if (onOk) {
      onOk();
    }
  };

  return (
    <Modal
      {...props}
      open={open}
      title={title}
      okText={okText}
      cancelText={cancelText}
      onCancel={handleCancel}
      onOk={handleOk}
      destroyOnClose={destroyOnClose}
      aria-labelledby={title ? "modal-title" : undefined}
      aria-describedby="modal-description"
    >
      {title && (
        <h2 id="modal-title" className="sr-only">
          {title}
        </h2>
      )}
      <div id="modal-description" className="sr-only">
        {title ? `${title} dialog` : 'Dialog'}
      </div>
      {children}
    </Modal>
  );
};

export default AccessibleModal;

