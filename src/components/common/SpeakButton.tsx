
import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../App';

interface SpeakButtonProps {
    textToSpeak: string;
}

const SpeakButton: React.FC<SpeakButtonProps> = ({ textToSpeak }) => {
    const { t, lang } = useContext(AppContext);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    // Load available voices when component mounts and on voiceschanged event
    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            if (availableVoices.length > 0) {
                setVoices(availableVoices);
            }
        };

        loadVoices(); // Initial attempt
        window.speechSynthesis.onvoiceschanged = loadVoices;

        // Cleanup function
        return () => {
            window.speechSynthesis.onvoiceschanged = null;
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const findVoice = (languageCode: string): SpeechSynthesisVoice | null => {
        if (voices.length === 0) return null;
        
        // Prioritize voices that match the language code exactly or the language prefix.
        const exactMatch = voices.find(voice => voice.lang === languageCode);
        if (exactMatch) return exactMatch;

        const langPrefix = languageCode.split('-')[0];
        const prefixMatch = voices.find(voice => voice.lang.startsWith(`${langPrefix}-`));
        if (prefixMatch) return prefixMatch;
        
        const langOnlyMatch = voices.find(voice => voice.lang === langPrefix);
        if (langOnlyMatch) return langOnlyMatch;

        return null;
    };

    const handleSpeak = () => {
        if (!('speechSynthesis' in window)) {
            alert(t('speech_not_supported'));
            return;
        }

        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        const voiceForLang = findVoice(lang);

        if (!voiceForLang) {
            const languagesMap: Record<string, string> = {
                 'en': 'english',
                 'ku-sorani': 'kurdish_sorani',
                 'ku-badini': 'kurdish_bahdini',
                 'ar': 'arabic',
                 'syr': 'modern_assyrian'
            };
            const languageName = t(languagesMap[lang] || lang);
            alert(t('voice_not_available').replace('{language}', languageName));
            return;
        }

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.voice = voiceForLang;
        utterance.lang = voiceForLang.lang;
        utterance.rate = 0.95; // A comfortable speaking rate

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (e) => {
            console.error("Speech synthesis error:", e.error);
            setIsSpeaking(false);
        };
        
        window.speechSynthesis.speak(utterance);
    };

    return (
        <button
            onClick={handleSpeak}
            title={t('speak')}
            className={`p-2 rounded-full transition-colors duration-200 ${isSpeaking ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-blue-100'}`}
        >
            <i className={`fas ${isSpeaking ? 'fa-stop-circle' : 'fa-volume-up'}`}></i>
        </button>
    );
};

export default SpeakButton;