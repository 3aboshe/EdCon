
import React, { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AppContext, SessionPayload } from '../contexts/AppContext';
import apiService from '../services/apiService';
import { APP_NAME } from '../constants';
import Header from '../components/ui/Header';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import EdConLogo from '../assets/EdCon_Logo.png';
import Modal from '../components/ui/Modal';
import { mapApiUserToClient } from '../lib/userAdapter';

const LoginScreen: React.FC = () => {
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetError, setResetError] = useState('');
    const [isResetting, setIsResetting] = useState(false);
    const [pendingSession, setPendingSession] = useState<SessionPayload | null>(null);
    const [temporaryPassword, setTemporaryPassword] = useState('');
    const { login } = useContext(AppContext);
    const { t } = useTranslation();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!code.trim() || !password.trim()) {
            setError(t('login_error_missing_fields'));
            return;
        }

        setIsSubmitting(true);
        try {
            const response: any = await apiService.login(code.trim(), password);
            const apiUser = response?.user;
            const token = response?.token;
            const requiresPasswordReset = Boolean(response?.requiresPasswordReset);
            const school = response?.school || response?.data?.school || null;

            if (!apiUser || !token) {
                setError(t('login_error_invalid_credentials'));
                return;
            }

            if ((apiUser.role || '').toString().toLowerCase() === 'student') {
                setError(t('login_error_students_blocked'));
                return;
            }

            const normalizedUser = mapApiUserToClient(apiUser);
            const resolvedSchool = school || normalizedUser.school || null;
            const sessionPayload: SessionPayload = {
                user: { ...normalizedUser, requiresPasswordReset, school: resolvedSchool },
                token,
                school: resolvedSchool,
            };

            if (requiresPasswordReset) {
                setPendingSession(sessionPayload);
                setTemporaryPassword(password);
                setShowResetModal(true);
                return;
            }

            login(sessionPayload);
        } catch (err) {
            console.error('Login failed', err);
            setError(t('login_error_invalid_credentials'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!pendingSession) return;

        if (newPassword.length < 8) {
            setResetError(t('password_reset_min_length'));
            return;
        }

        if (newPassword !== confirmPassword) {
            setResetError(t('password_reset_mismatch'));
            return;
        }

        setResetError('');
        setIsResetting(true);
        try {
            await apiService.resetPassword(temporaryPassword, newPassword);
            const updatedUser = { ...pendingSession.user, requiresPasswordReset: false };
            login({ ...pendingSession, user: updatedUser });
            setShowResetModal(false);
            setNewPassword('');
            setConfirmPassword('');
            setPendingSession(null);
            setTemporaryPassword('');
        } catch (error) {
            console.error('Password reset failed', error);
            setResetError(t('password_reset_error'));
        } finally {
            setIsResetting(false);
        }
    };

    return (
          <div className="min-h-screen flex flex-col bg-slate-50">
              <Header onLogout={() => {}} showLanguageSelector={false} />
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

                            <div className="mb-6">
                                <label htmlFor="user-password" className="block text-sm font-medium text-slate-600 mb-2">{t('password')}</label>
                                <input
                                    type="password"
                                    id="user-password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError('');
                                    }}
                                    placeholder={t('password_placeholder')}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition transform hover:scale-105 disabled:opacity-60"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? t('login_loading') : t('login')}
                            </button>
                        </form>
                    </div>
                    <p className="text-center text-xs text-slate-400 mt-6">{`© ${new Date().getFullYear()} ${APP_NAME}`}</p>
                </div>
            </main>

            <Modal
                isOpen={showResetModal}
                onClose={() => {
                    if (isResetting) return;
                    setShowResetModal(false);
                }}
                title={t('password_reset_title')}
            >
                <p className="text-sm text-slate-600 mb-4">{t('password_reset_description')}</p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2" htmlFor="new-password">{t('new_password')}</label>
                        <input
                            id="new-password"
                            type="password"
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2" htmlFor="confirm-password">{t('confirm_password')}</label>
                        <input
                            id="confirm-password"
                            type="password"
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                    {resetError && <p className="text-red-500 text-xs">{resetError}</p>}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            className="flex-1 bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                            onClick={handlePasswordReset}
                            disabled={isResetting}
                        >
                            {isResetting ? t('password_reset_loading') : t('password_reset_submit')}
                        </button>
                        <button
                            type="button"
                            className="flex-1 bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg hover:bg-slate-300 disabled:opacity-60"
                            onClick={() => setShowResetModal(false)}
                            disabled={isResetting}
                        >
                            {t('password_reset_cancel')}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default LoginScreen;