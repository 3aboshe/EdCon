import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, User, Trash2,
    X, AlertCircle
} from 'lucide-react';
import { useUsers, useClasses, useCreateUser, useDeleteUser } from '../../hooks/useSchoolData';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import styles from './UsersPage.module.css';

export function UsersPage() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('STUDENT');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showCredentialsModal, setShowCredentialsModal] = useState(false);
    const [credentials, setCredentials] = useState(null);

    // Data Hooks
    const { data: users = [], isLoading } = useUsers(activeTab);
    const { data: classes = [] } = useClasses();

    // Mutations
    const createUser = useCreateUser();
    const deleteUser = useDeleteUser();

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

    const handleDeleteUser = async (id) => {
        if (!confirm(t('admin.delete_user_confirm', { role: activeTab.toLowerCase() }))) return;
        try {
            await deleteUser.mutateAsync(id);
        } catch (error) {
            console.error('Failed to delete user:', error);
        }
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
        </div>
    );
}

// Create User Modal Component
function CreateUserModal({ role, classes, onClose, onSubmit }) {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: undefined,
        phone: '',
        role: role,
        classId: '',
        accessCode: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name) {
            setError(t('admin.name_error'));
            return;
        }

        if (formData.accessCode && formData.accessCode.trim().length > 0 && formData.accessCode.trim().length < 3) {
            setError(t('admin.access_code_too_short'));
            return;
        }

        const submitData = { ...formData };
        if (!submitData.email) delete submitData.email;
        if (!submitData.accessCode) delete submitData.accessCode;

        setIsLoading(true);
        try {
            await onSubmit(submitData);
        } catch (err) {
            setError(err.response?.data?.message || t('admin.create_user_error'));
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
                    <Input
                        label={t('admin.access_code') + ' (Optional)'}
                        value={formData.accessCode || ''}
                        onChange={e => setFormData({ ...formData, accessCode: e.target.value })}
                        placeholder="e.g. S12345"
                    />
                    <div className={styles.modalFooter}>
                        <Button variant="ghost" type="button" onClick={onClose}>{t('common.cancel')}</Button>
                        <Button type="submit" isLoading={isLoading}>{t('common.create')}</Button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

// Credentials Modal - Redesigned
function CredentialsModal({ credentials, onClose }) {
    const { t } = useTranslation();
    const [copiedCode, setCopiedCode] = useState(false);
    const [copiedPassword, setCopiedPassword] = useState(false);

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

    return (
        <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className={styles.credentialsModal}
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

                <h2 className={styles.credentialsTitle}>{t('admin.user_created_success')}</h2>

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
