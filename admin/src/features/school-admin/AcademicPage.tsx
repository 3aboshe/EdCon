import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, Book, GraduationCap, FileText, BookOpen,
    Trash2, X, AlertCircle, Calendar
} from 'lucide-react';
import { academicService } from '../../services/academicService';
import type { Class, Subject, Exam, Homework } from '../../services/academicService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import styles from './AcademicPage.module.css';

type AcademicTab = 'CLASS' | 'SUBJECT' | 'EXAM' | 'HOMEWORK';

export function AcademicPage() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<AcademicTab>('CLASS');
    const [data, setData] = useState<{
        classes: Class[],
        subjects: Subject[],
        exams: Exam[],
        homework: Homework[]
    }>({ classes: [], subjects: [], exams: [], homework: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [classes, subjects, exams, homework] = await Promise.all([
                academicService.getClasses(),
                academicService.getSubjects(),
                academicService.getExams(),
                academicService.getHomework()
            ]);
            setData({ classes, subjects, exams, homework });
        } catch (error) {
            console.error('Failed to load academic data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('common.confirm_delete'))) return;
        try {
            switch (activeTab) {
                case 'CLASS': await academicService.deleteClass(id); break;
                case 'SUBJECT': await academicService.deleteSubject(id); break;
                case 'EXAM': await academicService.deleteExam(id); break;
                case 'HOMEWORK': await academicService.deleteHomework(id); break;
            }
            loadData();
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const getFilteredData = () => {
        const query = searchQuery.toLowerCase();
        switch (activeTab) {
            case 'CLASS': return data.classes.filter(c => c.name.toLowerCase().includes(query));
            case 'SUBJECT': return data.subjects.filter(s => s.name.toLowerCase().includes(query));
            case 'EXAM': return data.exams.filter(e => e.title.toLowerCase().includes(query));
            case 'HOMEWORK': return data.homework.filter(h => h.title.toLowerCase().includes(query));
        }
    };

    const filteredItems = getFilteredData();

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1>{t('admin.academic_management_title')}</h1>
                    <p>{t('admin.manage_your_school')}</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)}>
                    <Plus size={18} />
                    {t('common.add')} {t(`common.${activeTab.toLowerCase()}`)}
                </Button>
            </div>

            <div className={styles.controls}>
                <div className={styles.tabs}>
                    {(['CLASS', 'SUBJECT', 'EXAM', 'HOMEWORK'] as AcademicTab[]).map((tab) => (
                        <button
                            key={tab}
                            className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {t(`common.${tab.toLowerCase()}s`)}
                        </button>
                    ))}
                </div>
                <div className={styles.searchWrapper}>
                    <Input
                        placeholder={t('common.search')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        startIcon={<Search size={18} />}
                    />
                </div>
            </div>

            <div className={styles.grid}>
                {isLoading ? (
                    <div className={styles.empty}>{t('common.loading')}</div>
                ) : filteredItems.length === 0 ? (
                    <div className={styles.empty}>
                        <Book size={48} />
                        <p>{t('common.no_content')}</p>
                    </div>
                ) : (
                    filteredItems.map((item: any) => (
                        <motion.div
                            key={item.id}
                            className={styles.card}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <div className={styles.cardHeader}>
                                <div className={styles.iconWrapper}>
                                    {activeTab === 'CLASS' && <GraduationCap size={20} />}
                                    {activeTab === 'SUBJECT' && <BookOpen size={20} />}
                                    {activeTab === 'EXAM' && <FileText size={20} />}
                                    {activeTab === 'HOMEWORK' && <Book size={20} />}
                                </div>
                                <div className={styles.cardTitle}>
                                    <h3>{item.name || item.title}</h3>
                                    <span className={styles.cardSubtitle}>
                                        {activeTab === 'EXAM' || activeTab === 'HOMEWORK' ? item.subject?.name : ''}
                                    </span>
                                </div>
                            </div>

                            {(activeTab === 'EXAM' || activeTab === 'HOMEWORK') && (
                                <div className={styles.cardStats}>
                                    <div className={styles.statItem}>
                                        <Calendar size={14} />
                                        <span>{new Date(item.date || item.dueDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className={styles.statItem}>
                                        <GraduationCap size={14} />
                                        <span>{item.class?.name}</span>
                                    </div>
                                </div>
                            )}

                            <div className={styles.cardActions}>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <CreateAcademicModal
                        type={activeTab}
                        classes={data.classes}
                        subjects={data.subjects}
                        onClose={() => setShowCreateModal(false)}
                        onSuccess={() => {
                            setShowCreateModal(false);
                            loadData();
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function CreateAcademicModal({ type, classes, subjects, onClose, onSuccess }: any) {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<any>({
        name: '', title: '', subjectId: '', classId: '', date: '', dueDate: '', description: ''
    });

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            switch (type) {
                case 'CLASS': await academicService.createClass(formData.name); break;
                case 'SUBJECT': await academicService.createSubject(formData.name); break;
                case 'EXAM': await academicService.createExam(formData); break;
                case 'HOMEWORK': await academicService.createHomework(formData); break;
            }
            onSuccess();
        } catch (error) {
            console.error('Create failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div className={styles.modalOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
            <motion.div className={styles.modal} initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>{t('common.add')} {t(`common.${type.toLowerCase()}`)}</h2>
                    <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className={styles.modalBody}>
                    {(type === 'CLASS' || type === 'SUBJECT') && (
                        <Input
                            label={t('common.name')}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    )}
                    {(type === 'EXAM' || type === 'HOMEWORK') && (
                        <>
                            <Input
                                label={t('common.title')}
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>{t('common.subject')}</label>
                                <select className={styles.select} value={formData.subjectId} onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })} required>
                                    <option value="">{t('common.select')}</option>
                                    {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>{t('common.class')}</label>
                                <select className={styles.select} value={formData.classId} onChange={(e) => setFormData({ ...formData, classId: e.target.value })} required>
                                    <option value="">{t('common.select')}</option>
                                    {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <Input
                                label={type === 'EXAM' ? t('common.date') : t('common.due')}
                                type="date"
                                value={type === 'EXAM' ? formData.date : formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, [type === 'EXAM' ? 'date' : 'dueDate']: e.target.value })}
                                required
                            />
                        </>
                    )}
                    <div className={styles.modalFooter}>
                        <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
                        <Button type="submit" isLoading={isLoading}>{t('common.create')}</Button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

export default AcademicPage;
