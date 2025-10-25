import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './locales/en/translation.json';
import translationAR from './locales/ar/translation.json';
import translationKU_SORANI from './locales/ku-sorani/translation.json';
import translationKU_BADINI from './locales/ku-badini/translation.json';
import translationSYR from './locales/syr/translation.json';

const resources = {
  en: {
    translation: translationEN
  },
  ar: {
    translation: translationAR
  },
  'ku-sorani': {
    translation: translationKU_SORANI
  },
  'ku-badini': {
    translation: translationKU_BADINI
  },
  syr: {
    translation: translationSYR
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: true,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    // Add RTL language detection and document direction handling
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    }
  });

// Set document direction based on language
const setDocumentDirection = (language: string) => {
  const rtlLanguages = ['ar', 'ku-sorani', 'ku-badini', 'syr'];
  const dir = rtlLanguages.includes(language) ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = language;
};

// Initialize document direction
setDocumentDirection(i18n.language);

// Update document direction when language changes
i18n.on('languageChanged', (lng) => {
  setDocumentDirection(lng);
});

export default i18n;
