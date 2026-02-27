import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, Building2, Users, Trash2, Eye,
    X, Copy, Check, AlertCircle, ShieldCheck, RefreshCw
} from 'lucide-react';
import { schoolService } from '../../services/schoolService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import styles from './SchoolsPage.module.css';

export function SchoolsPage() {
    const { t } = useTranslation();
    const [schools, setSchools] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAddAdminModal, setShowAddAdminModal] = useState(null);
    const [showAdminsModal, setShowAdminsModal] = useState(null);
    const [showCredentialsModal, setShowCredentialsModal] = useState(false);
    const [credentials, setCredentials] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [feedback, setFeedback] = useState({ type: '', text: '' });

    useEffect(() => {
        loadSchools();
    }, []);

    const loadSchools = async () => {
        try {
            const data = await schoolService.getSchools();
            setSchools(data);
        } catch (error) {
            console.error('Failed to load schools:', error);
            setFeedback({ type: 'error', text: error?.message || t('super_admin.failed_load_schools') });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateSchool = async (data) => {
        try {
            const response = await schoolService.createSchool(data);
            setSchools([...schools, response.school]);
            setCredentials(response.credentials);
            setShowCreateModal(false);
            setShowCredentialsModal(true);
            setFeedback({ type: 'success', text: 'School created successfully' });
        } catch (error) {
            console.error('Failed to create school:', error);
            setFeedback({ type: 'error', text: error?.message || t('super_admin.failed_create_school') });
            throw error;
        }
    };

    const handleAddAdmin = async (schoolId, adminData) => {
        try {
            const response = await schoolService.addAdmin(schoolId, adminData);
            setCredentials(response.credentials);
            setShowAddAdminModal(null);
            setShowCredentialsModal(true);
            setFeedback({ type: 'success', text: 'School admin added successfully' });
            loadSchools();
        } catch (error) {
            console.error('Failed to add school admin:', error);
            setFeedback({ type: 'error', text: error?.message || t('super_admin.failed_add_admin') });
            throw error;
        }
    };

    const handleDeleteSchool = async (schoolId) => {
        try {
            await schoolService.deleteSchool(schoolId);
            setSchools(schools.filter(s => s.id !== schoolId));
            setDeleteConfirm(null);
            setFeedback({ type: 'success', text: 'School deleted successfully' });
        } catch (error) {
            console.error('Failed to delete school:', error);
            setFeedback({ type: 'error', text: error?.message || 'Failed to delete school' });
        }
    };

    const filteredSchools = schools.filter(school =>
        school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        school.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1>{t('super_admin.schools')}</h1>
                    <p>{filteredSchools.length} {t('super_admin.schools').toLowerCase()}</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)}>
                    <Plus size={18} />
                    {t('super_admin.create_school')}
                </Button>
            </div>

            {feedback.text && (
                <div className={`${styles.message} ${feedback.type === 'error' ? styles.messageError : styles.messageSuccess}`}>
                    <AlertCircle size={16} />
                    <span>{feedback.text}</span>
                </div>
            )}

            {/* Search */}
            <div className={styles.searchBar}>
                <Input
                    placeholder={t('super_admin.search_schools')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    startIcon={<Search size={18} />}
                />
            </div>

            {/* Schools Grid */}
            <div className={styles.grid}>
                {isLoading ? (
                    <div className={styles.loading}>Loading...</div>
                ) : filteredSchools.length === 0 ? (
                    <div className={styles.empty}>
                        <Building2 size={48} />
                        <p>{t('admin.no_schools_found')}</p>
                    </div>
                ) : (
                    filteredSchools.map((school, index) => (
                        <motion.div
                            key={school.id}
                            className={styles.schoolCard}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <div className={styles.cardHeader}>
                                <div className={styles.schoolIcon}>
                                    <Building2 size={24} />
                                </div>
                                <div className={styles.schoolInfo}>
                                    <h3>{school.name}</h3>
                                    <span className={styles.schoolCode}>{school.code}</span>
                                </div>
                            </div>

                            <div className={styles.cardStats}>
                                <div className={styles.stat}>
                                    <Users size={16} />
                                    <span>{school._count?.users || 0} {t('super_admin.users_count')}</span>
                                </div>
                            </div>

                            {school.address && (
                                <p className={styles.address}>{school.address}</p>
                            )}

                            <div className={styles.cardActions}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowAdminsModal({ schoolId: school.id, schoolName: school.name })}
                                >
                                    <Eye size={16} />
                                    {t('super_admin.view_admins')}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowAddAdminModal({ schoolId: school.id, schoolName: school.name })}
                                >
                                    <Plus size={16} />
                                    {t('super_admin.add_admin_short')}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={styles.deleteBtn}
                                    onClick={() => setDeleteConfirm(school.id)}
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>

                            {/* Delete Confirmation */}
                            <AnimatePresence>
                                {deleteConfirm === school.id && (
                                    <motion.div
                                        className={styles.deleteConfirm}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <p>{t('super_admin.delete_confirmation_named', { name: school.name })}</p>
                                        <div className={styles.confirmActions}>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setDeleteConfirm(null)}
                                            >
                                                {t('super_admin.cancel')}
                                            </Button>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => handleDeleteSchool(school.id)}
                                            >
                                                {t('super_admin.delete')}
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Create School Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <CreateSchoolModal
                        onClose={() => setShowCreateModal(false)}
                        onSubmit={handleCreateSchool}
                    />
                )}
            </AnimatePresence>

            {/* Add Admin Modal */}
            <AnimatePresence>
                {showAddAdminModal && (
                    <AddAdminModal
                        schoolName={showAddAdminModal.schoolName}
                        onClose={() => setShowAddAdminModal(null)}
                        onSubmit={(data) => handleAddAdmin(showAddAdminModal.schoolId, data)}
                    />
                )}
            </AnimatePresence>

            {/* View Admins Modal */}
            <AnimatePresence>
                {showAdminsModal && (
                    <ViewAdminsModal
                        schoolId={showAdminsModal.schoolId}
                        schoolName={showAdminsModal.schoolName}
                        onClose={() => setShowAdminsModal(null)}
                        onPasswordReset={(creds) => {
                            setCredentials(creds);
                            setShowCredentialsModal(true);
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Credentials Modal */}
            <AnimatePresence>
                {showCredentialsModal && credentials && (
                    <CredentialsModal
                        credentials={credentials}
                        onClose={() => {
                            setShowCredentialsModal(false);
                            setCredentials(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// Create School Modal
function CreateSchoolModal({ onClose, onSubmit }) {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        adminName: '',
        adminEmail: '',
        adminAccessCode: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.name.trim() || !formData.adminName.trim()) {
            setError(t('super_admin.fill_required'));
            return;
        }

        setIsLoading(true);
        try {
            await onSubmit({
                name: formData.name.trim(),
                address: formData.address.trim() || undefined,
                admin: {
                    name: formData.adminName.trim(),
                    email: formData.adminEmail.trim() || undefined,
                    accessCode: formData.adminAccessCode.trim() || undefined,
                },
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : t('super_admin.failed_create_school'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className={styles.modal}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.modalHeader}>
                    <h2>{t('super_admin.create_school')}</h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.modalBody}>
                    {error && (
                        <div className={styles.error}>
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <Input
                        label={t('super_admin.school_name') + ' *'}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={t('super_admin.school_name')}
                    />

                    <Input
                        label={t('super_admin.school_address')}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder={t('super_admin.school_address')}
                    />

                    <div className={styles.divider}>
                        <span>{t('super_admin.admin_details')}</span>
                    </div>

                    <Input
                        label={t('super_admin.admin_name') + ' *'}
                        value={formData.adminName}
                        onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                        placeholder={t('super_admin.admin_name')}
                    />

                    <Input
                        label={t('super_admin.email_optional')}
                        type="email"
                        value={formData.adminEmail}
                        onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                        placeholder={t('super_admin.admin_email')}
                    />

                    <Input
                        label={t('super_admin.custom_access_code')}
                        value={formData.adminAccessCode}
                        onChange={(e) => setFormData({ ...formData, adminAccessCode: e.target.value })}
                        placeholder={t('super_admin.username_hint')}
                    />

                    <div className={styles.modalFooter}>
                        <Button variant="ghost" type="button" onClick={onClose}>
                            {t('super_admin.cancel')}
                        </Button>
                        <Button type="submit" isLoading={isLoading}>
                            {t('super_admin.create')}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

// Add Admin Modal
function AddAdminModal({ schoolName, onClose, onSubmit }) {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        accessCode: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.name.trim()) {
            setError(t('super_admin.fill_required'));
            return;
        }

        setIsLoading(true);
        try {
            await onSubmit({
                name: formData.name.trim(),
                email: formData.email.trim() || undefined,
                accessCode: formData.accessCode.trim() || undefined,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : t('super_admin.failed_add_admin'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className={styles.modal}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.modalHeader}>
                    <div>
                        <h2>{t('super_admin.add_school_admin')}</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{schoolName}</p>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.modalBody}>
                    {error && (
                        <div className={styles.error}>
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <Input
                        label={t('super_admin.admin_name') + ' *'}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={t('super_admin.admin_name')}
                        autoFocus
                    />

                    <Input
                        label={t('super_admin.email_optional')}
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder={t('super_admin.admin_email')}
                    />

                    <Input
                        label={t('super_admin.custom_access_code')}
                        value={formData.accessCode}
                        onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
                        placeholder={t('super_admin.username_hint')}
                    />

                    <div className={styles.modalFooter}>
                        <Button variant="ghost" type="button" onClick={onClose}>
                            {t('super_admin.cancel')}
                        </Button>
                        <Button type="submit" isLoading={isLoading}>
                            {t('super_admin.add_admin')}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

// View Admins Modal
function ViewAdminsModal({ schoolId, schoolName, onClose, onPasswordReset }) {
    const { t } = useTranslation();
    const [admins, setAdmins] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [resettingId, setResettingId] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, onConfirm: null, title: '', message: '' });

    useEffect(() => {
        loadAdmins();
    }, [schoolId]);

    const loadAdmins = async () => {
        try {
            const data = await schoolService.getAdmins(schoolId);
            setAdmins(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load admins:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = (adminId, adminName) => {
        setConfirmModal({
            isOpen: true,
            title: t('admin.reset_password_title'),
            message: t('admin.reset_password_confirm'),
            variant: 'warning',
            onConfirm: async () => {
                setResettingId(adminId);
                setConfirmModal({ isOpen: false });
                try {
                    const result = await schoolService.resetAdminPassword(schoolId, adminId);
                    onPasswordReset({
                        accessCode: result.accessCode,
                        temporaryPassword: result.temporaryPassword,
                        userName: adminName,
                    });
                } catch (error) {
                    console.error('Failed to reset password:', error);
                } finally {
                    setResettingId(null);
                }
            }
        });
    };

    return (
        <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className={styles.modalLarge}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.modalHeader}>
                    <div>
                        <h2>{t('super_admin.school_admins')}</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{schoolName}</p>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {isLoading ? (
                        <div className={styles.centered}>{t('common.loading')}</div>
                    ) : admins.length === 0 ? (
                        <div className={styles.centered}>
                            <ShieldCheck size={48} style={{ opacity: 0.3 }} />
                            <p>{t('super_admin.no_admins')}</p>
                        </div>
                    ) : (
                        <div className={styles.adminsList}>
                            {admins.map(admin => (
                                <div key={admin.id} className={styles.adminItem}>
                                    <div className={styles.adminInfo}>
                                        <div className={styles.adminAvatar}>
                                            {admin.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className={styles.adminName}>{admin.name}</div>
                                            <div className={styles.adminCode}>{admin.accessCode}</div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleResetPassword(admin.id, admin.name)}
                                        isLoading={resettingId === admin.id}
                                    >
                                        <RefreshCw size={14} />
                                        {t('admin.reset_password_button')}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.modalFooter}>
                    <Button onClick={onClose} fullWidth>
                        {t('common.close')}
                    </Button>
                </div>
            </motion.div>

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant}
                isLoading={resettingId !== null}
                confirmText={t('common.confirm')}
                cancelText={t('common.cancel')}
            />
        </motion.div>
    );
}

// Credentials Modal with RTL support
function CredentialsModal({ credentials, onClose }) {
    const { t, i18n } = useTranslation();
    const [copiedField, setCopiedField] = useState(null);

    const isRTL = ['ar', 'he', 'fa'].includes(i18n.language);

    const copyToClipboard = async (text, field) => {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const isPasswordReset = !!credentials.userName;

    return (
        <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className={`${styles.credentialsModal} ${isRTL ? styles.rtl : ''}`}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
            >
                {/* Success Icon */}
                <div className={styles.successIcon}>
                    <Check size={32} />
                </div>

                <h2 className={styles.credentialsTitle}>
                    {isPasswordReset ? t('admin.password_reset_success') : t('super_admin.admin_created')}
                </h2>

                {credentials.userName && (
                    <p className={styles.credentialsSubtitle}>{credentials.userName}</p>
                )}

                <div className={styles.warningBanner}>
                    <AlertCircle size={20} />
                    <p>{t('super_admin.save_credentials')}</p>
                </div>

                <div className={styles.credentialField}>
                    <label>{t('admin.access_code')}</label>
                    <div className={styles.credentialValue}>
                        <code>{credentials.accessCode}</code>
                        <button onClick={() => copyToClipboard(credentials.accessCode, 'code')}>
                            {copiedField === 'code' ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                    </div>
                </div>

                <div className={styles.credentialField}>
                    <label>{t('super_admin.temp_password')}</label>
                    <div className={styles.credentialValue}>
                        <code>{credentials.temporaryPassword}</code>
                        <button onClick={() => copyToClipboard(credentials.temporaryPassword, 'password')}>
                            {copiedField === 'password' ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <Button onClick={onClose} fullWidth>
                        {t('super_admin.done')}
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default SchoolsPage;
