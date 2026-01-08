import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Building2, Users, Activity, Bell, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { schoolService } from '../../services/schoolService';
import styles from './OverviewPage.module.css';

interface Stats {
    totalSchools: number;
    totalUsers: number;
    activeNow: number;
}

export function OverviewPage() {
    const { t } = useTranslation();
    const [stats, setStats] = useState<Stats>({ totalSchools: 0, totalUsers: 0, activeNow: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const schools = await schoolService.getSchools();
            let totalUsers = 0;
            schools.forEach(school => {
                totalUsers += school._count?.users || 0;
            });

            setStats({
                totalSchools: schools.length,
                totalUsers,
                activeNow: Math.floor(totalUsers * 0.1),
            });
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const statCards = [
        {
            icon: Building2,
            label: t('super_admin.total_schools'),
            value: stats.totalSchools,
            color: 'primary'
        },
        {
            icon: Users,
            label: t('super_admin.total_users'),
            value: stats.totalUsers,
            color: 'success'
        },
        {
            icon: Activity,
            label: t('super_admin.active_now'),
            value: stats.activeNow,
            color: 'info'
        },
    ];

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1>{t('super_admin.hq_title')}</h1>
                    <p>{t('super_admin.hq_subtitle')}</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                {statCards.map((card, index) => (
                    <motion.div
                        key={card.label}
                        className={`${styles.statCard} ${styles[card.color]}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <div className={styles.statIcon}>
                            <card.icon size={24} />
                        </div>
                        <div className={styles.statContent}>
                            <span className={styles.statValue}>
                                {isLoading ? '...' : card.value.toLocaleString()}
                            </span>
                            <span className={styles.statLabel}>{card.label}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className={styles.section}>
                <h2>{t('super_admin.quick_actions')}</h2>
                <div className={styles.actionsGrid}>
                    <Link to="/super-admin/schools" className={styles.actionCard}>
                        <div className={styles.actionIcon}>
                            <Building2 size={24} />
                        </div>
                        <div className={styles.actionContent}>
                            <h3>{t('super_admin.create_school')}</h3>
                            <p>{t('super_admin.schools')}</p>
                        </div>
                        <Plus size={20} className={styles.actionPlus} />
                    </Link>

                    <Link to="/super-admin/notifications" className={styles.actionCard}>
                        <div className={styles.actionIcon}>
                            <Bell size={24} />
                        </div>
                        <div className={styles.actionContent}>
                            <h3>{t('super_admin.global_notifications')}</h3>
                            <p>{t('super_admin.global_notifications_subtitle')}</p>
                        </div>
                        <Plus size={20} className={styles.actionPlus} />
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default OverviewPage;
