import { useState, useMemo } from 'react';
import { translations } from '../constants';

export const useTranslation = (initialLang: string = 'en') => {
  const [lang, setLang] = useState<string>(initialLang);

  const t = useMemo(() => {
    return (key: string, replacements?: Record<string, string>): string => {
      const langTranslations = translations[lang as keyof typeof translations] || translations.en;
      let translation = langTranslations[key as keyof typeof langTranslations] || key;
      
      if (replacements) {
        Object.entries(replacements).forEach(([placeholder, value]) => {
          translation = translation.replace(new RegExp(`{${placeholder}}`, 'g'), value);
        });
      }
      
      return translation;
    };
  }, [lang]);

  const dir = useMemo(() => {
    return lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  return {
    lang,
    setLang,
    t,
    dir
  };
};
