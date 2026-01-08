import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    Bell, ClipboardCheck,
    Settings, MessageSquare, ChevronRight,
    Users, BookOpen, Database, Download, Archive,
    CheckCircle, AlertCircle, RefreshCw, FileDown, Shield
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { systemService } from '../../services/systemService';
import styles from './ToolsPage.module.css';

interface CheckResult {
    success: boolean;
    issues?: string[];
    fixes?: string[];
    totalIssues?: number;
    totalFixes?: number;
}

export function ToolsPage() {
    const { t } = useTranslation();
    const [isChecking, setIsChecking] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleCheckRelations = async () => {
        setIsChecking(true);
        setCheckResult(null);
        setMessage(null);
        try {
            const result = await systemService.checkRelations();
            setCheckResult(result);
            setMessage({
                type: 'success',
                text: t('system.check_completed')
            });
        } catch (error) {
            setMessage({
                type: 'error',
                text: t('system.check_failed')
            });
        } finally {
            setIsChecking(false);
        }
    };

    const handleExportData = async () => {
        setIsExporting(true);
        setMessage(null);
        try {
            const blob = await systemService.exportData();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `edcon-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            setMessage({
                type: 'success',
                text: t('system.export_success')
            });
        } catch (error) {
            setMessage({
                type: 'error',
                text: t('system.export_failed')
            });
        } finally {
            setIsExporting(false);
        }
    };

    const handleCreateBackup = async () => {
        setIsBackingUp(true);
        setMessage(null);
        try {
            await systemService.createBackup();
            setMessage({
                type: 'success',
                text: t('system.backup_created')
            });
        } catch (error) {
            setMessage({
                type: 'error',
                text: t('system.backup_failed')
            });
        } finally {
            setIsBackingUp(false);
        }
    };

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

            {message && (
                <motion.div
                    className={`${styles.message} ${message.type === 'success' ? styles.success : styles.error}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    <span>{message.text}</span>
                </motion.div>
            )}

            {/* System Maintenance Section */}
            <div className={styles.sectionTitle}>
                <Database size={20} />
                <h2>{t('system.title')}</h2>
            </div>

            <div className={styles.systemGrid}>
                {/* Relation Checker */}
                <motion.div
                    className={styles.systemCard}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className={styles.toolHeader}>
                        <div className={styles.iconWrapper} style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
                            <Database size={22} />
                        </div>
                        <div className={styles.toolTitle}>
                            <h3>{t('system.relation_checker_title')}</h3>
                            <p>{t('system.relation_checker_subtitle')}</p>
                        </div>
                    </div>
                    <div className={styles.cardBody}>
                        <ul className={styles.checkList}>
                            <li><CheckCircle size={14} /> {t('system.check_parent_child')}</li>
                            <li><CheckCircle size={14} /> {t('system.check_student_class')}</li>
                            <li><CheckCircle size={14} /> {t('system.check_teacher_subject')}</li>
                        </ul>
                        {checkResult && (
                            <div className={styles.resultBox}>
                                <span>{t('system.total_issues')} <strong>{checkResult.totalIssues || 0}</strong></span>
                                <span>{t('system.total_fixes')} <strong>{checkResult.totalFixes || 0}</strong></span>
                            </div>
                        )}
                    </div>
                    <Button onClick={handleCheckRelations} isLoading={isChecking} fullWidth>
                        <RefreshCw size={16} />
                        {isChecking ? t('system.checking') : t('system.run_checker')}
                    </Button>
                </motion.div>

                {/* Export Data */}
                <motion.div
                    className={styles.systemCard}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className={styles.toolHeader}>
                        <div className={styles.iconWrapper} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                            <Download size={22} />
                        </div>
                        <div className={styles.toolTitle}>
                            <h3>{t('system.export_data')}</h3>
                            <p>Download all school data as JSON</p>
                        </div>
                    </div>
                    <div className={styles.cardBody}>
                        <ul className={styles.checkList}>
                            <li><FileDown size={14} /> Users and profiles</li>
                            <li><FileDown size={14} /> Classes and subjects</li>
                            <li><FileDown size={14} /> Grades and attendance</li>
                        </ul>
                    </div>
                    <Button onClick={handleExportData} isLoading={isExporting} variant="outline" fullWidth>
                        <Download size={16} />
                        {t('system.export_data')}
                    </Button>
                </motion.div>

                {/* Create Backup */}
                <motion.div
                    className={styles.systemCard}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className={styles.toolHeader}>
                        <div className={styles.iconWrapper} style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                            <Archive size={22} />
                        </div>
                        <div className={styles.toolTitle}>
                            <h3>{t('system.create_backup')}</h3>
                            <p>Create a server-side backup</p>
                        </div>
                    </div>
                    <div className={styles.cardBody}>
                        <ul className={styles.checkList}>
                            <li><Shield size={14} /> Full database snapshot</li>
                            <li><Shield size={14} /> Automatic versioning</li>
                            <li><Shield size={14} /> Server-side storage</li>
                        </ul>
                    </div>
                    <Button onClick={handleCreateBackup} isLoading={isBackingUp} variant="outline" fullWidth>
                        <Archive size={16} />
                        {t('system.create_backup')}
                    </Button>
                </motion.div>
            </div>

            {/* Quick Actions Section */}
            <div className={styles.sectionTitle}>
                <Settings size={20} />
                <h2>{t('admin.quick_actions')}</h2>
            </div>

            <div className={styles.toolsGrid}>
                {toolSections.map((section, idx) => (
                    <motion.div
                        key={section.title}
                        className={styles.toolCard}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + idx * 0.1 }}
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

