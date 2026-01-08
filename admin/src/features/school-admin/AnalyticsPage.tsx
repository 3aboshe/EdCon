import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    BarChart3, TrendingUp, Users, GraduationCap,
    BookOpen, CheckCircle2
} from 'lucide-react';
import { dashboardService, DashboardStats } from '../../services/dashboardService';
import styles from './AnalyticsPage.module.css';

export function AnalyticsPage() {
    const { t } = useTranslation();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const data = await dashboardService.getSchoolDashboard();
                setStats(data);
            } catch (error) {
                console.error('Failed to load analytics:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadStats();
    }, []);

    const statCards = [
        { label: t('admin.total_students'), value: stats?.totalStudents || 0, icon: GraduationCap },
        { label: t('admin.total_teachers'), value: stats?.totalTeachers || 0, icon: Users },
        { label: t('admin.attendance_rate'), value: `${stats?.attendanceRate || 0}%`, icon: CheckCircle2 },
        { label: t('admin.active_homework'), value: stats?.activeHomework || 0, icon: BookOpen },
    ];

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1>{t('admin.analytics_title')}</h1>
                <p>{t('admin.analytics_subtitle')}</p>
            </div>

            <div className={styles.statsGrid}>
                {statCards.map((card, index) => (
                    <motion.div
                        key={card.label}
                        className={styles.statCard}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <div className={styles.iconWrapper}>
                            <card.icon size={24} />
                        </div>
                        <div className={styles.statContent}>
                            <span className={styles.statValue}>
                                {isLoading ? '...' : card.value}
                            </span>
                            <span className={styles.statLabel}>{card.label}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className={styles.chartsGrid}>
                <motion.div
                    className={styles.chartCard}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <h2>{t('admin.performance_overview')}</h2>
                    <div className={styles.placeholderChart}>
                        <BarChart3 size={48} strokeWidth={1} />
                        <span>Performance data visualization coming soon</span>
                    </div>
                </motion.div>

                <motion.div
                    className={styles.chartCard}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <h2>{t('admin.attendance_trend')}</h2>
                    <div className={styles.placeholderChart}>
                        <TrendingUp size={48} strokeWidth={1} />
                        <span>Attendance trend visualization coming soon</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default AnalyticsPage;
