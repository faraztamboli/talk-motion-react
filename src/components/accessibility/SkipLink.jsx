import React from 'react';
import { Link } from 'react-router-dom';
import { skipToContent } from '../../utils/accessibility';

/**
 * Skip Navigation Link
 * Allows keyboard users to skip to main content
 */
const SkipLink = () => {
  const handleClick = (e) => {
    e.preventDefault();
    skipToContent();
  };

  return (
    <Link
      to="#main-content"
      onClick={handleClick}
      className="skip-link"
      style={{
        position: 'absolute',
        top: '-40px',
        left: '0',
        background: 'var(--color-primary)',
        color: '#ffffff',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        zIndex: 1000,
        textDecoration: 'none',
        borderRadius: '0 0 var(--radius-md) var(--radius-md)',
        fontWeight: 600,
        fontSize: 'var(--font-size-base)',
        transition: 'top var(--transition-base)',
      }}
      onFocus={(e) => {
        e.currentTarget.style.top = '0';
      }}
      onBlur={(e) => {
        e.currentTarget.style.top = '-40px';
      }}
      aria-label="Skip to main content"
    >
      Skip to main content
    </Link>
  );
};

export default SkipLink;

