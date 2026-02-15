/**
 * Truncates a string to a maximum length, appending ellipsis if truncated
 * @param {string} str - The string to truncate
 * @param {number} maxLength - Maximum length (default: 250 for titles)
 * @returns {string} - Truncated string
 */
const truncateString = (str, maxLength = 250) => {
  if (!str || typeof str !== 'string') {
    return str || '';
  }
  if (str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength - 3) + '...';
};

/**
 * Truncates a description string to YouTube's maximum length (5000 characters)
 * @param {string} str - The description string to truncate
 * @returns {string} - Truncated string (max 5000 chars)
 */
export const truncateDescription = (str, maxLength = 5000) => {
  if (!str || typeof str !== 'string') {
    return str || '';
  }
  if (str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength - 3) + '...';
};

export default truncateString;

