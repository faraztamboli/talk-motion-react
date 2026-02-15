import React, { createContext, useContext, useState, useEffect } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import i18n, { getTextDirection, isRTL } from "../i18n/config";

const LanguageContext = createContext();

/**
 * Language Context Provider
 * Manages global language state and preferences with i18next integration
 */
export const LanguageProvider = ({ children }) => {
  const [selectedLanguage, setSelectedLanguage] = useLocalStorage("selectedLanguage", "en");
  const [languages, setLanguages] = useState([]);
  const [direction, setDirection] = useState(getTextDirection(selectedLanguage));

  /**
   * Update text direction based on language
   * @param {string} languageCode - Language code
   */
  const updateDirection = React.useCallback((languageCode) => {
    const newDirection = getTextDirection(languageCode);
    setDirection(newDirection);
    
    // Update document direction
    document.documentElement.setAttribute('dir', newDirection);
    document.documentElement.setAttribute('lang', languageCode);
    
    // Update body class for RTL/LTR styling
    document.body.classList.remove('rtl', 'ltr');
    document.body.classList.add(newDirection);
  }, []);

  // Initialize i18n language and direction on mount and when language changes
  useEffect(() => {
    if (i18n.language !== selectedLanguage) {
      i18n.changeLanguage(selectedLanguage);
    }
    updateDirection(selectedLanguage);
  }, [selectedLanguage, updateDirection]);

  /**
   * Update the selected language
   * @param {string} languageCode - Language code to set (e.g., "en", "es")
   */
  const changeLanguage = (languageCode) => {
    setSelectedLanguage(languageCode);
    i18n.changeLanguage(languageCode);
    updateDirection(languageCode);
    
    // Trigger a custom event for components that need to react to language changes
    window.dispatchEvent(new CustomEvent("languageChanged", { 
      detail: { 
        languageCode,
        direction: getTextDirection(languageCode),
        isRTL: isRTL(languageCode)
      } 
    }));
  };

  /**
   * Get the current selected language object
   * @returns {Object} Language object with code, name, and nativeName
   */
  const getCurrentLanguage = () => {
    return languages.find((lang) => lang.code === selectedLanguage) || {
      code: selectedLanguage,
      name: "English",
      nativeName: "English",
    };
  };

  const value = {
    selectedLanguage,
    languages,
    setLanguages,
    changeLanguage,
    getCurrentLanguage,
    direction,
    isRTL: isRTL(selectedLanguage),
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * Hook to use the Language Context
 * @returns {Object} Language context value
 */
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export default LanguageContext;

