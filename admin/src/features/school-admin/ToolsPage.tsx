import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    Bell, Calendar, ClipboardCheck,
    Settings, MessageSquare, ChevronRight,
    Users, BookOpen
} from 'lucide-react';
import styles from './ToolsPage.module.css';

export function ToolsPage() {
    const { t } = useTranslation();

    const toolSections = [
        {
            title: t('admin.announcements'),
            description: t('admin.post_updates'),
            icon: Bell,
            actions: [
                { label: t('admin.create_announcement'), icon: Bell },
                { label: t('admin.latest_announcements'), icon: MessageSquare },
            ]
        },
        {
            title: t('admin.attendance'),
            description: t('admin.track_attendance'),
            icon: ClipboardCheck,
            actions: [
                { label: t('admin.take_attendance'), icon: ClipboardCheck },
                { label: t('admin.attendance_rate'), icon: Users },
            ]
        },
        {
            title: t('admin.academic'),
            description: t('admin.manage_school'),
            icon: Settings,
            actions: [
                { label: t('admin.create_class'), icon: Users },
                { label: t('admin.add_subject'), icon: BookOpen },
            ]
        }
    ];

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1>{t('admin.tools')}</h1>
                <p>{t('system.subtitle')}</p>
            </div>

            <div className={styles.toolsGrid}>
                {toolSections.map((section, idx) => (
                    <motion.div
                        key={section.title}
                        className={styles.toolCard}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <div className={styles.toolHeader}>
                            <div className={styles.iconWrapper}>
                                <section.icon size={22} />
                            </div>
                            <div className={styles.toolTitle}>
                                <h2>{section.title}</h2>
                                <p>{section.description}</p>
                            </div>
                        </div>

                        <div className={styles.toolActions}>
                            {section.actions.map((action) => (
                                <button key={action.label} className={styles.actionButton}>
                                    <action.icon size={18} />
                                    <span style={{ flex: 1, textAlign: 'left' }}>{action.label}</span>
                                    <ChevronRight size={16} />
                                </button>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

export default ToolsPage;
