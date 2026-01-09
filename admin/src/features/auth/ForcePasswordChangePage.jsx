import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LanguageSelector } from '../../components/ui/LanguageSelector';
import styles from './ForcePasswordChangePage.module.css';

export function ForcePasswordChangePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, resetPassword } = useAuth();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Security check: redirect if user is not authenticated or doesn't require password reset
    if (!user || !user.requiresPasswordReset) {
        // Redirect to appropriate dashboard
        if (user?.role === 'SUPER_ADMIN') {
            navigate('/super-admin', { replace: true });
        } else {
            navigate('/admin', { replace: true });
        }
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!currentPassword.trim()) {
            setError(t('password_reset.current_required'));
            return;
        }

        if (!newPassword.trim()) {
            setError(t('password_reset.new_required'));
            return;
        }

        if (!confirmPassword.trim()) {
            setError(t('password_reset.confirm_required'));
            return;
        }

        if (newPassword.length < 8) {
            setError(t('password_reset.min_length'));
            return;
        }

        if (newPassword !== confirmPassword) {
            setError(t('password_reset.passwords_mismatch'));
            return;
        }

        setIsLoading(true);

        try {
            await resetPassword({
                currentPassword,
                newPassword,
            });

            setSuccess(true);

            // Redirect to dashboard after a short delay
            setTimeout(() => {
                if (user.role === 'SUPER_ADMIN') {
                    navigate('/super-admin');
                } else {
                    navigate('/admin');
                }
            }, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('password_reset.failed'));
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

            {/* Password Change Card */}
            <motion.div
                className={styles.card}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Icon */}
                <div className={styles.iconWrapper}>
                    <img
                        src="/blue_logo_lock.png"
                        alt="EdCona"
                        className={styles.logoImage}
                    />
                </div>

                {success ? (
                    // Success State
                    <motion.div
                        className={styles.successContainer}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <CheckCircle size={64} className={styles.successIcon} />
                        <h2 className={styles.successTitle}>{t('password_reset.success')}</h2>
                        <p className={styles.successMessage}>
                            {t('password_reset.redirecting')}
                        </p>
                    </motion.div>
                ) : (
                    // Form
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.header}>
                            <h2>{t('password_reset.title')}</h2>
                            <p>{t('password_reset.subtitle')}</p>
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
                            type="password"
                            label={t('password_reset.current_password')}
                            placeholder={t('password_reset.current_password')}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            startIcon={<Lock size={18} />}
                            autoComplete="current-password"
                            autoFocus
                        />

                        <Input
                            type="password"
                            label={t('password_reset.new_password')}
                            placeholder={t('password_reset.new_password')}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            startIcon={<Lock size={18} />}
                            autoComplete="new-password"
                        />

                        <Input
                            type="password"
                            label={t('password_reset.confirm_password')}
                            placeholder={t('password_reset.confirm_password')}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            startIcon={<Lock size={18} />}
                            autoComplete="new-password"
                        />

                        <Button
                            type="submit"
                            fullWidth
                            size="lg"
                            isLoading={isLoading}
                        >
                            {isLoading ? <Loader2 className={styles.spinner} /> : null}
                            {t('password_reset.submit')}
                        </Button>
                    </form>
                )}
            </motion.div>
        </div>
    );
}

export default ForcePasswordChangePage;
