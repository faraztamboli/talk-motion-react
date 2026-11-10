/**
 * Tests only: a real i18next instance with no translations, so t("key", "Fallback {{n}}", { n })
 * renders "Fallback 3" as in the app (without an instance react-i18next skips interpolation).
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    lng: "en",
    fallbackLng: "en",
    resources: { en: { translation: {} } },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export default i18n;
