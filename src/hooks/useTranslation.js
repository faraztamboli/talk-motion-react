import { useTranslation as useI18nTranslation } from 'react-i18next';

/**
 * Custom hook that wraps react-i18next's useTranslation
 * Provides easy access to translation function and language info
 * @returns {Object} Translation utilities
 */
export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();
  
  return {
    t, // Translation function
    i18n, // i18n instance
    currentLanguage: i18n.language,
    changeLanguage: i18n.changeLanguage.bind(i18n),
  };
};

export default useTranslation;

