/**
 * Simple date formatting utilities
 * Since date-fns is not installed, we use native JavaScript Date methods
 */

export function formatDistanceToNow(date, options = {}) {
  if (!date) return "Unknown";
  
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return date;
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - dateObj) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);

    if (diffInSeconds < 60) {
      return options.addSuffix ? "just now" : "less than a minute ago";
    } else if (diffInMinutes < 60) {
      const text = diffInMinutes === 1 ? "minute" : "minutes";
      return options.addSuffix 
        ? `${diffInMinutes} ${text} ago`
        : `${diffInMinutes} ${text}`;
    } else if (diffInHours < 24) {
      const text = diffInHours === 1 ? "hour" : "hours";
      return options.addSuffix 
        ? `${diffInHours} ${text} ago`
        : `${diffInHours} ${text}`;
    } else if (diffInDays < 7) {
      const text = diffInDays === 1 ? "day" : "days";
      return options.addSuffix 
        ? `${diffInDays} ${text} ago`
        : `${diffInDays} ${text}`;
    } else if (diffInWeeks < 4) {
      const text = diffInWeeks === 1 ? "week" : "weeks";
      return options.addSuffix 
        ? `${diffInWeeks} ${text} ago`
        : `${diffInWeeks} ${text}`;
    } else if (diffInMonths < 12) {
      const text = diffInMonths === 1 ? "month" : "months";
      return options.addSuffix 
        ? `${diffInMonths} ${text} ago`
        : `${diffInMonths} ${text}`;
    } else {
      const text = diffInYears === 1 ? "year" : "years";
      return options.addSuffix 
        ? `${diffInYears} ${text} ago`
        : `${diffInYears} ${text}`;
    }
  } catch (err) {
    console.error("Error formatting date:", err);
    return date;
  }
}

export function formatDate(date, format = "short") {
  if (!date) return "Unknown";
  
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return date;
    
    if (format === "short") {
      return dateObj.toLocaleDateString();
    } else if (format === "long") {
      return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } else if (format === "datetime") {
      return dateObj.toLocaleString();
    }
    
    return dateObj.toLocaleDateString();
  } catch (err) {
    console.error("Error formatting date:", err);
    return date;
  }
}

