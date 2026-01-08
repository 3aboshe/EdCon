import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import styles from './ConfirmModal.module.css';

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    cancelText,
    variant = 'warning', // 'warning' | 'danger' | 'info'
    isLoading = false
}) {
    const { t, i18n } = useTranslation();
    const isRTL = ['ar', 'he', 'fa'].includes(i18n.language);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className={styles.overlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className={`${styles.modal} ${isRTL ? styles.rtl : ''}`}
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Icon */}
                    <div className={`${styles.iconWrapper} ${styles[variant]}`}>
                        <AlertTriangle size={28} />
                    </div>

                    {/* Content */}
                    <div className={styles.content}>
                        <h3 className={styles.title}>{title}</h3>
                        <p className={styles.message}>{message}</p>
                    </div>

                    {/* Actions */}
                    <div className={styles.actions}>
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            {cancelText || t('common.cancel')}
                        </Button>
                        <Button
                            variant={variant === 'danger' ? 'danger' : 'primary'}
                            onClick={onConfirm}
                            isLoading={isLoading}
                        >
                            {confirmText || t('common.confirm')}
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// Hook for easy usage
export function useConfirmModal() {
    const [state, setState] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: '',
        cancelText: '',
        variant: 'warning',
        onConfirm: () => { },
        isLoading: false,
    });

    const confirm = (options) => {
        return new Promise((resolve) => {
            setState({
                isOpen: true,
                title: options.title || '',
                message: options.message || '',
                confirmText: options.confirmText || '',
                cancelText: options.cancelText || '',
                variant: options.variant || 'warning',
                isLoading: false,
                onConfirm: () => {
                    setState(s => ({ ...s, isLoading: true }));
                    resolve(true);
                },
            });
        });
    };

    const close = () => {
        setState(s => ({ ...s, isOpen: false, isLoading: false }));
    };

    const setLoading = (loading) => {
        setState(s => ({ ...s, isLoading: loading }));
    };

    const ConfirmModalComponent = () => (
        <ConfirmModal
            isOpen={state.isOpen}
            onClose={() => {
                close();
            }}
            onConfirm={state.onConfirm}
            title={state.title}
            message={state.message}
            confirmText={state.confirmText}
            cancelText={state.cancelText}
            variant={state.variant}
            isLoading={state.isLoading}
        />
    );

    return { confirm, close, setLoading, ConfirmModalComponent };
}

export default ConfirmModal;
