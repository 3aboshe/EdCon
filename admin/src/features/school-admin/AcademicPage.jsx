import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, Book, GraduationCap, BookOpen,
    Trash2, X
} from 'lucide-react';
import { academicService } from '../../services/academicService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import styles from './AcademicPage.module.css';

export function AcademicPage() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('CLASS');
    const [data, setData] = useState({ classes: [], subjects: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [classesResult, subjectsResult] = await Promise.allSettled([
                academicService.getClasses(),
                academicService.getSubjects()
            ]);
            setData({
                classes: classesResult.status === 'fulfilled' ? classesResult.value : [],
                subjects: subjectsResult.status === 'fulfilled' ? subjectsResult.value : []
            });
        } catch (error) {
            console.error('Failed to load academic data:', error);
            setData({ classes: [], subjects: [] });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm(t('common.confirm_delete'))) return;
        try {
            switch (activeTab) {
                case 'CLASS': await academicService.deleteClass(id); break;
                case 'SUBJECT': await academicService.deleteSubject(id); break;
            }
            loadData();
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const getFilteredData = () => {
        const query = searchQuery.toLowerCase();
        switch (activeTab) {
            case 'CLASS': return (data.classes || []).filter(c => c.name.toLowerCase().includes(query));
            case 'SUBJECT': return (data.subjects || []).filter(s => s.name.toLowerCase().includes(query));
            default: return [];
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
                    {['CLASS', 'SUBJECT'].map((tab) => (
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
                    filteredItems.map((item) => (
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
                                </div>
                                <div className={styles.cardTitle}>
                                    <h3>{item.name}</h3>
                                </div>
                            </div>

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

function CreateAcademicModal({ type, onClose, onSuccess, subjects = [] }) {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', subjectIds: [] });

    const handleSubjectToggle = (subjectId) => {
        setFormData(prev => ({
            ...prev,
            subjectIds: prev.subjectIds.includes(subjectId)
                ? prev.subjectIds.filter(id => id !== subjectId)
                : [...prev.subjectIds, subjectId]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            switch (type) {
                case 'CLASS':
                    await academicService.createClass(formData.name, formData.subjectIds);
                    break;
                case 'SUBJECT':
                    await academicService.createSubject(formData.name);
                    break;
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
                    <Input
                        label={t('common.name')}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={type === 'CLASS' ? t('admin.class_name_hint_2') : t('admin.subject_name_hint_2')}
                        required
                    />

                    {/* Subject checkboxes for Class creation */}
                    {type === 'CLASS' && subjects.length > 0 && (
                        <div className={styles.subjectSelection}>
                            <label className={styles.fieldLabel}>{t('admin.select_subjects')}</label>
                            <div className={styles.checkboxGrid}>
                                {subjects.map(subject => (
                                    <label key={subject.id} className={styles.checkboxItem}>
                                        <input
                                            type="checkbox"
                                            checked={formData.subjectIds.includes(subject.id)}
                                            onChange={() => handleSubjectToggle(subject.id)}
                                        />
                                        <span>{subject.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
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
