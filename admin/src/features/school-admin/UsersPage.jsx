import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import {
    Plus, Search, User, Trash2, RefreshCw,
    X, AlertCircle, Check
} from 'lucide-react';
import { useUsers, useClasses, useCreateUser, useDeleteUser } from '../../hooks/useSchoolData';
import { userService } from '../../services/userService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import styles from './UsersPage.module.css';

export function UsersPage() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('STUDENT');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showCredentialsModal, setShowCredentialsModal] = useState(false);
    const [credentials, setCredentials] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, onConfirm: null, title: '', message: '' });
    const [isResetting, setIsResetting] = useState(false);
    const [searchParams] = useSearchParams();

    // Data Hooks
    const { data: users = [], isLoading, refetch } = useUsers(activeTab);
    const { data: classes = [] } = useClasses();
    const { data: parents = [] } = useUsers('PARENT');

    // Mutations
    const createUser = useCreateUser();
    const deleteUser = useDeleteUser();

    useEffect(() => {
        const tabParam = (searchParams.get('tab') || '').toLowerCase();
        const actionParam = (searchParams.get('action') || '').toLowerCase();

        if (tabParam) {
            const tabMap = {
                student: 'STUDENT',
                students: 'STUDENT',
                teacher: 'TEACHER',
                teachers: 'TEACHER',
                parent: 'PARENT',
                parents: 'PARENT',
            };

            const mappedTab = tabMap[tabParam];
            if (mappedTab) {
                setActiveTab(mappedTab);
            }
        }

        if (actionParam === 'create') {
            setShowCreateModal(true);
        }
    }, [searchParams]);

    const handleCreateUser = async (data) => {
        try {
            const response = await createUser.mutateAsync(data);
            if (response.credentials) {
                setCredentials({
                    accessCode: response.credentials.accessCode,
                    temporaryPassword: response.credentials.temporaryPassword
                });
                setShowCredentialsModal(true);
            }
            setShowCreateModal(false);
        } catch (error) {
            console.error('Failed to create user:', error);
            throw error;
        }
    };

    const handleDeleteUser = (id) => {
        setConfirmModal({
            isOpen: true,
            title: t('admin.delete_user_title'),
            message: t('admin.delete_user_confirm', { role: t(`admin.tab_${activeTab.toLowerCase()}s`).toLowerCase() }),
            variant: 'danger',
            onConfirm: async () => {
                try {
                    await deleteUser.mutateAsync(id);
                    setConfirmModal({ isOpen: false });
                } catch (error) {
                    console.error('Failed to delete user:', error);
                    setConfirmModal({ isOpen: false });
                }
            }
        });
    };

    const handleResetPassword = (userId, userName) => {
        setConfirmModal({
            isOpen: true,
            title: t('admin.reset_password_title'),
            message: t('admin.reset_password_confirm'),
            variant: 'warning',
            onConfirm: async () => {
                setIsResetting(true);
                try {
                    const result = await userService.resetPassword(userId);
                    setCredentials({
                        accessCode: result.accessCode || result.data?.accessCode,
                        temporaryPassword: result.temporaryPassword || result.data?.temporaryPassword,
                        userName: userName
                    });
                    setConfirmModal({ isOpen: false });
                    setShowCredentialsModal(true);
                } catch (error) {
                    console.error('Failed to reset password:', error);
                    setConfirmModal({ isOpen: false });
                } finally {
                    setIsResetting(false);
                }
            }
        });
    };

    const filteredUsers = users.filter((user) =>
        (user.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (user.accessCode?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1>{t('admin.user_management_title')}</h1>
                    <p>{t('admin.user_management_subtitle')}</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)}>
                    <Plus size={18} />
                    {t(`admin.create_${activeTab.toLowerCase()}`)}
                </Button>
            </div>

            <div className={styles.controls}>
                <div className={styles.tabs}>
                    {['STUDENT', 'TEACHER', 'PARENT'].map((tab) => (
                        <button
                            key={tab}
                            className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {t(`admin.tab_${tab.toLowerCase()}s`)}
                        </button>
                    ))}
                </div>
                <div className={styles.searchWrapper}>
                    <Input
                        placeholder={t('admin.search_users_hint')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        startIcon={<Search size={18} />}
                    />
                </div>
            </div>

            <div className={styles.tableContainer}>
                {isLoading ? (
                    <div className={styles.empty}>{t('common.loading')}</div>
                ) : filteredUsers.length === 0 ? (
                    <div className={styles.empty}>
                        <User size={48} />
                        <p>{t(`admin.no_${activeTab.toLowerCase()}s_found`)}</p>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>{t('common.name')}</th>
                                <th>{t('admin.access_code')}</th>
                                {activeTab === 'STUDENT' && <th>{t('common.class')}</th>}
                                {activeTab === 'TEACHER' && <th>{t('admin.tab_subjects')}</th>}
                                <th>{t('common.status')}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                        <div className={styles.userInfo}>
                                            <div className={styles.avatar}>
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className={styles.userName}>{user.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={styles.userCode}>{user.accessCode}</span>
                                    </td>
                                    {activeTab === 'STUDENT' && (
                                        <td>{user.class?.name || t('common.na')}</td>
                                    )}
                                    {activeTab === 'TEACHER' && (
                                        <td>{user.subject || '-'}</td>
                                    )}
                                    <td>
                                        <span className={`${styles.badge} ${user.status === 'ACTIVE' ? styles.activeBadge : styles.inactiveBadge}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            {/* Password reset for teachers and parents */}
                                            {(activeTab === 'TEACHER' || activeTab === 'PARENT') && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleResetPassword(user.id, user.name)}
                                                    title={t('admin.reset_password_button')}
                                                >
                                                    <RefreshCw size={16} />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)}>
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create User Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <CreateUserModal
                        role={activeTab}
                        classes={classes}
                        parents={parents}
                        onClose={() => setShowCreateModal(false)}
                        onSubmit={handleCreateUser}
                    />
                )}
            </AnimatePresence>

            {/* Credentials Modal */}
            <AnimatePresence>
                {showCredentialsModal && credentials && (
                    <CredentialsModal
                        credentials={credentials}
                        onClose={() => setShowCredentialsModal(false)}
                    />
                )}
            </AnimatePresence>

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant}
                isLoading={isResetting}
                confirmText={t('common.confirm')}
                cancelText={t('common.cancel')}
            />
        </div>
    );
}

// Create User Modal Component with Parent Search
function CreateUserModal({ role, classes, parents = [], onClose, onSubmit }) {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [parentSearch, setParentSearch] = useState('');
    const [showParentDropdown, setShowParentDropdown] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: undefined,
        phone: '',
        role: role,
        classId: '',
        parentId: '',
        subject: ''
    });

    // Filter parents based on search
    const filteredParents = parents.filter(parent =>
        parent.name?.toLowerCase().includes(parentSearch.toLowerCase()) ||
        parent.accessCode?.toLowerCase().includes(parentSearch.toLowerCase())
    ).slice(0, 5);

    const selectParent = (parent) => {
        setFormData({ ...formData, parentId: parent.id });
        setParentSearch(parent.name);
        setShowParentDropdown(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name) {
            setError(t('admin.name_error'));
            return;
        }

        const submitData = { ...formData };
        if (!submitData.email) delete submitData.email;
        if (!submitData.parentId) delete submitData.parentId;
        if (!submitData.subject) delete submitData.subject;

        setIsLoading(true);
        try {
            await onSubmit(submitData);
        } catch (err) {
            setError(err.response?.data?.message || err.message || t('admin.create_user_error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div className={styles.modalOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
            <motion.div className={styles.modal} initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>{t(`admin.create_${role.toLowerCase()}`)}</h2>
                    <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className={styles.modalBody}>
                    {error && <div className={styles.error}><AlertCircle size={16} /><span>{error}</span></div>}
                    <Input
                        label={t('admin.name_label')}
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder={t('admin.name_hint')}
                        required
                    />
                    <Input
                        label={t('admin.email_optional')}
                        type="email"
                        value={formData.email || ''}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                    />

                    {/* Class selector for students */}
                    {role === 'STUDENT' && (
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>{t('admin.class_label')}</label>
                            <select
                                className={styles.select}
                                value={formData.classId}
                                onChange={e => setFormData({ ...formData, classId: e.target.value })}
                                required
                            >
                                <option value="">{t('admin.class_select_error')}</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Parent search for students */}
                    {role === 'STUDENT' && parents.length > 0 && (
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>{t('admin.link_parent')}</label>
                            <div className={styles.autocompleteWrapper}>
                                <input
                                    type="text"
                                    className={styles.autocompleteInput}
                                    value={parentSearch}
                                    onChange={(e) => {
                                        setParentSearch(e.target.value);
                                        setShowParentDropdown(true);
                                        if (!e.target.value) {
                                            setFormData({ ...formData, parentId: '' });
                                        }
                                    }}
                                    onFocus={() => setShowParentDropdown(true)}
                                    placeholder={t('admin.search_parent_hint')}
                                />
                                {showParentDropdown && parentSearch && filteredParents.length > 0 && (
                                    <div className={styles.autocompleteDropdown}>
                                        {filteredParents.map(parent => (
                                            <div
                                                key={parent.id}
                                                className={styles.autocompleteItem}
                                                onClick={() => selectParent(parent)}
                                            >
                                                <span className={styles.parentName}>{parent.name}</span>
                                                <span className={styles.parentCode}>{parent.accessCode}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {formData.parentId && (
                                    <div className={styles.selectedParent}>
                                        <Check size={14} />
                                        <span>{t('admin.parent_linked')}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Subject field for teachers */}
                    {role === 'TEACHER' && (
                        <Input
                            label={t('admin.subject_label')}
                            value={formData.subject || ''}
                            onChange={e => setFormData({ ...formData, subject: e.target.value })}
                            placeholder={t('admin.subject_name_hint_2')}
                        />
                    )}

                    <div className={styles.modalFooter}>
                        <Button variant="ghost" type="button" onClick={onClose}>{t('common.cancel')}</Button>
                        <Button type="submit" isLoading={isLoading}>{t('common.create')}</Button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

// Credentials Modal - Redesigned with RTL support
function CredentialsModal({ credentials, onClose }) {
    const { t, i18n } = useTranslation();
    const [copiedCode, setCopiedCode] = useState(false);
    const [copiedPassword, setCopiedPassword] = useState(false);

    const isRTL = ['ar', 'he', 'fa'].includes(i18n.language);

    const handleCopyCode = () => {
        navigator.clipboard.writeText(credentials.accessCode);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const handleCopyPassword = () => {
        if (credentials.temporaryPassword) {
            navigator.clipboard.writeText(credentials.temporaryPassword);
            setCopiedPassword(true);
            setTimeout(() => setCopiedPassword(false), 2000);
        }
    };

    const handleCopyAll = () => {
        let text = `${t('admin.access_code')}: ${credentials.accessCode}`;
        if (credentials.temporaryPassword) {
            text += `\n${t('admin.temporary_password')}: ${credentials.temporaryPassword}`;
        }
        navigator.clipboard.writeText(text);
        setCopiedCode(true);
        setCopiedPassword(true);
        setTimeout(() => {
            setCopiedCode(false);
            setCopiedPassword(false);
        }, 2000);
    };

    const isPasswordReset = !!credentials.userName;

    return (
        <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className={`${styles.credentialsModal} ${isRTL ? styles.rtl : ''}`}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
            >
                {/* Success Icon */}
                <div className={styles.successIcon}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="m9 12 2 2 4-4" />
                    </svg>
                </div>

                <h2 className={styles.credentialsTitle}>
                    {isPasswordReset ? t('admin.password_reset_success') : t('admin.user_created_success')}
                </h2>

                {credentials.userName && (
                    <p className={styles.credentialsSubtitle}>{credentials.userName}</p>
                )}

                {/* Warning Banner */}
                <div className={styles.warningBanner}>
                    <AlertCircle size={18} />
                    <span>{t('admin.save_credentials_warning')}</span>
                </div>

                {/* Credentials Cards */}
                <div className={styles.credentialsGrid}>
                    {/* Access Code Card */}
                    <div className={styles.credentialCard}>
                        <div className={styles.credentialLabel}>{t('admin.access_code')}</div>
                        <div className={styles.credentialValueRow}>
                            <code className={styles.credentialCode}>{credentials.accessCode}</code>
                            <button
                                className={`${styles.copyBtn} ${copiedCode ? styles.copied : ''}`}
                                onClick={handleCopyCode}
                                title={t('common.copy')}
                            >
                                {copiedCode ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="m9 12 2 2 4-4" />
                                    </svg>
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Password Card */}
                    {credentials.temporaryPassword && (
                        <div className={styles.credentialCard}>
                            <div className={styles.credentialLabel}>{t('admin.temporary_password')}</div>
                            <div className={styles.credentialValueRow}>
                                <code className={styles.credentialCode}>{credentials.temporaryPassword}</code>
                                <button
                                    className={`${styles.copyBtn} ${copiedPassword ? styles.copied : ''}`}
                                    onClick={handleCopyPassword}
                                    title={t('common.copy')}
                                >
                                    {copiedPassword ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="m9 12 2 2 4-4" />
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className={styles.credentialsActions}>
                    <Button variant="outline" onClick={handleCopyAll} fullWidth>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        {t('admin.copy_all')}
                    </Button>
                    <Button onClick={onClose} fullWidth>
                        {t('admin.done')}
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default UsersPage;
