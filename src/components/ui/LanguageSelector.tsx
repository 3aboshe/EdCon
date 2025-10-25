import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  isRTL: boolean;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', isRTL: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', isRTL: true },
  { code: 'ku-sorani', name: 'Kurdish (Sorani)', nativeName: 'کوردی (سۆرانی)', flag: '🏴', isRTL: true },
  { code: 'ku-badini', name: 'Kurdish (Bahdini)', nativeName: 'کوردی (بادینی)', flag: '🏴', isRTL: true },
  { code: 'syr', name: 'Modern Assyrian', nativeName: 'ܐܬܘܪܝܐ ܚܕܬܐ', flag: '🏴', isRTL: true }
];

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>(languages[0]);

  useEffect(() => {
    const savedLanguage = languages.find(lang => lang.code === i18n.language);
    if (savedLanguage) {
      setCurrentLanguage(savedLanguage);
    }
  }, [i18n.language]);

  const handleLanguageChange = (language: Language) => {
    i18n.changeLanguage(language.code);
    setCurrentLanguage(language);
    setIsOpen(false);
    
    // Update document direction for RTL languages
    document.documentElement.dir = language.isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language.code;
    
    // Store preference in localStorage
    localStorage.setItem('language', language.code);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 bg-white shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-sm font-medium text-gray-700">
          {currentLanguage.nativeName}
        </span>
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className={`text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-1 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language)}
                className={`flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                  currentLanguage.code === language.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
                role="menuitem"
              >
                <span className="text-lg mr-3">{language.flag}</span>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{language.nativeName}</span>
                  <span className="text-xs text-gray-500">{language.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;