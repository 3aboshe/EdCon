import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../i18n';
import styles from './LanguageSelector.module.css';

interface LanguageSelectorProps {
    variant?: 'dropdown' | 'inline';
}

export function LanguageSelector({ variant = 'dropdown' }: LanguageSelectorProps) {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === i18n.language) || SUPPORTED_LANGUAGES[0];

    const handleLanguageChange = (langCode: string) => {
        i18n.changeLanguage(langCode);
        setIsOpen(false);
    };

    if (variant === 'inline') {
        return (
            <div className={styles.inlineWrapper}>
                {SUPPORTED_LANGUAGES.map(lang => (
                    <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`${styles.inlineButton} ${lang.code === i18n.language ? styles.active : ''}`}
                    >
                        {lang.nativeName}
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            <button
                className={styles.trigger}
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <Globe size={18} />
                <span>{currentLang.nativeName}</span>
                <svg
                    className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                >
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
            </button>

            {isOpen && (
                <>
                    <div className={styles.overlay} onClick={() => setIsOpen(false)} />
                    <ul className={styles.menu} role="listbox">
                        {SUPPORTED_LANGUAGES.map(lang => (
                            <li key={lang.code}>
                                <button
                                    className={`${styles.menuItem} ${lang.code === i18n.language ? styles.selected : ''}`}
                                    onClick={() => handleLanguageChange(lang.code)}
                                    role="option"
                                    aria-selected={lang.code === i18n.language}
                                >
                                    <span className={styles.nativeName}>{lang.nativeName}</span>
                                    <span className={styles.englishName}>{lang.name}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}

export default LanguageSelector;
