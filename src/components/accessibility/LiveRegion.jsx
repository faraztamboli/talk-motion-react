import React from 'react';

/**
 * Live Region Component
 * Announces dynamic content updates to screen readers
 */
const LiveRegion = ({ 
  children, 
  priority = 'polite', // 'polite' | 'assertive'
  atomic = true 
}) => {
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic={atomic}
      className="sr-only"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        borderWidth: 0,
      }}
    >
      {children}
    </div>
  );
};

export default LiveRegion;

