import React, { useState, useEffect } from "react";
import JS2Py from "../remotepyjs";
import useLocalStorage from "./useLocalStorage";

/**
 * Hook for managing language support functionality
 * Fetches supported languages from the backend API
 */
function useLanguages() {
  const [token] = useLocalStorage("token");
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all supported languages from the backend
   * @returns {Promise<Array>} Promise that resolves with array of language objects
   */
  function getLanguagesSupported() {
    return new Promise((resolve, reject) => {
      setLoading(true);
      setError(null);
      try {
        JS2Py.PythonFunctions.TalkMotionServer.languagesSupported(
          token,
          function (res) {
            setLoading(false);
            if (res && res.constructor === Array) {
              // Normalize language data
              const normalizedLanguages = res.map((lang) => {
                // Handle different possible response formats
                if (typeof lang === "string") {
                  // If it's just a string, create an object
                  return {
                    code: lang,
                    name: getLanguageName(lang),
                    nativeName: getLanguageNativeName(lang),
                  };
                } else if (typeof lang === "object") {
                  // If it's already an object, ensure it has required fields
                  return {
                    code: lang.code || lang.language_code || lang,
                    name: lang.name || getLanguageName(lang.code || lang.language_code || lang),
                    nativeName: lang.nativeName || lang.native_name || getLanguageNativeName(lang.code || lang.language_code || lang),
                  };
                }
                return lang;
              });
              setLanguages(normalizedLanguages);
              resolve(normalizedLanguages);
            } else {
              // If API returns empty or unexpected format, use default languages
              const defaultLanguages = getDefaultLanguages();
              setLanguages(defaultLanguages);
              resolve(defaultLanguages);
            }
          }
        );
      } catch (err) {
        console.error("Error fetching supported languages:", err);
        setLoading(false);
        setError(err);
        // Fallback to default languages on error
        const defaultLanguages = getDefaultLanguages();
        setLanguages(defaultLanguages);
        reject(err);
      }
    });
  }

  /**
   * Get default languages as fallback
   * @returns {Array} Array of default language objects
   */
  function getDefaultLanguages() {
    return [
      { code: "en", name: "English", nativeName: "English" },
      { code: "es", name: "Spanish", nativeName: "Español" },
      { code: "fr", name: "French", nativeName: "Français" },
      { code: "de", name: "German", nativeName: "Deutsch" },
      { code: "it", name: "Italian", nativeName: "Italiano" },
      { code: "pt", name: "Portuguese", nativeName: "Português" },
      { code: "zh", name: "Chinese", nativeName: "中文" },
      { code: "ja", name: "Japanese", nativeName: "日本語" },
      { code: "ko", name: "Korean", nativeName: "한국어" },
      { code: "ar", name: "Arabic", nativeName: "العربية" },
    ];
  }

  /**
   * Get language name from language code
   * @param {string} code - Language code (e.g., "en", "es")
   * @returns {string} Language name
   */
  function getLanguageName(code) {
    const languageNames = {
      en: "English",
      es: "Spanish",
      fr: "French",
      de: "German",
      it: "Italian",
      pt: "Portuguese",
      zh: "Chinese",
      ja: "Japanese",
      ko: "Korean",
      ar: "Arabic",
      ru: "Russian",
      hi: "Hindi",
      nl: "Dutch",
      sv: "Swedish",
      pl: "Polish",
      tr: "Turkish",
    };
    return languageNames[code] || code.toUpperCase();
  }

  /**
   * Get native language name from language code
   * @param {string} code - Language code (e.g., "en", "es")
   * @returns {string} Native language name
   */
  function getLanguageNativeName(code) {
    const nativeNames = {
      en: "English",
      es: "Español",
      fr: "Français",
      de: "Deutsch",
      it: "Italiano",
      pt: "Português",
      zh: "中文",
      ja: "日本語",
      ko: "한국어",
      ar: "العربية",
      ru: "Русский",
      hi: "हिन्दी",
      nl: "Nederlands",
      sv: "Svenska",
      pl: "Polski",
      tr: "Türkçe",
    };
    return nativeNames[code] || code.toUpperCase();
  }

  // Auto-fetch languages on mount if token exists
  useEffect(() => {
    if (token) {
      getLanguagesSupported().catch((err) => {
        console.error("Failed to load languages:", err);
      });
    } else {
      // If no token, use default languages
      setLanguages(getDefaultLanguages());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return {
    languages,
    loading,
    error,
    getLanguagesSupported,
    refreshLanguages: getLanguagesSupported,
  };
}

export default useLanguages;

