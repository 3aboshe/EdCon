
import React, { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../contexts/AppContext';
import apiService from '../services/apiService';
import { APP_NAME } from '../constants';
import Header from '../components/ui/Header';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import EdConLogo from '../assets/EdCon_Logo.png';

const LoginScreen: React.FC = () => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AppContext);
    const { t } = useTranslation();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await apiService.login(code);
            if (response.success && response.user) {
                login(response.user);
            } else {
                setError('Invalid code. Please try again.');
            }
        } catch (err) {
            setError('Invalid code. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
           <Header />
            <main className="flex-grow flex items-center justify-center p-4">
                <div className="w-full max-w-sm">
                    <div className="text-center mb-8">
                         <img src={EdConLogo} alt="EdCona Logo" className="w-48 h-48 mx-auto mb-4 object-contain" />
                        <h1 className="text-3xl font-bold text-slate-800">{t('login_welcome')}</h1>
                        <p className="text-slate-500">{t('login_subtitle')}</p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-lg">
                         <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-600 mb-2">{t('select_language')}</label>
                            <LanguageSwitcher theme="light" />
                        </div>
                        <form onSubmit={handleLogin}>
                            <div className="mb-6">
                                <label htmlFor="user-code" className="block text-sm font-medium text-slate-600 mb-2">{t('user_code')}</label>
                                <input
                                    type="text"
                                    id="user-code"
                                    value={code}
                                    onChange={(e) => {
                                        setCode(e.target.value);
                                        setError('');
                                    }}
                                    placeholder={t('user_code_placeholder')}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                />
                                {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition transform hover:scale-105"
                            >
                                {t('login')}
                            </button>
                        </form>
                    </div>
                    <p className="text-center text-xs text-slate-400 mt-6">{`© ${new Date().getFullYear()} ${APP_NAME}`}</p>
                </div>
            </main>
        </div>
    );
};

export default LoginScreen;