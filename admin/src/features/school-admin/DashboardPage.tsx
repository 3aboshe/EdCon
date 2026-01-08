import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    GraduationCap, Users, UserCheck, BookOpen,
    Plus, UserPlus, School
} from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from './DashboardPage.module.css';
import { useSchoolDashboard } from '../../hooks/useSchoolData';

export function DashboardPage() {
    const { t } = useTranslation();
    const { data: stats, isLoading } = useSchoolDashboard();

    const statCards = [
        {
            icon: GraduationCap,
            label: t('admin.total_students'),
            value: stats?.totalStudents || 0,
            sublabel: t('admin.enrolled_students'),
            color: 'primary'
        },
        {
            icon: Users,
            label: t('admin.total_teachers'),
            value: stats?.totalTeachers || 0,
            sublabel: t('admin.active_teachers'),
            color: 'success'
        },
        {
            icon: UserCheck,
            label: t('admin.total_parents'),
            value: stats?.totalParents || 0,
            sublabel: t('admin.registered_parents'),
            color: 'info'
        },
        {
            icon: BookOpen,
            label: t('admin.total_classes'),
            value: stats?.totalClasses || 0,
            sublabel: t('admin.total_classes'),
            color: 'warning'
        },
    ];

    const quickActions = [
        {
            icon: UserPlus,
            title: t('admin.add_new_student'),
            description: t('admin.add_new_student_desc'),
            path: '/admin/users?tab=students&action=create'
        },
        {
            icon: Users,
            title: t('admin.add_new_teacher'),
            description: t('admin.add_new_teacher_desc'),
            path: '/admin/users?tab=teachers&action=create'
        },
        {
            icon: School,
            title: t('admin.create_class'),
            description: t('admin.create_class_desc'),
            path: '/admin/academic?tab=classes&action=create'
        },
        {
            icon: BookOpen,
            title: t('admin.add_subject'),
            description: t('admin.add_subject_desc'),
            path: '/admin/academic?tab=subjects&action=create'
        },
    ];

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <h1>{t('admin.welcome_admin')}</h1>
                <p>{t('admin.manage_school')}</p>
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
                <h2>{t('admin.quick_actions')}</h2>
                <div className={styles.actionsGrid}>
                    {quickActions.map((action, index) => (
                        <Link
                            key={action.title}
                            to={action.path}
                            className={styles.actionCard}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + index * 0.05 }}
                                className={styles.actionInner}
                            >
                                <div className={styles.actionIcon}>
                                    <action.icon size={22} />
                                </div>
                                <div className={styles.actionContent}>
                                    <h3>{action.title}</h3>
                                    <p>{action.description}</p>
                                </div>
                                <Plus size={18} className={styles.actionPlus} />
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;
