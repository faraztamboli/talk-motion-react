/**
 * Color Contrast Checker Utilities
 * Helps ensure WCAG compliance for text contrast
 */

/**
 * Convert hex color to RGB
 */
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

/**
 * Calculate relative luminance
 * Based on WCAG 2.1 formula
 */
const getLuminance = (rgb) => {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
    val = val / 255;
    return val <= 0.03928 
      ? val / 12.92 
      : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Calculate contrast ratio between two colors
 * @param {string} color1 - Hex color (e.g., "#000000")
 * @param {string} color2 - Hex color (e.g., "#ffffff")
 * @returns {number} Contrast ratio
 */
export const getContrastRatio = (color1, color2) => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) {
    console.warn('Invalid color format. Use hex colors (e.g., "#000000")');
    return 0;
  }
  
  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Check if contrast meets WCAG standards
 * @param {string} foreground - Foreground color (hex)
 * @param {string} background - Background color (hex)
 * @param {string} level - 'AA' or 'AAA'
 * @param {boolean} largeText - Is text large (18px+ or 14px+ bold)
 * @returns {boolean} True if meets standard
 */
export const meetsContrastStandard = (foreground, background, level = 'AA', largeText = false) => {
  const ratio = getContrastRatio(foreground, background);
  
  if (largeText) {
    return level === 'AA' ? ratio >= 3 : ratio >= 4.5;
  }
  
  return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
};

/**
 * Get contrast ratio with pass/fail status
 * @param {string} foreground - Foreground color
 * @param {string} background - Background color
 * @param {boolean} largeText - Is text large
 * @returns {object} Contrast information
 */
export const getContrastInfo = (foreground, background, largeText = false) => {
  const ratio = getContrastRatio(foreground, background);
  const passesAA = meetsContrastStandard(foreground, background, 'AA', largeText);
  const passesAAA = meetsContrastStandard(foreground, background, 'AAA', largeText);
  
  return {
    ratio: ratio.toFixed(2),
    passesAA,
    passesAAA,
    level: passesAAA ? 'AAA' : passesAA ? 'AA' : 'Fail',
    largeText
  };
};

/**
 * Common color contrast checks for the app
 */
export const checkAppContrast = () => {
  const checks = [
    {
      name: 'Primary text on white',
      foreground: '#000000',
      background: '#ffffff',
      largeText: false
    },
    {
      name: 'Neutral-600 text on white',
      foreground: '#7a7a7a',
      background: '#ffffff',
      largeText: false
    },
    {
      name: 'Neutral-500 text on white',
      foreground: '#979797',
      background: '#ffffff',
      largeText: false
    },
    {
      name: 'White text on primary',
      foreground: '#ffffff',
      background: '#1677ff',
      largeText: false
    },
  ];
  
  return checks.map(check => ({
    ...check,
    ...getContrastInfo(check.foreground, check.background, check.largeText)
  }));
};

