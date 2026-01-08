import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, User, Trash2,
    X, AlertCircle
} from 'lucide-react';
import { useUsers, useClasses, useCreateUser, useDeleteUser } from '../../hooks/useSchoolData';
import type { User as UserType, CreateUserData } from '../../services/userService';
import type { Class } from '../../services/academicService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import styles from './UsersPage.module.css';

type UserTab = 'STUDENT' | 'TEACHER' | 'PARENT';

export function UsersPage() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<UserTab>('STUDENT');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showCredentialsModal, setShowCredentialsModal] = useState(false);
    const [credentials, setCredentials] = useState<{ accessCode: string; temporaryPassword?: string } | null>(null);

    // Data Hooks
    const { data: users = [], isLoading } = useUsers(activeTab);
    const { data: classes = [] } = useClasses();

    // Mutations
    const createUser = useCreateUser();
    const deleteUser = useDeleteUser();

    const handleCreateUser = async (data: CreateUserData) => {
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
            // Error handling is managed inside the modal or toast could be added here
            throw error;
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm(t('admin.delete_user_confirm', { role: activeTab.toLowerCase() }))) return;
        try {
            await deleteUser.mutateAsync(id);
        } catch (error) {
            console.error('Failed to delete user:', error);
        }
    };

    const filteredUsers = users.filter((user: UserType) =>
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
                    {(['STUDENT', 'TEACHER', 'PARENT'] as UserTab[]).map((tab) => (
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
                            {filteredUsers.map((user: UserType) => (
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
function CreateUserModal({ role, classes, onClose, onSubmit }: {
    role: UserTab,
    classes: Class[],
    onClose: () => void,
    onSubmit: (data: CreateUserData) => Promise<void>
}) {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState<CreateUserData>({
        name: '',
        email: undefined,
        phone: '',
        role: role,
        classId: '',
        accessCode: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            setError(t('admin.name_error'));
            return;
        }

        const submitData = { ...formData };
        if (!submitData.email) delete submitData.email; // Send clean data
        if (!submitData.accessCode) delete submitData.accessCode; // Let backend generate if empty

        setIsLoading(true);
        try {
            await onSubmit(submitData);
        } catch (err: any) {
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

// Credentials Modal
function CredentialsModal({ credentials, onClose }: { credentials: { accessCode: string, temporaryPassword?: string }, onClose: () => void }) {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        let text = `Code: ${credentials.accessCode}`;
        if (credentials.temporaryPassword) {
            text += `\nPassword: ${credentials.temporaryPassword}`;
        }
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div className={styles.modalOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h2>{t('admin.user_created_title', { role: '' })}</h2>
                </div>
                <div className={styles.modalBody}>
                    <div className={styles.warningBanner}>
                        <AlertCircle size={20} />
                        <p>{t('admin.save_credentials_warning')}</p>
                    </div>
                    <div className={styles.credentialField}>
                        <label>{t('admin.access_code')}</label>
                        <div className={styles.credentialValue}>
                            <code>{credentials.accessCode}</code>
                        </div>
                    </div>
                    {credentials.temporaryPassword && (
                        <div className={styles.credentialField}>
                            <label>{t('admin.temporary_password')}</label>
                            <div className={styles.credentialValue}>
                                <code>{credentials.temporaryPassword}</code>
                            </div>
                        </div>
                    )}
                    <Button onClick={handleCopy} fullWidth variant="outline">
                        {copied ? t('admin.copied_to_clipboard') : t('common.copy')}
                    </Button>
                    <Button onClick={onClose} fullWidth>{t('admin.done')}</Button>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default UsersPage;
