import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';
import frTranslations from './locales/fr.json';
import deTranslations from './locales/de.json';
import arTranslations from './locales/ar.json';
import zhTranslations from './locales/zh.json';
import jaTranslations from './locales/ja.json';
import koTranslations from './locales/ko.json';
import ruTranslations from './locales/ru.json';
import hiTranslations from './locales/hi.json';
import trTranslations from './locales/tr.json';
import ptTranslations from './locales/pt.json';
import itTranslations from './locales/it.json';

// Languages that use RTL (Right-to-Left)
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

/**
 * Get text direction for a language
 * @param {string} langCode - Language code
 * @returns {string} 'rtl' or 'ltr'
 */
export const getTextDirection = (langCode) => {
  return RTL_LANGUAGES.includes(langCode) ? 'rtl' : 'ltr';
};

/**
 * Check if a language is RTL
 * @param {string} langCode - Language code
 * @returns {boolean}
 */
export const isRTL = (langCode) => {
  return RTL_LANGUAGES.includes(langCode);
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      es: { translation: esTranslations },
      fr: { translation: frTranslations },
      de: { translation: deTranslations },
      ar: { translation: arTranslations },
      zh: { translation: zhTranslations },
      ja: { translation: jaTranslations },
      ko: { translation: koTranslations },
      ru: { translation: ruTranslations },
      hi: { translation: hiTranslations },
      tr: { translation: trTranslations },
      pt: { translation: ptTranslations },
      it: { translation: itTranslations },
    },
    lng: localStorage.getItem('selectedLanguage') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;

