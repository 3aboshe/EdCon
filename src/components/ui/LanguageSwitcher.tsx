import React, { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';

interface LanguageSwitcherProps {
    theme?: 'dark' | 'light';
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ theme = 'dark' }) => {
    const { lang, setLang, t } = useContext(AppContext);

    const languages = [
        { code: 'en', name: 'english' },
        { code: 'ku-sorani', name: 'kurdish_sorani' },
        { code: 'ku-badini', name: 'kurdish_bahdini' },
        { code: 'ar', name: 'arabic' },
        { code: 'syr', name: 'modern_assyrian' },
    ];

    const themeClasses = {
        dark: 'bg-slate-700 text-white rounded-md p-2',
        light: 'w-full px-4 py-3 border border-slate-300 rounded-lg bg-white text-slate-800'
    };

    return (
        <div className="relative">
            <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className={`${themeClasses[theme]} appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
                aria-label={t('select_language')}
            >
                {languages.map(l => (
                    <option key={l.code} value={l.code}>{t(l.name)}</option>
                ))}
            </select>
        </div>
    );
};

export default LanguageSwitcher;