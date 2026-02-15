import React, { useState, useEffect } from "react";
import { Select, Spin, Tooltip } from "antd";
import { GlobalOutlined } from "@ant-design/icons";
import { useLanguage } from "../../contexts/LanguageContext";
import useLanguages from "../../hooks/useLanguages";
import { useTranslation } from "react-i18next";
import "./LanguageSelector.css";

const { Option } = Select;

/**
 * LanguageSelector Component
 * Displays a dropdown for selecting the application language
 */
const LanguageSelector = ({ 
  size = "default", 
  showLabel = false,
  placement = "bottomRight",
  style = {},
  className = "",
}) => {
  const { selectedLanguage, changeLanguage, languages: contextLanguages, setLanguages } = useLanguage();
  const { languages: apiLanguages, loading } = useLanguages();
  const [localLanguages, setLocalLanguages] = useState([]);
  const { t } = useTranslation();

  // Update local languages when API languages are loaded
  useEffect(() => {
    if (apiLanguages && apiLanguages.length > 0) {
      setLocalLanguages(apiLanguages);
      // Also update context languages
      if (setLanguages) {
        setLanguages(apiLanguages);
      }
    } else if (contextLanguages && contextLanguages.length > 0) {
      setLocalLanguages(contextLanguages);
    }
  }, [apiLanguages, contextLanguages, setLanguages]);

  /**
   * Handle language selection change
   * @param {string} value - Selected language code
   */
  const handleLanguageChange = (value) => {
    changeLanguage(value);
  };

  /**
   * Get flag emoji for language code
   * @param {string} code - Language code
   * @returns {string} Flag emoji or language code
   */
  const getLanguageFlag = (code) => {
    const flagMap = {
      en: "🇺🇸",
      es: "🇪🇸",
      fr: "🇫🇷",
      de: "🇩🇪",
      it: "🇮🇹",
      pt: "🇵🇹",
      zh: "🇨🇳",
      ja: "🇯🇵",
      ko: "🇰🇷",
      ar: "🇸🇦",
      ru: "🇷🇺",
      hi: "🇮🇳",
      nl: "🇳🇱",
      sv: "🇸🇪",
      pl: "🇵🇱",
      tr: "🇹🇷",
    };
    return flagMap[code] || "🌐";
  };

  /**
   * Format language display text
   * @param {Object} lang - Language object
   * @returns {string} Formatted display text
   */
  const formatLanguageDisplay = (lang) => {
    if (lang.nativeName && lang.nativeName !== lang.name) {
      return `${lang.nativeName} (${lang.name})`;
    }
    return lang.nativeName || lang.name || lang.code;
  };

  const displayLanguages = localLanguages.length > 0 ? localLanguages : [
    { code: "en", name: "English", nativeName: "English" },
  ];

  return (
    <div 
      className={`language-selector ${className}`}
      style={{ display: "inline-flex", alignItems: "center", gap: "8px", ...style }}
    >
      {showLabel && (
        <span 
          style={{ 
            fontSize: "14px", 
            color: "var(--color-neutral-700)",
            fontWeight: 500
          }}
        >
          {t("header.language")}:
        </span>
      )}
      <Tooltip title={t("header.selectLanguage")} placement={placement}>
        <Select
          value={selectedLanguage}
          onChange={handleLanguageChange}
          loading={loading}
          size={size}
          style={{
            minWidth: showLabel ? "200px" : "140px",
            ...style,
          }}
          suffixIcon={<GlobalOutlined />}
          className="language-select"
          aria-label={t("header.selectLanguage")}
          popupMatchSelectWidth={false}
          dropdownStyle={{ minWidth: "250px" }}
          notFoundContent={loading ? <Spin size="small" /> : "No languages found"}
        >
          {displayLanguages.map((lang) => (
            <Option 
              key={lang.code} 
              value={lang.code}
              title={formatLanguageDisplay(lang)}
            >
              <div 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px",
                  padding: "4px 0"
                }}
              >
                <span style={{ fontSize: "18px" }}>{getLanguageFlag(lang.code)}</span>
                <span style={{ flex: 1 }}>{formatLanguageDisplay(lang)}</span>
                {selectedLanguage === lang.code && (
                  <span style={{ color: "var(--color-primary)", fontSize: "12px" }}>✓</span>
                )}
              </div>
            </Option>
          ))}
        </Select>
      </Tooltip>
    </div>
  );
};

export default LanguageSelector;

