import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './languages/en.json';
import fa from './languages/fa.json';

/* ── Keep <html lang> and <html dir> in sync with the active language ──
   fa → dir="rtl", en → dir="ltr". Registered before init so the persisted
   language (localStorage) applies the correct direction on page reload. */
const applyDocumentLanguage = (lng) => {
  const lang = (lng || i18n.resolvedLanguage || 'en').split('-')[0];
  document.documentElement.lang = lang;
  document.documentElement.dir = i18n.dir(lang) === 'rtl' ? 'rtl' : 'ltr';
};

i18n.on('languageChanged', applyDocumentLanguage);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fa: { translation: fa },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'fa'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

/* Ensure direction is applied even if languageChanged already fired during init */
applyDocumentLanguage();

export default i18n;
