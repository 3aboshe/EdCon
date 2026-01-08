import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { History, AlertCircle, Bell } from 'lucide-react';
import { systemService } from '../../services/systemService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import styles from './NotificationsPage.module.css';

export function NotificationsPage() {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [history, setHistory] = useState([]);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        targetRole: 'ALL'
    });

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const data = await systemService.getGlobalHistory();
            setHistory(data);
        } catch (err) {
            console.error('Failed to load notifications history:', err);
        } finally {
            setIsFetching(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.content.trim()) {
            setError(t('super_admin.fill_all_fields'));
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            await systemService.sendGlobalNotification({
                title: formData.title.trim(),
                content: formData.content.trim(),
            });
            setFormData({ title: '', content: '', targetRole: 'ALL' });
            loadNotifications();
        } catch (err) {
            setError(err instanceof Error ? err.message : t('super_admin.notification_failed'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1>{t('super_admin.global_notifications')}</h1>
                    <p>{t('super_admin.global_notifications_subtitle')}</p>
                </div>
            </div>

            <div className={styles.grid}>
                {/* Form Section */}
                <motion.div
                    className={styles.formSection}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <form onSubmit={handleSubmit} className={styles.form}>
                        {error && (
                            <div className={styles.error}>
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        <Input
                            label={t('super_admin.notification_title')}
                            placeholder={t('super_admin.notification_title_placeholder')}
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />

                        <div className={styles.inputGroup}>
                            <label>{t('super_admin.notification_content')}</label>
                            <textarea
                                className={styles.textarea}
                                placeholder={t('super_admin.notification_content_placeholder')}
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>{t('super_admin.target_audience')}</label>
                            <select
                                className={styles.select}
                                value={formData.targetRole}
                                onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                            >
                                <option value="ALL">{t('super_admin.all_users')}</option>
                                <option value="SCHOOL_ADMIN">{t('super_admin.school_admins_only')}</option>
                            </select>
                        </div>

                        <div className={styles.actions}>
                            <Button type="submit" isLoading={isLoading}>
                                {t('super_admin.send_notification')}
                            </Button>
                        </div>
                    </form>
                </motion.div>

                {/* History Section */}
                <motion.div
                    className={styles.historySection}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className={styles.historyHeader}>
                        <History size={20} />
                        <h2>{t('super_admin.activity')}</h2>
                    </div>

                    <div className={styles.notificationList}>
                        {isFetching ? (
                            <div className={styles.empty}>Loading...</div>
                        ) : history.length === 0 ? (
                            <div className={styles.empty}>
                                <Bell size={40} strokeWidth={1} />
                                <p>{t('super_admin.no_notifications')}</p>
                            </div>
                        ) : (
                            history.map((notif) => (
                                <div key={notif.id} className={styles.notificationCard}>
                                    <div className={styles.notifHeader}>
                                        <span className={styles.notifTitle}>{notif.title}</span>
                                        <span className={styles.notifDate}>
                                            {new Date(notif.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className={styles.notifContent}>{notif.content}</p>
                                    {notif.targetRole && (
                                        <span className={styles.notifBadge}>
                                            {notif.targetRole === 'ALL' ? t('super_admin.all_users') : t('super_admin.school_admins_only')}
                                        </span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default NotificationsPage;
