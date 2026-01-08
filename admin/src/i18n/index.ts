import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// RTL languages
export const RTL_LANGUAGES = ['ar', 'ckb', 'bhn'];

// All supported languages
export const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
    { code: 'ckb', name: 'Kurdish (Sorani)', nativeName: 'کوردی سۆرانی', dir: 'rtl' },
    { code: 'bhn', name: 'Kurdish (Bahdini)', nativeName: 'کوردی بادینی', dir: 'rtl' },
    { code: 'arc', name: 'Assyrian', nativeName: 'ܐܬܘܪܝܐ', dir: 'ltr' },
];

export const isRTL = (lang: string): boolean => RTL_LANGUAGES.includes(lang);

export const getLanguageDir = (lang: string): 'rtl' | 'ltr' =>
    isRTL(lang) ? 'rtl' : 'ltr';

// Update document direction when language changes
export const updateDocumentDirection = (lang: string) => {
    const dir = getLanguageDir(lang);
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
};

i18n
    .use(HttpBackend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        supportedLngs: SUPPORTED_LANGUAGES.map(l => l.code),
        debug: import.meta.env.DEV,

        interpolation: {
            escapeValue: false, // React already escapes
        },

        backend: {
            loadPath: '/translations/{{lng}}.json',
        },

        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'edcon-lang',
        },
    });

// Set initial direction
i18n.on('initialized', () => {
    updateDocumentDirection(i18n.language);
});

// Update direction on language change
i18n.on('languageChanged', (lng) => {
    updateDocumentDirection(lng);
    localStorage.setItem('edcon-lang', lng);
});

export default i18n;
