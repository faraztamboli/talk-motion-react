/**
 * Accessibility Utilities
 * Helper functions for improving accessibility
 */

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive'
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement);
    }
  }, 1000);
};

/**
 * Trap focus within an element (for modals)
 * @param {HTMLElement} element - Element to trap focus in
 * @param {HTMLElement} previousFocus - Element to return focus to
 */
export const trapFocus = (element, previousFocus = null) => {
  const focusableElements = element.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  const handleTabKey = (e) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };
  
  element.addEventListener('keydown', handleTabKey);
  firstElement?.focus();
  
  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleTabKey);
    previousFocus?.focus();
  };
};

/**
 * Skip to main content
 */
export const skipToContent = () => {
  const mainContent = document.getElementById('main-content') || 
                      document.querySelector('main') ||
                      document.querySelector('[role="main"]');
  
  if (mainContent) {
    mainContent.setAttribute('tabindex', '-1');
    mainContent.focus();
    mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Check if user prefers high contrast
 */
export const prefersHighContrast = () => {
  return window.matchMedia('(prefers-contrast: high)').matches;
};

/**
 * Check if user prefers dark mode
 */
export const prefersDarkMode = () => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

/**
 * Handle keyboard events for buttons/clickable elements
 * @param {Function} handler - Click handler
 * @param {KeyboardEvent} event - Keyboard event
 */
export const handleKeyboardClick = (handler, event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    handler(event);
  }
};

/**
 * Get accessible name for an element
 * @param {HTMLElement} element - Element to get name for
 */
export const getAccessibleName = (element) => {
  // Try aria-label first
  if (element.getAttribute('aria-label')) {
    return element.getAttribute('aria-label');
  }
  
  // Try aria-labelledby
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelElement = document.getElementById(labelledBy);
    if (labelElement) {
      return labelElement.textContent;
    }
  }
  
  // Try associated label
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) {
      return label.textContent;
    }
  }
  
  // Try text content
  if (element.textContent) {
    return element.textContent.trim();
  }
  
  // Try alt text for images
  if (element.tagName === 'IMG' && element.alt) {
    return element.alt;
  }
  
  return '';
};

/**
 * Check color contrast ratio
 * @param {string} color1 - First color (hex)
 * @param {string} color2 - Second color (hex)
 */
export const getContrastRatio = (color1, color2) => {
  const getLuminance = (hex) => {
    const rgb = hexToRgb(hex);
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
      val = val / 255;
      return val <= 0.03928 
        ? val / 12.92 
        : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };
  
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Check if contrast meets WCAG standards
 * @param {string} foreground - Foreground color
 * @param {string} background - Background color
 * @param {string} level - 'AA' or 'AAA'
 * @param {boolean} largeText - Is text large (18px+ or 14px+ bold)
 */
export const meetsContrastStandard = (foreground, background, level = 'AA', largeText = false) => {
  const ratio = getContrastRatio(foreground, background);
  
  if (largeText) {
    return level === 'AA' ? ratio >= 3 : ratio >= 4.5;
  }
  
  return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
};

