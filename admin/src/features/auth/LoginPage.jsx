import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LanguageSelector } from '../../components/ui/LanguageSelector';
import styles from './LoginPage.module.css';

export function LoginPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { login } = useAuth();

    const [accessCode, setAccessCode] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!accessCode.trim()) {
            setError(t('login.error_required'));
            return;
        }

        if (!password.trim()) {
            setError(t('login.error_password_required'));
            return;
        }

        setIsLoading(true);

        try {
            const response = await login({ accessCode: accessCode.trim(), password });

            // Check if user needs to reset password
            if (response.user.requiresPasswordReset) {
                navigate('/force-password-change');
            } else {
                if (response.user.role === 'SUPER_ADMIN') {
                    navigate('/super-admin');
                } else {
                    navigate('/admin');
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : t('login.error_invalid'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* Animated Background */}
            <div className={styles.background}>
                <div className={styles.gradientOrb1} />
                <div className={styles.gradientOrb2} />
            </div>

            {/* Language Selector */}
            <div className={styles.languageBar}>
                <LanguageSelector />
            </div>

            {/* Login Card */}
            <motion.div
                className={styles.card}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Logo */}
                <div className={styles.logoWrapper}>
                    <img
                        src="/logoblue.png"
                        alt="EdCona"
                        className={styles.logoImage}
                    />
                    <p className={styles.logoSubtext}>{t('admin.admin_panel')}</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.welcome}>
                        <h2>{t('login.welcome')}</h2>
                        <p>{t('login.subtitle')}</p>
                    </div>

                    {error && (
                        <motion.div
                            className={styles.error}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </motion.div>
                    )}

                    <Input
                        label={t('login.access_code')}
                        placeholder={t('login.access_code_hint')}
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                        startIcon={<KeyRound size={18} />}
                        autoComplete="username"
                        autoFocus
                    />

                    <Input
                        type="password"
                        label={t('login.password')}
                        placeholder={t('login.password_hint')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        startIcon={<Lock size={18} />}
                        autoComplete="current-password"
                    />

                    <Button
                        type="submit"
                        fullWidth
                        size="lg"
                        isLoading={isLoading}
                    >
                        {isLoading ? <Loader2 className={styles.spinner} /> : null}
                        {t('login.login_button')}
                    </Button>
                </form>

                {/* Admin Only Notice */}
                <p className={styles.notice}>
                    <Lock size={14} />
                    {t('admin.admin_panel')}
                </p>
            </motion.div>
        </div>
    );
}

export default LoginPage;
